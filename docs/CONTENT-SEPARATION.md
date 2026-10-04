# 资讯与博客拆分验收

日期：2026-10-04。基线：`bedf601914aeb8c9ac3a6795c611c967cc3af6b1`（已同步本轮执行中发布的三篇文章），独立 checkout，未触碰其他目录的未提交工作。

## 目标与结果

- 资讯保留独立分类、来源、原文地址、采集与发布日期；博客只收录作者原创及明确标注的作者材料 AI 辅助整理。
- 博客一级分类固定为 AI 工程、产品与交互、独立创造、思考与成长，每篇一个字符串 category。tags 仅在博客内使用。
- `/archive/` 以最新文章为主；分类使用静态页面，年份通过下层归档进入，不依赖 JavaScript。手机采用单列卡片。
- 删除四篇示例稿、`src/pages/topics/`、跨域专题配置、专题关联阅读与旧样式。没有兼容重定向。
- 搜索索引只含 post / news / work，界面分为博客 / 资讯 / 项目，支持类型切换、资讯独立筛选和每区每页 20 条。索引没有专题或示例稿。
- 只保留 `rss.xml` 与 `news/rss.xml`。删除混合 feed 和候选 feed，同步订阅页、head 自动发现和 sitemap。
- 写作配置、入门草稿生成器、维护说明与现有测试同步更新，防止再次生成旧分类与 demo 字段。

## 环境与验收方式

- Node 依赖来自锁文件：`npm ci`。
- 生产构建：`npm run build`；浏览器预览：`npm run preview -- --host 127.0.0.1 --port 4336`。
- 浏览器使用 Playwright CLI，执行 `scripts/test-content-separation-browser.js`；页面基址在脚本顶部配置。
- 所有浏览器流程从博客首页重新开始，覆盖 1440、390、320px、深浅色、分类空状态、年份归档、文章标签、三篇新文章逐篇打开并返回博客、搜索三分区、分页、资讯筛选、清空、刷新、后退、资讯阅读弹窗、首页和订阅。
- 本地截图保存在 `output/playwright/`，不提交生成物。

## 发现与修复

旧导航与专题将原创标签映射到资讯分类，示例稿仍有公开页面；搜索缺少可见的类型切换。已从模型、页面、索引、订阅与模板一起移除耦合。

截图复核发现手机端双列卡片导致单篇文章过窄，改为 560px 以下单列。搜索改为分区后，同步修正搜索统计，按实际条目数计数。

首轮浏览器脚本中的 URL 检查因 CLI 执行环境没有全局 URL 而中止，已改为在页面环境读取。后续每次均从第一步完整重跑；没有跳过失败步骤。

## 最终验证

- 构建通过，682 个静态页面。
- `node --test scripts/*.test.mjs`：45/45 通过。新增内容隔离检查已接入 `npm run test:v2`，发布流水线会执行。
- Python 资讯测试：11/11 通过。
- `node scripts/verify-writing.mjs`：草稿预览、生产隔离、发布收录、图片路径和临时文件清理通过。资讯分类、多分类数组及 demo 字段三项负向验证均按预期阻止构建。
- 浏览器完整流程通过，三个屏幕尺寸均无横向溢出、无页面脚本错误；两个 RSS 返回有效 XML；废弃专题、混合 RSS、候选 RSS、示例文章返回 404。
- `git diff --check` 通过。

## 边界

当前基线有四篇正式文章，保留其 AI 辅助说明；三篇新文章归入 AI 工程，站点实现记录归入独立创造。空分类显示简洁空状态。外部资讯及其图片仍依赖原发布者可用性。

## 改动文件

M 为修改，A 为新增，D 为删除。

```text
M	README.md
M	docs/ANALYTICS.md
M	docs/AUTHORING.md
A	docs/CONTENT-SEPARATION.md
M	docs/DISCOVERY.md
M	docs/NAVIGATION.md
M	docs/V2-DELIVERY.md
M	frontmatter.json
M	package.json
A	scripts/content-separation.test.mjs
M	scripts/init-writing.mjs
M	scripts/navigation.test.mjs
M	scripts/reading-articles.test.mjs
A	scripts/test-content-separation-browser.js
M	scripts/test-search-layout.js
M	scripts/test-v2-browser.js
M	scripts/verify-writing.mjs
A	src/components/BlogListing.astro
M	src/components/NewsCard.astro
M	src/components/PostCard.astro
M	src/components/SectionNav.astro
M	src/content.config.ts
D	src/content/posts/ai-engineering.md
M	src/content/posts/building-mind.md
M	src/content/posts/cost-per-usable-result.md
D	src/content/posts/creative-work.md
D	src/content/posts/interface-design.md
D	src/content/posts/long-term.md
M	src/content/posts/memory-hot-warm-cold.md
M	src/content/posts/rag-retrieval-evidence.md
M	src/data/reading-articles.json
M	src/layouts/Base.astro
A	src/lib/blog-categories.ts
M	src/lib/discovery-rules.mjs
M	src/lib/discovery.ts
M	src/lib/reading-index.ts
M	src/lib/site-navigation.mjs
M	src/pages/about-site.astro
M	src/pages/archive.astro
A	src/pages/archive/category/[category].astro
A	src/pages/archive/year/[year].astro
D	src/pages/feed.xml.ts
M	src/pages/index.astro
M	src/pages/lab/stream.astro
M	src/pages/news/story/[id].astro
D	src/pages/picks/rss.xml.ts
M	src/pages/posts/[id].astro
M	src/pages/rss.xml.ts
M	src/pages/search.astro
M	src/pages/sitemap.xml.ts
M	src/pages/stats.astro
M	src/pages/subscribe.astro
D	src/pages/topics/[slug].astro
D	src/pages/topics/index.astro
M	src/scripts/analytics.ts
M	src/scripts/motion.ts
M	src/scripts/search.ts
M	src/styles/connections.css
M	src/styles/discovery.css
M	src/styles/explore.css
M	src/styles/global.css
M	src/styles/shell.css
```
