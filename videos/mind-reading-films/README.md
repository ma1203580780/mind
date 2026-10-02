# 文章字幕短片

四篇示例稿的无声字幕概览，每篇 24 秒；播放器明确标注示例与无声。

使用 HyperFrames 0.8.108；`index.html` 引用四个独立 composition，合计 96 秒。构建字体为 Noto Sans CJK SC 字符子集，许可在 assets/OFL.txt。GSAP 使用包内分发版本，版权与许可链接保留在 assets/gsap.min.js 文件头。

```bash
npx hyperframes@0.8.108 check .
npx hyperframes@0.8.108 render . --fps=24 --output=films.mp4 --crf=24
```

按 films.json 的 start/duration 分割为四个文件，放到 `../../public/media/`；建议使用 H.264、yuv420p 和 faststart。文章 frontmatter 指向实际文件。电影不包括配音，全文收听由博客系统朗读提供。

编辑依据见 BRIEF.md、design.md、STORYBOARD.md。正文变化后要同步重做字幕概览，不能把旧视频当作新正文的完整内容。
