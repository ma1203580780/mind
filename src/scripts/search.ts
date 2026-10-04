import {onPageLoad} from './page-lifecycle';
import {track} from './analytics';
import {animateMotion,reducedMotion} from './motion';
import {createSearchPositioner} from '../lib/search-position.mjs';
type Entry={id:string;kind:string;title:string;description:string;category:string;tags:string[];url:string;body:string;date:string;source:string;language:string;issue:string};
onPageLoad((signal,onCleanup)=>{
 const root=document.querySelector<HTMLElement>('#site-search');if(!root)return;
 const panel=root.querySelector<HTMLElement>('.search-panel')!;
 const positioner=createSearchPositioner(root,root.querySelector<HTMLFormElement>('.search-form')!,{animate:animateMotion,reducedMotion});
 let clearTimer:ReturnType<typeof setTimeout>|undefined,resultAnimation:Animation|null=null;
 const input=root.querySelector<HTMLInputElement>('#query')!,results=root.querySelector<HTMLElement>('#results')!,status=root.querySelector<HTMLElement>('#search-status')!,retry=root.querySelector<HTMLButtonElement>('#retry-index')!,pager=root.querySelector<HTMLElement>('#result-pages')!;
 const language=root.querySelector<HTMLSelectElement>('#content-language')!,category=root.querySelector<HTMLSelectElement>('#content-category')!,clear=root.querySelector<HTMLButtonElement>('#clear-filters')!;
 const params=new URLSearchParams(location.search);let kind=['post','news','work'].includes(params.get('kind')||'')?params.get('kind')!:'all',page=Math.max(1,Number(params.get('page'))||1),scope=params.get('scope')||'',entries:Entry[]=[],loaded=false;
 // Keep text entered before the route script finishes loading.
 if(!input.value)input.value=params.get('q')||'';
 language.value=['zh','en'].includes(params.get('language')||'')?params.get('language')!:'all';category.value=params.get('category')||'全部';if(!category.value)category.value='全部';
 if(kind!=='news'){scope='';language.value='all';category.value='全部';}
 const node=(tag:string,text:string,cls='')=>{const el=document.createElement(tag);el.textContent=text;el.className=cls;return el;};
 const normalized=(value:string)=>value.normalize('NFKC').toLowerCase();
 function syncUrl(){const url=new URL(location.href);url.search='';if(input.value.trim())url.searchParams.set('q',input.value.trim());if(kind!=='all')url.searchParams.set('kind',kind);if(kind==='news'){if(language.value!=='all')url.searchParams.set('language',language.value);if(category.value!=='全部')url.searchParams.set('category',category.value);if(scope&&scope!=='history')url.searchParams.set('scope',scope);}if(page>1)url.searchParams.set('page',String(page));history.replaceState(history.state,'',url);}
 function render(){
  const wasActive=root!.dataset.active==='true',active=Boolean(input.value.trim());
  clearTimeout(clearTimer);
  positioner.move(active,root!.dataset.loadState==='error');
  panel.inert=!active&&root!.dataset.loadState!=='error';
  root!.querySelectorAll<HTMLButtonElement>('[data-search-kind]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.searchKind===kind)));
  root!.querySelector<HTMLElement>('#news-filters')!.hidden=kind!=='news';
  clear.hidden=language.value==='all'&&category.value==='全部'&&(!scope||scope==='history');
  if(!loaded)return;
  const q=input.value.trim(),terms=normalized(q).split(/\s+/).filter(Boolean);
  const candidates=entries.filter(e=>terms.every(term=>normalized([e.title,e.description,e.body,e.source,e.category,...e.tags].join(' ')).includes(term)));
  root!.querySelectorAll<HTMLElement>('[data-count]').forEach(el=>el.textContent=q?String(candidates.filter(e=>el.dataset.count==='all'||e.kind===el.dataset.count).length):'');
  const matches=candidates.filter(e=>(kind==='all'||e.kind===kind)&&(kind!=='news'||((language.value==='all'||e.language===language.value)&&(category.value==='全部'||e.category===category.value)&&(!scope||scope==='history'||e.issue===scope))));
  if(!q){
   // Retire old results after the outgoing panel is hidden.
   const empty=()=>{results.replaceChildren();status.textContent='';pager.hidden=true;};
   if(wasActive&&!reducedMotion())clearTimer=setTimeout(empty,170);else empty();
   page=1;syncUrl();return;
  }
  const oldResults=results.textContent;
  results.replaceChildren();
  const kinds=['post','news','work'];
  const groups=kinds.map(value=>({kind:value,entries:matches.filter(entry=>entry.kind===value)})).filter(group=>group.entries.length);
  const pages=Math.max(1,...groups.map(group=>Math.ceil(group.entries.length/20)));page=Math.min(pages,Math.max(1,Math.floor(page)));
  status.textContent=`找到 ${matches.length} 条${scope&&scope!=='history'?' · 收录日期 '+scope:''}`;pager.hidden=pages<=1;
  for(const group of groups){
   const visible=group.entries.slice((page-1)*20,page*20);if(!visible.length)continue;
   const section=node('section','','search-group');section.dataset.kind=group.kind;
   const label=group.kind==='post'?'博客':group.kind==='news'?'资讯':'项目';
   const heading=node('h2',`${label} · ${group.entries.length}`,'search-group-title');heading.id=`results-${group.kind}`;section.setAttribute('aria-labelledby',heading.id);section.append(heading);results.append(section);
   for(const entry of visible){
   const card=node('article','','search-result'),meta=node('div','','search-result-meta');
   meta.append(node('span',entry.kind==='news'?'资讯':entry.kind==='work'?'项目':'博客','result-kind'),node('span',[entry.source,entry.date].filter(Boolean).join(' · ')));
   const h=node('h3',''),link=document.createElement('a');link.href=entry.url;link.textContent=entry.title;if(new URL(entry.url,location.href).origin!==location.origin){link.target='_blank';link.rel='noopener noreferrer';link.append(node('span',' ↗'));}h.append(link);
   let excerpt=entry.description;
   if(!terms.every(t=>normalized(entry.title+' '+excerpt).includes(t))){const at=normalized(entry.body).indexOf(terms[0]);if(at>=0)excerpt=(at>45?'…':'')+entry.body.slice(Math.max(0,at-45),at+140).replace(/[#*_`>]/g,'')+'…';}
   card.append(meta,h,node('p',excerpt));section.append(card);
   }
  }
  if(!matches.length)results.append(node('div','没有找到相关内容，试试更短的关键词。','reading-empty'));
  if(wasActive&&oldResults!==results.textContent){resultAnimation?.cancel();resultAnimation=animateMotion(results,[{opacity:.65,translate:'0 4px'},{opacity:1,translate:'0 0'}],{duration:220},'search-results');}
  root!.querySelector<HTMLButtonElement>('#previous-page')!.disabled=page<=1;root!.querySelector<HTMLButtonElement>('#next-page')!.disabled=page>=pages;root!.querySelector('#page-label')!.textContent=`${page} / ${pages}`;syncUrl();
 }
 const reset=()=>{page=1;render();};let timer:ReturnType<typeof setTimeout>;
 input.addEventListener('input',()=>{reset();clearTimeout(timer);timer=setTimeout(()=>{if(input.value.trim())track('search_used',{area:kind,results:results.querySelectorAll('.search-result').length});},1000);},{signal});
 root.querySelector('form')!.addEventListener('submit',e=>{e.preventDefault();reset();},{signal});
 root.querySelectorAll<HTMLButtonElement>('[data-search-kind]').forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.searchKind!;language.value='all';category.value='全部';scope='';reset();},{signal}));
 root.querySelectorAll<HTMLButtonElement>('[data-search-suggestion]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.searchSuggestion!;reset();input.focus();},{signal}));
 [language,category].forEach(el=>el.addEventListener('change',reset,{signal}));clear.addEventListener('click',()=>{language.value='all';category.value='全部';scope='';reset();},{signal});
 for(const [id,direction] of [['previous-page',-1],['next-page',1]] as const)root.querySelector('#'+id)!.addEventListener('click',()=>{page+=direction;render();root!.scrollIntoView({block:'start',behavior:'instant'});},{signal});
 // Revalidate the index so returning readers see newly published content.
 async function load(){root!.dataset.loadState='loading';retry.hidden=true;status.textContent='正在加载索引…';render();try{const response=await fetch(root!.dataset.index!,{signal,cache:'no-cache'});if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data))throw Error();if(signal.aborted)return;entries=data;loaded=true;root!.dataset.loadState='ready';render();}catch{if(signal.aborted)return;root!.dataset.loadState='error';positioner.move(Boolean(input.value.trim()),true);panel.inert=false;status.textContent='暂时无法加载搜索，请重试。';retry.hidden=false;}}
 retry.addEventListener('click',load,{signal});onCleanup(()=>{clearTimeout(timer);clearTimeout(clearTimer);resultAnimation?.cancel();positioner.dispose();});load();
});
