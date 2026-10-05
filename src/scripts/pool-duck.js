import {onPageLoad} from './page-lifecycle';

onPageLoad((signal,onCleanup)=>{
 const duck=document.querySelector('.pool-duck');
 if(!duck)return;
 let dragging=false,offsetX=0,offsetY=0,lastWake=0;
 const wake=(strength=.22)=>{
  const rect=duck.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  window.dispatchEvent(new CustomEvent('pool-duck-wake',{detail:{
   x:rect.left+rect.width*.52,y:rect.top+rect.height*.79,strength
  }}));
 };
 const stopSwimming=()=>{
  const rect=duck.getBoundingClientRect();
  duck.style.animation='none';
  duck.style.left=`${rect.left}px`;
  duck.style.top=`${rect.top}px`;
  duck.style.transform='none';
 };
 const move=event=>{
  if(!dragging)return;
  const rect=duck.getBoundingClientRect();
  const left=Math.max(-rect.width*.35,Math.min(window.innerWidth-rect.width*.65,event.clientX-offsetX));
  const top=Math.max(0,Math.min(window.innerHeight-rect.height*.72,event.clientY-offsetY));
  duck.style.left=`${left}px`;
  duck.style.top=`${top}px`;
  if(event.timeStamp-lastWake>90){wake(.78);lastWake=event.timeStamp;}
 };
 const release=event=>{
  if(!dragging)return;
  dragging=false;
  duck.classList.remove('is-dragging');
  duck.releasePointerCapture?.(event.pointerId);
  wake(.95);
 };
 duck.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  const rect=duck.getBoundingClientRect();
  event.preventDefault();
  stopSwimming();
  dragging=true;
  offsetX=event.clientX-rect.left;
  offsetY=event.clientY-rect.top;
  duck.classList.add('is-dragging');
  duck.setPointerCapture?.(event.pointerId);
  wake(.7);
 },{signal});
 duck.addEventListener('pointermove',move,{signal});
 duck.addEventListener('pointerup',release,{signal});
 duck.addEventListener('pointercancel',release,{signal});
 const swimmer=window.setInterval(()=>{if(!dragging)wake(.16);},640);
 onCleanup(()=>window.clearInterval(swimmer));
});
