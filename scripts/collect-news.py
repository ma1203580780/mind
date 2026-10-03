"""Fetch publisher RSS/Atom feeds. No LLM, API key, or generated news."""
import concurrent.futures, datetime as dt, email.utils, hashlib, html, json, re, sys
import urllib.request, urllib.parse, xml.etree.ElementTree as ET
from pathlib import Path
from html.parser import HTMLParser
ROOT = Path(__file__).resolve().parents[1]
UTC = dt.timezone.utc
CN = dt.timezone(dt.timedelta(hours=8))
def clean(s, limit=300):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', html.unescape(s or ''))).replace('<','').replace('>','').strip()[:limit]
def timestamp(s):
    try: d = email.utils.parsedate_to_datetime(s)
    except Exception:
        try: d = dt.datetime.fromisoformat(s.replace('Z','+00:00'))
        except Exception: return None
    return d.replace(tzinfo=d.tzinfo or UTC).astimezone(UTC)
def canonical(raw):
    u=urllib.parse.urlsplit(raw)
    if u.scheme not in ('http','https') or not u.hostname or u.username or u.password: return None
    q=urllib.parse.parse_qsl(u.query)
    q=[(k,v) for k,v in q if not k.lower().startswith('utm_') and k not in ('fbclid','gclid')]
    return urllib.parse.urlunsplit(('https',u.netloc,u.path,urllib.parse.urlencode(sorted(q)),''))
def local(tag): return tag.rsplit('}',1)[-1]
class FeedImages(HTMLParser):
    def __init__(self): super().__init__();self.urls=[]
    def handle_starttag(self,tag,attrs):
        if tag=='img':
            a=dict(attrs);self.urls.append(a.get('data-src') or a.get('src') or '')
def feed_image(fields,base):
    parser=FeedImages();parser.feed(fields.get('description','')+fields.get('encoded',''))
    candidates=[fields.get('mediaImage',''),fields.get('image','')]+parser.urls
    for raw in candidates:
        u=urllib.parse.urljoin(base,html.unescape(raw));p=urllib.parse.urlsplit(u)
        if not raw or p.scheme not in ('https','http') or not p.hostname:continue
        if re.search(r'(logo|icon|avatar|default|l_common|placeholder|qrcode)',p.path,re.I) or p.path.lower().endswith('.svg'):continue
        return urllib.parse.urlunsplit(('https',p.netloc,p.path,p.query,''))
    return None
def parse_feed(raw):
    # A quoted HTML document inside CDATA is text, not an XML DTD. Some
    # publisher feeds (e.g. GitHub Blog) legitimately use this representation.
    markup=re.sub(rb'<!\[CDATA\[.*?\]\]>',b'',raw,flags=re.S)
    if b'<!ENTITY' in markup.upper() or b'<!DOCTYPE' in markup.upper(): raise ValueError('Not a safe XML feed')
    # Squarespace feeds occasionally contain HTML named entities outside CDATA.
    # Convert only known HTML entities to numeric XML references; never load a DTD.
    raw=re.sub(rb'&([A-Za-z][A-Za-z0-9]+);',lambda m: ('&#%d;'%html.entities.name2codepoint[m[1].decode()]).encode() if m[1].decode() in html.entities.name2codepoint and m[1] not in (b'amp',b'lt',b'gt',b'quot',b'apos') else m[0],raw)
    root=ET.fromstring(raw)
    if local(root.tag) not in ('rss','feed','RDF'): raise ValueError('Not RSS/Atom')
    rows=[]
    for item in root.iter():
        if local(item.tag) not in ('item','entry'): continue
        fields={}
        for el in item:
            key=local(el.tag)
            if key=='link' and el.get('href') and el.get('rel','alternate')=='alternate': fields['link']=el.get('href')
            elif key in ('thumbnail','content','enclosure') and el.get('url') and (key!='enclosure' or el.get('type','').startswith('image/')):fields['mediaImage']=el.get('url')
            elif key not in fields: fields[key]=''.join(el.itertext())
        date=timestamp(fields.get('pubDate') or fields.get('published') or fields.get('date') or fields.get('updated') or '')
        url=canonical(fields.get('link') or fields.get('guid') or '')
        if date and url and fields.get('title'):
            description=fields.get('description') or fields.get('summary') or fields.get('content') or ''
            description=re.sub(r'^arXiv:.*?Abstract:\s*','',description,flags=re.S)
            excerpt_text=clean(description,10000)
            # Strip publisher subscription/footer boilerplate before truncating or
            # translating. Preserve the actual article excerpt verbatim.
            excerpt_text=re.sub(r'Do stories and artists like this matter to you\?.*$', '',excerpt_text)
            excerpt_text=re.sub(r'\s+The (?:post|article) .+? appeared first on .+?\.?\s*$', '',excerpt_text)
            excerpt=excerpt_text.strip()[:600]
            rows.append({'title':clean(fields['title'],240),'url':url,'published':date,'excerpt':excerpt,'excerptTruncated':len(excerpt_text)>600,'image':feed_image(fields,url),'author':clean(fields.get('creator') or fields.get('author') or '',100)})
    return rows

def fetch(source):
    req=urllib.request.Request(source['url'],headers={'User-Agent':'MindNews/1.0 (+https://ma1203580780.github.io/mind/)','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml'})
    with urllib.request.urlopen(req,timeout=25) as r:
        raw=r.read(5_000_001)
        if len(raw)>5_000_000: raise ValueError('Feed exceeds 5 MB')
        rows=parse_feed(raw)
        return rows,hashlib.sha256(raw).hexdigest()

