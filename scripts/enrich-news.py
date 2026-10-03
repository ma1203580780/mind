"""Publisher images + cached offline English-to-Chinese translation."""
import concurrent.futures, datetime as dt, hashlib, html, json, os, re, sys, urllib.parse, urllib.request, zipfile
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
MODEL_SHA='433e7c4f034d87fbe2353161e05f18646d7999452f801a4e1f0378522b9850ab'
MODEL_VERSION='argos-en-zh-1.9-ct2-v1'
UA='MindNews/1.0 (+https://ma1203580780.github.io/mind/)'
def clean(s,limit=600):
    return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',html.unescape(s or ''))).replace('<','').replace('>','').strip()[:limit]
def language(text): return 'zh' if len(re.findall(r'[\u3400-\u9fff]',text or ''))>=3 else 'en'
# Verified publisher-wide column banners, not article-specific illustrations.
GENERIC_IMAGE_FILES={'02560DCCC0336D1EFC7A62BB5EEFF8E7.jpg','BF3FFD4CC4BD3331A55AD1DCE56D9C81.png'}
def image_url(raw,base):
    u=urllib.parse.urljoin(base,html.unescape(raw or ''));p=urllib.parse.urlsplit(u)
    if p.scheme not in ('https','http') or not p.hostname or p.username or p.password:return None
    if p.path.rsplit('/',1)[-1] in GENERIC_IMAGE_FILES or (p.hostname=='img.eeo.com.cn' and p.path.startswith('/pc/images/')):return None
    if 'private-user-images.githubusercontent.com' in p.hostname or re.search(r'(jwt|X-Amz-Signature|token)=',p.query,re.I):return None
    if 'arxiv.org' in p.hostname and '/static/' in p.path:return None
    if p.hostname in ('www.federalreserve.gov','www.bls.gov') and p.path.startswith('/images/'):return None
    if 'avatars.githubusercontent.com' in p.hostname or 'opengraph.githubassets.com' in p.hostname or re.search(r'(?:logo|favicon|avatar|sprite|icon|default|place.?holder|l_common|arxiv-logo|og-image|site[-_]image|simons|USAGov|OpenGov|emblem|social-v3-new-releases|/images/card.png|menu-button|/dist/img/|/wp-content/themes/)',p.path,re.I) or p.path.lower().endswith('.svg'):return None
    return urllib.parse.urlunsplit(('https',p.netloc,p.path,p.query,''))
class ArticleMeta(HTMLParser):
    def __init__(self,base): super().__init__();self.base=base;self.images=[];self.description='';self.figure=0;self.title=''
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='figure':self.figure+=1
        if tag=='meta':
            key=a.get('property') or a.get('name')
            if key in ('og:description','description') and not self.description:self.description=clean(a.get('content'))
            if key=='og:title':self.title=clean(a.get('content'),240)
            if key in ('og:image','twitter:image') and 'arxiv.org' not in urllib.parse.urlsplit(self.base).hostname:
                u=image_url(a.get('content'),self.base)
                if u:self.images.append((0,u,'原文封面',a.get('content','')))
        if tag=='img':
            u=image_url(a.get('data-src') or a.get('src'),self.base)
            if not u:return
            if re.search(r'(qr|qrcode|wechat|weixin)',u,re.I):return
            try:
                w=int(a.get('width') or a.get('w') or 500);h=int(a.get('height') or a.get('h') or 300)
                if w<250 or h<120:return
            except ValueError:pass
            if 'arxiv.org' in urllib.parse.urlsplit(self.base).hostname and not self.figure:return
            if self.figure or re.search(r'(newsuploadfiles|wp-content/uploads|assets/blog|cdn-uploads|\.png|\.jpg|\.webp)',u,re.I):
                self.images.append((1 if self.figure else 2,u,'原文配图',a.get('alt','')))
    def handle_endtag(self,tag):
        if tag=='figure':self.figure=max(0,self.figure-1)
def read_article(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=18) as r:
        if 'html' not in r.headers.get('Content-Type',''):raise ValueError('Not HTML')
        b=r.read(2_000_001)
        if len(b)>2_000_000:raise ValueError('Article HTML too large')
        charset=r.headers.get_content_charset() or 'utf-8'
        parser=ArticleMeta(r.url);parser.feed(b.decode(charset,errors='replace'));return parser

