import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateIssue, validateArchive } from './validate-news.mjs';
const fixture = JSON.parse(readFileSync(new URL('../src/data/news/2026-10-02.json', import.meta.url), 'utf8'));
const now = Date.parse('2026-10-03T12:00:00+08:00');
const copy = () => structuredClone(fixture);
test('valid issue with traceable sources passes', () => validateIssue(copy(), '2026-10-02.json', now));
test('blocks future dates and invalid calendar dates', () => {
  for (const date of ['2026-10-04', '2026-02-30']) {const i = copy();i.date = date;assert.throws(() => validateIssue(i, `${date}.json`, now));}
  const i = copy();i.stories[0].publishedDate = '2026-10-03';assert.throws(() => validateIssue(i, '2026-10-02.json', now));
});
test('rejects stale sources and unreviewed timestamps', () => {
  const i = copy();i.stories[0].publishedDate = '2026-09-01';assert.throws(() => validateIssue(i, '2026-10-02.json', now));
  const j = copy();j.checkedAt = '2026-10-02';assert.throws(() => validateIssue(j, '2026-10-02.json', now));
});
test('allows monthly research only for a matching configured feed', () => {
  const i = copy();const story = i.stories[0];
  Object.assign(story,{automated:true,sourceId:'baymard',feedUrl:'https://baymard.com/blog/feed.xml',category:'产品设计',publishedDate:'2026-09-10'});
  validateIssue(i,'2026-10-02.json',now);
  story.feedUrl='https://example.org/fake';assert.throws(()=>validateIssue(i,'2026-10-02.json',now));
  story.feedUrl='https://baymard.com/blog/feed.xml';story.publishedDate='2026-09-01';assert.throws(()=>validateIssue(i,'2026-10-02.json',now));
});
test('blocks unsafe URLs, empty summaries, and duplicate stories', () => {
  for (const patch of [{sourceUrl:'javascript:alert(1)'},{sourceUrl:'https://user:secret@example.com/'},{summary:''}]) {
    const i = copy();Object.assign(i.stories[0], patch);assert.throws(() => validateIssue(i, '2026-10-02.json', now));
  }
  const i = copy();i.stories.push({...i.stories[0]});assert.throws(() => validateIssue(i, '2026-10-02.json', now));
});
test('requires a valid prior reference before republishing an event', () => {
  const next = copy();next.date = '2026-10-03';next.checkedAt = '2026-10-03T10:00:00+08:00';next.stories = [next.stories[0]];
  const entries = [['2026-10-02.json', copy()], ['2026-10-03.json', next]];
  assert.throws(() => validateArchive(entries, now));
  next.stories[0].updateOf = '2026-10-02#copilot-computer-use';validateArchive(entries, now);
  next.stories[0].updateOf = '2026-10-01#missing';assert.throws(() => validateArchive(entries, now));
});
