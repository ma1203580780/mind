import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {poolSize,createRipples,MAX_RIPPLES} from '../src/lib/pool-dynamics.mjs';
import {createPoolRenderer} from '../src/lib/pool-renderer.mjs';
import {mountPoolBackground} from '../src/lib/pool-background.mjs';

test('retina and wide screens respect the drawing budget without changing their aspect ratio',()=>{
 for(const [width,height,dpr] of [[390,700,3],[1440,900,2],[3840,2160,2]]){
  const size=poolSize(width,height,dpr);
  assert.ok(size.width*size.height<=900000);
  assert.ok(Math.abs(size.width/size.height-width/height)<.005);
  assert.ok(size.width<=width*1.25);
 }
 for(const width of [0,-10,NaN,Infinity])assert.equal(poolSize(width,900),null);
});
test('rapid water gestures reuse a bounded buffer and expire without leaving stale waves',()=>{
 const ripples=createRipples(),buffer=new Float32Array(MAX_RIPPLES*4);
 for(let i=0;i<100;i++)ripples.add(i/100,.4,0);
 assert.equal(ripples.pack(1,buffer),buffer);
 assert.equal(buffer.length,32);assert.ok(Math.abs(buffer[0]-.92)<.0001);
 assert.equal(buffer[2],1);assert.equal(buffer[3],1);
 ripples.pack(4.1,buffer);assert.ok(buffer.every(value=>value===0));
 ripples.add(NaN,0,5);ripples.add(0,Infinity,5);assert.ok(ripples.pack(5,buffer).every(value=>value===0));
 ripples.add(-1,2,5,2);ripples.pack(6,buffer);assert.deepEqual([...buffer.slice(0,4)],[0,1,1,1]);
 ripples.clear();assert.ok(ripples.pack(6,buffer).every(value=>value===0));
});

function fakeGL({compile=true,link=true}={}){
 const calls=[],deleted=[];
 const gl={
  VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,STATIC_DRAW:6,FLOAT:7,TRIANGLES:8,
  createProgram:()=>({type:'program'}),createBuffer:()=>({type:'buffer'}),createShader:type=>({type:'shader',shaderType:type}),
  getShaderParameter:()=>compile,getProgramParameter:()=>link,getAttribLocation:()=>0,getUniformLocation:(_p,name)=>name,isContextLost:()=>false,
  deleteProgram:item=>deleted.push(item),deleteBuffer:item=>deleted.push(item),deleteShader:item=>deleted.push(item)
 };
 for(const name of ['shaderSource','compileShader','attachShader','linkProgram','useProgram','bindBuffer','bufferData','enableVertexAttribArray','vertexAttribPointer','viewport','uniform2f','uniform1f','uniform4fv','drawArrays'])gl[name]=(...args)=>calls.push({name,args});
 return {gl,calls,deleted};
}
test('unavailable and failed WebGL contexts fall back and release partially created resources',()=>{
 assert.equal(createPoolRenderer({getContext:()=>null}),null);
 assert.equal(createPoolRenderer({getContext(){throw Error('Unavailable')}}),null);
 for(const config of [{compile:false},{link:false}]){
  const f=fakeGL(config);assert.equal(createPoolRenderer({getContext:()=>f.gl}),null);
  assert.ok(f.deleted.some(item=>item.type==='program'));assert.ok(f.deleted.some(item=>item.type==='buffer'));
  assert.equal(f.deleted.filter(item=>item.type==='shader').length,config.compile===false?1:2);
 }
});
test('the water uses CSS coordinates and a seamless shared wave period, then disposes once',()=>{
 const f=fakeGL(),canvas={width:1000,height:700,getContext:()=>f.gl},renderer=createPoolRenderer(canvas);
 renderer.draw(Math.PI*200+3,true,new Float32Array(32),1440,1008);
 assert.deepEqual(f.calls.find(call=>call.name==='viewport').args,[0,0,1000,700]);
 assert.deepEqual(f.calls.find(call=>call.name==='uniform2f').args,['u_size',1440,1008]);
 assert.ok(Math.abs(f.calls.find(call=>call.name==='uniform1f'&&call.args[0]==='u_time').args[1]-3)<.00001);
 renderer.dispose();renderer.dispose();assert.equal(f.deleted.length,4);
});

