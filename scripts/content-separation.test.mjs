import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {BLOG_CATEGORIES,blogCategories} from '../src/lib/blog-categories.ts';
import {sectionForPath} from '../src/lib/site-navigation.mjs';
const read=p=>readFileSync(`dist/${p}`,'utf8');
const index=JSON.parse(read('search-index.json'));
const posts=index.filter(entry=>entry.kind==='post');
const demos=['ai-engineering','creative-work','interface-design','long-term'];
test('public content contains only published originals, external news and projects',()=>{
 assert.ok(posts.length);
 assert.deepEqual(new Set(index.map(entry=>entry.kind)),new Set(['post','news','work']));
 for(const post of posts){assert.ok(BLOG_CATEGORIES.includes(post.category));assert.ok(post.url.includes('/posts/'));}
 for(const news of index.filter(entry=>entry.kind==='news')){assert.ok(news.source);assert.match(news.sourceUrl,/^https?:\/\//);assert.ok(!BLOG_CATEGORIES.includes(news.category));}
 for(const demo of demos){assert.ok(!existsSync(`src/content/posts/${demo}.md`));assert.ok(!existsSync(`dist/posts/${demo}/index.html`));}
 for(const entry of index){assert.ok(!entry.id.startsWith('topic:'));assert.notEqual(entry.category,'专题');}
});
test('blog category and year routes have deterministic ordering and correct navigation',()=>{
 const archive=read('archive/index.html');
 assert.ok(archive.indexOf('blog-grid')<archive.indexOf('按年份归档'));
 for(const category of blogCategories){
  const route=`archive/category/${category.slug}/`;
  const html=read(route+'index.html');
  for(const post of posts)assert.equal(html.includes(`href="${post.url}"`),post.category===category.name);
  for(const base of ['/','/mind/'])assert.equal(sectionForPath(base+route,base),'articles');
 }
 const expected=[...posts].sort((a,b)=>b.time-a.time);
 assert.deepEqual(posts.map(p=>p.id),expected.map(p=>p.id));
 for(const year of new Set(posts.map(p=>p.date.slice(0,4))))assert.ok(existsSync(`dist/archive/year/${year}/index.html`));
});
test('removed routes, demo content and cross-domain links never reach generated output',()=>{
 for(const route of ['topics','feed.xml','picks/rss.xml'])assert.ok(!existsSync(`dist/${route}`),route);
 const visit=dir=>{for(const file of readdirSync(dir,{withFileTypes:true})){
  const path=`${dir}/${file.name}`;if(file.isDirectory())visit(path);
  else if(/\.(html|xml|json)$/.test(file.name)){
   const text=readFileSync(path,'utf8');
   assert.ok(!/\/mind\/topics\/|\/mind\/feed\.xml|\/mind\/picks\/rss\.xml/.test(text),path);
   for(const demo of demos)assert.ok(!text.includes(`/posts/${demo}/`),path);
  }
 }};visit('dist');
});
test('feeds and auto-discovery expose exactly the two isolated streams',()=>{
 const blog=read('rss.xml'),news=read('news/rss.xml');
 assert.ok(!blog.includes('/news/story/'));assert.ok(!news.includes('/posts/'));
 for(const post of posts)assert.ok(blog.includes(post.url));
 const alternates=[...read('index.html').matchAll(/<link[^>]+rel="alternate"[^>]+>/g)].map(m=>m[0]);
 assert.equal(alternates.length,2);assert.ok(alternates.some(s=>s.includes('href="/mind/rss.xml"')));assert.ok(alternates.some(s=>s.includes('href="/mind/news/rss.xml"')));
 assert.equal((read('subscribe/index.html').match(/class="subscribe-feed"/g)||[]).length,2);
});
