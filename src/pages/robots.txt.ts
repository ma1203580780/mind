import {path} from '../site';
export function GET(context){return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(path('sitemap.xml'),context.site).href}\n`)}
