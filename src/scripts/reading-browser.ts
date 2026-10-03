import {onPageLoad} from './page-lifecycle';
import {readState,clearReading} from './reading-store';
import {track} from './analytics';
type Entry={id:string;kind:string;title:string;description:string;category:string;tags:string[];demo:boolean;url:string;body:string;date:string;source:string;language:string;issue:string;sourceUrl:string};
export function initReadingBrowser(signal:AbortSignal,onCleanup:(fn:()=>void)=>void){
 const root=document.querySelector<HTMLElement>('#reading-browser');if(!root)return;
 const query=document.querySelector<HTMLInputElement>('#query')!,results=document.querySelector<HTMLElement>('#results')!,status=document.querySelector<HTMLElement>('#search-status')!,pagination=document.querySelector<HTMLElement>('#result-pages')!,retry=document.querySelector<HTMLButtonElement>('#retry-index')!;
 const prev=document.querySelector<HTMLButtonElement>('#previous-page')!,next=document.querySelector<HTMLButtonElement>('#next-page')!;
 const kind=document.querySelector<HTMLSelectElement>('#content-kind'),language=document.querySelector<HTMLSelectElement>('#content-language'),category=document.querySelector<HTMLSelectElement>('#content-category');
 const params=new URLSearchParams(location.search);let mode=root.dataset.mode!,scope=params.get('scope')||'',page=Math.max(1,Number(params.get('page'))||1),entries:Entry[]=[],loaded=false,failed=false;
 query.value=params.get('q')||'';if(kind)kind.value=['all','post','news'].includes(params.get('kind')||'')?params.get('kind')!:'all';if(language)language.value=['zh','en'].includes(params.get('language')||'')?params.get('language')!:'all';if(category){category.value=params.get('category')||'全部';if(!category.value)category.value='全部';}
 const clearScope=document.querySelector<HTMLButtonElement>('#clear-scope');if(clearScope)clearScope.hidden=!scope||scope==='history';
 const node=(tag:string,text:string,className='')=>{const el=document.createElement(tag);el.textContent=text;el.className=className;return el;};
 function show(){
  if(!loaded){status.textContent=failed?'索引加载失败，原有收藏仍保存在本机。请重试。':'正在加载全部历史索引…';retry.hidden=!failed;return;}
  const terms=query.value.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean),state=readState();
  let matches=entries.filter(e=>{
   if(mode==='saved'&&!state.saved[e.id]||mode==='read'&&!state.read[e.id])return false;
   if(kind?.value&&kind.value!=='all'&&e.kind!==kind.value)return false;
   if(language?.value&&language.value!=='all'&&e.language!==language.value)return false;
   if(category?.value&&category.value!=='全部'&&e.category!==category.value)return false;
   if(scope&&scope!=='history'&&e.issue!==scope)return false;
   return terms.every(t=>[e.title,e.description,e.body,e.source,e.category,...e.tags].join(' ').normalize('NFKC').toLowerCase().includes(t));
  });
  if(mode!=='search')matches.sort((a,b)=>(state[mode as 'read'|'saved'][b.id]||0)-(state[mode as 'read'|'saved'][a.id]||0));
  const count=Math.max(1,Math.ceil(matches.length/30));page=Math.min(count,Math.max(1,Math.floor(page)));results.replaceChildren();
  status.textContent=`${scope&&scope!=='history'?scope+' 收录 · ':''}${mode==='search'?'全部历史':mode==='saved'?'我的收藏':'已读记录'} · ${matches.length} 条${matches.length?' · 第 '+page+' / '+count+' 页':''}`;
  for(const entry of matches.slice((page-1)*30,page*30)){
   const card=node('article','','search-result');card.dataset.readingId=entry.id;card.append(node('span',`${entry.kind==='news'?entry.source:'本站文章'} · ${entry.date}${entry.demo?' · 示例稿':''}`,'category'));
   const h=node('h2',''),link=document.createElement('a');link.href=entry.url;link.textContent=entry.title;h.append(link);card.append(h,node('p',entry.description));
   const actions=node('div','','reading-actions'),badge=node('small','已读');badge.dataset.readBadge='';badge.hidden=!state.read[entry.id];const save=document.createElement('button');save.type='button';save.className='save-button';save.dataset.save=entry.id;save.textContent=state.saved[entry.id]?'已收藏':'收藏';save.setAttribute('aria-pressed',String(!!state.saved[entry.id]));actions.append(badge,save);card.append(actions);results.append(card);
  }
  if(!matches.length)results.append(node('div',mode==='search'?'没有匹配内容，试试更短的关键词或取消筛选。':mode==='saved'?'看到值得留下的文章或新闻，点击「收藏」，下次在这里继续。':'展开新闻或阅读文章后，记录会出现在这里。','reading-empty'));
  pagination.hidden=matches.length<=30;prev.disabled=page<=1;next.disabled=page>=count;document.querySelector('#page-label')!.textContent=`${page} / ${count}`;
  if(mode==='search'){const u=new URL(location.href);for(const key of ['q','kind','language','category','scope','page'])u.searchParams.delete(key);if(query.value.trim())u.searchParams.set('q',query.value.trim());if(kind&&kind.value!=='all')u.searchParams.set('kind',kind.value);if(language&&language.value!=='all')u.searchParams.set('language',language.value);if(category&&category.value!=='全部')u.searchParams.set('category',category.value);if(scope&&scope!=='history')u.searchParams.set('scope',scope);if(page>1)u.searchParams.set('page',String(page));history.replaceState(history.state,'',u);}
 }
 const reset=()=>{page=1;show();};let timer:ReturnType<typeof setTimeout>;
 query.addEventListener('input',()=>{reset();clearTimeout(timer);timer=setTimeout(()=>{if(loaded&&query.value.trim())track('search_used',{area:mode,results:Number(status.textContent?.match(/· (\d+) 条/)?.[1]||0)})},1000);});[kind,language,category].forEach(el=>el?.addEventListener('change',reset));
 prev.addEventListener('click',()=>{page--;show();root.scrollIntoView({block:'start',behavior:'instant'});});next.addEventListener('click',()=>{page++;show();root.scrollIntoView({block:'start',behavior:'instant'});});
 clearScope?.addEventListener('click',()=>{scope='';clearScope.hidden=true;reset();});document.querySelectorAll<HTMLButtonElement>('[data-reading-tab]').forEach(button=>button.addEventListener('click',()=>{mode=button.dataset.readingTab!;document.querySelectorAll('[data-reading-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));reset();}));
 document.querySelector('#clear-reading')?.addEventListener('click',()=>{if(window.confirm('清除这个浏览器中的全部收藏与已读记录？'))if(!clearReading())status.textContent='无法清除本地记录。';});
 document.addEventListener('reading:change',()=>{if(mode!=='search')show();},{signal});window.addEventListener('storage',show,{signal});onCleanup(()=>clearTimeout(timer));
 async function load(){if(signal.aborted)return;failed=false;show();try{const response=await fetch(root!.dataset.index!,{signal});if(!response.ok)throw Error();const data=await response.json();if(!Array.isArray(data))throw Error();entries=data;loaded=true;retry.hidden=true;}catch{if(signal.aborted)return;failed=true;}if(!signal.aborted)show();}retry.addEventListener('click',load);load();
}

onPageLoad(initReadingBrowser);
