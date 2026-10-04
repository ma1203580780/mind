"""Approved reading components, rendered from marked Markdown. Do not edit generated JSON."""
from pathlib import Path
from html import escape
import re,math,json
from markdown_it import MarkdownIt
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parent
MD=MarkdownIt('commonmark',{'html':False}).enable('table')
CATALOG_ID='urn:mind:reading:v1'
KIT=json.loads((ROOT/'reading-kit/components.json').read_text())['components']
TYPES=['Chapter','Thesis','Prose','Figure','Flow','EvidenceTable','SplitCompare','Experiment','Caveat','Checklist','Takeaway','SourceNotes','LayerStack','Tabs','FailureCase','Quote','DecisionTree','Formula','MetricBars','Calculator']
LABELS={'Flow':'一条诊断路径','EvidenceTable':'放在一起看','SplitCompare':'两个不同问题','Experiment':'可以动手验证','Caveat':'别漏掉这个条件','Checklist':'带走一份检查表','LayerStack':'分层，而不是堆积','Tabs':'切换一个场景','FailureCase':'一个容易踩的坑','DecisionTree':'从条件作判断','Formula':'换一个计算口径','MetricBars':'把同一单位摆在一起','Calculator':'自己动手算','Takeaway':'回到最初的问题'}

def e(s):return escape(str(s),quote=True)

def paragraph(s):return MD.render(s)

def blocks(raw):
 chunks=re.split(r'<!--\s*a2ui:(\w+)\s*-->',raw)
 if chunks[0].strip():raise ValueError('Unmarked article content')
 result=[]
 for i in range(1,len(chunks),2):
  t,content=chunks[i],chunks[i+1].strip()
  if t not in TYPES or not content:raise ValueError('Unknown or empty block '+t)
  result.append((t,content))
 return result

def doc(slug,parts,variant):
 data={'blocks':{f'b{i}':{'content':c} for i,(t,c) in enumerate(parts)}}
 comps=[{'id':'root','component':'ArticleColumn','children':[f'b{i}' for i in range(len(parts))]}]+[{'id':f'b{i}','component':t,'content':{'path':f'/blocks/b{i}/content'}} for i,(t,c) in enumerate(parts)]
 return [{'version':'v0.9.1','createSurface':{'surfaceId':slug,'catalogId':CATALOG_ID,'theme':{'variant':variant},'sendDataModel':False}},{'version':'v0.9.1','updateComponents':{'surfaceId':slug,'components':comps}},{'version':'v0.9.1','updateDataModel':{'surfaceId':slug,'path':'/','value':data}}]

def resolve(binding,model):
 if isinstance(binding,str):return binding
 value=model
 for key in binding['path'].strip('/').split('/'):value=value[key.replace('~1','/').replace('~0','~')]
 if not isinstance(value,str):raise TypeError('Expected text binding')
 return value

def table_data(soup):
 t=soup.find('table')
 if not t:raise ValueError('Component requires a table')
 headers=[x.get_text(' ',strip=True) for x in t.select('thead th')]
 rows=[[x.decode_contents() for x in row.find_all('td')] for row in t.select('tbody tr')]
 return t,headers,rows

def table_html(soup):
 for t in list(soup.find_all('table')):
  wrapper=soup.new_tag('div',attrs={'class':'ed-table-wrap rk-comparison','tabindex':'0','role':'region','aria-label':'内容对照表，可横向滚动'})
  t.wrap(wrapper)
 return str(soup)

