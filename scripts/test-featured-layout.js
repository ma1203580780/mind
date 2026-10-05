async page => {
 const base='http://localhost:4322/mind/';
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const metrics=()=>page.evaluate(()=>{const card=document.querySelector('.news-card'),grid=document.querySelector('.news-grid'),rect=card.getBoundingClientRect(),style=getComputedStyle(card);return {x:rect.x,width:rect.width,radius:style.borderRadius,columns:getComputedStyle(grid).gridTemplateColumns,overflow:document.documentElement.scrollWidth>innerWidth}});
 // 卡片排布必须是行优先：先从左到右填满一行，再换到下一行；后面的卡片不能出现在左边一列的上方。
 const readingOrder=()=>page.evaluate(()=>{const tol=12,rs=[...document.querySelectorAll('.news-grid>.news-card')].map(c=>{const r=c.getBoundingClientRect();return {x:r.x,y:r.y,bottom:r.bottom}});let rowJump=0,colJump=0;for(let a=0;a<rs.length;a++)for(let b=a+1;b<rs.length;b++){if(rs[b].y+tol<rs[a].y)rowJump++;if(rs[b].x+tol<rs[a].x&&rs[b].y+tol<rs[a].bottom)colJump++;}return {count:rs.length,rowJump,colJump}});
 for(const theme of ['light','dark'])for(const width of [1440,390,320]){
  await page.setViewportSize({width,height:900});await page.goto(base);
  await page.evaluate(theme=>{localStorage.setItem('theme',theme);document.documentElement.dataset.theme=theme},theme);
  await page.locator('.news-grid .news-card').first().waitFor();const featured=await metrics();
  assert(!featured.overflow&&await page.locator('.home-status').count()===0,'精选存在多余介绍或溢出');
  const homeOrder=await readingOrder();assert(homeOrder.count>1&&!homeOrder.rowJump&&!homeOrder.colJump,`精选卡片不是行优先排布 ${JSON.stringify(homeOrder)}`);
  await page.locator('.featured-rules summary').click();assert(await page.locator('.featured-rules').getAttribute('open')!==null,'入选规则无法展开');await page.locator('.featured-rules summary').click();
  await page.screenshot({path:`output/playwright/featured-${theme}-${width}.png`,animations:'disabled'});
  const tabs=()=>page.getByRole('navigation',{name:'二级导航',exact:true});
  await tabs().getByRole('link',{name:'全部资讯',exact:true}).click();await page.waitForURL('**/news/');await page.locator('.news-grid .news-card').first().waitFor();
  const newsOrder=await readingOrder();assert(newsOrder.count>1&&!newsOrder.rowJump&&!newsOrder.colJump,`资讯卡片不是行优先排布 ${JSON.stringify(newsOrder)}`);
  const all=await metrics();assert(!all.overflow,'全部资讯溢出');
  assert(Math.abs(featured.x-all.x)<1&&Math.abs(featured.width-all.width)<1&&featured.radius===all.radius&&featured.columns===all.columns,'精选与资讯网格或卡片布局不一致');
  await tabs().getByRole('link',{name:'AI 资讯',exact:true}).click();await page.waitForURL('**/news/filter/**');
  assert((await page.locator('.news-card .card-top>span:first-child').allTextContents()).every(value=>value.replace(/\s/g,'')==='AI资讯'),'分类切换失败');
  await page.getByRole('navigation',{name:'来源语言',exact:true}).getByRole('link',{name:/英文对照，/}).click();await page.waitForURL('**/history/en/**');
  assert((await page.locator('.news-card').evaluateAll(cards=>cards.map(card=>card.dataset.language))).every(value=>value==='en'),'语言筛选失败');
  const date=page.locator('[data-date-item]').first(),href=await date.getAttribute('href');await date.click();
  await page.waitForURL(url=>url.pathname===href);
  assert(await page.locator('.date-list a[aria-current="page"]').getAttribute('href')===href,'日期高亮失效');
  await tabs().getByRole('link',{name:'精选',exact:true}).click();await page.waitForURL(base);
  assert(await page.locator('.news-card').count()===5,'返回精选未恢复候选');
  assert(await page.locator('html').getAttribute('data-theme')===theme,'主题在切换时丢失');
 }
 assert(!errors.length,errors.join(';'));return {passed:true,widths:[1440,390,320],themes:2,pageErrors:errors};
}
