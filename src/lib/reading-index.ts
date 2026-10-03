import {getPosts,path} from '../site';
import {allNews,displayTitle,displaySummary,newsPublishedTime} from './news';
import {storyUrl} from './discovery';
export async function readingIndex(){
 const posts=await getPosts();
 return [...posts.map(p=>({id:`post:${p.id}`,kind:'post',title:p.data.title,description:p.data.description,category:p.data.category,tags:p.data.tags,demo:p.data.demo,url:path(`posts/${p.id}/`),body:p.body||'',date:p.data.date.toISOString().slice(0,10),time:p.data.date.valueOf(),source:'本站文章',language:'zh',issue:'',sourceUrl:''})),...allNews.map(s=>({id:`news:${s.id}`,kind:'news',title:displayTitle(s),description:displaySummary(s),category:s.category,tags:[s.kind],demo:false,url:storyUrl(s),body:[s.title,s.summary,s.author].join(' '),date:s.publishedDate,time:newsPublishedTime(s),source:s.sourceName,language:s.sourceLanguage||'en',issue:s.issueDate,sourceUrl:s.sourceUrl}))].sort((a,b)=>b.time-a.time||a.id.localeCompare(b.id));
}
