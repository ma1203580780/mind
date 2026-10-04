"""Render only the explicitly published articles. Run after editing their Markdown."""
from pathlib import Path
import json,re,hashlib,yaml
from reading_components import blocks,doc,render_messages
from reading_layout import article_layout
ROOT=Path(__file__).resolve().parent.parent
config=json.loads((ROOT/'scripts/reading-kit/articles.json').read_text())
articles={}
for slug,settings in config.items():
    raw=(ROOT/f'src/content/posts/{slug}.md').read_text()
    _,frontmatter,body=raw.split('---',2)
    meta=yaml.safe_load(frontmatter)
    if meta.get('draft') is not False:raise ValueError('Only approved public articles belong in this renderer: '+slug)
    articles[slug]={'meta':{**meta,**settings},'body':body,'source_sha256':hashlib.sha256(raw.encode()).hexdigest()}
all_meta={slug:article['meta'] for slug,article in articles.items()};output={}
for slug,article in articles.items():
    meta=article['meta'];body=article['body']
    messages=doc(slug,blocks(body),meta['variant']);content,toc=render_messages(messages)
    chars=len(re.sub(r'\s|<!--.*?-->|https?://[^\s)]+','',body))
    html=article_layout(slug,meta,content,toc,chars,all_meta)
    if any(x in html for x in ['127.0.0.1','localhost','/Users/','本地草稿','../review/','__BASE__src/']):raise ValueError('Local-only content in public article '+slug)
    output[slug]={'title':meta['title'],'description':meta['description'],'source_sha256':article['source_sha256'],'html':html}
(ROOT/'src/data/reading-articles.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print('Rendered '+str(len(output))+' approved public articles')