def render_block(t,content,idx):
 content=content.replace('../../../public/articles/','__BASE__articles/')
 s=BeautifulSoup(MD.render(content),'html.parser')
 cls='ed-block ed-'+({'SourceNotes':'sources','MetricBars':'bars'}.get(t,t.lower())); extra=''; h=s.find(['h2','h3'])
 primitive=KIT[t]; cls+=' '+primitive['class']; tone=f' data-tone="{primitive["tone"]}"' if 'tone' in primitive else ''
 kicker=f'<p class="ed-kicker">{LABELS[t]}</p>' if t in LABELS else ''
 if t=='Chapter':
  bits=h.get_text().split(' / ',2); h.decompose()
  return f'<header class="ed-chapter" data-component="Chapter"><div class="ed-chapter-no">{e(bits[0])}</div><div><p class="ed-chapter-label"><span>{e(bits[0])}</span>{e(bits[1])}</p><h2>{e(bits[2])}</h2>{s}</div></header>'
 if t=='Figure':
  im=s.find('img'); assert im and im.get('alt')
  im['src']=im['src'].replace('../../assets/draft-art/','../assets/')
  im['loading']='lazy';im['decoding']='async';im['width']='1536';im['height']='1024'
  parent=im.parent;im.extract();parent.decompose()
  return f'<figure class="ed-block ed-figure" data-component="{t}">{im}<figcaption>{s}</figcaption></figure>'
 if t=='Flow':
  table,headers,rows=table_data(s);out='<ol class="rk-steps">'
  for j,row in enumerate(rows):out+=f'<li><span class="step-no">0{j+1}</span><h3>{row[0]}</h3><p>{row[1]}</p><p class="step-check">{row[2]}</p></li>'
  out+='</ol>';table.replace_with(BeautifulSoup(out,'html.parser'));cls+=' ed-wide'
 elif t=='LayerStack':
  table,headers,rows=table_data(s);out='<ol class="ed-layers">'
  for row in rows:out+=f'<li><h3>{row[0]}</h3><div><p>{row[1]}</p><small>{e(headers[2])}：{row[2]}</small></div></li>'
  out+='</ol>';table.replace_with(BeautifulSoup(out,'html.parser'))
 elif t=='DecisionTree':
  table,headers,rows=table_data(s);out='<div class="ed-decisions">'
  for row in rows:
   out+=f'<div class="ed-decision"><h3>{row[0]}</h3><div>'+''.join(f'<p><span>{e(headers[j])}</span>{cell}</p>' for j,cell in enumerate(row[1:],1))+'</div></div>'
  out+='</div>';table.replace_with(BeautifulSoup(out,'html.parser'))
 elif t in ['SplitCompare','Tabs']:
  pieces=re.split(r'(?m)^#### (.+)\n',content);lead=MD.render(pieces[0]); panels=[]
  for j in range(1,len(pieces),2):panels.append((pieces[j],MD.render(pieces[j+1])))
  if t=='SplitCompare':return f'<section class="{cls}" data-component="{t}"{tone}>{kicker}{lead}<div class="ed-split">'+''.join(f'<div><h4>{e(title)}</h4>{text}</div>' for title,text in panels)+'</div></section>'
  tabs=f'<div class="ed-tab-buttons rk-tablist" role="tablist" aria-label="选择任务场景">'+''.join(f'<button type="button" id="tab-{idx}-{j}" role="tab" aria-controls="panel-{idx}-{j}" aria-selected="{str(j==0).lower()}">{e(title)}</button>' for j,(title,_) in enumerate(panels))+'</div>'
  return f'<section class="{cls}" data-component="{t}"{tone}>{kicker}{lead}{tabs}'+''.join(f'<div class="ed-tab-panel" id="panel-{idx}-{j}" role="tabpanel" aria-labelledby="tab-{idx}-{j}" tabindex="0"><h4>{e(title)}</h4>{text}</div>' for j,(title,text) in enumerate(panels))+'</section>'
 elif t=='Checklist':
  for ul in s.find_all(['ul','ol']):ul['class']=['rk-checklist']
  for j,li in enumerate(s.select('li')):
   txt=li.decode_contents();li.clear();li.append(BeautifulSoup(f'<label><input type="checkbox" aria-label="{e(BeautifulSoup(txt,"html.parser").get_text())}"><span>{txt}</span></label>','html.parser'))
  extra='<p class="ed-check-count" role="status" aria-live="polite"></p>'
 elif t=='MetricBars':
  table,headers,rows=table_data(s); vals=[float(BeautifulSoup(row[1],'html.parser').get_text()) for row in rows]; bound=math.ceil(max(vals)*10)/10
  out='<div class="ed-bar-chart" role="img" aria-label="教学演算：方案 A 每个可用结果 0.36 元；方案 B 约 0.263 元。两条横柱从零开始。">'
  for row,val in zip(rows,vals):out+=f'<div class="ed-bar-row"><span>{row[0]}</span><div class="ed-bar-track"><div class="ed-bar" style="width:{val/bound*100:.3f}%"></div></div><strong>{val:.3f}</strong></div>'
  out+=f'<div class="ed-bar-axis"><span>0</span><span>{bound:g} 元 / 个</span></div></div>'
  table.replace_with(BeautifulSoup(out,'html.parser'))
 elif t=='Calculator':
  table,headers,rows=table_data(s);out='<form class="ed-calc-form" aria-label="单位可用结果成本计算器"><div class="ed-calc-grid">'
  for key,row in zip(['a','b'],rows):
   cost=float(BeautifulSoup(row[1],'html.parser').get_text()); count=int(BeautifulSoup(row[2],'html.parser').get_text())
   out+=f'<fieldset><legend>方案 {key.upper()}</legend><label class="rk-field">全部自动费用（元）<input name="{key}cost" type="number" inputmode="decimal" min="0" step="any" value="{cost:g}" aria-label="方案 {key.upper()} 全部自动费用" required></label><label class="rk-field">可用结果数<input name="{key}count" type="number" inputmode="numeric" min="0" step="1" value="{count}" aria-label="方案 {key.upper()} 可用结果数" required></label><output class="ed-calc-result" data-result="{key}" aria-label="方案 {key.upper()} 每个可用结果成本">{cost/count:.3f} 元 / 个</output></fieldset>'
  out+='</div><p class="ed-calc-summary" role="status" aria-live="polite">就当前演算，方案 B 单位成本较低。</p><div class="ed-calc-actions"><button type="button" class="ed-preset rk-button">试试 A 交付 69 个</button><button type="button" class="ed-reset rk-button" data-variant="secondary">恢复演算示例</button></div></form>'
  table.replace_with(BeautifulSoup(out,'html.parser'))
 elif t=='SourceNotes':
  heading=h.get_text();h.decompose()
  return f'<section class="{cls}" data-component="{t}"><details class="rk-disclosure"><summary>{e(heading)} · 核对日期与资料范围</summary><div>{s}</div></details></section>'
 out=table_html(s)
 return f'<section class="{cls}" data-component="{t}"{tone}>{kicker}{out}{extra}</section>'

