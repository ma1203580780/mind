import {newsPublishedTime, canonicalNewsUrl} from './news-feed.mjs';

export const topics = [
  {slug:'ai-engineering',name:'AI 工程实践',intro:'从工具和论文出发，追踪智能体、评测与真实工程问题。',categories:['AI 资讯','AI 协作'],tags:['AI工程'],question:'如何把 AI 能力接进可用的产品？'},
  {slug:'product-experience',name:'AI 产品与交互',intro:'研究信息如何呈现，交互怎样帮助人理解和行动。',categories:['产品设计','审美提升'],tags:['交互设计'],question:'一个好界面，如何让复杂的事情变简单？'},
  {slug:'independent-building',name:'一个人做产品',intro:'连接创作、发布、经营与复盘，积累可以复用的方法。',categories:['一人公司','产品营销','经济观察'],tags:['创作','独立开发'],question:'怎样把一个想法，做成持续运转的作品？'},
];

/** Conservative grouping: explicit shared event key or exactly equal meaningful
 * titles. Never infer that two stories describe the same event from keywords. */
export function groupStories(entries) {
  const groups = [], keys = new Map();
  for (const entry of entries) {
    const title = String(entry.title||'').normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}\s]/gu,'');
    const key = entry.eventKey && !entry.eventKey.startsWith('feed-') ? `event:${entry.eventKey}` : title.length >= 28 ? `title:${title}` : `url:${canonicalNewsUrl(entry.sourceUrl) || entry.id}`;
    if (keys.has(key)) keys.get(key).push(entry);
    else {const group=[entry];keys.set(key,group);groups.push(group);}
  }
  return groups;
}

/** A reproducible reading shortlist, not a popularity or truth ranking.
 * Anchor on latest captured edition so builds remain deterministic. */
export function readingCandidates(entries, anchorDate, limit=5) {
  const end=Date.parse(`${anchorDate}T23:59:59+08:00`), start=end-7*86400000;
  const eligible=entries.filter(e=>newsPublishedTime(e)>=start&&newsPublishedTime(e)<=end&&(e.summaryZh||e.summary||'').length>=80&&((e.sourceLanguage||'en')==='zh'||e.titleZh));
  const sorted=groupStories(eligible).map(g=>g[0]).sort((a,b)=>newsPublishedTime(b)-newsPublishedTime(a)||a.id.localeCompare(b.id));
  const chosen=[],sources=new Set(),categories=new Set();
  for(const varied of [true,false]) for(const e of sorted){
    if(chosen.length>=limit)break;
    if(sources.has(e.sourceName)||(varied&&categories.has(e.category)))continue;
    chosen.push(e);sources.add(e.sourceName);categories.add(e.category);
  }
  return chosen;
}

export const candidateReason = entry => `近 7 天 · ${entry.sourceLanguage==='zh'?'中文原文':'中文译文可用'} · 摘要较完整`;
