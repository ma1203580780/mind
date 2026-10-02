import {getPosts,path} from '../site';
import {issues} from '../lib/news';
export async function GET(context){const urls=['','archive/','about/','news/','news/archive/',...issues.map(i=>`news/${i.date}/`),...(await getPosts()).filter(p=>!p.data.demo).map(p=>`posts/${p.id}/`)];const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>`<url><loc>${new URL(path(u),context.site).href}</loc></url>`).join('')+'</urlset>';return new Response(xml,{headers:{'Content-Type':'application/xml'}})}
