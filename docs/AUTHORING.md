# 写作与媒体

文章存放在 `src/content/posts/`，字段约束见 [`src/content.config.ts`](../src/content.config.ts)。最小文章示例见[根目录 README](../README.md#写作与发布)。

## 内容状态

- `draft: true`：不生成生产页面、不进入列表、搜索、RSS 或 sitemap；本地开发模式可直接访问文章地址预览。文件仍然随仓库公开。
- `demo: true`：标注为示例稿，不进入正式文章 RSS、全站更新 RSS 或 sitemap，文章页带 `noindex`；仍可在站内浏览和搜索。
- `authorship: assisted`：文章页显示「本站记录 · AI 辅助」。正文应说明依据与边界，不代替作者陈述个人经历。

站名、描述与社交链接在 [`src/site.ts`](../src/site.ts) 中修改。空的社交链接不会显示；关于页及其他硬编码文字需另行检查。

## 封面图片

正文图片可通过 Front Matter 保存到 `public/uploads/`；Markdown 使用 `/uploads/文件名`，构建时自动补上站点基础路径。操作方法见 [Windows 写作指南](WRITING_WINDOWS.md)。封面字段与正文图片使用不同约束。

封面是可选字段；当前 schema 要求四项同时存在，`src` 与 `sourceUrl` 必须为完整 URL：

| 字段 | 内容 |
| --- | --- |
| `cover.src` | 与文章直接相关、已核对使用条件的图片 URL |
| `cover.alt` | 对图中内容的准确描述 |
| `cover.sourceUrl` | 原始发布页面 URL |
| `cover.sourceName` | 原作者或发布者名称 |

没有合适图片就使用文字卡。详情见[视觉编辑规范](VISUAL_EDITORIAL.md)。

## 阅读、收听与观看

每篇文章都有三种模式。未配置音频时使用设备中文语音，支持暂停、语速和段落定位，取决于浏览器语音支持。没有视频时显示准备提示，不自动生成视频。

以下为**字段格式示例**；使用前须将文件放入 `public/media/`，并替换为实际文件名：

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

组件自动添加站点基础路径，无需在 `src` 中写 `/mind/`；音视频 `src` 也接受 HTTPS 外链。可选 `video.captions` 指向中文字幕轨道文件。

B 站视频用仅含 `bvid` 的 `video` 对象替代上述视频配置，填写实际的 `BV` 加 10 位字母数字的视频号。播放器只在点击加载后连接 B 站。

小型媒体可放在 [`public/media/`](../public/media/)，大视频优先使用外部托管。现有四篇示例稿配有 24 秒无声字幕概览，属于示例内容；可编辑源工程在 [`videos/mind-reading-films/`](../videos/mind-reading-films/)。

## 发布前

1. 核对标题、摘要、日期、来源和内容状态。
2. 本地检查正文、深浅色、移动端和三种阅读模式。
3. 运行 `npm run build`，通过后提交，由 GitHub Actions 发布。

新闻的采集与翻译使用独立数据流程，见[新闻编辑规则](NEWS_EDITORIAL.md)。
