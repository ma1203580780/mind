async (page) => {
 const base='http://localhost:4322/mind/';
 const assert=(ok,message)=>{if(!ok)throw new Error(message)};
 const failures=[];page.on('pageerror',error=>failures.push(error.message));
 const nav=()=>page.getByRole('navigation',{name:'主导航',exact:true});
 const check=async()=>{await page.evaluate(async()=>{await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})))});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'页面横向溢出');assert((await nav().locator('a').allTextContents()).join('/')==='资讯/博客/项目/发现/搜索','主导航不一致');};
 for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740}]){
  await page.setViewportSize(viewport);await page.goto(base);await page.evaluate(()=>{localStorage.setItem('theme','light');document.documentElement.dataset.theme='light'});
  await check();assert(await page.locator('.home-status').count()===0,'精选页不应展示个人介绍');assert(await page.locator('.news-grid .news-card').count()===5,'精选未复用资讯卡片');assert(await page.locator('.recent-writing .text-entries a').count()>0,'首页缺少文章');
  await page.locator('.news-grid .news-card .headline-button').first().click();await page.locator('dialog[open]').waitFor();await page.getByRole('button',{name:'关闭阅读'}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));assert(await page.locator('dialog[open]').count()===0,'精选阅读弹窗未关闭');
  await nav().getByRole('link',{name:'发现',exact:true}).click();await page.waitForURL('**/discover/');await check();
  assert(await page.locator('.explore-project').count()===3,'项目近况缺失');assert(await page.locator('.explore-connect').count()===1,'连接入口缺失');assert(await nav().getByRole('link',{name:'发现',exact:true}).getAttribute('aria-current')==='page','发现选中态失效');
  await page.screenshot({path:`output/playwright/discover-${viewport.width}-light.png`,fullPage:true});
  await page.getByRole('button',{name:'切换深浅色'}).click();assert(await page.locator('html').getAttribute('data-theme')==='dark','主题切换失败');
  await page.getByRole('link',{name:'看看当前开放的问题 →'}).click();await page.waitForURL('**/build/');await check();assert(await page.locator('html').getAttribute('data-theme')==='dark','主题路由间丢失');
  assert(await page.locator('.problem-list article').count()===3,'开放问题缺失');const discussion=await page.locator('.problem-list .inline-links a').first().getAttribute('href');assert(discussion.includes('Agent'),'问题上下文丢失');
  await page.screenshot({path:`output/playwright/build-${viewport.width}-dark.png`,fullPage:true});
  await nav().getByRole('link',{name:'项目',exact:true}).click();await page.waitForURL('**/lab/');await check();assert(await page.locator('.lab-project').count()===3,'精选项目缺失');
  await nav().getByRole('link',{name:'搜索',exact:true}).click();await page.waitForURL('**/search/');await page.getByRole('searchbox',{name:'搜索站内内容'}).fill('mind');await page.waitForFunction(()=>document.querySelector('#results')?.textContent.includes('mind'));await check();
  const result=page.locator('#results h3 a[href*="/lab/"]').first();assert((await result.getAttribute('href')).includes('lab/#mind'),'项目搜索目标错误');assert(await result.getAttribute('target')===null,'站内项目不应打开外部窗口');await result.click();await page.waitForURL('**/lab/#mind');
  await nav().getByRole('link',{name:'博客',exact:true}).click();await page.waitForURL('**/archive/');await check();await page.locator('main a[href*="/posts/"]').first().click();await page.waitForURL('**/posts/**');await check();assert(await page.getByRole('link',{name:'参与讨论 ↗'}).count()===1,'文章讨论入口缺失');assert(await page.locator('.article-related').count()===0,'不应有专题关联阅读');
  await page.getByRole('link',{name:'去发现 →',exact:true}).click();await page.waitForURL('**/discover/');await page.locator('.follow-links').getByRole('link',{name:/RSS/}).click();await page.waitForURL('**/subscribe/');await check();
  await nav().getByRole('link',{name:'资讯',exact:true}).click();await page.waitForURL('**/news/');await check();assert(await page.locator('.news-card').count()>0,'资讯列表丢失');
  await page.getByRole('button',{name:'切换深浅色'}).click();await page.reload();await check();assert(await page.locator('html').getAttribute('data-theme')==='light','刷新丢失主题');
 }
 for(const route of ['rss.xml','news/rss.xml']){const response=await page.request.get(base+route);assert(response.ok()&&(await response.text()).includes('<rss'),'RSS 回归 '+route);}
 await page.goto(base+'search/?kind=news&q=AI');await page.waitForFunction(()=>document.querySelector('#results')?.children.length>0);assert((await page.locator('#results .result-kind').allTextContents()).every(x=>x==='资讯'),'搜索深链接失效');
 assert(!failures.length,'浏览器错误 '+failures.join(';'));return {passed:true,widths:[1440,390,320],pageErrors:failures};
}
