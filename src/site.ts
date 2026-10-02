import { getCollection } from 'astro:content';
export const site = {name:'海波东', title:'海波东 · 工程与思考', description:'关于 AI 工程、交互设计、创作实践与长期成长的记录。', social:{github:'https://github.com/ma1203580780',zhihu:'',bilibili:'',wechat:''}};
export const path = (s='') => `${import.meta.env.BASE_URL.replace(/\/$/,'')}/${s.replace(/^\//,'')}`;
export const getPosts = async () => (await getCollection('posts')).filter(p=>!p.data.draft).sort((a,b)=>b.data.date.valueOf()-a.data.date.valueOf());
export const dateLabel = (d:Date) => d.toISOString().slice(0,10).replaceAll('-','.');
export const reading = (body='') => Math.max(1,Math.ceil(body.replace(/\s/g,'').length/450));
