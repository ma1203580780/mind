import test from 'node:test';import assert from 'node:assert/strict';
import {readState,changeState,clearReading} from '../src/scripts/reading-store.ts';
const data=new Map();let failed=false;
globalThis.localStorage={getItem:key=>data.get(key)||null,setItem:(key,value)=>{if(failed)throw Error('quota');data.set(key,value);},removeItem:key=>{if(failed)throw Error('blocked');data.delete(key);}};
globalThis.document={dispatchEvent:()=>{}};
test('saved and read records remain independent and survive reload reads',()=>{data.clear();assert.equal(changeState('saved','news:one',true),true);changeState('read','news:one',true);assert.ok(readState().saved['news:one']);assert.ok(readState().read['news:one']);changeState('saved','news:one',false);assert.equal(readState().saved['news:one'],undefined);assert.ok(readState().read['news:one']);});
test('corrupt and untrusted local storage is ignored',()=>{data.set('mind-reading-v1','broken');assert.deepEqual(readState(),{saved:{},read:{}});data.set('mind-reading-v1',JSON.stringify({saved:{'news:ok':1,'javascript:bad':2,'post:text':'unexpected'},read:[]}));assert.deepEqual(readState(),{saved:{'news:ok':1},read:{}});});
test('storage failures return failure without claiming success',()=>{data.clear();failed=true;assert.equal(changeState('saved','news:one',true),false);assert.equal(clearReading(),false);failed=false;changeState('saved','news:one',true);assert.equal(clearReading(),true);assert.deepEqual(readState(),{saved:{},read:{}});});