def render_messages(messages):
 # Supported local profile: literal or JSON Pointer text, one root column, predeclared blocks.
 created=messages[0]['createSurface']; comps=messages[1]['updateComponents']['components']; model=messages[2]['updateDataModel']['value']; nodes={c['id']:c for c in comps}
 assert len(nodes)==len(comps) and nodes['root']['component']=='ArticleColumn'
 assert len(nodes['root']['children'])==len(nodes)-1
 out=[]
 for i,cid in enumerate(nodes['root']['children']):
  c=nodes[cid];out.append(render_block(c['component'],resolve(c['content'],model),i))
 soup=BeautifulSoup(''.join(out),'html.parser');toc=[]
 # Group adjacent components under their chapter without changing message order.
 group=None
 for el in list(soup.contents):
  if not getattr(el,'attrs',None):continue
  if el.get('data-component')=='Chapter':
   group=soup.new_tag('section',attrs={'class':'ed-chapter-group'});el.insert_before(group);group.append(el.extract())
  elif el.get('data-component') in ['Takeaway','SourceNotes']:group=None
  elif group is not None:group.append(el.extract())
 for i,h in enumerate(soup.find_all('h2')):
  anchor=f'section-{i+1}';h['id']=anchor;toc.append((anchor,h.get_text()))
 return str(soup),toc
