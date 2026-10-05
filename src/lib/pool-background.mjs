import {createPoolRenderer} from './pool-renderer.mjs';
import {createRipples,poolSize,MAX_RIPPLES} from './pool-dynamics.mjs';

/** A decorative surface: all navigation and search controls keep native input. */
export function mountPoolBackground(host,{
 window:win=globalThis.window,document:doc=globalThis.document,
 rendererFactory=createPoolRenderer
}={}){
 const canvas=host.querySelector('[data-pool-water]');
 if(!canvas)return ()=>{};
 const controller=new win.AbortController(),signal=controller.signal;
 const preference=win.matchMedia('(prefers-reduced-motion: reduce)');
 const ripples=createRipples(),points=new Float32Array(MAX_RIPPLES*4);
 let renderer=null,frame=0,lastTime=null,lastDraw=-Infinity,elapsed=0;
 let visible=true,lost=false,disposed=false,bounds;
 const dark=()=>doc.documentElement.dataset.theme==='dark';
 const paused=()=>doc.hidden||!visible||preference.matches||lost||!bounds||bounds.width<=0||bounds.height<=0;
 const stop=()=>{if(frame)win.cancelAnimationFrame(frame);frame=0;lastTime=null;};
 const draw=()=>{
  if(!renderer||!bounds)return;
  if(renderer.draw(elapsed,dark(),ripples.pack(elapsed,points),bounds.width,bounds.height)){
   host.dataset.ready='true';
  }else{
   host.dataset.ready='false';host.dataset.paused='true';lost=true;stop();
  }
 };
 const tick=timestamp=>{
  frame=0;
  if(disposed||paused()||!renderer)return;
  if(lastTime!==null)elapsed+=Math.min((timestamp-lastTime)/1000,.1);
  lastTime=timestamp;
  if(timestamp-lastDraw>=1000/30){draw();lastDraw=timestamp;}
  if(!paused())frame=win.requestAnimationFrame(tick);
 };
 const refreshActivity=()=>{
  host.dataset.paused=String(paused());
  if(paused()){stop();ripples.clear();}
  else if(renderer&&!frame)frame=win.requestAnimationFrame(tick);
 };
 const resize=()=>{
  bounds=canvas.getBoundingClientRect();
  const size=poolSize(bounds.width,bounds.height,win.devicePixelRatio);
  if(!size){refreshActivity();return;}
  if(canvas.width!==size.width||canvas.height!==size.height){
   canvas.width=size.width;canvas.height=size.height;
  }
  draw();refreshActivity();
 };
 const initialize=()=>{
  renderer?.dispose();renderer=null;
  try{renderer=rendererFactory(canvas);}catch{}
  lost=false;host.dataset.ready='false';resize();refreshActivity();
 };
 const addDuckWake=event=>{
  const {x,y,strength=.25}=event.detail||{};
  if(paused()||!bounds||!Number.isFinite(x)||!Number.isFinite(y))return;
  const localX=(x-bounds.left)/bounds.width,localY=(y-bounds.top)/bounds.height;
  if(localX<-.1||localX>1.1||localY<-.1||localY>1.1)return;
  ripples.add(localX,1-localY,elapsed,strength);
  host.style.setProperty('--duck-light-x',`${localX*100}%`);
  host.style.setProperty('--duck-light-y',`${localY*100}%`);
  host.style.setProperty('--duck-light-strength',String(Math.min(.8,.14+strength*.48)));
 };
 win.addEventListener('pool-duck-wake',addDuckWake,{signal});
 doc.addEventListener('visibilitychange',refreshActivity,{signal});
 preference.addEventListener('change',()=>{refreshActivity();draw();},{signal});
 win.addEventListener('resize',resize,{passive:true,signal});
 win.addEventListener('scroll',()=>{bounds=canvas.getBoundingClientRect();},{passive:true,signal});
 canvas.addEventListener('webglcontextlost',event=>{
  event.preventDefault();lost=true;host.dataset.ready='false';refreshActivity();
 },{signal});
 canvas.addEventListener('webglcontextrestored',initialize,{signal});
 const resizeObserver=win.ResizeObserver?new win.ResizeObserver(resize):null;
 resizeObserver?.observe(host);
 const intersection=win.IntersectionObserver?new win.IntersectionObserver(entries=>{
  visible=entries.some(entry=>entry.isIntersecting);refreshActivity();
 }):null;
 intersection?.observe(host);
 const themeObserver=new win.MutationObserver(draw);
 themeObserver.observe(doc.documentElement,{attributes:true,attributeFilter:['data-theme']});
 initialize();
 return ()=>{
  if(disposed)return;disposed=true;controller.abort();stop();
  resizeObserver?.disconnect();intersection?.disconnect();themeObserver.disconnect();
  renderer?.dispose();renderer=null;ripples.clear();
 };
}
