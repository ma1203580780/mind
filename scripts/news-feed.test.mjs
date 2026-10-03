import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalNewsUrl, collectNewsHistory, filterNews, newsPublishedTime, paginateNews } from '../src/lib/news-feed.mjs';

const story = (id, overrides = {}) => ({
  id, sourceUrl: `https://example.com/article/${id}`, publishedDate: '2026-10-02',
  title: `Article ${id}`, summary: 'Source excerpt', category: 'AI 动态', sourceLanguage: 'en', ...overrides,
});
const issue = (date, stories) => ({ date, stories });

test('history accumulates more than a daily cap and pages 30 at a time without loss', () => {
  const records = Array.from({ length: 237 }, (_, i) => story(`story-${i}`));
  const history = collectNewsHistory([
    issue('2026-10-03', records.slice(0, 37)),
    issue('2026-10-02', records.slice(37, 137)),
    issue('2026-10-01', records.slice(137)),
  ]);
  const pages = Array.from({length:8},(_,i)=>i+1).map(page => paginateNews(history, page));
  assert.equal(history.length, 237);
  assert.deepEqual(pages.map(page => page.entries.length), [30,30,30,30,30,30,30,27]);
  assert.equal(new Set(pages.flatMap(page => page.entries.map(entry => entry.id))).size, 237);
  assert.equal(pages[0].pageCount, 8);
  assert.equal(pages[1].total, 237);
  assert.equal(history.find(entry => entry.id === 'story-150').issueDate, '2026-10-01');
});

test('chronology uses actual publication instants, not issue dates or pictures', () => {
  const history = collectNewsHistory([
    issue('2026-10-03', [story('old', { publishedAt: '2026-10-01T23:59:59+08:00', image: 'https://example.com/old.jpg' })]),
    issue('2026-10-02', [
      story('late', { publishedAt: '2026-10-02T22:00:00+08:00' }),
      story('date-only'),
      story('zone-equivalent', { publishedAt: '2026-10-02T10:00:00Z' }),
      story('early', { publishedAt: '2026-10-02T01:00:00+08:00' }),
    ]),
  ]);
  assert.deepEqual(history.map(entry => entry.id), ['late', 'zone-equivalent', 'early', 'date-only', 'old']);
  assert.equal(newsPublishedTime(story('date-only')), Date.parse('2026-10-01T16:00:00Z'));
  assert.equal(newsPublishedTime(story('bad-time', { publishedAt: 'not a time' })), Date.parse('2026-10-01T16:00:00Z'));
  assert.equal(newsPublishedTime(story('bare-date', { publishedAt: '2026-10-02' })), Date.parse('2026-10-01T16:00:00Z'));
});

test('stable timestamp ties use capture time then ID regardless of input issue order', () => {
  const entries = [
    story('b', { publishedAt: '2026-10-02T12:00:00Z', fetchedAt: '2026-10-02T13:00:00Z' }),
    story('a', { publishedAt: '2026-10-02T12:00:00Z', fetchedAt: '2026-10-02T13:00:00Z' }),
    story('c', { publishedAt: '2026-10-02T12:00:00Z', fetchedAt: '2026-10-02T14:00:00Z' }),
  ];
  assert.deepEqual(collectNewsHistory([issue('2026-10-02', entries)]).map(entry => entry.id), ['c', 'a', 'b']);
  assert.deepEqual(collectNewsHistory([issue('2026-10-02', [...entries].reverse())]).map(entry => entry.id), ['c', 'a', 'b']);
});

test('deduplicates tracked URLs using the newest enriched issue while keeping meaningful query IDs', () => {
  const old = story('original', { sourceUrl: 'http://example.com/story?id=42&utm_source=rss#intro' });
  const updated = story('updated', { sourceUrl: 'https://example.com/story?gclid=123&id=42', titleZh: '最新译文', summaryZh: '中文摘要' });
  const different = story('other', { sourceUrl: 'https://example.com/story?id=43' });
  const history = collectNewsHistory([
    issue('2026-10-03', [updated, different]),
    issue('2026-10-02', [old]),
  ]);
  assert.equal(history.length, 2);
  assert.equal(history.find(entry => entry.id === 'updated').titleZh, '最新译文');
  assert.equal(history.find(entry => entry.id === 'updated').issueDate, '2026-10-03');
  assert.equal(canonicalNewsUrl('https://example.com/?b=2&a=1&UTM_campaign=c#s'), 'https://example.com/?a=1&b=2');
  assert.equal(canonicalNewsUrl('javascript:alert(1)'), null);
  assert.equal(canonicalNewsUrl('https://user:secret@example.com'), null);
});

