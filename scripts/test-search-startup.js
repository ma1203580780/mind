async page => {
 let release;const gate=new Promise(resolve=>release=resolve);
 const route='**/_astro/search.astro_astro_type_script_index_0_lang.*.js';
 await page.route(route,async request=>{await gate;await request.continue()});
 try {
  await page.goto('http://localhost:4322/mind/search/',{waitUntil:'commit'});
  await page.getByRole('searchbox').fill('mind');
  const typed=await page.getByRole('searchbox').inputValue();release();
  await page.waitForFunction(()=>document.querySelector('#site-search')?.hasAttribute('data-active'));
  if(await page.getByRole('searchbox').inputValue()!==typed)throw Error('搜索初始化清空了提前输入的内容');
  await page.waitForFunction(()=>document.querySelector('#results')?.textContent.includes('mind'));
  return {passed:true,query:await page.getByRole('searchbox').inputValue(),results:await page.locator('#results .search-result').count()};
 } finally {release();await page.unroute(route)}
}
