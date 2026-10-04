import {newsPublishedTime, canonicalNewsUrl} from './news-feed.mjs';
import {usableTranslation,isReleaseNote} from './news-quality.mjs';

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
  const eligible=entries.filter(e=>newsPublishedTime(e)>=start&&newsPublishedTime(e)<=end&&!isReleaseNote(e)&&(e.summaryZh||e.summary||'').length>=80&&((e.sourceLanguage||'en')==='zh'||(usableTranslation(e.titleZh,e.title)&&usableTranslation(e.summaryZh,e.summary))));
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
