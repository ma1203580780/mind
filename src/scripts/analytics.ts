// Only low-cardinality, explicitly allowed event fields leave the browser.
export const eventFields: Record<string, string[]> = {
  discover_view: [], discover_resource_click: [], discover_community_click: [], discover_github_click: [], discover_rss_click: [], discover_discussion_click: [],
  build_view: [], build_problem_click: [], article_discussion_click: [], article_discover_click: [], project_github_click: [], home_discover_click: [],
  article_mode: ['mode'], article_open: ['mode'], read_depth: ['percent'], read_active: ['seconds'],
  audio_play: ['type'], audio_complete: ['type'], audio_progress: ['type','percent'],
  video_play: ['type'], video_complete: ['type'], video_progress: ['type','percent'],
  media_error: ['type'], video_load: ['provider'], bilibili_open: [],
  news_source_open: ['story','source','category','issue'], news_filter: ['category'], news_view: ['view'],
  news_expand: ['story'], search_used: ['area','results'], article_share: [], code_copy: [],
  reading_save: ['kind','saved'], lab_interact: ['mode'], subscribe: ['feed'], outbound: ['source'], analytics_test: [],
};
export function isExcluded() {
  try { return navigator.doNotTrack === '1' || localStorage.getItem('analytics-opt-out') === 'true' || localStorage.getItem('analytics-owner') === 'true'; }
  catch { return navigator.doNotTrack === '1'; }
}
// 访问统计默认关闭：只有访问者在隐私页主动允许后才加载任何第三方统计脚本，
// 站内默认不向第三方域名发起请求。DNT 与站长排除始终优先。
export function analyticsAllowed() {
  try { return !isExcluded() && localStorage.getItem('analytics-consent') === 'granted'; }
  catch { return false; }
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
