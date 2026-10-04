async page => {
 const base='http://localhost:4322/mind/';
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const viewports=[{width:1440,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:640}];
 for(const theme of ['light','dark'])for(const viewport of viewports){
  await page.setViewportSize(viewport);await page.goto(base+'discover/');
  await page.evaluate(theme=>{localStorage.setItem('theme',theme);document.documentElement.dataset.theme=theme},theme);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'发现页横向溢出');
  const heading=await page.locator('main h1').evaluate(el=>({class:el.className,width:el.getBoundingClientRect().width}));
  assert(heading.class==='sr-only'&&heading.width<=1,'重复页名仍在正文占据空间');
  assert(!(await page.locator('main').innerText()).match(/阅读清单|我关注的人/),'推荐仍被误标为个人关注记录');
  assert(await page.locator('.intro-links a').count()===2,'介绍区缺少关于链接');
  assert(await page.locator('.discover-focus li').count()===3,'Focus 方向缺失');
  assert(await page.locator('.discover-intro').evaluate(el=>el.getBoundingClientRect().height)<=(viewport.width>560?215:360),'介绍区过高');
  assert(await page.locator('.network-column').first().locator('.network-entry').count()===4,'核心站点缺失');
  assert(await page.locator('.network-column').last().locator('.network-entry').count()===4,'行业作者缺失');
  assert(await page.locator('.network-communities a').count()===2,'社区入口缺失');
  assert(await page.locator('footer a').count()===11,'全站页脚链接回归');
  const clipping=await page.locator('.network-entry,.network-communities a').evaluateAll(items=>items.filter(el=>el.scrollWidth>el.clientWidth+1).map(el=>el.textContent));
  assert(!clipping.length,'推荐内容被挤出容器 '+clipping.join(';'));
  await page.mouse.move(0,0);
  await page.screenshot({path:`output/playwright/discover-intro-${theme}-${viewport.width}.png`,fullPage:true,animations:'disabled'});
 }
 await page.setViewportSize({width:1440,height:900});await page.goto(base+'discover/');
 const related=await page.locator('.network-actions a[href*="/search/"]').evaluateAll(links=>links.map(link=>link.href));
 assert(related.length>0,'已有收录的来源缺少站内阅读入口');
 for(const href of related){await page.goto(href);await page.waitForFunction(()=>document.querySelector('#results')?.children.length>0);assert((await page.locator('#results .result-kind').allTextContents()).every(kind=>kind==='资讯'),'来源检索范围不正确');}
 await page.goto(base+'discover/');await page.locator('.intro-links').getByRole('link',{name:'关于我',exact:true}).click();await page.waitForURL('**/about/');
 assert(await page.locator('nav[aria-label="主导航"] a[aria-current="page"]').innerText()==='发现','关于我所属导航失效');
 await page.goBack();await page.waitForURL('**/discover/');
 await page.locator('.intro-links').getByRole('link',{name:'关于站点',exact:true}).click();await page.waitForURL('**/about-site/');assert(await page.getByRole('heading',{name:'关于本站',exact:true}).count()===1,'关于站点跳转失败');
 await page.goBack();await page.waitForURL('**/discover/');
 await page.locator('.discover-focus a').last().click();await page.waitForURL('**/build/#interactive-video');assert(await page.locator('#interactive-video').count()===1,'Focus 未连接到开放问题');
 await page.goBack();await page.waitForURL('**/discover/');
 const recommendation=await page.locator('.network-contribute a').evaluate(link=>{const url=new URL(link.href);return {host:url.hostname,path:url.pathname,title:url.searchParams.get('title'),body:url.searchParams.get('body')}});
 assert(recommendation.host==='github.com'&&recommendation.path==='/ma1203580780/mind/issues/new','推荐入口错误');
 assert(recommendation.title==='推荐一个人或站点'&&recommendation.body.includes('名称与链接：\n\n值得关注的原因：'),'推荐入口缺少预填内容');
 assert(!errors.length,errors.join(';'));
 return {passed:true,viewports:viewports.length,themes:2,relatedSearches:related.length,pageErrors:errors};
}
