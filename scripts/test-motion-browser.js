async page => {
  const base = 'http://localhost:4322/mind/';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (ok, message) => { if (!ok) throw Error(message); };
  const settle = () => page.evaluate(async () => {
    await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})));
  });
  const measure = () => page.evaluate(() => {
    const form = document.querySelector('.search-form').getBoundingClientRect();
    const main = document.querySelector('main').getBoundingClientRect();
    return {y: form.y, centred: Math.abs(form.y + form.height / 2 - main.y - main.height / 2),
      overflow: document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth,
      footer: document.querySelector('footer').getBoundingClientRect().bottom <= innerHeight + 1};
  });
  const sample = async action => {
    await page.evaluate(() => {
      window.motionFrames = [];
      window.motionDone = false;
      const start = performance.now();
      const frame = () => {
        window.motionFrames.push(document.querySelector('.search-form').getBoundingClientRect().y);
        if (performance.now() - start < 800) requestAnimationFrame(frame);
        else window.motionDone = true;
      };
      requestAnimationFrame(frame);
    });
    await action();
    await page.waitForFunction(() => window.motionDone);
    return page.evaluate(() => window.motionFrames);
  };
  const reports = [];
  await page.emulateMedia({reducedMotion: 'no-preference'});
  for (const viewport of [{width:1440,height:900},{width:390,height:844},{width:320,height:640},{width:844,height:390}]) {
    await page.setViewportSize(viewport);
    await page.goto(base + 'search/');
    await page.waitForFunction(() => document.querySelector('#site-search').dataset.loadState === 'ready');
    await settle();
    const input = page.getByRole('searchbox');
    const initial = await measure();
    assert(initial.centred < 2 && !initial.overflow && initial.footer, '搜索初始布局 ' + JSON.stringify(initial));
    const up = await sample(() => input.fill('mind'));
    const active = await measure();
    assert(initial.y - active.y > 20, '输入后未上移');
    const betweenUp = up.filter(y => y > active.y + 1 && y < initial.y - 1);
    assert(new Set(betweenUp.map(y => y.toFixed(1))).size >= 4, '上移没有连续中间帧');
    assert(await page.locator('#results a[href*="/lab/#mind"]').count() > 0, '搜索丢失项目结果');
    const down = await sample(() => input.fill(''));
    const empty = await measure();
    const betweenDown = down.filter(y => y > active.y + 1 && y < initial.y - 1);
    assert(new Set(betweenDown.map(y => y.toFixed(1))).size >= 4, '回中没有连续中间帧');
    assert(empty.centred < 2 && !empty.overflow && empty.footer, '清空后未正确回中');
    assert(await page.locator('#results').evaluate(el => el.children.length === 0), '清空后残留结果');
    assert(await page.locator('.search-panel').evaluate(el => el.inert), '空状态仍可聚焦隐藏结果');
    await input.fill('AI'); await page.waitForTimeout(90);
    await input.fill(''); await page.waitForTimeout(80);
    await input.fill('SRE'); await settle();
    assert(await page.locator('#results a[href*="sre-course"]').count() === 1, '快速反转导致结果丢失');
    assert(!await page.locator('.search-panel').evaluate(el => el.inert), '结果面板未恢复交互');
    await input.fill(''); await settle();
    assert((await measure()).centred < 2, '快速反转后没有回中');
    reports.push({viewport, upFrames: betweenUp.length, downFrames: betweenDown.length});
  }

  await page.setViewportSize({width:1440,height:900});
  await page.goto(base + 'search/?q=SRE&kind=work');
  await page.locator('#results a[href*="sre-course"]').waitFor(); await settle();
  assert(await page.getByRole('searchbox').inputValue() === 'SRE', '查询链接未恢复');
  await page.evaluate(() => {
    window.motionRoutes = [];
    document.addEventListener('astro:page-load', () => {
      const path = location.pathname;
      requestAnimationFrame(() => {
        window.motionRoutes.push({path, count:document.getAnimations().filter(a => a.id === 'mind:reveal').length});
        window.motionReadyPath = path;
      });
    });
  });
  const routes = [['发现','discover'],['项目','lab'],['博客','archive'],['资讯','news'],['搜索','search']];
  await page.locator('#site-header').evaluate(el => { el.dataset.motionTest = 'persistent'; });
  for (const [label, route] of routes) {
    await page.locator('#site-header').getByRole('link', {name:label,exact:true}).click();
    await page.waitForURL('**/mind/' + route + '/');
    await page.waitForFunction(route => window.motionReadyPath === '/mind/' + route + '/', route);
    await settle();
    assert(await page.locator('#site-header').getAttribute('data-motion-test') === 'persistent', '顶栏重新创建');
    assert(await page.locator('#site-header .nav-marker').count() === 1, '导航下划线重复');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '页面动画产生横向溢出');
  }
  const routeMotion = await page.evaluate(() => window.motionRoutes);
  for (const [,route] of routes.slice(0,4)) assert(routeMotion.some(r => r.path.endsWith('/'+route+'/') && r.count > 0), '缺少页面入场动效: '+route);
  await page.goBack(); await page.waitForURL('**/mind/news/');
  await page.waitForFunction(() => window.motionReadyPath === '/mind/news/'); await settle();
  await page.goForward(); await page.waitForURL('**/mind/search/');
  await page.waitForFunction(() => window.motionReadyPath === '/mind/search/'); await settle();
  await page.goto(base); await settle();
  const trigger = page.locator('.headline-button').first();
  for (const method of ['button','escape','backdrop']) {
    await trigger.click();
    const dialog = page.locator('.news-reader[open]'); await dialog.waitFor(); await settle();
    if (method === 'button') await dialog.getByRole('button',{name:'关闭阅读'}).click();
    else if (method === 'escape') await page.keyboard.press('Escape');
    else await page.mouse.click(1,1);
    await page.waitForFunction(() => document.getAnimations().some(a => a.id === 'mind:reader-exit'));
    await page.waitForFunction(() => !document.querySelector('.news-reader[open]'));
    assert(await trigger.evaluate(el => el === document.activeElement), '阅读关闭后焦点未恢复');
    assert(!await page.evaluate(() => document.documentElement.classList.contains('reader-is-open')), '阅读关闭后滚动锁未解除');
  }
  const details = page.locator('.featured-rules');
  await details.locator('summary').click(); await settle();
  assert(await details.evaluate(el => el.open), '展开失败');
  await details.locator('summary').click(); await settle();
  assert(!await details.evaluate(el => el.open), '收起失败');

  await page.route('**/search-index.json', route => route.fulfill({status:503,body:'Unavailable'}));
  await page.goto(base + 'search/');
  await page.getByRole('button',{name:'重新加载'}).waitFor(); await settle();
  assert((await measure()).centred < 2, '索引错误使输入框偏离中心');
  assert(!await page.locator('.search-panel').evaluate(el => el.inert), '错误状态无法重试');
  await page.unroute('**/search-index.json');
  await page.getByRole('button',{name:'重新加载'}).click();
  await page.waitForFunction(() => document.querySelector('#site-search').dataset.loadState === 'ready');
  await page.getByRole('searchbox').fill('mind'); await page.waitForTimeout(70);
  await page.emulateMedia({reducedMotion:'reduce'});
  assert(await page.evaluate(() => document.getAnimations().length === 0), '偏好变更后动画未停止');
  await page.getByRole('searchbox').fill('');
  assert((await measure()).centred < 2, '偏好变更后没有回中');

  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base + 'search/');
  await page.waitForFunction(() => document.querySelector('#site-search').dataset.loadState === 'ready');
  await page.getByRole('searchbox').fill('mind');
  await page.getByRole('searchbox').fill('');
  assert((await measure()).centred < 2, '减少动态效果时没有直接回中');
  assert(await page.evaluate(() => document.getAnimations().length === 0), '减少动态效果仍播放动画');
  await page.goto(base); await trigger.click(); await page.keyboard.press('Escape');
  assert(await page.locator('.news-reader[open]').count() === 0, '减少动态效果时阅读弹窗未直接关闭');
  assert(!errors.length, errors.join('\n'));
  await page.emulateMedia({reducedMotion:'no-preference'});
  return {passed:true,search:reports,routeMotion,reader:['button','escape','backdrop'],reducedMotion:true,retry:true,pageErrors:errors};
}
