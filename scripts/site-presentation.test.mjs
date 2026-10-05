import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {resolve,relative} from 'node:path';
import {presentationForPath} from '../src/lib/site-presentation.mjs';

test('page roles work on nested paths and root or project deployment',()=>{
 const examples=[['','feed','sky'],['news/filter/2026-10-03/en/AI/1/','feed','sky'],['news/story/example/','reading','horizon'],['posts/building-mind/','reading','horizon'],['archive/category/ai-engineering/','library','horizon'],['archive/year/2026/','library','horizon'],['tags/%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD/','library','horizon'],['news/archive/','library','sky'],['lab/','studio','sky'],['lab/stream/','studio','tide'],['discover/','connection','sky'],['about/','connection','dawn'],['build/','connection','dawn'],['search/','utility','pool'],['news/sources/','utility','sky'],['stats/','utility','mist'],['privacy/','note','paper'],['subscribe/','note','paper'],['404/','note','paper']];
 for(const base of ['/','/mind/','/preview/mind/'])for(const [route,family,scene] of examples){
  const result=presentationForPath(base+route,base);assert.equal(result.family,family);assert.equal(result.scene,scene);assert.equal(result.embedded,['sky','pool'].includes(scene));
 }
 assert.equal(presentationForPath('/mind/posts/example/','/mind/',{reading:true}).embedded,true);
 assert.equal(presentationForPath('/mind/archive/').embedded,true);
});

const files=readdirSync('dist',{recursive:true}).filter(file=>file.endsWith('.html'));
test('every generated page receives one scene and the shared navigation landmarks',()=>{
 const counts={};
 for(const file of files){
  const html=readFileSync('dist/'+file,'utf8');
  const route='/mind/'+(file==='404.html'?'404/':file.replace(/index\.html$/,''));
  const expected=presentationForPath(route,'/mind/',{reading:html.includes('class="site-shell reading-layout"'),blogArchive:html.includes('class="site-shell blog-archive-layout"')});
  assert.ok(html.includes(`data-page-family="${expected.family}"`),file);assert.ok(html.includes(`data-scene="${expected.scene}"`),file);
  assert.equal((html.match(/class="page-backdrop"/g)||[]).length,expected.embedded?0:1,file);
  assert.equal((html.match(/id="navigation-sky"/g)||[]).length,expected.persistentSky?1:0,file);
  assert.equal((html.match(/id="pool-backdrop"/g)||[]).length,expected.scene==='pool'?1:0,file);
  assert.equal((html.match(/<h1\b/g)||[]).length,1,`${file}: one page title`);
  assert.equal((html.match(/id="main"/g)||[]).length,1,file);assert.equal((html.match(/id="site-header"/g)||[]).length,1,file);
  assert.equal((html.match(/id="theme"/g)||[]).length,1,file);assert.equal((html.match(/<footer class="site-footer"/g)||[]).length,1,file);
  if(!expected.embedded){
   const backdrop=html.match(/<div class="page-backdrop"[\s\S]*?<\/svg>/)?.[0];assert.ok(backdrop,file);
   assert.match(backdrop,/aria-hidden="true"/);assert.match(backdrop,/focusable="false"/);
   assert.doesNotMatch(backdrop,/<(?:a|button|image|feImage|text|foreignObject)\b|data:image/);
  }
  counts[expected.family]=(counts[expected.family]||0)+1;
 }
 assert.equal(Object.keys(counts).length,7);assert.ok(files.length>600);
});

test('all scene routes retain working local assets and existing search and subscription controls',()=>{
 const checked=new Set();
 for(const file of files){
  const html=readFileSync('dist/'+file,'utf8');
  for(const [,url] of html.matchAll(/(?:href|src)="(\/mind\/_astro\/[^"?#]+)[^"]*"/g)){
   if(checked.has(url))continue;checked.add(url);
   const target=resolve('dist','.'+decodeURIComponent(url.slice('/mind'.length)));
   assert.ok(!relative(resolve('dist'),target).startsWith('..'));assert.ok(existsSync(target),url);
  }
 }
 const search=readFileSync('dist/search/index.html','utf8');
 for(const id of ['query','search-status','results','result-pages','retry-index'])assert.ok(search.includes(`id="${id}"`),id);
 const privacy=readFileSync('dist/privacy/index.html','utf8');assert.match(privacy,/analytics|统计/);
 const subscribe=readFileSync('dist/subscribe/index.html','utf8');assert.equal((subscribe.match(/data-copy-feed/g)||[]).length,2);
});
