"""Fetch publisher RSS/Atom feeds. No LLM, API key, or generated news."""
import concurrent.futures, datetime as dt, email.utils, hashlib, html, json, re, sys
import urllib.request, urllib.parse, xml.etree.ElementTree as ET
from pathlib import Path
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
def parse_feed(raw):
    if b'<!ENTITY' in raw.upper() or b'<!DOCTYPE' in raw.upper(): raise ValueError('Not a safe XML feed')
    root=ET.fromstring(raw)
    if local(root.tag) not in ('rss','feed','RDF'): raise ValueError('Not RSS/Atom')
    rows=[]
    for item in root.iter():
        if local(item.tag) not in ('item','entry'): continue
        fields={}
        for el in item:
            key=local(el.tag)
            if key=='link' and el.get('href') and el.get('rel','alternate')=='alternate': fields['link']=el.get('href')
            elif key not in fields: fields[key]=''.join(el.itertext())
        date=timestamp(fields.get('pubDate') or fields.get('published') or fields.get('date') or fields.get('updated') or '')
        url=canonical(fields.get('link') or fields.get('guid') or '')
        if date and url and fields.get('title'):
            rows.append({'title':clean(fields['title'],240),'url':url,'published':date,'excerpt':clean(fields.get('description') or fields.get('summary') or '',240)})
    return rows

def fetch(source):
    req=urllib.request.Request(source['url'],headers={'User-Agent':'MindNews/1.0 (+https://ma1203580780.github.io/mind/)','Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml'})
    with urllib.request.urlopen(req,timeout=25) as r:
        raw=r.read(5_000_001)
        if len(raw)>5_000_000: raise ValueError('Feed exceeds 5 MB')
        rows=parse_feed(raw)
        return rows,hashlib.sha256(raw).hexdigest()

def select(candidates, seen, now, limit=200, existing=None):
    selected=[]; urls=set(seen); titles=set(); counts={}; research=0
    for old in existing or []:
        titles.add(re.sub(r'\W+','',old['title'].casefold()))
        sid=old.get('sourceId'); counts[sid]=counts.get(sid,0)+1
        if old.get('kind')=='论文预印本': research+=1
    # Interleave domains, so a busy AI feed cannot crowd out economics.
    groups={d:sorted([x for x in candidates if x['source']['domain']==d],key=lambda x:x['published'],reverse=True) for d in ('AI','经济')}
    ordered=[]
    while any(groups.values()):
        for g in groups.values():
            if g: ordered.append(g.pop(0))
    for x in ordered:
        s=x['source']; key=re.sub(r'\W+','',x['title'].casefold())
        if x['url'] in urls or key in titles or not dt.timedelta(0)<=now-x['published']<=dt.timedelta(hours=72): continue
        if counts.get(s['id'],0)>=s.get('maxItems',25): continue
        if s['kind']=='论文预印本' and research>=70: continue
        if s['kind']=='论文预印本': research+=1
        urls.add(x['url']); titles.add(key); counts[s['id']]=counts.get(s['id'],0)+1;selected.append(x)
        if len(selected)>=limit: break
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
            return s,rows,{'id':s['id'],'name':s['name'],'url':s['url'],'domain':s['domain'],'ok':True,'items':len(rows),'sha256':digest}
        except Exception as e:return s,[],{'id':s['id'],'name':s['name'],'url':s['url'],'domain':s['domain'],'ok':False,'items':0,'error':str(e)[:180]}
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for s,rows,status in pool.map(work,sources):
            statuses.append(status)
            candidates.extend(dict(x,source=s) for x in rows)
    picked=select(candidates,seen,now,max(0,200-len(existing)),existing) if len(existing)<200 else []
    for x in picked:
        s=x['source']; key=hashlib.sha256(x['url'].encode()).hexdigest()[:20]
        existing.append(dict(id='feed-'+key,eventKey='feed-'+key,category=s['category'],kind=s['kind'],title=x['title'],summary=x['excerpt'] or '订阅源未提供摘要，请阅读原文。',why='本条由公开订阅源自动收录，未作事实背书或人工解读。',action='打开发布者原文，核对完整背景与适用条件。',sourceName=s['name'],sourceUrl=x['url'],publishedDate=x['published'].astimezone(CN).date().isoformat(),publishedAt=x['published'].isoformat(),fetchedAt=now.isoformat(),feedUrl=s['url'],sourceId=s['id'],domain=s['domain'],automated=True))
    status={'checkedAt':now.isoformat(),'newItems':len(picked),'issueDate':day,'totalItems':len(existing),'sources':statuses}
    (ROOT/'src/data/news-status.json').write_text(json.dumps(status,ensure_ascii=False,indent=2)+'\n')
    if existing:
        issue=dict(date=day,checkedAt=now.isoformat(),automated=True,title='AI 与经济 · 原始信息流',intro='直接采集公开 RSS / Atom：机构公告、经济数据、论文与开源项目更新。保留原文标题与源摘要，不生成新闻；每期最多 200 条。',briefing=[f'本期 {len(existing)} 条；本次新增 {len(picked)} 条。',f'{sum(s["ok"] for s in statuses)} / {len(statuses)} 个订阅源本次读取成功。','仅收录近 72 小时未收录内容；不足数量不补旧闻。','论文预印本与项目发布并非媒体新闻，已单独标注。'],stories=existing)
        dest.write_text(json.dumps(issue,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(status,ensure_ascii=False))
    if not any(s['ok'] for s in statuses): sys.exit('All sources failed; previous editions retained')
if __name__=='__main__': main()