function runtimeFixture({fallback=false,reduce=false}={}){
 const observers=[],frames=new Map(),renders=[],renderers=[];
 let nextFrame=0,rect={left:0,top:72,width:1440,height:900};
 const preference=new EventTarget();preference.matches=reduce;
 const doc=new EventTarget();doc.hidden=false;doc.documentElement={dataset:{theme:'light'}};
 const canvas=new EventTarget();canvas.width=0;canvas.height=0;canvas.getBoundingClientRect=()=>({...rect});
 const rings={children:[],append(node){node.parent=this;this.children.push(node)},replaceChildren(){this.children=[]},get firstElementChild(){return this.children[0]}};
 doc.createElement=()=>{const node=new EventTarget();node.style={};node.remove=()=>{if(node.parent)node.parent.children=node.parent.children.filter(other=>other!==node)};return node};
 const host={dataset:{},querySelector:selector=>selector==='[data-pool-water]'?canvas:rings};
 const win=new EventTarget();win.AbortController=AbortController;win.devicePixelRatio=2;win.matchMedia=()=>preference;
 win.requestAnimationFrame=callback=>{const id=++nextFrame;frames.set(id,callback);return id};
 win.cancelAnimationFrame=id=>frames.delete(id);
 for(const kind of ['ResizeObserver','IntersectionObserver','MutationObserver'])win[kind]=class{
  constructor(callback){this.callback=callback;this.kind=kind;this.disconnected=false;observers.push(this)}
  observe(){}disconnect(){this.disconnected=true}
 };
 const rendererFactory=()=>{
  if(fallback)return null;
  const renderer={disposed:0,draw(time,dark,points,width,height){renders.push({time,dark,points:[...points],width,height});return true},dispose(){this.disposed++}};
  renderers.push(renderer);return renderer;
 };
 const dispose=mountPoolBackground(host,{window:win,document:doc,rendererFactory});
 const step=time=>{const callbacks=[...frames.values()];frames.clear();callbacks.forEach(callback=>callback(time))};
 const pointer=(type,{x=300,y=300,time=200,target,pointerType='mouse'}={})=>{
  const event=new Event(type);
  for(const [key,value] of Object.entries({clientX:x,clientY:y,timeStamp:time,pointerType,target}))if(value!==undefined)Object.defineProperty(event,key,{value});
  doc.dispatchEvent(event);
 };
 return {host,canvas,rings,doc,win,preference,frames,renders,renderers,observers,dispose,step,pointer,rect:value=>{rect=value}};
}
test('the background pauses when hidden or offscreen, resumes without a time jump and cleans up on navigation',()=>{
 const f=runtimeFixture();assert.equal(f.frames.size,1);f.step(0);f.step(40);
 assert.ok(f.renders.at(-1).time>.03);
 f.doc.hidden=true;f.doc.dispatchEvent(new Event('visibilitychange'));
 assert.equal(f.frames.size,0);assert.equal(f.host.dataset.paused,'true');
 const pausedTime=f.renders.at(-1).time;
 f.doc.hidden=false;f.doc.dispatchEvent(new Event('visibilitychange'));f.step(10000);
 assert.equal(f.renders.at(-1).time,pausedTime);
 const intersection=f.observers.find(observer=>observer.kind==='IntersectionObserver');
 intersection.callback([{isIntersecting:false}]);assert.equal(f.frames.size,0);
 intersection.callback([{isIntersecting:true}]);assert.equal(f.frames.size,1);
 f.dispose();f.dispose();
 assert.equal(f.frames.size,0);assert.equal(f.renderers[0].disposed,1);assert.ok(f.observers.every(observer=>observer.disconnected));
 f.doc.dispatchEvent(new Event('visibilitychange'));assert.equal(f.frames.size,0);
});
test('reduced motion draws a static water surface and reacts to theme changes without a render loop',()=>{
 const f=runtimeFixture({reduce:true});assert.equal(f.frames.size,0);assert.equal(f.host.dataset.ready,'true');
 f.pointer('pointerdown');assert.equal(f.rings.children.length,0);
 f.doc.documentElement.dataset.theme='dark';f.observers.find(observer=>observer.kind==='MutationObserver').callback([]);
 assert.equal(f.renders.at(-1).dark,true);
 f.preference.matches=false;f.preference.dispatchEvent(new Event('change'));assert.equal(f.frames.size,1);
 f.preference.matches=true;f.preference.dispatchEvent(new Event('change'));assert.equal(f.frames.size,0);
 f.dispose();
});
test('water gestures ignore controls, map pointer coordinates correctly and cap the SVG fallback rings',()=>{
 const f=runtimeFixture();f.pointer('pointerdown',{target:{closest:()=>({})}});f.step(0);
 assert.ok(f.renders.at(-1).points.every(value=>value===0));
 f.pointer('pointerdown',{x:720,y:522});f.step(40);
 assert.ok(Math.abs(f.renders.at(-1).points[0]-.5)<.00001);assert.ok(Math.abs(f.renders.at(-1).points[1]-.5)<.00001);
 f.dispose();
 const svg=runtimeFixture({fallback:true});assert.equal(svg.frames.size,0);
 for(let i=0;i<100;i++)svg.pointer('pointerdown');
 assert.equal(svg.rings.children.length,8);
 svg.pointer('pointerdown',{x:2000});assert.equal(svg.rings.children.length,8);
 svg.rings.firstElementChild.dispatchEvent(new Event('animationend'));assert.equal(svg.rings.children.length,7);
 svg.dispose();assert.equal(svg.rings.children.length,0);
 svg.pointer('pointerdown');assert.equal(svg.rings.children.length,0);
});
test('context loss exposes the SVG backup and restored WebGL starts a fresh renderer',()=>{
 const f=runtimeFixture(),event=new Event('webglcontextlost',{cancelable:true});
 f.canvas.dispatchEvent(event);assert.equal(event.defaultPrevented,true);assert.equal(f.frames.size,0);assert.equal(f.host.dataset.ready,'false');
 f.canvas.dispatchEvent(new Event('webglcontextrestored'));
 assert.equal(f.renderers.length,2);assert.equal(f.renderers[0].disposed,1);assert.equal(f.host.dataset.ready,'true');
 f.dispose();assert.equal(f.renderers[1].disposed,1);
});
test('the generated search backdrop contains only local decorative graphics and preserves search semantics',()=>{
 const html=readFileSync('dist/search/index.html','utf8');
 const backdrop=html.match(/<div id="pool-backdrop"[\s\S]*?<\/svg>\s*<\/div>\s*<\/div>/)?.[0];
 assert.ok(backdrop);assert.match(backdrop,/aria-hidden="true"/);
 assert.doesNotMatch(backdrop,/<(?:text|image|img|foreignObject)\b|https?:\/\//);
 assert.match(html,/<form[^>]*role="search"/);assert.match(html,/<h1 class="sr-only">搜索<\/h1>/);
});
