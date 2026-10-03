import test from 'node:test';import assert from 'node:assert/strict';import {readingCandidates,groupStories} from '../src/lib/discovery-rules.mjs';
import {usableTranslation,cleanStoryTranslation,isReleaseNote} from '../src/lib/news-quality.mjs';
const story=(id,extra={})=>({id,eventKey:'feed-'+id,title:'A detailed independent article about '+id,summary:'a'.repeat(100),sourceName:id,sourceLanguage:'zh',sourceUrl:'https://example.com/'+id,publishedDate:'2026-10-03',issueDate:'2026-10-03',category:id,...extra});
test('candidates enforce freshness, readable text and source diversity without padding',()=>{
 const entries=[story('fresh'),story('same',{sourceName:'fresh'}),story('old',{publishedDate:'2026-09-01'}),story('future',{publishedDate:'2026-10-04'}),story('untranslated',{sourceLanguage:'en'}),story('short',{summary:'short'}),story('second')];
 assert.deepEqual(new Set(readingCandidates(entries,'2026-10-03').map(s=>s.id)),new Set(['fresh','second']));
 assert.equal(readingCandidates([],'2026-10-03').length,0);
});
test('short release titles from unrelated projects are not merged',()=>assert.equal(groupStories([story('a',{title:'v1.0.0'}),story('b',{title:'v1.0.0'})]).length,2));
test('bad translations fall back without corrupting source history',()=>{
 const original=story('bad',{sourceLanguage:'en',titleZh:'一份可读的标题',summaryZh:'标有，'.repeat(100)});
 const result=cleanStoryTranslation(original);assert.equal(result.summaryZh,undefined);assert.equal(result.summary,original.summary);assert.equal(result.translationStatus,'partial');assert.ok(original.summaryZh);
 assert.equal(usableTranslation('English only'),false);assert.equal(usableTranslation('正常中文译文。','Normal translated text.'),true);
 assert.equal(readingCandidates([original],'2026-10-03').length,0);
});
test('release notes stay out of the shortlist',()=>{
 const release=story('rc',{kind:'版本发布',title:'v0.31.0rc5: [misc] upper bounds',summary:'Co-authored-by: '.repeat(10)});
 assert.equal(isReleaseNote(release),true);assert.equal(readingCandidates([release],'2026-10-03').length,0);
 assert.equal(isReleaseNote(story('major',{kind:'版本发布',title:'v2.0 stable: a new architecture'})),true);
});
test('translation revisions expire when the source excerpt changes',()=>{
 const s=story('revision',{sourceLanguage:'en'}),edits=[{id:s.id,originalTitle:s.title,originalSummary:s.summary,titleZh:'修订标题',summaryZh:'修订摘要'}];
 assert.equal(cleanStoryTranslation(s,edits).summaryZh,'修订摘要');
 assert.equal(cleanStoryTranslation({...s,summary:'Updated source excerpt'},edits).summaryZh,undefined);
});
test('explicit shared event keys group coverage; candidates cap at five',()=>{assert.equal(groupStories([story('a',{eventKey:'same-event'}),story('b',{eventKey:'same-event'})]).length,1);assert.equal(readingCandidates(Array.from({length:12},(_,i)=>story('story'+i)),'2026-10-03').length,5);});
