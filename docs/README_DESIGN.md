# README 设计记录

调研日期：2026-10-03。阅读以下 10 个仓库当日默认分支 README；Star 为 GitHub API 查询时的近似量级，仅用于说明样本选择，不作为质量证明。

## 参考模式与取舍

| 项目 | Star 约数 | 观察到的组织方式 | 在 mind 中的应用 |
| --- | --- | --- | --- |
| [Immich](https://github.com/immich-app/immich#readme) | 115.5k | 主截图、链接索引、Demo、能力矩阵；路线图单独链接 | 真实界面前置，三类阅读入口并列；后续事项与现有能力分开 |
| [Appwrite](https://github.com/appwrite/appwrite#readme) | 57.6k | 品牌主图、产品分组、安装、架构与贡献的完整信息层级 | 用资讯／文章／作品组织特性，不平铺所有实现细节 |
| [Supabase](https://github.com/supabase/supabase#readme) | 111.0k | 产品截图之后解释组成与架构，详细文档外置 | 在体验之后放简短数据流图，再连接源码位置 |
| [Tauri](https://github.com/tauri-apps/tauri#readme) | 111.6k | 简介、最短启动路径、功能、平台边界与贡献入口 | 明确运行环境、真实命令及浏览器能力边界 |
| [Astro](https://github.com/withastro/astro#readme) | 63.0k | 一句话定位，安装命令前置，文档／支持／贡献分流 | 精简启动流程，维护内容放独立文档 |
| [Excalidraw](https://github.com/excalidraw/excalidraw#readme) | 133.4k | 明暗主题主视觉、在线入口、产品截图；区分包与站点能力 | 明暗首页实拍、可点击体验入口；仅描述当前站点已接入功能 |
| [Outline](https://github.com/outline/outline#readme) | 40.8k | 真实界面大图；安装、开发与架构分层 | 用界面证据替代装饰图，README 只保留架构概览 |
| [Cal.diy](https://github.com/calcom/cal.diy#readme) | 48.8k | 居中项目入口、产品截图、技术栈、环境前置条件 | 克制的居中首屏与明确前置条件，不复制冗长部署章节 |
| [Memos](https://github.com/usememos/memos#readme) | 63.5k | 用户价值开场，演示入口、场景化特性、快速启动 | 从浏览／深入／找回内容解释能力，先让读者理解用途 |
| [shadcn/ui](https://github.com/shadcn-ui/ui#readme) | 125.0k | 极短定位、主视觉与少量高价值文档链接 | 控制段落长度，以留白和层级组织信息 |

调研时 `calcom/cal.com` 已重定向至 `calcom/cal.diy`，因此记录实际读取的仓库。参考仅限信息组织与表达方式；未复制对方文案、品牌素材或功能声明。

## 本次设计

阅读顺序为：定位与入口 → 真实截图 → 场景与能力 → 本地启动 → 写作与发布 → 架构 → 文档 → 贡献与后续事项。首屏无 Badge，截图保留站点自身的纸色、石墨正文和低饱和配色。

兼容 GitHub 原生渲染：Markdown 表格、代码围栏、Mermaid、`picture` 与简单 HTML 表格；不依赖自定义 CSS、脚本或外部动态图表。主截图适配明暗主题，功能文字保留在图片之外，图片提供 alt 文本。

## 事实核对

- 以 `package.json`、锁文件、页面路由、内容 schema、组件与发布工作流为依据，而非仅重写旧 README。
- 当前无 `src/pages/reading.astro`，本地收藏存储模块未接入当前页面，因此不声称已提供收藏页或已读界面；同步修正 `docs/DISCOVERY.md` 中关于该入口的旧记录。
- 作者精选配置为空，Clarity ID 为空，均列为待完成事项；不承诺发布日期。
- 仓库未提供根目录 LICENSE，不添加许可证 Badge，也不擅自指定许可证。
- 根目录保留最短写作示例，媒体配置移至 `docs/AUTHORING.md`；不存在的媒体文件明确标为待替换示例。

截图来源与更新方式见[资源说明](assets/readme/README.md)。
