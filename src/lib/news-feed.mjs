/** Pure archive helpers shared by the generated pages and browser controls. */
const trackingKeys = new Set(['fbclid', 'gclid', 'dclid', 'msclkid', 'mc_cid', 'mc_eid']);

export function canonicalNewsUrl(raw) {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    url.protocol = 'https:';
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith('utm_') || trackingKeys.has(key.toLowerCase())) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.href;
  } catch {
    return null;
  }
}

/** Date-only source records represent the start of that date in Shanghai. */
export function newsPublishedTime(entry) {
  const explicit = timestamp(entry.publishedAt);
  if (Number.isFinite(explicit)) return explicit;
  const date = entry.publishedDate || entry.issueDate;
  const fallback = Date.parse(`${date}T00:00:00+08:00`);
  return Number.isFinite(fallback) ? fallback : 0;
}

function timestamp(value) {
  // Date-only strings are not precise timestamps and must use the Shanghai fallback.
  if (typeof value !== 'string' || !/[T ]\d{2}:\d{2}/.test(value)) return NaN;
  // Old records without an explicit zone are interpreted consistently in Shanghai.
  const zoned = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value}+08:00`;
  return Date.parse(zoned);
}

const textCompare = (a, b) => String(a || '').localeCompare(String(b || ''), 'en');
const captureTime = (entry) => {
  const time = timestamp(entry.fetchedAt);
  return Number.isFinite(time) ? time : 0;
};
const enrichmentScore = (entry) => Number(Boolean(entry.titleZh)) + Number(Boolean(entry.summaryZh)) + Number(Boolean(entry.image)) + Number(entry.translationStatus === 'ready');

/** Latest issue wins if an older article was intentionally republished/enriched. */
function preferRecord(candidate, previous) {
  const issueOrder = textCompare(candidate.issueDate, previous.issueDate);
  if (issueOrder) return issueOrder > 0;
  const captured = captureTime(candidate) - captureTime(previous);
  if (captured) return captured > 0;
  const enrichment = enrichmentScore(candidate) - enrichmentScore(previous);
  if (enrichment) return enrichment > 0;
  return textCompare(candidate.id, previous.id) > 0;
}

export function collectNewsHistory(issues) {
  const unique = new Map();
  for (const issue of issues || []) {
    for (const story of issue.stories || []) {
      const entry = { ...story, issueDate: issue.date };
      const url = canonicalNewsUrl(entry.sourceUrl);
      const key = url ? `url:${url}` : `id:${entry.id}`;
      const previous = unique.get(key);
      if (!previous || preferRecord(entry, previous)) unique.set(key, entry);
    }
  }
  return [...unique.values()].sort((a, b) =>
    newsPublishedTime(b) - newsPublishedTime(a) ||
    captureTime(b) - captureTime(a) ||
    textCompare(a.id, b.id) ||
    textCompare(a.sourceUrl, b.sourceUrl));
}

const normalize = (value) => String(value || '').normalize('NFKC').toLowerCase();

export function filterNews(entries, { language = 'all', category = '全部', query = '' } = {}) {
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return entries.filter(entry => {
    if (language !== 'all' && language && (entry.sourceLanguage || 'en') !== language) return false;
    if (category && category !== '全部' && category !== 'all' && entry.category !== category) return false;
    if (!words.length) return true;
    const searchable = normalize([
      entry.title, entry.titleZh, entry.summary, entry.summaryZh,
      entry.sourceName, entry.category, entry.kind, entry.domain,
      entry.author, entry.why, entry.action,
    ].join(' '));
    return words.every(word => searchable.includes(word));
  });
}

export function paginateNews(entries, page = 1, pageSize = 100) {
  const size = Number.isFinite(Number(pageSize)) && Number(pageSize) > 0 ? Math.max(1, Math.floor(Number(pageSize))) : 100;
  const total = entries.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const requested = Number.isFinite(Number(page)) ? Math.floor(Number(page)) : 1;
  const current = Math.min(pageCount, Math.max(1, requested));
  const offset = (current - 1) * size;
  return { entries: entries.slice(offset, offset + size), pageCount, total, page: current, pageSize: size };
}
