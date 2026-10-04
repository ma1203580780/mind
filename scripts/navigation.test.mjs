import test from 'node:test';import assert from 'node:assert/strict';
import {sectionForPath} from '../src/lib/site-navigation.mjs';
import {onPageLoad} from '../src/scripts/page-lifecycle.ts';
test('deep routes retain the right top-level navigation',()=>{
 for(const [route,section] of [['','news'],['picks/','news'],['news/filter/2026-10-03/en/AI/1/','news'],['posts/building-mind/','articles'],['tags/AI工程/','articles'],['archive/','articles'],['archive/category/ai-engineering/','articles'],['archive/year/2026/','articles'],['topics/ai-engineering/','site'],['lab/stream/','lab'],['search/','search']])assert.equal(sectionForPath('/mind/'+route),section);
});
test('leaving a page disposes timers and global handlers before a revisit',()=>{
 const doc=new EventTarget();globalThis.document=doc;let starts=0,cleanups=0,signals=[];
 onPageLoad((signal,cleanup)=>{starts++;signals.push(signal);cleanup(()=>cleanups++);});
 doc.dispatchEvent(new Event('astro:page-load'));assert.equal(starts,1);assert.equal(signals[0].aborted,false);
 doc.dispatchEvent(new Event('astro:before-swap'));assert.equal(cleanups,1);assert.equal(signals[0].aborted,true);
 doc.dispatchEvent(new Event('astro:page-load'));assert.equal(starts,2);assert.equal(signals[1].aborted,false);
 doc.dispatchEvent(new Event('astro:before-swap'));assert.equal(cleanups,2);
});
