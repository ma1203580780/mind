import {readFileSync,existsSync,readdirSync} from 'node:fs';
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
 // 首页只展示最近三篇（src/pages/index.astro 的 slice(0,3)），因此不要求每篇阅读文章都
 // 出现在首页；归档、搜索、RSS、sitemap 必须收录全部已发布文章。
 for(const path of ['archive/index.html','search-index.json','rss.xml','sitemap.xml']){
  const index=readFileSync('dist/'+path,'utf8');assert.ok(index.includes('/posts/'+slug+'/'),`${slug} absent from ${path}`);
 }
});
test('homepage keeps its three most recent posts',()=>{
 const html=readFileSync('dist/index.html','utf8');
 const section=html.slice(html.indexOf('recent-writing'));
 const entries=section.slice(0,section.indexOf('</section>'));
 assert.equal((entries.match(/href="\/mind\/posts\/[a-z0-9-]+\/"/g)||[]).length,3);
 assert.ok(entries.includes('最近写的'));
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

test('reading pages share the project shell without duplicate landmarks',()=>{
 const home=readFileSync('dist/index.html','utf8');
 const footer=html=>html.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)?.[0];
 const navLinks=html=>[...html.match(/<header\b[^>]*id="site-header"[\s\S]*?<\/header>/)[0].matchAll(/<a data-section="([^"]+)"[^>]*href="([^"]+)"/g)].map(m=>[m[1],m[2]]);
 for(const slug of Object.keys(articles)){
  const html=readFileSync(`dist/posts/${slug}/index.html`,'utf8');
  assert.match(html,/<body class="site-shell reading-layout"/);
  assert.equal((html.match(/id="site-header"/g)||[]).length,1);
  assert.equal((html.match(/id="main"/g)||[]).length,1);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.deepEqual(navLinks(html),navLinks(home));
  assert.equal(footer(html),footer(home));
  assert.match(html,/<a data-section="articles"[^>]*aria-current="page"/);
  assert.equal((html.match(/id="theme"/g)||[]).length,1);
  assert.doesNotMatch(html,/<header class="ed-topbar"/);
  const hero=html.match(/<div class="rk-clouds"[\s\S]*?<\/svg>/)?.[0];
  assert.ok(hero,'shared vector cloud hero');
  assert.match(hero,/id="sc-front"/);
  assert.doesNotMatch(hero,/<(?:image|feImage|text|foreignObject)\b|data:image/);
 }
});

test('blog routes keep only blog content without secondary navigation',()=>{
 const pages=[...['archive','posts','tags'].flatMap(section=>readdirSync('dist/'+section,{recursive:true}).filter(file=>file.endsWith('index.html')).map(file=>section+'/'+file))];
 for(const page of pages){
  const html=readFileSync('dist/'+page,'utf8');
  assert.doesNotMatch(html,/class="section-(?:nav|rail)"/,`${page}: no secondary navigation`);
  const main=html.match(/<main\b[\s\S]*?<\/main>/)?.[0];
  assert.ok(main);
  assert.doesNotMatch(main,/近期来源资料|\d+ 条历史资料|\d+ 条来源资料|source-note/);
 }
});
