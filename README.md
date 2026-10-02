# 海波东 · 工程与思考

以阅读为中心的中文个人博客，使用 Astro 7，面向 GitHub Pages 发布。无数据库、无运行服务器，正文保存在 Markdown 文件中。

## 已具备

- 中文首页、分类筛选、标签、归档、关于页与 404 页。
- 文章正文、目录、代码高亮与复制、阅读进度、文章链接复制。
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

小图片、音频、PDF可以放 `public/media/`。文章内支持 Markdown 图片、原生 `<audio controls>`、`<video controls>` 与 `<iframe>`。B站播放器使用官方提供的嵌入地址；浏览器或微信内播放情况需要实测。

为了兼容项目仓库路径，媒体引用需包含实际 BASE_PATH，例如本仓库 `/mind/media/cover.jpg`。根域名仓库可直接使用 `/media/cover.jpg`。建议大视频在B站发布，博客嵌入；原始大文件不要放进 Git。

## 跨平台

博客是完整版。公众号可以使用 Doocs 排版，知乎和B站专栏可以使用 Wechatsync 同步草稿后检查；这些是独立工具，本项目没有内置账号登录和自动跨平台发布。

## 后续适合添加

有正式内容后，再接评论（如 giscus）、独立域名和访问统计。当前不显示虚构阅读量、点赞或粉丝数据。
