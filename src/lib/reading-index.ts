import {getPosts,path} from '../site';
import {allNews,displayTitle,displaySummary,newsPublishedTime} from './news';
import {githubProjects,kancloud} from './projects';
import {topics} from './discovery';
import {storyUrl} from './discovery';
export async function readingIndex(){
 const posts=await getPosts();
 const works=[...githubProjects.map(r=>({id:`work:${r.name}`,kind:'work',title:r.name,description:r.name==='mind'?'个人博客与资讯阅读站，记录工程实践、收录公开资讯。':r.description||'',category:'GitHub',tags:[r.language,r.fork?'Fork 仓库':'独立仓库'].filter(Boolean),demo:false,url:r.url,body:r.description||'',date:r.updatedAt.slice(0,10),time:Date.parse(r.updatedAt),source:'GitHub',language:'',issue:'',sourceUrl:r.url})),{id:'work:kancloud',kind:'work',title:kancloud.name,description:kancloud.description,category:'看云',tags:kancloud.tags,demo:false,url:kancloud.url,body:kancloud.tags.join(' '),date:'',time:0,source:'看云',language:'',issue:'',sourceUrl:kancloud.url}];
 const topicEntries=topics.map(t=>({id:`topic:${t.slug}`,kind:'post',title:t.name,description:t.intro,category:'专题',tags:t.tags,demo:false,url:path(`topics/${t.slug}/`),body:t.question,date:'',time:0,source:'博客专题',language:'zh',issue:'',sourceUrl:''}));
 return [...works,...topicEntries,...posts.map(p=>({id:`post:${p.id}`,kind:'post',title:p.data.title,description:p.data.description,category:p.data.category,tags:p.data.tags,demo:p.data.demo,url:path(`posts/${p.id}/`),body:p.body||'',date:p.data.date.toISOString().slice(0,10),time:p.data.date.valueOf(),source:'本站文章',language:'zh',issue:'',sourceUrl:''})),...allNews.map(s=>({id:`news:${s.id}`,kind:'news',title:displayTitle(s),description:displaySummary(s),category:s.category,tags:[s.kind],demo:false,url:storyUrl(s),body:[s.title,s.summary,s.author].join(' '),date:s.publishedDate,time:newsPublishedTime(s),source:s.sourceName,language:s.sourceLanguage||'en',issue:s.issueDate,sourceUrl:s.sourceUrl}))].sort((a,b)=>b.time-a.time||a.id.localeCompare(b.id));
}
