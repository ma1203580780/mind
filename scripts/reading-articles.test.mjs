import {readFileSync,existsSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
const articles=JSON.parse(readFileSync('src/data/reading-articles.json','utf8'));
const base=(process.env.BASE_PATH??'/mind').replace(/\/$/,'');
for(const [slug,article] of Object.entries(articles))test(`published reading page and assets: ${slug}`,()=>{
 const file=`dist/posts/${slug}/index.html`;assert.ok(existsSync(file));const html=readFileSync(file,'utf8');
 assert.ok(html.includes(article.title));assert.ok(html.includes('ed-site reading-kit'));
 assert.doesNotMatch(html,/noindex|127\.0\.0\.1|localhost|__BASE__|本地草稿|\.v7\.html|\/Users\//);
 assert.match(html,/rel="canonical"/);assert.match(html,/og:type" content="article"/);
 for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(!url.startsWith(base+'/'))continue;
  const pathname=decodeURIComponent(url.split(/[?#]/)[0]).slice(base.length);
  const target=resolve('dist','.'+pathname+(pathname.endsWith('/')?'index.html':''));
  assert.ok(existsSync(target),`${slug}: missing ${url}`);
 }
 const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
 for(const [,anchor] of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.has(anchor),`missing anchor ${anchor}`);
 for(const path of ['archive/index.html','index.html','search-index.json','rss.xml','feed.xml','sitemap.xml']){
  const index=readFileSync('dist/'+path,'utf8');assert.ok(index.includes('/posts/'+slug+'/'),`${slug} absent from ${path}`);
 }
});
test('public articles keep their interactive controls and examples',()=>{
 const rag=readFileSync('dist/posts/rag-retrieval-evidence/index.html','utf8');
 const memory=readFileSync('dist/posts/memory-hot-warm-cold/index.html','utf8');
 const cost=readFileSync('dist/posts/cost-per-usable-result/index.html','utf8');
 assert.equal((rag.match(/type="checkbox"/g)||[]).length,6);
 assert.equal((memory.match(/role="tabpanel"/g)||[]).length,3);
 assert.equal((cost.match(/type="number"/g)||[]).length,4);
 assert.ok(cost.includes('ed-preset')&&cost.includes('ed-reset'));
 assert.ok(existsSync('dist/articles/research/examples/cost-ledger.csv'));
});
