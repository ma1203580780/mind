// Change layout once, then move the field with a compositor-only FLIP animation.
export function createSearchPositioner(root,field,{animate,reducedMotion}){
 let initialized=false,animation=null;
 const move=(active,failed=false)=>{
  const layout=active||failed?'results':'idle';
  const changed=root.dataset.layout!==layout;
  let previousTop;
  if(initialized&&changed){previousTop=field.getBoundingClientRect().top;animation?.cancel();}
  root.dataset.active=String(active);
  root.dataset.layout=layout;
  if(initialized&&changed&&!reducedMotion()){
   const offset=previousTop-field.getBoundingClientRect().top;
   if(Number.isFinite(offset)&&Math.abs(offset)>.5){
    animation=animate(field,[{transform:`translate3d(0,${offset}px,0)`},{transform:'translate3d(0,0,0)'}],{duration:680,easing:'cubic-bezier(.22,1,.36,1)'},'search-position');
   }
  }
  initialized=true;
 };
 return {move,dispose:()=>{animation?.cancel();animation=null;}};
}
