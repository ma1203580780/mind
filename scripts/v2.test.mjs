import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {sectionForPath} from '../src/lib/site-navigation.mjs';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const html=p=>readFileSync(`dist/${p}/index.html`,'utf8');
test('nested relationship pages and deployment bases keep the correct active navigation',()=>{
 for(const base of ['/mind/','/'])for(const route of ['discover/','build/','about/'])assert.equal(sectionForPath(base+route,base),'discover');
 assert.equal(sectionForPath('/mind/posts/building-mind/'),'articles');
 assert.equal(sectionForPath('/mind/search/'),'search');
 assert.equal(sectionForPath('/mind/lab/'),'lab');
 assert.equal(sectionForPath('/mind/about-site/'),'site');
});
test('project data references unique IDs and working configured destinations',()=>{
 const projects=json('src/data/projects.json');const ids=new Set(projects.map(p=>p.id));assert.equal(ids.size,projects.length);
 for(const p of projects){assert.ok(p.progress);assert.ok(p.stack.length);assert.ok(['active','exploring','maintained','paused','published'].includes(p.status));assert.equal(new URL(p.github||p.url).protocol,'https:');}
 for(const p of json('src/data/open-problems.json'))if(p.projectId)assert.ok(ids.has(p.projectId));
});
test('curated sites and communities reference configured feeds; authors retain source evidence',()=>{
 const directory=json('src/data/people.json');
 const sources=new Set(json('src/config/news-sources.json').map(source=>source.id));
 const entries=[...directory.sites,...directory.communities];
 assert.equal(new Set(entries.map(item=>item.sourceId)).size,entries.length);
 for(const item of entries){assert.ok(sources.has(item.sourceId),`Unknown source: ${item.sourceId}`);assert.equal(new URL(item.url).protocol,'https:');}
 assert.equal(new Set(directory.authors.map(author=>author.id)).size,directory.authors.length);
 for(const author of directory.authors){for(const url of [author.url,author.evidenceUrl,author.connection?.url].filter(Boolean))assert.equal(new URL(url).protocol,'https:');}
});
test('new pages expose only existing local routes, resources and anchors',()=>{
 for(const page of ['discover','build','lab','about','about-site']){
  const text=html(page);
  for(const [,href] of text.matchAll(/href="([^"]+)"/g)){
   if(!href.startsWith('/mind/'))continue;
   const u=new URL(href,'https://example.test');const relative=decodeURIComponent(u.pathname.slice('/mind/'.length));
   const file=resolve('dist',relative+(u.pathname.endsWith('/')?'index.html':''));assert.ok(existsSync(file),`${page}: ${href}`);
   if(u.hash){const target=readFileSync(file,'utf8');assert.ok(target.includes(`id="${decodeURIComponent(u.hash.slice(1))}"`),`Missing anchor: ${href}`);}
  }
 }
});
test('published search, RSS and home do not leak local drafts; project search uses shared data',()=>{
 const index=json('dist/search-index.json');
 for(const id of ['memory-hot-warm-cold','rag-retrieval-evidence']){
  assert.ok(!index.some(p=>p.id===`post:${id}`));assert.ok(!existsSync(`dist/posts/${id}/index.html`));assert.ok(!readFileSync('dist/rss.xml','utf8').includes(`/posts/${id}/`));
 }
 for(const p of json('src/data/projects.json')){const entry=index.find(e=>e.id===`work:${p.id}`);assert.ok(entry);assert.ok(entry.body.includes(p.progress));assert.equal(entry.url,`/mind/lab/#${p.id}`);}
 const home=readFileSync('dist/index.html','utf8');assert.ok(home.includes('最近写的'));assert.ok(!home.includes('class="header-subscribe"'));
});
