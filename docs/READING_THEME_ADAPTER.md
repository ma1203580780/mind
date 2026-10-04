# 蓝天白云阅读页与项目主题融合

## 共用项目外壳

ReadingArticle 使用 Base.astro；文章、首页和目录共用真实标识、五项主导航、页脚、主题偏好和页面切换。没有独立的页头或重复的主内容区域。

Base 新增 reading、ogType、publishedTime 参数。默认值保持普通页面行为；阅读文章继续保留文章分享元信息、canonical 和发布时间。

## 主题边界

蓝天、白云与少量暖阳是阅读标题区的装饰。正文保持项目的中性文字与页面底色。湖蓝强调、奶油黄提醒和原有阅读内容组件继续由 reading-kit 管理。

site-adapter.css 仅在 body.reading-layout 下生效；blog-sky.css 管理文章与目录共用的背景：

| 阅读属性 | 项目主题来源 |
| --- | --- |
| 字体 | Base 中的全站字体 |
| 正文、辅助文字 | --ink / --muted |
| 普通内容表面 | --paper |
| 云层过渡到的页面底色 | --bg |
| 轻阴影、浮起阴影 | --shadow / --lift |
| 页头和页脚宽度 | --shell-width |
| 阅读字号 | --rk-font-*，14/16/18/22/26px |

暗色模式沿用站点主题按钮，标题区变为柔和深蓝，云层与正文表面同步转暗。手机保留已有站点导航与折叠目录。

云朵新增 CSS 分层飘动：薄云、远景、中景和前景以不同的周期缓慢位移，标题保持静止。背景离开视口或页面隐藏时暂停；减少动态效果偏好下不播放动画。

博客区域不再显示二级导航，包括原“全部博客”黑色按钮。原专题路径继续可访问，但只统计和展示本站博客，不混入近期资讯来源、历史资料数量或资讯分类入口。

## 单一来源

- scripts/reading-kit/sky-clouds.svg：无文字原生 SVG，路径、渐变和轻柔滤镜，无位图依赖。
- scripts/reading_layout.py：可复用阅读外壳，只生成标题区、文章栏与目录。
- src/components/ReadingArticle.astro：连接共用 Base。
- src/styles/reading-kit/site-adapter.css：主题适配层。
- src/styles/blog-sky.css：文章与目录共用天空、云层和暗色配色，目录卡片使用柔和蓝色阴影。
- src/scripts/sky-background.js：共用天空的可见性监听与暂停逻辑，页面离开时清理观察器。
- src/scripts/editorial-reader.js：页面离开时清理阅读进度监听和目录观察器，支持站内切换。

修改布局后运行 npm run reading:build 更新 reading-articles.json，不手工修改生成缓存。Markdown 正文没有修改，目前仍只有获准的三篇使用阅读外壳。

## 本地验证

- npm run build：690 页构建通过。
- 阅读文章、博客区域纯净性、导航和原有 v2 检查：13 项通过。
- 三篇阅读页与首页共用页脚、主导航链接，博客菜单正确激活；没有重复主内容标识、标题或主题按钮。
- 首页、目录、三篇文章和加载的本地样式/脚本均通过 HTTP 检查。
- 云层不含文字、位图或 foreignObject。
- 共享背景生命周期模拟检查通过：重复初始化不叠加观察器，离屏/后台暂停，页面切换清理后可重新挂载。
- 浏览器视觉验收未完成：此前浏览器策略检查不可用，未绕过限制。暗色视觉、窄屏布局与实际点击仍需在浏览器查看。

## 预览

本地预览服务复用项目已有的 4323 端口：

- http://127.0.0.1:4323/mind/archive/
- http://127.0.0.1:4323/mind/posts/memory-hot-warm-cold/
- http://127.0.0.1:4323/mind/posts/rag-retrieval-evidence/
- http://127.0.0.1:4323/mind/posts/cost-per-usable-result/

以上为首次本地适配记录。后续用户已授权统一五个一级页面背景并推送 GitHub，本轮集成与验证见 [SITE_VISUAL_SYSTEM.md](SITE_VISUAL_SYSTEM.md#五个一级页面统一与发布)。
