export const MAX_RIPPLES=8;
const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
export function poolSize(width,height,dpr=1){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return null;
 const scale=Math.min(Number.isFinite(dpr)?Math.max(1,dpr):1,1.25,Math.sqrt(900000/(width*height)));
 return {width:Math.max(1,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale))};
}
export function createRipples(){
 let ripples=[];
 return {
  add(x,y,time,strength=1){
   if(![x,y,time,strength].every(Number.isFinite))return;
   ripples=ripples.filter(ripple=>time-ripple.time<4).slice(-(MAX_RIPPLES-1));
   ripples.push({x:clamp(x,0,1),y:clamp(y,0,1),time,strength:clamp(strength,0,1)});
  },
  pack(time,target=new Float32Array(MAX_RIPPLES*4)){
   target.fill(0);
   ripples=ripples.filter(ripple=>time-ripple.time<4);
   ripples.forEach((ripple,index)=>target.set([ripple.x,ripple.y,Math.max(0,time-ripple.time),ripple.strength],index*4));
   return target;
  },
  clear(){ripples=[];}
 };
}