test('same-issue duplicates retain later capture or richer translation, invalid URLs fall back to ID', () => {
  const base = story('same', { sourceUrl: 'invalid', fetchedAt: '2026-10-02T09:00:00Z' });
  const enriched = { ...base, titleZh: '更完整的中文', summaryZh: '摘要', translationStatus: 'ready' };
  const later = { ...base, fetchedAt: '2026-10-02T10:00:00Z', titleZh: '最新抓取' };
  assert.equal(collectNewsHistory([issue('2026-10-02', [base, enriched])])[0].titleZh, '更完整的中文');
  assert.equal(collectNewsHistory([issue('2026-10-02', [base, enriched, later])])[0].titleZh, '最新抓取');
  assert.equal(collectNewsHistory([issue('2026-10-02', [base, story('other', { sourceUrl: 'invalid' })])]).length, 2);
});

test('filters all accumulated history before pagination and searches Chinese plus original English', () => {
  const entries = Array.from({ length: 245 }, (_, i) => story(`item-${String(i).padStart(3, '0')}`, {
    sourceLanguage: i % 2 === 0 ? 'zh' : 'en',
    category: i % 3 === 0 ? '宏观经济' : 'AI 动态',
    title: 'AI markets report', titleZh: '人工智能市场报告',
    summaryZh: i > 180 ? '央行政策' : '模型更新', sourceName: '发布者',
  }));
  const history = collectNewsHistory([issue('2026-10-02', entries)]);
  assert.equal(filterNews(history, { language: 'zh' }).length, 123);
  assert.equal(filterNews(history, { language: 'en', category: '宏观经济' }).length, 41);
  const filtered = filterNews(history, { language: 'en', category: '宏观经济', query: '央行 MARKETS' });
  assert.equal(filtered.length, 11);
  assert.ok(filtered.every(entry => Number(entry.id.slice(5)) > 180));
  assert.equal(paginateNews(filterNews(history, { language: 'en' }), 5).entries.length, 2);
  assert.equal(filterNews([story('fallback', { sourceLanguage: undefined })], { language: 'en' }).length, 1);
  assert.equal(filterNews(history, { query: '不存在' }).length, 0);
  assert.equal(history.length, 245, 'filtering must not alter the archive');
});

test('empty archives and invalid pages clamp to a consistent valid page', () => {
  assert.deepEqual(collectNewsHistory([]), []);
  assert.deepEqual(paginateNews([]), { entries: [], pageCount: 1, total: 0, page: 1, pageSize: 30 });
  const entries = Array.from({ length: 205 }, (_, i) => story(String(i)));
  for (const page of [-5, 0, NaN, 'invalid']) assert.equal(paginateNews(entries, page).page, 1);
  assert.equal(paginateNews(entries, 99).page, 7);
  assert.equal(paginateNews(entries, '2').entries[0].id, '30');
  assert.equal(paginateNews(entries, 2.9).page, 2);
  assert.equal(paginateNews(entries, 1, 0).pageSize, 30);
  assert.equal(paginateNews(entries, 1, 2.9).pageSize, 2);
});

test('old categories remain reachable under the new reading topics', () => {
 const history=collectNewsHistory([issue('2026-10-02',[story('paper',{category:'AI 研究'}),story('tool',{category:'开源工具'}),story('econ',{category:'经济数据'})])]);
 assert.equal(filterNews(history,{category:'AI 资讯'})[0].id,'paper');
 assert.equal(filterNews(history,{category:'AI 研究'})[0].id,'paper');
 assert.equal(filterNews(history,{category:'AI 协作'})[0].id,'tool');
 assert.equal(filterNews(history,{category:'经济观察'})[0].id,'econ');
});
