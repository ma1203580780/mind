# 三篇正式阅读文章

这三篇已获作者确认发布，沿用本地审阅通过的天空蓝、湖蓝、奶油黄、圆角与阴影；字号仍为 14/16/18/22/26px。不要给单篇另建配色。

## 正文与生成

- 正文：`src/content/posts/rag-retrieval-evidence.md`、`memory-hot-warm-cold.md`、`cost-per-usable-result.md`。
- 共用样式：`src/styles/reading-kit/`。原有四份阅读组件样式保持获准版本；`site-adapter.css` 连接全站主题与蓝天白云标题区。
- 标记式内容组件：`scripts/reading_components.py`，对应 `scripts/reading-kit/components.json`。
- 公开阅读布局：`scripts/reading_layout.py`；站内导航取代草稿管理入口。
- 页面外壳：`ReadingArticle.astro` 共用 `Base.astro` 的标识、导航、页脚和深浅色切换；云层源文件为 `scripts/reading-kit/sky-clouds.svg`。适配边界见 `READING_THEME_ADAPTER.md`。
- 生成缓存：`src/data/reading-articles.json`。不要手工改正文 HTML。
- 图片与练习：`public/articles/`。图片是 AI 生成的概念说明；JSON/CSV 是自造教学数据，不能称作真实模型测试。

编辑正文后，安装生成依赖并执行：

```sh
python3 -m pip install -r scripts/reading-requirements.txt
npm run reading:build
npm run build
node --test scripts/reading-articles.test.mjs
```

生成缓存随 Markdown 一起提交。正常站点构建无需 Python 渲染依赖，但会校验正文 SHA-256，防止旧缓存上线。发布路径支持 `/mind` 与 `BASE_PATH` 配置；附件链接在构建时解析，无本地服务依赖。

仅该名单使用新阅读组件，其他文章继续现有样式。新增文章须先确认内容与布局，再加入 `scripts/reading-kit/articles.json`。

## 正式页与本地草稿的区别

正式页可被索引，具有 canonical、分享摘要、博客 RSS 与站内导航；不包含 localhost、文件系统路径、历史预览、草稿管理或编辑审查入口。内容源继续保留 `authorship: assisted`。

检查覆盖：正式路径、目录/首页/搜索/RSS/sitemap 收录、附件与图片、锚点、交互控件结构和源码同步。真实点击、视觉和移动端检查需另外通过浏览器完成，不能由静态检查代替。
