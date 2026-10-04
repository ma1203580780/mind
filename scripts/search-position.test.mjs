import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSearchPositioner} from '../src/lib/search-position.mjs';

function fixture(reduce=false){
 const root={dataset:{}},animations=[];
 let visualOffset=0,reads=0;
 const field={getBoundingClientRect(){reads++;return {top:(root.dataset.layout==='results'?24:300)+visualOffset}}};
 const positioner=createSearchPositioner(root,field,{
  reducedMotion:()=>reduce,
  animate(_element,frames,options){
   const animation={frames,options,cancelled:false,cancel(){this.cancelled=true;visualOffset=0}};
   animations.push(animation);return animation;
  }
 });
 return {root,animations,positioner,reads:()=>reads,offset:value=>{visualOffset=value}};
}
test('empty and bookmarked searches load directly at their correct positions',()=>{
 for(const active of [false,true]){
  const f=fixture();f.positioner.move(active);
  assert.equal(f.root.dataset.layout,active?'results':'idle');assert.equal(f.animations.length,0);
  f.positioner.move(active);assert.equal(f.reads(),0);
 }
});
test('typing moves up, clearing returns down, further typing does not restart the transition',()=>{
 const f=fixture();f.positioner.move(false);f.positioner.move(true);
 assert.equal(f.animations[0].frames[0].transform,'translate3d(0,276px,0)');
 assert.equal(f.animations[0].options.duration,680);
 f.positioner.move(true);assert.equal(f.animations.length,1);
 f.positioner.move(false);
 assert.equal(f.animations[0].cancelled,true);
 assert.equal(f.animations[1].frames[0].transform,'translate3d(0,-276px,0)');
 f.positioner.dispose();assert.equal(f.animations[1].cancelled,true);
});
test('a reversal starts at the current visual position before cancelling the earlier animation',()=>{
 const f=fixture();f.positioner.move(false);f.positioner.move(true);
 f.offset(120);f.positioner.move(false);
 assert.equal(f.animations[1].frames[0].transform,'translate3d(0,-156px,0)');
 assert.equal(f.animations[0].cancelled,true);
});
test('failed index loading leaves the retry control at the top and a successful retry returns to centre',()=>{
 const f=fixture();f.positioner.move(false);f.positioner.move(false,true);
 assert.equal(f.root.dataset.layout,'results');assert.equal(f.root.dataset.active,'false');
 f.positioner.move(false);assert.equal(f.root.dataset.layout,'idle');
 assert.equal(f.animations.length,2);
});
test('reduced motion changes layout without animation',()=>{
 const f=fixture(true);f.positioner.move(false);f.positioner.move(true);f.positioner.move(false);
 assert.equal(f.root.dataset.layout,'idle');assert.equal(f.animations.length,0);
 f.positioner.dispose();
});
