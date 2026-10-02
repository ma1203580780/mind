# 海波东 · 工程与思考

以阅读为中心的中文个人博客，使用 Astro 7，面向 GitHub Pages 发布。无数据库、无运行服务器，正文保存在 Markdown 文件中。

## 已具备

- 中文首页、分类筛选、标签、归档、关于页与 404 页。
- 文章正文、目录、代码高亮与复制、阅读进度、文章链接复制。
- 阅读 / 收听 / 观看切换：全文系统朗读，原生音视频或按需加载的 B 站播放器。
- 新闻图文瀑布流、日期侧栏、分类浮栏、搜索与列表切换。
- Vercount 基础访问统计、隐私开关，以及可选的 Umami 事件统计。
- 浏览器全文搜索（包含正文）、移动端、深浅色、键盘导航。
- canonical、RSS、sitemap、robots 与 GitHub Actions 发布。
- 所有示例文章均标注「示例稿」，不进入 RSS/sitemap，文章页带 noindex。

## 本地使用

安装 Node.js 24，然后执行：

```bash
npm ci
npm run dev
```

访问终端输出的本地网址。构建：`npm run build`。预览构建结果：`npm run preview`。

## 发布到 GitHub

1. 本博客使用公开仓库 `ma1203580780/mind`，站点地址为 `https://ma1203580780.github.io/mind/`。
2. 把本项目文件放在仓库根目录，必须包含 `.github/workflows/deploy.yml`。
3. 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
4. 推送到 `main` 或手动运行 Publish blog 工作流。
5. 工作流自动识别站点域名及项目路径，无需修改源码中的示例域名。

如使用自定义域名，在 Pages 设置中配置并完成 DNS 设置，然后重新运行发布。不要直接上传 `dist` 作为源码仓库。

本项目默认站点域名为 `https://ma1203580780.github.io`，路径为 `/mind/`。

## 改站名和平台入口

编辑 `src/site.ts` 的 `site` 对象；微信、知乎、B站和 GitHub 链接填入 `social` 即可出现。未填写时不会显示无效入口。部分页面标题与关于文字也需要相应替换。

## 写文章

在 `src/content/posts/` 新建 `.md`，例如：

```yaml
---
title: "文章标题"
description: "准确简洁的摘要"
date: 2026-10-02
category: "AI 工程"
tags: ["AI工程"]
draft: false
demo: false
---
```

下方写 Markdown 正文。提交到 GitHub 后自动发布。`draft: true` 不生成页面、不进入搜索、RSS 或 sitemap；私人附件请勿提交到公开仓库。发布前删除或替换示例稿。

## 多模态

每篇文章有「阅读 / 收听 / 观看」切换。未配置音频时使用设备的中文朗读，支持暂停、语速和段落定位。系统朗读需要浏览器语音支持；不会自动播放。四篇示例稿附有 24 秒无声字幕概览，正式文章请配置自己的媒体。

在文章 frontmatter 中配置文件，路径由组件自动加上项目 BASE_PATH：

```yaml
audio:
  src: "media/my-article.mp3"
  duration: "6:20"
video:
  src: "media/my-article.mp4"
  poster: "media/my-article.jpg"
  duration: "3:10"
  label: "文章视频"
```

`src` 也接受 HTTPS 外链。B 站视频使用下方配置替代整个 `video` 对象：

```yaml
video:
  bvid: "填写实际的 BV 号"
```

B 站播放器仅点击加载后才连接第三方；没有媒体时显示明确的准备提示。小图片、音频与轻量视频可放 `public/media/`。大视频优先在 B 站等平台托管，避免把原始大文件放进 Git。当前示例视频的可编辑工程在 `videos/mind-reading-films/`。

## 访问统计

`/mind/stats/` 是统一数据入口：真实 Vercount 累计计数、内容状态、8 个分析分区、渠道链接生成器、站长设备排除和埋点字典。详细报表在登录后的 Umami / Clarity 查看。两边尚需绑定真实项目 ID，不生成虚构趋势。

配置在 `src/config/analytics.json`。Umami 与 Clarity 独立加载，保留既有 Vercount。Clarity 需访客明确同意，支持撤回；DNT、全局关闭与站长排除阻止采集。阅读、原生媒体进度、新闻和搜索数量等事件已实现。接入和验收见 [docs/ANALYTICS.md](docs/ANALYTICS.md)。
