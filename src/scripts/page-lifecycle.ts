/** One setup per displayed document, with cleanup before every client swap. */
export function onPageLoad(setup:(signal:AbortSignal,onCleanup:(fn:()=>void)=>void)=>void){
 let controller:AbortController|undefined,cleanup:(()=>void)[]=[];
 const dispose=()=>{controller?.abort();for(const fn of cleanup.splice(0))fn();};
 document.addEventListener('astro:before-swap',dispose);
 document.addEventListener('astro:page-load',()=>{dispose();controller=new AbortController();setup(controller.signal,fn=>cleanup.push(fn));});
}
