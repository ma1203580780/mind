import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync('src/scripts/sky-background.js','utf8');
const makeSky=()=>{
 const keeper={getAttribute:()=> 'navigation-sky'};
 const cloud={animation:{animationName:'blog-cloud-drift',currentTime:17350,playbackRate:1},getAnimations(){return [this.animation]}};
 return {dataset:{},keeper,cloud,closest:()=>keeper,querySelectorAll:()=>[cloud]};
};

test('the primary tabs retain the same sky and stylesheet beneath the search pool',()=>{
 const routes=['news','archive','lab','discover','search'];
 const skies=[],styles=[];
 for(const route of routes){
  const html=readFileSync(`dist/${route}/index.html`,'utf8');
  const sky=html.match(/<div[^>]*id="navigation-sky"[\s\S]*?<\/svg>\s*<\/div>\s*<\/div>/)?.[0];
  const style=html.match(/<style[^>]*data-astro-transition-persist="navigation-sky-styles"[^>]*>[\s\S]*?<\/style>/)?.[0];
  assert.ok(sky,route);assert.ok(style,route);
  assert.match(sky,/data-astro-transition-persist="navigation-sky"/);
  assert.match(html,/<header[^>]*data-astro-transition-persist="site-header"/);
  assert.ok(html.includes(`data-scene="${route==='search'?'pool':'sky'}"`),route);
  assert.doesNotMatch(html,/class="page-backdrop"|class="archive-sky"|class="search-waves"|class="lab-halo"/);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`${route}: unique IDs`);
  // Astro's generated scope can differ with the caller's transition count.
  skies.push(sky.replace(/ data-astro-transition-scope="[^"]+"/g,''));styles.push(style);
 }
 for(const sky of skies)assert.equal(sky,skies[0]);
 for(const style of styles)assert.equal(style,styles[0]);
});

test('persistent navigation keeps observers and restores the cloud phase after reinsertion',()=>{
 const sky=makeSky(),doc=new EventTarget(),observers=[];
 doc.hidden=false;doc.readyState='complete';doc.nodes=[sky];
 doc.querySelectorAll=()=>doc.nodes;
 class Observer{
  constructor(callback){this.callback=callback;this.disconnected=false;observers.push(this)}
  observe(node){this.node=node}
  disconnect(){this.disconnected=true}
 }
 const dispatch=(name,newDocument)=>{
  const event=new Event(name);event.newDocument=newDocument;doc.dispatchEvent(event);
 };
 runInNewContext(source,{document:doc,window:{IntersectionObserver:Observer},IntersectionObserver:Observer,AbortController});
 assert.equal(observers.length,1);assert.equal(sky.dataset.paused,'false');
 const next={getElementById:()=>sky.keeper};
 for(let switchCount=0;switchCount<5;switchCount++){
  sky.cloud.animation.currentTime+=2100;
  const phase=sky.cloud.animation.currentTime;
  dispatch('astro:before-swap',next);
  // Model browsers that restart CSS animations when Astro reinserts a DOM node.
  sky.cloud.animation={animationName:'blog-cloud-drift',currentTime:0,playbackRate:1};
  dispatch('astro:after-swap');
  dispatch('astro:page-load');
  assert.equal(sky.cloud.animation.currentTime,phase);
  assert.equal(observers.length,1);assert.equal(observers[0].disconnected,false);
 }
 doc.hidden=true;dispatch('visibilitychange');assert.equal(sky.dataset.paused,'true');
 doc.hidden=false;dispatch('visibilitychange');assert.equal(sky.dataset.paused,'false');
 observers[0].callback([{isIntersecting:false}]);assert.equal(sky.dataset.paused,'true');
 observers[0].callback([{isIntersecting:true}]);assert.equal(sky.dataset.paused,'false');
 dispatch('astro:before-swap',{getElementById:()=>null});
 doc.nodes=[];dispatch('astro:after-swap');dispatch('astro:page-load');
 assert.equal(observers[0].disconnected,true);
 // The departed sky no longer receives document visibility events.
 doc.hidden=true;dispatch('visibilitychange');assert.equal(sky.dataset.paused,'false');
 const returning=makeSky();doc.nodes=[returning];dispatch('astro:page-load');
 assert.equal(observers.length,2);assert.equal(returning.dataset.paused,'true');
 doc.hidden=false;dispatch('visibilitychange');assert.equal(returning.dataset.paused,'false');
});
