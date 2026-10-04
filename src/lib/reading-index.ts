import {getPosts,path} from '../site';
import {allNews,displayTitle,displaySummary,newsPublishedTime} from './news';
import projects from '../data/projects.json';
import {topics} from './discovery';
import {storyUrl} from './discovery';
export async function readingIndex(){
 const posts=await getPosts();
 const works=projects.map(p=>({id:`work:${p.id}`,kind:'work',title:p.name,description:p.description,category:'项目',tags:p.stack,demo:false,url:path(`lab/#${p.id}`),body:[p.progress,...p.stack].join(' '),date:p.updatedAt||'',time:p.updatedAt?Date.parse(p.updatedAt):0,source:p.github?'GitHub':'看云',language:'',issue:'',sourceUrl:p.github||p.url}));
 const topicEntries=topics.map(t=>({id:`topic:${t.slug}`,kind:'post',title:t.name,description:t.intro,category:'专题',tags:t.tags,demo:false,url:path(`topics/${t.slug}/`),body:t.question,date:'',time:0,source:'博客专题',language:'zh',issue:'',sourceUrl:''}));
 return [...works,...topicEntries,...posts.map(p=>({id:`post:${p.id}`,kind:'post',title:p.data.title,description:p.data.description,category:p.data.category,tags:p.data.tags,demo:p.data.demo,url:path(`posts/${p.id}/`),body:p.body||'',date:p.data.date.toISOString().slice(0,10),time:p.data.date.valueOf(),source:'本站文章',language:'zh',issue:'',sourceUrl:''})),...allNews.map(s=>({id:`news:${s.id}`,kind:'news',title:displayTitle(s),description:displaySummary(s),category:s.category,tags:[s.kind],demo:false,url:storyUrl(s),body:[s.title,s.summary,s.author].join(' '),date:s.publishedDate,time:newsPublishedTime(s),source:s.sourceName,language:s.sourceLanguage||'en',issue:s.issueDate,sourceUrl:s.sourceUrl}))].sort((a,b)=>b.time-a.time||a.id.localeCompare(b.id));
}
