import {track} from './analytics';
import {onPageLoad} from './page-lifecycle';
onPageLoad((signal,onCleanup)=>{
const connectionView=document.querySelector<HTMLElement>('[data-connection-view]')?.dataset.connectionView;
if(connectionView)track(connectionView);
document.addEventListener('click',event=>{
 const link=event.target instanceof Element?event.target.closest<HTMLElement>('[data-connection-event]'):null;
 if(link?.dataset.connectionEvent)track(link.dataset.connectionEvent);
},{signal});
const article=document.querySelector<HTMLElement>('#article .article-body');
const readPanel=document.querySelector<HTMLElement>('#panel-read');
if(article && readPanel){
  let active=0,last=Date.now(),interaction=Date.now(),opened=false;
  const depths=new Set<number>(),times=new Set<number>();
  const open=()=>{if(opened)return;opened=true;track('article_open',{mode:document.querySelector<HTMLElement>('.media-tabs [aria-selected=true]')?.dataset.mode||'read'})};
  if(document.querySelector<HTMLElement>('#analytics-config')?.dataset.websiteId){document.addEventListener('analytics:state',()=>{if(document.documentElement.dataset.umamiState==='loaded')open()},{signal});if(document.documentElement.dataset.umamiState==='loaded')open()}else open();
  for(const event of ['scroll','pointerdown','keydown'])window.addEventListener(event,()=>{interaction=Date.now()},{passive:true,signal});
  const timer=setInterval(()=>{
    const now=Date.now(),delta=Math.min(2,(now-last)/1000);last=now;
    if(document.hidden||readPanel.hidden||now-interaction>60000)return;
    const r=article.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
    active+=delta;
    for(const seconds of [30,60,180])if(active>=seconds&&!times.has(seconds)){times.add(seconds);track('read_active',{seconds})}
    if(active<3)return;
    const depth=Math.min(100,Math.max(0,(innerHeight-r.top)/r.height*100));
    for(const percent of [25,50,75,100])if(depth>=percent&&!depths.has(percent)){depths.add(percent);track('read_depth',{percent})}
  },1000);
  onCleanup(()=>clearInterval(timer));
}
for(const media of document.querySelectorAll<HTMLMediaElement>('#article-audio,#article-video')){
  const seen=new Set<number>();const type=media.tagName.toLowerCase();
  media.addEventListener('timeupdate',()=>{
    if(!Number.isFinite(media.duration)||media.duration<=0)return;
    let played=0;for(let i=0;i<media.played.length;i++)played+=media.played.end(i)-media.played.start(i);
    const progress=played/media.duration*100;
    for(const percent of [25,50,75,90])if(progress>=percent&&!seen.has(percent)){seen.add(percent);track(type+'_progress',{type:'file',percent})}
  });
  media.addEventListener('error',()=>track('media_error',{type}));
}
for(const d of document.querySelectorAll<HTMLDetailsElement>('.story-detail')){
  let seen=false;d.addEventListener('toggle',()=>{if(d.open&&!seen){seen=true;track('news_expand',{story:d.closest('.news-card')?.id||''})}});
}
document.querySelector('#copy-link')?.addEventListener('click',()=>track('article_share'));
document.addEventListener('click',e=>{if((e.target as Element).closest('.copy-code'))track('code_copy')},{signal});

});
