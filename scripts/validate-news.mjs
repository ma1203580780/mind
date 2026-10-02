import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

export const categories = ['AI 动态', '开源工具', '工程实践', '产品观察', '创作设计'];
const day = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const text = (value, max, label) => assert(typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[<>]/.test(value), `Invalid ${label}`);
export function validateIssue(issue, filename, now = Date.now()) {
  assert(day(issue.date) && filename === `${issue.date}.json`, 'Issue date must match filename');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  assert(issue.date <= today, 'Future issue date');
  assert(typeof issue.checkedAt === 'string' && /(?:Z|[+-]\d\d:\d\d)$/.test(issue.checkedAt), 'checkedAt needs timezone');
  const checked = Date.parse(issue.checkedAt);
  assert(Number.isFinite(checked) && checked <= now + 300000 && checked >= Date.parse(`${issue.date}T00:00:00+08:00`), 'Invalid review timestamp');
  text(issue.title, 70, 'issue title'); text(issue.intro, 250, 'intro');
  assert(Array.isArray(issue.briefing) && issue.briefing.length >= 1 && issue.briefing.length <= 4, 'Use 1–4 briefing lines');
  issue.briefing.forEach(v => text(v, 140, 'briefing'));
  assert(Array.isArray(issue.stories) && issue.stories.length >= 1 && issue.stories.length <= 10, 'Use 1–10 sourced stories; never fill a quota');
  const ids = new Set(), events = new Set(), urls = new Set();
  for (const s of issue.stories) {
    for (const key of ['id', 'eventKey']) assert(typeof s[key] === 'string' && /^[a-z0-9-]{3,100}$/.test(s[key]), `Invalid ${key}`);
    assert(!ids.has(s.id) && !events.has(s.eventKey), 'Duplicate story or event'); ids.add(s.id); events.add(s.eventKey);
    assert(categories.includes(s.category), 'Unknown category');
    for (const [key, max] of [['kind',20],['title',90],['summary',350],['why',200],['action',150],['sourceName',60]]) text(s[key], max, key);
    const url = new URL(s.sourceUrl);
    assert(url.protocol === 'https:' && !url.username && !url.password && !url.hash && !url.search, 'Use canonical HTTPS source URL');
    const canonical = url.href.replace(/\/$/, '');
    assert(!urls.has(canonical), 'Duplicate source'); urls.add(canonical);
    assert(day(s.publishedDate) && s.publishedDate <= issue.date, 'Invalid or future source date');
    assert(Date.parse(issue.date) - Date.parse(s.publishedDate) <= 7 * 86400000, 'Source older than 7 days');
    if (s.updateOf) assert(/^\d{4}-\d{2}-\d{2}#[a-z0-9-]+$/.test(s.updateOf), 'updateOf must identify original story');
  }
}
export function validateArchive(entries, now = Date.now()) {
  const events = new Map(), urls = new Map();
  for (const [filename, issue] of [...entries].sort(([a], [b]) => a.localeCompare(b))) {
    validateIssue(issue, filename, now);
    for (const s of issue.stories) {
      const canonical = s.sourceUrl.replace(/\/$/, '');
      const prior = events.get(s.eventKey) || urls.get(canonical);
      if (prior) assert(s.updateOf === prior, `Repeated event needs explicit updateOf: ${s.id}`);
      else assert(!s.updateOf, `updateOf has no matching prior event: ${s.id}`);
      events.set(s.eventKey, `${issue.date}#${s.id}`); urls.set(canonical, `${issue.date}#${s.id}`);
    }
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = new URL('../src/data/news/', import.meta.url);
  const entries = readdirSync(dir).filter(n => n.endsWith('.json')).map(n => [n, JSON.parse(readFileSync(new URL(n, dir), 'utf8'))]);
  assert(entries.length, 'News archive must not be empty');
  validateArchive(entries);
  console.log(`News validation passed: ${entries.length} issue(s), ${entries.reduce((n, [, i]) => n + i.stories.length, 0)} stories.`);
}
