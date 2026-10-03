# 一人公司与产品设计订阅拓展

核验日期：2026-10-03。以发布者公开 RSS / Atom 的实际响应、条目日期和主题相关性为依据。搜索目录仅用于发现，不作为已接入的凭据。

## 接入结果

- 全站 30 → 48 个订阅端点；一人公司 1 → 10，产品设计 3 → 12。18 个新增端点均已通过实际抓取和 XML 解析。端点数量不等于独立媒体数量，人人都是产品经理有 3 个互补栏目。
- 一人公司覆盖中文独立开发、变现案例、作品发布、SaaS 经营、创业访谈与创始人复盘。产品设计覆盖中文产品洞察、交互体验、周报、研究方法、电商可用性和产品管理。
- 综合产品源改为标题加摘要的主题筛选；专业分栏不重复使用综合源的狭窄标题过滤。社区与产品榜单设每日小额上限；Lenny 过滤产品、用户、研究、增长等关键词，减少纯模型资讯。
- 低频周报和深度研究最多接收近 30 天未收录文章，保留原发布日期；快讯默认 72 小时。过旧文章不为填满频道而补录。

| 订阅源 | 板块 | RSS 返回条目 | 最新原文日期 | 每日上限 | 收录窗口 |
| --- | --- | ---: | --- | ---: | ---: |
| [独立开发变现周刊](https://www.ezindie.com/feed/rss.xml) | 一人公司 | 11 | 2026-09-30 | 4 | 30 天 |
| [V2EX · 独立开发者](https://www.v2ex.com/feed/isv.xml) | 一人公司 | 50 | 2026-09-30 | 4 | 7 天 |
| [Solo 独立开发者社区](https://solo.xin/rss.xml) | 一人公司 | 200 | 2026-10-02 | 4 | 7 天 |
| [w2solo · 独立作品](https://w2solo.com/topics/feed) | 一人公司 | 20 | 2026-10-02 | 3 | 7 天 |
| [Decohack · 新产品发现](https://www.decohack.com/feed/) | 一人公司 | 15 | 2026-10-03 | 2 | 3 天 |
| [MicroConf On Air](https://feeds.castos.com/8vqr) | 一人公司 | 287 | 2026-09-23 | 4 | 30 天 |
| [The Bootstrapped Founder](https://thebootstrappedfounder.com/feed/) | 一人公司 | 10 | 2026-04-03 | 4 | 30 天 |
| [Justin Jackson · SaaS 经营](https://justinjackson.ca/feed) | 一人公司 | 50 | 2026-07-11 | 4 | 30 天 |
| [A Smart Bear · Jason Cohen](https://longform.asmartbear.com/index.xml) | 一人公司 | 166 | 2026-07-19 | 4 | 30 天 |
| [人人都是产品经理 · 产品设计](https://www.woshipm.com/pd/feed) | 产品设计 | 15 | 2026-10-02 | 6 | 7 天 |
| [人人都是产品经理 · 交互体验](https://www.woshipm.com/ucd/feed) | 产品设计 | 15 | 2026-09-14 | 6 | 30 天 |
| [龙爪槐守望者 · 体验碎周报](https://www.ftium4.com/rss.xml) | 产品设计 | 40 | 2026-09-07 | 4 | 30 天 |
| [UX Collective](https://uxdesign.cc/feed) | 产品设计 | 10 | 2026-10-03 | 6 | 7 天 |
| [Baymard · 电商体验研究](https://baymard.com/blog/feed.xml) | 产品设计 | 50 | 2026-09-24 | 4 | 30 天 |
| [Lenny’s Newsletter](https://www.lennysnewsletter.com/feed) | 产品设计 | 20 | 2026-09-30 | 6 | 7 天 |
| [SVPG · 产品管理](https://www.svpg.com/feed/) | 产品设计 | 15 | 2026-09-25 | 4 | 30 天 |
| [UX Planet](https://uxplanet.org/feed) | 产品设计 | 10 | 2026-10-02 | 4 | 7 天 |
| [Intercom · 产品实践](https://www.intercom.com/blog/feed/) | 产品设计 | 10 | 2026-09-09 | 4 | 30 天 |

## 低频与暂不接入

- The Bootstrapped Founder、Justin Jackson、A Smart Bear 的公开源可正常读取，但这次返回的最新文章已超过 30 天。订阅等待后续更新，本次不导入旧稿；不将“可读取”等同于“近期有新文”。
- 优设的旧 `/feed` 地址实际跳转至普通文章 HTML；产品沉思录的小阅读首页未公开 RSS 链接，尝试的 `/feed` 返回 404；UXRen 返回 502；Growth.Design 的候选 feed 返回 404。未把这些未验证成功的入口加进定时采集。
- MicroConf 原候选 blog RSS 返回 404，已改用官网明确提供的 On Air 播客订阅。体验碎周报使用官网公布的 `/rss.xml`。
- 37signals 候选地址跳转营销页，A List Apart 的候选源未解析出有日期文章；不作为本次有效增量。Guyskk、UX Magazine 的源可读但近期未更新，且与已选源的覆盖重合，本轮留在候选。

## 质量与后续维护

- 配置以 `src/config/news-sources.json` 为准；失败状态实时保留在 `/news/sources/`，历史内容不会删除。
- 公开摘要与原文链接可以收录，付费全文和登录后的内容不抓取。社区、厂商实践、研究、访谈分别标注，不把投稿或经营案例当作经过核验的结论。
- 继续沿用每天三次自动采集、分类均衡、历史去重、中文机译与原文对照。新的窗口规则同时通过采集器测试和构建校验测试。
