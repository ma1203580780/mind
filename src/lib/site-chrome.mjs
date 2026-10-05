// 全站公共外框的唯一数据源：顶栏 tab 与页脚分组都从这里取。
//
// 约定：
// - 页面和布局都不再各自写导航数组；要加/改一个 tab，只改 PRIMARY_TABS。
// - 页脚「站点」组永远是 PRIMARY_TABS 的投影，因此顶栏和页脚不会漂移。
// - 想按页面改外框，只能改这里的入参，不要在页面里写 CSS 覆盖（那是耦合的来源）。
export const PRIMARY_TABS = [
  {label: '资讯', url: 'news/', section: 'news'},
  {label: '博客', url: 'archive/', section: 'articles'},
  {label: '项目', url: 'lab/', section: 'lab'},
  {label: '发现', url: 'discover/', section: 'discover'},
  {label: '搜索', url: 'search/', section: 'search'},
];

// 页脚除「站点」外的两组。external 的链接由调用方补 URL（例如 GitHub 账号来自站点配置）。
export const FOOTER_GROUPS = [
  {key: 'follow', title: '关注', links: [{label: 'RSS 订阅', url: 'subscribe/'}, {label: 'GitHub', external: 'github'}]},
  {
    key: 'about',
    title: '关于',
    links: [
      {label: '关于我', url: 'about/'},
      {label: '关于本站', url: 'about-site/'},
      {label: '数据', url: 'stats/'},
      {label: '隐私', url: 'privacy/'},
    ],
  },
];

/** 页脚三组链接：站点组直接复制顶栏 tab，保证两处内容永远一致。 */
export function footerGroups({github}) {
  return [
    {key: 'site', title: '站点', links: PRIMARY_TABS.map(({label, url}) => ({label, url}))},
    ...FOOTER_GROUPS.map(group => ({
      ...group,
      links: group.links.map(link => (link.external === 'github' ? {label: 'GitHub ↗', url: github, external: true} : link)),
    })),
  ];
}
