// Only low-cardinality, explicitly allowed event fields leave the browser.
export const eventFields: Record<string, string[]> = {
  article_mode: ['mode'], article_open: ['mode'], read_depth: ['percent'], read_active: ['seconds'],
  audio_play: ['type'], audio_complete: ['type'], audio_progress: ['type','percent'],
  video_play: ['type'], video_complete: ['type'], video_progress: ['type','percent'],
  media_error: ['type'], video_load: ['provider'], bilibili_open: [],
  news_source_open: ['story','source','category','issue'], news_filter: ['category'], news_view: ['view'],
  news_expand: ['story'], search_used: ['area','results'], article_share: [], code_copy: [],
  reading_save: ['kind','saved'], lab_interact: ['mode'], topic_open: ['topic'], subscribe: ['feed'], outbound: ['source'], analytics_test: [],
};
export function isExcluded() {
  try { return navigator.doNotTrack === '1' || localStorage.getItem('analytics-opt-out') === 'true' || localStorage.getItem('analytics-owner') === 'true'; }
  catch { return navigator.doNotTrack === '1'; }
}
export function replayAllowed() {
  try { return !isExcluded() && localStorage.getItem('analytics-replay') === 'granted'; } catch { return false; }
}
export function cleanUrl(input: string) {
  try {
    const u = new URL(input, location.origin);
    // Keep intentional campaign identifiers; discard search text, hashes and arbitrary parameters.
    const kept = new URLSearchParams();
    for (const key of ['utm_source','utm_medium','utm_campaign']) {
      const value = u.searchParams.get(key);
      if (value && /^[a-z0-9_-]{1,64}$/i.test(value)) kept.set(key,value);
    }
    return u.origin + u.pathname + (kept.size ? '?' + kept : '');
  } catch { return ''; }
}
export function track(name: string, data: Record<string,string|number> = {}) {
  if (!eventFields[name] || isExcluded()) return;
  const safe: Record<string,string|number> = {};
  for (const key of eventFields[name]) {
    const value=data[key];
    if (typeof value === 'number' && Number.isFinite(value)) safe[key]=value;
    else if (typeof value === 'string') safe[key]=value.slice(0,100);
  }
  const post=document.querySelector<HTMLElement>('.article-media')?.dataset.postId;
  if(post) safe.article=post;
  const config=document.querySelector<HTMLElement>('#analytics-config');
  const w=window as any;
  let sent=false;
  if(config?.dataset.websiteId && typeof w.umami?.track==='function') {
    try { Promise.resolve(w.umami.track(name,safe)).catch(()=>{});sent=true; } catch {}
  }
  if(config?.dataset.clarityId && replayAllowed() && typeof w.clarity==='function') {
    // Clarity events have no arbitrary text payload. Dimensions are inspected in Umami.
    try { w.clarity('event',name);sent=true; } catch {}
  }
  document.dispatchEvent(new CustomEvent('analytics:event',{detail:{name,data:safe,state:sent?'queued':'not-connected'}}));
}
