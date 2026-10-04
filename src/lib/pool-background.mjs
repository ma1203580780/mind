import {createPoolRenderer} from './pool-renderer.mjs';
import {createRipples,poolSize,MAX_RIPPLES} from './pool-dynamics.mjs';

/** A decorative surface: all navigation and search controls keep native input. */
export function mountPoolBackground(host,{
 window:win=globalThis.window,document:doc=globalThis.document,
 rendererFactory=createPoolRenderer
}={}){
 const canvas=host.querySelector('[data-pool-water]');
 const rings=host.querySelector('[data-pool-ripples]');
 if(!canvas||!rings)return ()=>{};
 const controller=new win.AbortController(),signal=controller.signal;
 const preference=win.matchMedia('(prefers-reduced-motion: reduce)');
 const ripples=createRipples(),points=new Float32Array(MAX_RIPPLES*4);
 let renderer=null,frame=0,lastTime=null,lastDraw=-Infinity,elapsed=0;
 let visible=true,lost=false,disposed=false,bounds,lastPointer=null;
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
  if(paused()){stop();ripples.clear();rings.replaceChildren();}
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
 const addRipple=(event,strength)=>{
  if(paused()||!bounds||!bounds.width||!bounds.height)return;
  // Text entry, paging and navigation never become water gestures.
  if(event.target?.closest?.('input,button,select,textarea,a,summary,[role="button"]'))return;
  const x=(event.clientX-bounds.left)/bounds.width;
  const y=(event.clientY-bounds.top)/bounds.height;
  if(x<0||x>1||y<0||y>1)return;
  ripples.add(x,1-y,elapsed,strength);
  if(renderer)return;
  const ring=doc.createElement('i');
  ring.className='pool-ripple';ring.style.left=`${x*100}%`;ring.style.top=`${y*100}%`;
  while(rings.children.length>=MAX_RIPPLES)rings.firstElementChild.remove();
  rings.append(ring);
  ring.addEventListener('animationend',()=>ring.remove(),{once:true});
 };
 doc.addEventListener('pointermove',event=>{
  if(event.pointerType!=='mouse')return;
  if(lastPointer&&(event.timeStamp-lastPointer.time<100||Math.hypot(event.clientX-lastPointer.x,event.clientY-lastPointer.y)<24))return;
  lastPointer={time:event.timeStamp,x:event.clientX,y:event.clientY};
  addRipple(event,.5);
 },{passive:true,signal});
 doc.addEventListener('pointerdown',event=>addRipple(event,1),{passive:true,signal});
 doc.addEventListener('visibilitychange',refreshActivity,{signal});
 preference.addEventListener('change',()=>{lastPointer=null;refreshActivity();draw();},{signal});
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
  renderer?.dispose();renderer=null;ripples.clear();rings.replaceChildren();
 };
}
