async page => {
 const base='http://127.0.0.1:4336/mind/';
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 const entries=await (await page.request.get(base+'search-index.json')).json();const posts=entries.filter(entry=>entry.kind==='post');
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const nav=()=>page.getByRole('navigation',{name:'主导航',exact:true});
 const rail=()=>page.getByRole('navigation',{name:'二级导航',exact:true});
 const settle=()=>page.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})))});
 const check=async(section)=>{
  await settle();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'横向溢出');
  assert(await nav().getByRole('link',{name:section,exact:true}).getAttribute('aria-current')==='page','顶栏选中态');
  assert(await page.locator('a[href*="/mind/topics/"]').count()===0,'残留专题链接');
 };
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:740}]){
  await page.setViewportSize(viewport);await page.goto(base+'archive/');await check('博客');
  assert(await page.locator('.blog-card').count()===posts.length,'正式博客数量');
  for(const name of ['AI 工程','产品与交互','独立创造','思考与成长']){
   await rail().getByRole('link',{name,exact:true}).click();await page.getByRole('heading',{name,exact:true,level:1}).waitFor();await check('博客');
   assert(await rail().getByRole('link',{name,exact:true}).getAttribute('aria-current')==='page','分类选中态');
   assert(await page.locator('.blog-card').count()===posts.filter(post=>post.category===name).length,'分类串文');
  }
  await rail().getByRole('link',{name:'全部博客',exact:true}).click();await page.waitForURL('**/archive/');
  await page.getByText('按年份归档',{exact:true}).click();await page.getByRole('navigation',{name:'博客年份归档'}).getByRole('link',{name:'2026',exact:true}).click();await page.waitForURL('**/archive/year/2026/');await check('博客');
  await page.locator('.blog-card h2 a[href$="/building-mind/"]').click();await page.waitForURL('**/posts/building-mind/');await check('博客');
  assert(await page.locator('.article-related').count()===0,'关联阅读残留');
  assert(await rail().getByRole('link',{name:'独立创造',exact:true}).getAttribute('aria-current')==='page','文章分类选中态');
  await page.locator('.article-header .tags a').first().click();await page.waitForURL('**/tags/**');await check('博客');
  for(const slug of ['rag-retrieval-evidence','memory-hot-warm-cold','cost-per-usable-result']){
   await nav().getByRole('link',{name:'博客',exact:true}).click();await page.waitForURL('**/archive/');
   await page.locator(`.blog-card h2 a[href$="/${slug}/"]`).click();await page.waitForURL(`**/posts/${slug}/`);
   await page.locator('.ed-site').waitFor();assert(await page.locator('h1').count()===1,'新文章正文丢失');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'新文章横向溢出');
   await nav().getByRole('link',{name:'博客',exact:true}).click();await page.waitForURL('**/archive/');await check('博客');
  }
  await nav().getByRole('link',{name:'搜索',exact:true}).click();await page.waitForURL('**/search/');
  await page.waitForFunction(()=>document.querySelector('#site-search')?.dataset.loadState==='ready');
  const input=page.getByRole('searchbox');await input.fill('AI');await page.locator('.search-group').first().waitFor();await check('搜索');
  assert((await page.locator('.search-group').count())===3,'统一搜索未分三区');
  await page.screenshot({path:`output/playwright/search-${viewport.width}.png`,fullPage:true});
  await page.locator('#next-page').click();assert((await page.locator('#page-label').innerText()).startsWith('2 /'),'搜索下一页');
  await page.locator('#previous-page').click();assert((await page.locator('#page-label').innerText()).startsWith('1 /'),'搜索上一页');
  for(const [kind,label] of [['post','博客'],['news','资讯'],['work','项目']]){
   await page.locator(`[data-search-kind="${kind}"]`).click();
   assert((await page.locator('.result-kind').allTextContents()).every(text=>text===label),'搜索类型混排');
   assert(await page.locator('#news-filters').isVisible()===(kind==='news'),'资讯筛选隔离');
   if(kind==='news'){
    await page.locator('#content-language').selectOption('zh');await page.locator('#content-category').selectOption('产品设计');
    assert(await page.evaluate(()=>new URL(location.href).searchParams.get('category'))==='产品设计','筛选未写入 URL');
   }
  }
  await page.locator('[data-search-kind="post"]').click();await page.reload();await page.waitForFunction(()=>document.querySelector('#site-search')?.dataset.loadState==='ready');
  assert(await page.locator('[data-search-kind="post"]').getAttribute('aria-pressed')==='true','刷新丢失搜索分区');
  await input.fill('');await settle();assert(await page.locator('.search-panel').evaluate(el=>el.inert),'清空未退出交互');
  await input.fill('mind');await page.locator('[data-search-kind="work"]').click();await page.locator('#results a[href*="/lab/#mind"]').click();await page.waitForURL('**/lab/#mind');await check('项目');
  await page.goBack();await page.waitForURL('**/search/**');await page.waitForFunction(()=>document.querySelector('#site-search')?.dataset.loadState==='ready');
  assert((await page.locator('.result-kind').allTextContents()).every(text=>text==='项目'),'后退丢失分区');
  await nav().getByRole('link',{name:'资讯',exact:true}).click();await page.waitForURL('**/news/');await check('资讯');
  assert(!(await rail().innerText()).includes('独立创造'),'资讯引用博客分类');
  await page.locator('.headline-button').first().click();await page.locator('dialog[open]').waitFor();assert(await page.locator('dialog[open] a[href^="https:"]').count()>0,'资讯缺来源');
  await page.getByRole('button',{name:'关闭阅读'}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  await page.getByRole('link',{name:'海波东，返回首页'}).click();await page.waitForURL(base);await check('资讯');assert(await page.locator('.recent-writing a[href*="/posts/"]').count()===Math.min(3,posts.length),'首页示例泄漏');
  await page.getByRole('link',{name:'RSS 订阅',exact:true}).click();await page.waitForURL('**/subscribe/');assert(await page.locator('.subscribe-feed').count()===2,'订阅数量');
  await nav().getByRole('link',{name:'博客',exact:true}).click();await page.waitForURL('**/archive/');await page.getByRole('button',{name:'切换深浅色'}).click();await check('博客');
  await page.screenshot({path:`output/playwright/blog-${viewport.width}.png`,fullPage:true});
 }
 for(const route of ['rss.xml','news/rss.xml']){const res=await page.request.get(base+route);assert(res.ok()&&(await res.text()).includes('<rss'),'RSS '+route);}
 for(const route of ['topics/','feed.xml','picks/rss.xml','posts/ai-engineering/'])assert((await page.request.get(base+route)).status()===404,'废弃路由 '+route);
 assert(!errors.length,errors.join(';'));return {passed:true,widths:[1440,390,320],pageErrors:errors};
}
