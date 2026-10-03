import test from 'node:test';import assert from 'node:assert/strict';import {readingCandidates,groupStories} from '../src/lib/discovery-rules.mjs';
const story=(id,extra={})=>({id,eventKey:'feed-'+id,title:'A detailed independent article about '+id,summary:'a'.repeat(100),sourceName:id,sourceLanguage:'zh',sourceUrl:'https://example.com/'+id,publishedDate:'2026-10-03',issueDate:'2026-10-03',category:id,...extra});
test('candidates enforce freshness, readable text and source diversity without padding',()=>{
 const entries=[story('fresh'),story('same',{sourceName:'fresh'}),story('old',{publishedDate:'2026-09-01'}),story('future',{publishedDate:'2026-10-04'}),story('untranslated',{sourceLanguage:'en'}),story('short',{summary:'short'}),story('second')];
 assert.deepEqual(new Set(readingCandidates(entries,'2026-10-03').map(s=>s.id)),new Set(['fresh','second']));
 assert.equal(readingCandidates([],'2026-10-03').length,0);
});
test('short release titles from unrelated projects are not merged',()=>assert.equal(groupStories([story('a',{title:'v1.0.0'}),story('b',{title:'v1.0.0'})]).length,2));
test('explicit shared event keys group coverage; candidates cap at five',()=>{assert.equal(groupStories([story('a',{eventKey:'same-event'}),story('b',{eventKey:'same-event'})]).length,1);assert.equal(readingCandidates(Array.from({length:12},(_,i)=>story('story'+i)),'2026-10-03').length,5);});
