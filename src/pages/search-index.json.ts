import {getPosts,path} from '../site';
export async function GET(){const posts=await getPosts();return new Response(JSON.stringify(posts.map(p=>({title:p.data.title,description:p.data.description,category:p.data.category,tags:p.data.tags,demo:p.data.demo,url:path(`posts/${p.id}/`),body:p.body}))),{headers:{'Content-Type':'application/json; charset=utf-8'}})}