def model_directory():
    cache=Path(os.environ.get('MIND_MODEL_CACHE',str(Path.home()/'.cache/mind-translation')))
    dest=cache/'translate-en_zh-1_9'
    if (dest/'model/model.bin').exists():return dest
    cache.mkdir(parents=True,exist_ok=True);archive=cache/'en-zh.argosmodel';errors=[]
    for url in ['https://data.argosopentech.com/argospm/v1/translate-en_zh-1_9.argosmodel','https://argos-net.com/v1/translate-en_zh-1_9.argosmodel']:
        try:
            with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':UA}),timeout=90) as r: archive.write_bytes(r.read(100_000_001))
            if hashlib.sha256(archive.read_bytes()).hexdigest()!=MODEL_SHA:raise ValueError('Translation model checksum mismatch')
            with zipfile.ZipFile(archive) as z:
                for f in z.namelist():
                    if not (cache/f).resolve().is_relative_to(cache.resolve()):raise ValueError('Unsafe archive path')
                z.extractall(cache)
            archive.unlink();return dest
        except Exception as e:errors.append(str(e))
    raise RuntimeError('; '.join(errors))

def translate_texts(texts,cache):
    import ctranslate2,sentencepiece
    p=model_directory();sp=sentencepiece.SentencePieceProcessor(model_file=str(p/'sentencepiece.model'))
    engine=ctranslate2.Translator(str(p/'model'),device='cpu',compute_type='int8',intra_threads=2,inter_threads=1)
    output={};pending=[]
    for text in dict.fromkeys(texts):
        key=hashlib.sha256((MODEL_VERSION+'\n'+text).encode()).hexdigest()
        if key in cache['translations']:output[text]=cache['translations'][key];continue
        # Sentence-sized batches keep generation bounded without silently truncating inputs.
        chunks=[]
        for sentence in re.split(r'(?<=[.!?])\s+',text):
            words=sentence.split()
            chunks.extend(' '.join(words[i:i+70]) for i in range(0,len(words),70))
        pending.append((text,key,chunks or [text]))
    for start in range(0,len(pending),12):
        batch=pending[start:start+12];chunks=[part for _,_,parts in batch for part in parts]
        results=engine.translate_batch([sp.encode(x,out_type=str) for x in chunks],beam_size=4,max_decoding_length=320,replace_unknowns=True,length_penalty=.2)
        decoded=[clean(sp.decode(r.hypotheses[0]).replace('▁',''),1600) for r in results];at=0
        for original,key,parts in batch:
            translated=''.join(decoded[at:at+len(parts)]);at+=len(parts)
            if not re.search(r'[\u3400-\u9fff]',translated):continue
            cache['translations'][key]=translated;output[original]=translated
    return output

def terminology(text,source):
    # Correct recurrent technical mistranslations while retaining the model output otherwise.
    if source.strip()=='Markets, Morals, and Ethics':return '市场、道德与伦理'
    if 'ethics' in source.lower() and 'morals' in source.lower():
        text=text.replace('道德和道德','伦理与道德').replace('道德涉及不伤害原则','伦理涉及不伤害原则').replace('道德,如诚实','伦理,例如诚实')
    fixes={'多式联运模型':'多模态模型','多式联运':'多模态','培训数据':'训练数据','多代理协作':'多智能体协作','多代理系统':'多智能体系统','非男性性':'不伤害原则'}
    for wrong,right in fixes.items():text=text.replace(wrong,right)
    if 'Qwen' in source:text=text.replace('Quen','Qwen')
    return text

