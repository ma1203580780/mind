import {getPosts,path} from '../site';
import {allNews,displayTitle,displaySummary,newsPublishedTime} from './news';
import projects from '../data/projects.json';
import {storyUrl} from './discovery';
export async function readingIndex(){
 const posts=await getPosts();
 const works=projects.map(p=>({id:`work:${p.id}`,kind:'work',title:p.name,description:p.description,category:'项目',tags:p.stack,url:path(`lab/#${p.id}`),body:[p.progress,...p.stack].join(' '),date:p.updatedAt||'',time:p.updatedAt?Date.parse(p.updatedAt):0,source:p.source,language:'',issue:'',sourceUrl:p.github||p.url}));
 return [...works,...posts.map(p=>({id:`post:${p.id}`,kind:'post',title:p.data.title,description:p.data.description,category:p.data.category,tags:p.data.tags,url:path(`posts/${p.id}/`),body:p.body||'',date:p.data.date.toISOString().slice(0,10),time:p.data.date.valueOf(),source:'作者原创',language:'zh',issue:'',sourceUrl:''})),...allNews.map(s=>({id:`news:${s.id}`,kind:'news',title:displayTitle(s),description:displaySummary(s),category:s.category,tags:[s.kind],url:storyUrl(s),body:[s.title,s.summary,s.author].join(' '),date:s.publishedDate,time:newsPublishedTime(s),source:s.sourceName,language:s.sourceLanguage||'en',issue:s.issueDate,sourceUrl:s.sourceUrl}))].sort((a,b)=>b.time-a.time||a.id.localeCompare(b.id));
}
