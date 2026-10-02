import rss from '@astrojs/rss';
import { issues } from '../../lib/news';
import { path } from '../../site';
export function GET(context) {
  return rss({title:'海波东 · 新闻日刊',description:'AI 与经济，公开订阅源自动采集。',site:new URL(path('news/'),context.site).href,items:issues.map(issue=>({title:`${issue.date}｜${issue.title}`,description:issue.intro,pubDate:new Date(issue.checkedAt),link:new URL(path(`news/${issue.date}/`),context.site).href}))});
}