def main():
    now=dt.datetime.now(dt.timezone.utc).isoformat()
    sources={s['id']:s for s in json.loads((ROOT/'src/config/news-sources.json').read_text())}
    cachepath=ROOT/'src/data/news-enrichment-cache.json'
    cache=json.loads(cachepath.read_text()) if cachepath.exists() else {'translations':{},'articles':{}}
    files=sorted((ROOT/'src/data/news').glob('*.json'),reverse=True)[:3];issues=[(p,json.loads(p.read_text())) for p in files]
    stories=[s for _,i in issues for s in i['stories']]
    for s in stories:
        s['sourceLanguage']=sources.get(s.get('sourceId'),{}).get('language','en')
        s['contentLanguage']=language(s['title'])
    # Refresh short RSS excerpts/images for already-published items, without duplicating stories.
    import importlib.util
    spec=importlib.util.spec_from_file_location('collector',ROOT/'scripts/collect-news.py');collector=importlib.util.module_from_spec(spec);spec.loader.exec_module(collector)
    def feed_refresh(source):
        try:return source['id'],collector.fetch(source)[0]
        except Exception:return source['id'],[]
    refreshed={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for sid,rows in pool.map(feed_refresh,sources.values()):
            for row in rows:refreshed[row['url']]=row
    for s in stories:
        row=refreshed.get(collector.canonical(s['sourceUrl']))
        if row and s.get('automated'):
            if row.get('excerpt'):s['summary']=row['excerpt'];s['summaryTruncated']=row.get('excerptTruncated',False)
            if row.get('author'):s['author']=row['author']
            if row.get('image') and not s.get('image'):s.update(image=row['image'],imageAlt='原文配图：'+s['title'][:100],imageSourceUrl=s['sourceUrl'],imageKind='订阅源配图')
    for s in stories:
        if s.get('image') and not image_url(s['image'],s['sourceUrl']):
            for key in ('image','imageAlt','imageKind','imageSourceUrl'):s.pop(key,None)
    for url,entry in list(cache['articles'].items()):
        if entry.get('image') and not image_url(entry['image'],url):del cache['articles'][url]
    targets=[s for s in stories if s['sourceUrl'] not in cache['articles'] and (not s.get('image') or '未提供摘要' in s['summary'])][:200]
    def article(s):
        url=s['sourceUrl']
        try:
            # arXiv HTML figures are actual paper evidence, unlike the generic arXiv social logo.
            target=url.replace('/abs/','/html/') if 'arxiv.org/abs/' in url else url
            p=read_article(target);imgs=sorted(p.images,key=lambda x:x[0]);value={'checkedAt':now,'description':p.description,'image':imgs[0][1] if imgs else None,'kind':imgs[0][2] if imgs else None,'imageSourceUrl':target}
            return url,value
        except Exception as e:return url,{'checkedAt':now,'error':str(e)[:100]}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        for url,value in pool.map(article,targets):cache['articles'][url]=value
    for s in stories:
        extra=cache['articles'].get(s['sourceUrl'],{})
        if extra.get('image') and not s.get('image'):s.update(image=extra['image'],imageAlt='原文配图：'+s['title'][:100],imageKind=extra['kind'],imageSourceUrl=extra['imageSourceUrl'])
        if extra.get('description') and '未提供摘要' in s['summary']:
            s['summary']=extra['description'];s['summaryOrigin']='原文页面描述'
    # A shared image on many unrelated article URLs is normally a site-wide decoration.
    from collections import defaultdict
    owners=defaultdict(set)
    for story in stories:
        if story.get('image'):owners[story['image']].add(story['sourceUrl'])
    for story in stories:
        if story.get('image') and len(owners[story['image']])>=3:
            for key in ('image','imageAlt','imageKind','imageSourceUrl'):story.pop(key,None)
    texts=[s[k] for s in stories if s['contentLanguage']=='en' for k in ('title','summary') if language(s[k])=='en']
    error=None
    try:translated=translate_texts(texts,cache)
    except Exception as e:translated={};error=str(e)[:250]
    for s in stories:
        if s['contentLanguage']=='en':
            if s.get('kind')=='版本发布' and re.fullmatch(r'(?:Release )?[\w.-]*v?\d[\w.+-]*',s['title']):s['titleZh']=s['sourceName'].split('/')[-1]+' 版本更新 · '+s['title']
            elif s['title'] in translated:s['titleZh']=translated[s['title']]
            if s['summary'] in translated:s['summaryZh']=translated[s['summary']]
            elif language(s['summary'])=='zh':s['summaryZh']=s['summary']
            if s.get('titleZh'):s['titleZh']=terminology(s['titleZh'],s['title'])
            if s.get('summaryZh'):s['summaryZh']=terminology(s['summaryZh'],s['summary'])
            s['translationStatus']='ready' if s.get('titleZh') and s.get('summaryZh') else 'unavailable'
            if s['translationStatus']=='ready':s['translationProvider']='Argos 英中离线模型';s['translationModel']=MODEL_VERSION
    for p,i in issues:p.write_text(json.dumps(i,ensure_ascii=False,indent=2)+'\n')
    cachepath.write_text(json.dumps(cache,ensure_ascii=False,indent=2)+'\n')
    statuspath=ROOT/'src/data/news-status.json';status=json.loads(statuspath.read_text());status['enrichment']={'checkedAt':now,'translationModel':MODEL_VERSION,'translated':sum(s.get('translationStatus')=='ready' for s in stories),'english':sum(s['contentLanguage']=='en' for s in stories),'images':sum(bool(s.get('image')) for s in stories),'stories':len(stories),'error':error};statuspath.write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(status['enrichment'],ensure_ascii=False))
    if error:sys.exit('Offline translation failed; publish gate blocked to keep last good bilingual edition')
if __name__=='__main__':main()
