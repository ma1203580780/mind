// Decorative sky pauses offscreen and when hidden; clean up on Astro navigation.
const skies=new Map();
const phases=new Map();
const mountSkies=()=>document.querySelectorAll('[data-sky-motion]').forEach(sky=>{
 if(skies.has(sky))return;
 const controller=new AbortController();
 let visible=true;
 const pause=()=>sky.dataset.paused=String(document.hidden||!visible);
 skies.set(sky,()=>controller.abort());
 document.addEventListener('visibilitychange',pause,{signal:controller.signal});
 if('IntersectionObserver'in window){
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;pause();});
  observer.observe(sky);
  controller.signal.addEventListener('abort',()=>observer.disconnect(),{once:true});
 }
 pause();
});
document.addEventListener('astro:before-swap',event=>{
 for(const [sky,cleanup] of skies){
  const keeper=sky.closest('#navigation-sky');
  const next=event.newDocument?.getElementById('navigation-sky');
  if(keeper&&next&&keeper.getAttribute('data-astro-transition-persist')===next.getAttribute('data-astro-transition-persist')){
   // Older browsers reinsert persisted nodes. Restore their CSS animation phase.
   phases.set(sky,[...sky.querySelectorAll('.sc-cloud')].flatMap(element=>(element.getAnimations?.()||[]).map(animation=>({element,name:animation.animationName,time:animation.currentTime,rate:animation.playbackRate}))));
   continue;
  }
  cleanup();skies.delete(sky);
 }
});
document.addEventListener('astro:after-swap',()=>{
 for(const snapshots of phases.values())for(const snapshot of snapshots){
  const animation=(snapshot.element.getAnimations?.()||[]).find(item=>item.animationName===snapshot.name);
  if(animation&&snapshot.time!==null){animation.currentTime=snapshot.time;animation.playbackRate=snapshot.rate;}
 }
 phases.clear();
});
document.addEventListener('astro:page-load',mountSkies);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mountSkies,{once:true});else mountSkies();
