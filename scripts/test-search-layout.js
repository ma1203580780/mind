async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const assert=(ok,message)=>{if(!ok)throw Error(message)};
 const frames=[{width:1440,height:900},{width:1280,height:720},{width:390,height:844},{width:320,height:640},{width:844,height:390}];
 for(const theme of ['light','dark'])for(const viewport of frames){
  await page.setViewportSize(viewport);await page.goto('http://localhost:4322/mind/search/');
  await page.evaluate(theme=>{localStorage.setItem('theme',theme);document.documentElement.dataset.theme=theme},theme);
  await page.waitForFunction(()=>document.querySelector('#search-status')?.textContent==='');
  const layout=await page.evaluate(()=>{const main=document.querySelector('main').getBoundingClientRect(),form=document.querySelector('.search-form').getBoundingClientRect(),footer=document.querySelector('body>footer').getBoundingClientRect();return {dx:Math.abs(form.x+form.width/2-(main.x+main.width/2)),dy:Math.abs(form.y+form.height/2-(main.y+main.height/2)),footerBottom:footer.bottom,height:innerHeight,overflow:document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth}});
  assert(layout.dx<2&&layout.dy<2,'未居中 '+JSON.stringify({viewport,layout}));assert(!layout.overflow&&layout.footerBottom<=layout.height+1,'页面或页脚溢出');
  assert(await page.locator('body>footer a:visible').count()===11,'页脚内容不完整');
  await page.mouse.move(0,0);await page.screenshot({animations:'disabled',path:`output/playwright/search-centered-${theme}-${viewport.width}.png`});
  const input=page.getByRole('searchbox');await input.fill('AI');await page.getByRole('button',{name:'搜索',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#results')?.children.length>0);
  const result=await page.locator('#results').evaluate(el=>({height:el.clientHeight,total:el.scrollHeight}));assert(result.height>45&&result.total>result.height,'结果区域不够用 '+JSON.stringify({viewport,result}));
  await page.locator('#results').evaluate(el=>el.scrollTop=300);assert(await page.locator('#results').evaluate(el=>el.scrollTop>0),'结果无法滚动');
  await input.fill('mind');await page.waitForFunction(()=>document.querySelector('#results h2 a[href*="/lab/"]'));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'长项目结果撑宽页面');
  assert(await page.locator('#results').evaluate(el=>el.scrollWidth<=el.clientWidth),'结果内容横向溢出');
  await input.fill('zzzz-nothing-95384');await page.getByText('没有找到相关内容，试试更短的关键词。').waitFor();
  await input.fill('');await page.waitForFunction(()=>document.querySelector('#site-search')?.getAttribute('data-active')==='false');
  await input.press('Tab');assert(await page.getByRole('button',{name:'搜索',exact:true}).evaluate(el=>el===document.activeElement),'键盘顺序错误');
  assert(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight),'搜索后页面溢出');
 }
 assert(!errors.length,errors.join(';'));return {passed:true,viewports:frames.length,themes:2,pageErrors:errors};
}