def select(candidates, seen, now, limit=200, existing=None):
    if limit<=0:return []
    selected=[]; urls=set(seen); titles=set(); counts={}; research=0; releases=0; topics={}
    legacy={'AI 动态':'AI 资讯','AI 研究':'AI 资讯','开源工具':'AI 协作','工程实践':'AI 协作','宏观经济':'经济观察','经济研究':'经济观察','经济数据':'经济观察'}
    for old in existing or []:
        titles.add(re.sub(r'\W+','',old['title'].casefold()))
        sid=old.get('sourceId'); counts[sid]=counts.get(sid,0)+1
        if old.get('kind')=='论文预印本': research+=1
        if old.get('kind')=='版本发布': releases+=1
        topic=legacy.get(old.get('category'),old.get('category','AI 资讯'));topics[topic]=topics.get(topic,0)+1
    # Pick the least represented topic first, including records already collected
    # today. New subscriptions can join without being drowned out by busy feeds.
    groups={}
    for x in sorted(candidates,key=lambda x:(x['published'],x['url']),reverse=True):
        s=x['source'];topic=s.get('category',s['domain'])
        groups.setdefault(topic,[]).append(x)
    while any(groups.values()) and len(selected)<limit:
        topic=min((t for t,g in groups.items() if g),key=lambda t:(topics.get(t,0),t))
        x=groups[topic].pop(0)
        s=x['source']
        if s.get('keywords') and not any(word.casefold() in (x['title'] if s.get('titleOnly') else x['title']+' '+x['excerpt']).casefold() for word in s['keywords']):continue
        key=re.sub(r'\W+','',x['title'].casefold())
        horizon=min(168,max(1,s.get('maxAgeHours',72)))
        if x['url'] in urls or key in titles or not dt.timedelta(0)<=now-x['published']<=dt.timedelta(hours=horizon): continue
        if counts.get(s['id'],0)>=s.get('maxItems',25): continue
        if s['kind']=='论文预印本' and research>=30: continue
        if s['kind']=='版本发布' and releases>=12: continue
        if s['kind']=='论文预印本': research+=1
        if s['kind']=='版本发布': releases+=1
        topics[topic]=topics.get(topic,0)+1
        urls.add(x['url']); titles.add(key); counts[s['id']]=counts.get(s['id'],0)+1;selected.append(x)
    return selected

def main():
    now=dt.datetime.now(UTC); day=now.astimezone(CN).date().isoformat()
    sources=json.loads((ROOT/'src/config/news-sources.json').read_text())
    dest=ROOT/'src/data/news'/f'{day}.json'
    old=json.loads(dest.read_text()) if dest.exists() else None
    existing=old['stories'] if old else []
    seen=set()
    for f in (ROOT/'src/data/news').glob('*.json'):
        seen.update(canonical(s['sourceUrl']) for s in json.loads(f.read_text())['stories'])
    candidates=[]; statuses=[]
    def work(s):
        try:
            rows,digest=fetch(s)
            return s,rows,{'id':s['id'],'name':s['name'],'url':s['url'],'domain':s['domain'],'language':s.get('language','en'),'ok':True,'items':len(rows),'sha256':digest}
        except Exception as e:return s,[],{'id':s['id'],'name':s['name'],'url':s['url'],'domain':s['domain'],'language':s.get('language','en'),'ok':False,'items':0,'error':str(e)[:180]}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for s,rows,status in pool.map(work,sources):
            statuses.append(status)
            candidates.extend(dict(x,source=s) for x in rows)
    picked=select(candidates,seen,now,max(0,200-len(existing)),existing) if len(existing)<200 else []
    for x in picked:
        s=x['source']; key=hashlib.sha256(x['url'].encode()).hexdigest()[:20]
        existing.append(dict(id='feed-'+key,eventKey='feed-'+key,category=s['category'],kind=s['kind'],title=x['title'],summary=x['excerpt'] or '订阅源未提供摘要，请阅读原文。',why='本条由公开订阅源自动收录，未作事实背书或人工解读。',action='打开发布者原文，核对完整背景与适用条件。',sourceName=s['name'],sourceUrl=x['url'],publishedDate=x['published'].astimezone(CN).date().isoformat(),publishedAt=x['published'].isoformat(),fetchedAt=now.isoformat(),feedUrl=s['url'],sourceId=s['id'],domain=s['domain'],automated=True,sourceLanguage=s.get('language','en'),summaryTruncated=x.get('excerptTruncated',False),author=x.get('author','')))
        if x.get('image'):existing[-1].update(image=x['image'],imageAlt='原文配图：'+x['title'][:100],imageSourceUrl=x['url'],imageKind='订阅源配图')
    status={'checkedAt':now.isoformat(),'newItems':len(picked),'issueDate':day,'totalItems':len(existing),'sources':statuses}
    (ROOT/'src/data/news-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n')
    if existing:
        issue=dict(date=day,checkedAt=now.isoformat(),automated=True,title='新闻与观察 · 原始信息流',intro='直接采集公开 RSS / Atom：AI、独立创业、设计、营销、协作与经济。中文源与英文源分区，英文标题与摘要提供中文机译和原文对照；每期最多 200 条。',briefing=[f'本期 {len(existing)} 条；本次新增 {len(picked)} 条。',f'{sum(s["ok"] for s in statuses)} / {len(statuses)} 个订阅源本次读取成功。','快讯收录近 72 小时；部分低频专题收录近 7 天未收录内容，保留原发布日期。','论文预印本与项目发布并非媒体新闻，已单独标注。'],stories=existing)
        dest.write_text(json.dumps(issue,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(status,ensure_ascii=False))
    if not any(s['ok'] for s in statuses): sys.exit('All sources failed; previous editions retained')
if __name__=='__main__': main()
