import {allNews,issues,filterNews,paginateNews,collectNewsHistory,type NewsEntry} from './news';
import {path} from '../site';
export const NEWS_PAGE_SIZE=100;
export const entriesForScope=(scope:string):NewsEntry[]=>scope==='history'?allNews:collectNewsHistory(issues.filter(issue=>issue.date===scope));
export const newsListPath=(scope='history',language='all',category='全部',page=1)=>{
  if(language==='all'&&category==='全部')return scope==='history'?path(page===1?'news/':`news/page/${page}/`):path(page===1?`news/${scope}/`:`news/${scope}/page/${page}/`);
  return path(`news/filter/${scope}/${language}/${encodeURIComponent(category==='全部'?'all':category)}/${page}/`);
};
export const newsFilterPaths=()=>{
  const result=[];
  for(const scope of ['history',...issues.map(i=>i.date)]){
    const entries=entriesForScope(scope),categories=['全部',...new Set(entries.map(s=>s.category))];
    for(const language of ['all','zh','en'])for(const category of categories){
      if(language==='all'&&category==='全部')continue;
      const {pageCount}=paginateNews(filterNews(entries,{language,category}),1,NEWS_PAGE_SIZE);
      for(let page=1;page<=pageCount;page++)result.push({params:{scope,language,category:category==='全部'?'all':category,page:String(page)},props:{scope,language,category,page}});
    }
  }
  return result;
};
