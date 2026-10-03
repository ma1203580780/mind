import rss from '@astrojs/rss';
import {getPosts,path} from '../site';
import {allNews,displayTitle,displaySummary,newsPublishedTime} from '../lib/news';
import {storyUrl} from '../lib/discovery';
export async function GET(context){
 const posts=(await getPosts()).filter(p=>!p.data.demo).map(p=>({title:p.data.title,pubDate:p.data.date,description:p.data.description,link:path(`posts/${p.id}/`),categories:['博客',...p.data.tags]}));
 const news=allNews.map(s=>({title:displayTitle(s),pubDate:new Date(newsPublishedTime(s)),description:`${s.sourceName} · ${displaySummary(s)}`,link:storyUrl(s),categories:['资讯',s.category]}));
 return rss({title:'海波东 · 全站更新',description:'博客文章与收录资讯，按发布时间更新。',site:new URL(path(),context.site).href,items:[...posts,...news].sort((a,b)=>b.pubDate.valueOf()-a.pubDate.valueOf()).slice(0,200),customData:'<language>zh-CN</language>'});
}
