from pathlib import Path
from html import escape as e
from bs4 import BeautifulSoup
CLOUDS=(Path(__file__).parent/"reading-kit/sky-clouds.svg").read_text()

def focus_diagram(variant,content):
 s=BeautifulSoup(content,'html.parser')
 if variant=='atlas':
  rows=s.select('.ed-flow li')
  steps=''.join(f'<li><span class="step-no">{i+1:02d}</span><div><b>{e(row.h3.get_text())}</b><small>{e(row.select_one(".step-check").get_text())}</small></div></li>' for i,row in enumerate(rows))
  return '<div class="ed-focus ed-focus-path rk-playground"><p class="ed-focus-label">这篇文章的主线</p><h2>答案需要覆盖哪些证据？</h2><ol class="rk-steps">'+steps+'</ol><p class="ed-focus-foot">按问题安排阅读，保留每一步的依据。</p></div>'
 if variant=='path':
  # 通用分支：复用已获准的 ed-focus-path / rk-steps 版式，只把内容换成该篇自己的 Flow 步骤，
  # 不为单篇新造视觉语言；标题取该 Flow 区块自己的 ### 标题。
  flow=s.select_one('.ed-flow');rows=flow.select('li') if flow else []
  if not rows:raise ValueError('path variant needs a Flow block')
  head=next((h for h in flow.find_all('h3') if h.find_parent('li') is None),None)
  title=e(head.get_text()) if head else '按顺序看清每一步'
  steps=''.join(f'<li><span class="step-no">{i+1:02d}</span><div><b>{e(row.h3.get_text())}</b><small>{e(row.select_one(".step-check").get_text())}</small></div></li>' for i,row in enumerate(rows))
  return f'<div class="ed-focus ed-focus-path rk-playground"><p class="ed-focus-label">这篇文章的主线</p><h2>{title}</h2><ol class="rk-steps">{steps}</ol><p class="ed-focus-foot">每一步都留下可以核对的依据。</p></div>'
 if variant=='plain':
  # 阅读体验优先：不加焦点图。正文以 Prose 为主，只在真正需要的地方用组件，
  # 避免同一份内容在开头图解和正文里各出现一次。
  return ''
 if variant=='notebook':
  return '<div class="ed-focus ed-focus-memory rk-playground"><p class="ed-focus-label">一张图记住分工</p><div class="ed-memory-graphic"><div><span>冷区</span><b>原文保真</b><small>可回查的档案</small></div><div><span>温区</span><b>状态有效</b><small>标记替代与失效</small></div><div><span>热区</span><b>当前做事</b><small>只放本次必要材料</small></div></div><p class="ed-focus-foot">职责示意 · 面积不代表实际容量</p></div>'
 vals=[row.strong.get_text() for row in s.select('.ed-bar-row')]
 return f'<div class="ed-focus ed-focus-cost rk-playground"><p class="ed-focus-label">教学演算 / 同一批 100 个输入</p><h2>账单更小，不一定单位成本更低。</h2><div class="ed-cost-comparison"><div class="rk-metric"><span>方案 A</span><strong>{e(vals[0])}</strong><small>18 元 ÷ 50 个</small></div><div class="rk-metric"><span>方案 B</span><strong>{e(vals[1])}</strong><small>25 元 ÷ 95 个</small></div></div><p class="ed-focus-unit">元 / 可用结果</p><p class="ed-focus-foot">假设数据，未计人工；两组完成数量不同。</p></div>'

def article_layout(slug,meta,content,toc,chars,all_samples):
    soup=BeautifulSoup(content,'html.parser');thesis=soup.select_one('.ed-thesis');thesis_html=str(thesis);thesis.decompose();content=str(soup)
    nav=''.join(f'<a href="#{a}"><span>{i+1:02d}</span>{e(t)}</a>' for i,(a,t) in enumerate(toc))
    links='<a href="__BASE__archive/">全部博客 ↗</a><a href="__BASE__articles/research/examples/README.md">练习材料说明 ↗</a>'
    date=str(meta['date'])[:10]
    top=f'<div class="ed-masthead blog-sky"><header class="ed-hero"><p class="ed-eyebrow">个人 AI 笔记 / {e(meta["topic"])}</p><h1>{e(meta["title"])}</h1><p class="ed-deck">{e(meta["description"])}</p><div class="ed-meta"><span>约 {max(3,round(chars/380))} 分钟</span><time datetime="{date}">{date.replace("-",".")}</time><span>AI 辅助整理</span></div></header><div class="rk-clouds" data-sky-motion aria-hidden="true">{CLOUDS}</div></div>'
    route='<nav class="ed-route" aria-label="阅读路径">'+''.join(f'<a href="#{a}"><span>{i+1:02d}</span>{e(t)}</a>' for i,(a,t) in enumerate(toc[:3]))+'</nav>'
    tools=f'<div class="ed-toc-tools"><button class="ed-mode rk-button" type="button" data-variant="secondary" aria-pressed="false">只看图解与方法</button>{links}</div>'
    mobile=f'<details class="ed-mobile-toc rk-disclosure"><summary>阅读路线与练习材料</summary><nav>{nav}</nav>{tools}</details>'
    nxt=next((s,m) for s,m in all_samples.items() if s!=slug)
    ending=f'<nav class="ed-article-footer" aria-label="文章导航"><a href="__BASE__archive/">← 全部博客</a><a href="__BASE__posts/{nxt[0]}/">接着读：{e(nxt[1]["title"])} →</a></nav>'
    foot='<div class="ed-footnote"><span>个人笔记与公开资料经 AI 辅助整理，研究来源和教学假设见文末。</span><a href="__BASE__rss.xml">订阅博客 RSS</a></div>'
    opening=f'{thesis_html}{focus_diagram(meta["variant"],content)}{route}'
    return f'<div class="ed-site reading-kit" data-variant="{meta["variant"]}">{top}<div class="ed-progress" aria-hidden="true"></div><div class="ed-page"><div class="ed-grid"><article class="ed-article" id="article-content">{mobile}<p class="ed-mode-note" role="status">当前只显示图解与方法；可随时切回完整论证。</p>{opening}{content}{ending}</article><aside class="ed-toc"><p>本篇路线</p><nav aria-label="文章目录">{nav}</nav>{tools}</aside></div>{foot}</div></div>'
