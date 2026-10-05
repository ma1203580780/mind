---
title: "4 篇、38 篇与 4 个 demo：这个站为什么先删掉自己的首页"
description: "占位稿没有撞上配色或文案，撞上的是两条线上 schema 规则。把放行挪到写入那一刻之后，站点从 4 篇走到 38 篇，而每一步都留在 git 历史里可以核对。"
date: '2026-10-05'
category: 独立创造
tags:
- 独立开发
- 创作
- AI工程
authorship: assisted
draft: false
featured: false
---

站点最早有五个 Markdown 文件。三十一个小时之后它有三十八篇文章，中间有一个时刻，这个数字是**四**。

`00f5da3` 那次提交的 `src/content/posts/` 里有五个文件，其中四个的 frontmatter 写着 `demo: true`：`ai-engineering`、`creative-work`、`interface-design`、`long-term`。它们在本地跑得起来，在浏览器里看得见，分类名也像模像样。中间 `bedf601` 又加进三篇后来正式发布的阅读文章，文件数一度到八个；三十分钟之后，`1ea87cd` 把那四个 demo 文件删掉了。理由不是排版不好，也不是内容不够——是它们在线上永远发不出去。

删完之后站点剩四篇正式文章。然后数字开始往回走：`2b7cbc4` 到九篇，`73734a4` 到十四篇，`3c5a5cd` 到二十五篇，`6583f7e` 到三十八篇；到 `438ff4c`，`src/content/posts/` 下三十八个文件，没有一个 `draft: true`。这篇文章讲的是中间那一步——删掉自己的首页，然后把放行这件事从人手里挪出去——以及为什么这件事只能这么做。

## 一 / 两份 schema / 「本地能跑」在发布链路上不成立

两棵源码树对被允许上线的文章，用的不是同一份定义。

工作区里的 `mind/`（本地写作副本）写的是 `category: z.string()`、`demo: z.boolean().default(false)`。任何分类名都收，写 `demo: true` 也照过。

发布克隆和线上仓库写的是 `category: z.enum(BLOG_CATEGORIES)`，其中 `BLOG_CATEGORIES = ['AI 工程', '产品与交互', '独立创造', '思考与成长']`；还有 `demo: z.never().optional()`——这个字段只被允许不出现在 frontmatter 里。`docs/PIPELINE.md` 把后果写成一句话：写进去直接构建失败。

那四篇占位稿正是撞在这两条上。`creative-work.md` 的 `category` 是「创作实践」，`long-term.md` 是「长期成长」——这两个词不在四类里；同时每一篇都带着 `demo: true`。所以它们不是「差点就发了」，而是从一开始就不可能上线：任何一次真实的 `astro build` 都会在读取 frontmatter 时中止。

真正要命的是时间差。本地那份宽松 schema 让编辑过程一路绿灯：`npm run dev` 起得来、页面渲染得出来、导航点得通。它校验的是「这个文件是不是一篇格式正确的稿子」，不是「这篇稿子有没有被允许上线」。两份定义之间那道缝在本地完全不可见，只有 CI 从 `main` 重建时才会暴露。占位稿在这一步之前活得很好，不是因为它合格，而是因为没有人问过它合格的问题。

`1ea87cd` 的解法是缩小战场而不是修补：删掉四个文件、删掉 `src/pages/topics/`、删掉混合 feed 与候选 feed、把 `src/lib/blog-categories.ts` 立成唯一的分类来源。删除不是清理动作，是承认这四篇无法按原样发布，而不是先改文案再想办法把它们塞进去。

## 二 / 靠记忆守边界 / 四篇示例稿撞在了哪两条线上

`1ea87cd` 把「能不能发」拆成三条互不重叠的条件：文案字段必须删掉 `demo`、分类必须映射进四类、`draft` 必须显式置为 `false`。任何一条不满足，那篇就不该出现在列表、搜索、RSS 和 sitemap 里。

把三条并排放在一起，能看出它们管的其实是两件不同的事。内容那三条管的是**这篇东西该不该被读者看到**；schema 管的是**这个文件会不会让构建中断**。前者可以靠编辑判断，后者不能——因为构建失败和内容质量无关，它只是类型不对。

于是问题换了个说法：成文规则本身不产生保护，**规则写在哪个位置**才产生保护。写在文档里，执行它需要有人在每次发布前记得；写在 schema 里，执行发生在构建的第一次读取。四篇示例稿恰好演示了前一种的失效：草稿目录里它们一直存在，草稿目录的 schema 一直允许它们存在，而「记得先删 `demo`」只存在于操作者的记忆里。

这也解释了 `08:17 / 14:17 / 20:17` 那三次排程为什么不能当成保护层。排程只负责触发采集与翻译，它不对「能不能发」表态。定时采集本身也并不可靠：10-02 三次计划实际只跑了一次（17:52），10-05 全天的二十一次运行全部由 push 触发。把守边界这件事挂在一个尽力而为的调度器上，等于没有守。

## 三 / 把检查挪到写入那一刻 / 因为 `dist/` 从不进仓库

为什么这两条规则值得单独立一节，答案在发布链路的结构里：`dist/` 从不进仓库，线上永远是 CI 从 `main` 现场重建的结果。本地构建不影响线上，本地预览的那份 `dist/` 也不构成任何发布保证。

这个结构有个直接后果：本地与线上之间的不一致不会被慢慢发现，而是要么被完全绕开，要么在某一次构建里一次性暴露。没有中间状态，也没有渐进式报警。所以唯一有效的引入点，是**写入的那一刻**——在文件被复制过去之前，而不是等构建失败之后再回头改。

`ef23481` 的提交信息标题是「Refuse to publish a draft that a test guards」。它新增三十三行，做的事很窄：先扫出 `mind/` 里所有 `draft: true` 的 slug，再扫 `scripts/` 下所有带 `test(` 的 `.mjs`，把「既是草稿、又被某个测试文件提到过」的 slug 记下来；然后在循环体开头拦住它们，打印出 `scripts/<file>:<line>` 和「若确实要发布，先改那条断言」。

关键在最后半句：它不修改测试，只是把规则的位置提前。被拦住的那一篇是 `ai-engineering-four-layers`，`scripts/v2.test.mjs` 里有一条断言明令它不得进入搜索与 RSS。在此之前，这条断言的生效时刻是构建——`npm run build` 跑到一半报错，看不出和测试有关；之后，它在任何文件被写入之前就报出文件名与行号。

同一天另一个提交 `e3e9fe5` 处理的是另一半「位置不对」：把 frontmatter 适配、构建、全量测试串成一条命令，并且**在提交前停下**。发布因此变成一个明确的决定，而不是一条命令的副作用。从四篇到三十八篇，每一批都走这条路；`docs/PIPELINE.md` 记录后续每一篇都经过同一套适配、构建、测试、推送、线上复核。

规则的位置一旦固定，测试的数量就成了另一件事的读数。`1ea87cd` 之后记的是 Node 45/45、Python 11/11；`docs/PIPELINE.md` 后来记到 Node **67/67**、再到 **73/73**，Python 一直是 11/11。这些数字的增长不代表代码变复杂了，它代表更多条原本只存在于对话里的判断被写进了仓库。哪一条被写进去，哪一条就再也不会在半夜被忘记。

## 四 / 沿用下来的三个强特征 / 这套东西教给阅读检查的部分

把上面两件事压成一条更一般的判断：**一个判断写在人脑里，它的执行率取决于发布那天有多累；写在仓库里，它的执行率是 100%。** 4 → 38 不是这条判断的证明，只是一个可以核对的样本；它证明的是这条判断至少在这个仓库里没有反例。

这条判断有一个直接推论：验收本身也不能靠弱特征。同一份 `docs/PIPELINE.md` 记录了一次真实事故——判断 `define-good-before-prompting` 是否已部署时，用了 `grep "80"`，结果匹配到旧版页面，报出假阳性。此后一律改用强特征：`资料与边界` 小节是否存在、外部来源链接数量、钩子短语能否完整匹配。`grep "80"` 和 `category: z.string()` 是同一类错误：用一个几乎必然成立的条件，去回答一个只在特定时刻才成立的问题。

同样，规格与渲染之间那次分离也留下了可核对的痕迹。三篇交互式阅读文章不走普通 Markdown 渲染，由 Python 预渲染成 HTML 存进 `src/data/reading-articles.json`；`scripts/check-reading-articles.mjs` 用 SHA-256 比对源 Markdown，并且顺手断言源文件里有 `draft: false`、渲染结果里没有 `127.0.0.1` / `localhost` / `/Users/` 这类本地痕迹、每篇只有一个 `<h1>`。它现在比对八篇（`READING_KIT.md` 里记的「本轮仅接入三篇样稿」是更早的状态）。**改了正文不同步重跑，构建就在这一步失败——而不是让一份源文件和一份渲染结果静静地分叉下去。**

这也解释了为什么这套东西最终没有停在 schema 上。schema 只能回答「这个文件合不合法」，回答不了「这份内容是不是这一版」。其中 `rag-retrieval-evidence`、`memory-hot-warm-cold`、`cost-per-usable-result` 这三条最早就走预渲染，Markdown 是源、HTML 是生成物，两者之间存在一份可以被遗忘的中间状态。SHA-256 比对把这份中间状态变成一次一问一答的核对：源文件改过、生成物没跟上，第一次读取就报错。**不允许分叉，也就不存在「先上线、以后再同步」这条路。**

回到开头那四个文件。它们没有被改写成能发布的样子，而是被删掉了；此后站点反而从四篇长到三十八篇。这不是「删了才长得快」的因果，而是删掉之后，唯一能决定放行的东西只剩下一份定义和一道守卫——而这两样都在仓库里，不依赖任何人当天记得什么。

## 资料与边界

核对时间 2026-10-05。本文所有数字取自这个仓库自身（工作区内的 `mind-articles-release` 与 `.publish-wt` 的 git 历史、文件内容，以及 `docs/PIPELINE.md`）。对应的公开仓库与线上站点如下，每条下面的提交号与文件路径都可以在原仓库里直接核对。没有引用任何外部论文或第三方榜单。

- 公开仓库（提交历史与全部源码）：[ma1203580780/mind](https://github.com/ma1203580780/mind)
- 线上站点（CI 每次从 `main` 重建的产物）：[ma1203580780.github.io/mind](https://ma1203580780.github.io/mind/)
- 一次真实定时运行的记录（`docs/PIPELINE.md` 引用它作为「该次执行成功」的证据，只证明该次）：[Actions run 37099484235](https://github.com/ma1203580780/mind/actions/runs/37099484235)

下文提到的 `00f5da3`、`bedf601`、`1ea87cd`、`2b7cbc4`、`e023c37`、`39319c7`、`73734a4`、`7d04ae6`、`9226ce5`、`3c5a5cd`、`6583f7e`、`438ff4c`、`ef23481`、`e3e9fe5`、`4766272` 均为公开仓库里的提交号。

- `docs/PIPELINE.md`（397 行）：本地/线上 schema 差异；`dist/` 不进仓库、线上永远由 CI 从 `main` 重建；线上 `main` = `4766272` 时 38 篇文章、**8 篇交互式阅读文章**；`npm run build` 当时 715 页；Node 67/67、npm 25/25、Python 11/11、全新 clone 复现验证 715 页；排程 `17 0,6,12 * * *`（UTC）实测表（10-02 一次、10-05 零次定时、全天 21 次全部 push 触发）；`73734a4` 时「博客从 4 篇变为 14 篇」；`grep "80"` 假阳性事故与强特征清单；第七节 732 页、Node 73/73、Python 11/11；第九节各批次提交号与累计 18 篇返工上线。
- `.publish-wt` 的 git 历史（只读查询）：`00f5da3` 的 `src/content/posts/` 含 5 个文件，其中 4 个 `demo: true`（`ai-engineering` / `creative-work` / `interface-design` / `long-term`）；按 `git ls-tree` 统计各提交下 `src/content/posts/*.md` 数量：`2b7cbc4`=9、`e023c37`=10、`39319c7`=12、`73734a4`=14、`7d04ae6`=16、`9226ce5`=17、`3c5a5cd`=25、`6583f7e`=38、`438ff4c`=38；`438ff4c` 的工作树里 38 个文件全部 `draft: false`，无 `draft: true`。
- `src/content.config.ts`（`.publish-wt`）：`category: z.enum(BLOG_CATEGORIES)`、`demo: z.never().optional()`。`mind/src/content.config.ts`：`category: z.string()`、`demo: z.boolean().default(false)`。`src/lib/blog-categories.ts`：`['AI 工程', '产品与交互', '独立创造', '思考与成长']`。四个占位稿的 `category` 与 `demo` 取自各自文件。
- 提交 `ef23481`「Refuse to publish a draft that a test guards」：新增 33 行，`scripts/prepublish.mjs`，被拦下的 slug 为 `ai-engineering-four-layers`。提交 `e3e9fe5`「Add incremental prepublish helper」：新增 144 行，构建与全量测试后停在提交之前。
- `mind-articles-release/docs/CONTENT-SEPARATION.md`（基线 `1ea87cd`）：逐字为「构建通过，682 个静态页面」「`node --test scripts/*.test.mjs`：45/45 通过」「Python 资讯测试：11/11 通过」；删除四篇示例稿与 `src/pages/topics/`、混合 feed、候选 feed；分类四类的字符串写法。注意这里的页面数与测试数是 2026-10-04 的状态，不是当前值。
- 另外两组测试数来自 `docs/PIPELINE.md` 的两处：第 253 行「构建 715 页通过，Node 67/67、npm 25/25、Python 11/11」；第 279 行「构建 **732 页**、…Node **73/73**…Python **11/11**」。第 222 行另有一次未提交改动的预检记录「构建 736 页、73/73 测试」。
- `.publish-wt/dist`（2026-10-05 19:24 构建）：915 个 HTML 页面，其中 `dist/posts/` 38 个、`dist/news/` 846 个。这是构建产物快照，不是线上页面的实时计数。
- `scripts/check-reading-articles.mjs`：SHA-256 比对源 Markdown，并断言 `draft: false`、无本地痕迹、单 `<h1>`。`src/data/reading-articles.json` 与 `scripts/reading-kit/articles.json` 当前各 8 条；`mind/docs/READING_KIT.md` 结尾记「本轮仅接入三篇样稿，其余 37 篇未经用户后续指示不批量改造」——该文件写在站点 40 篇、线上 38 篇的时点，本文章未据它推算任何当前篇数。

范围与口径说明：`715`、`682`、`732`、`915` 分别是不同时点、不同树上的构建产物页数，不能互相比较，也不能当作「站点规模增长」的同一个指标。`mind/` 与发布克隆的 schema 差异描述的是本工作区在 2026-10-05 的状态。文中所有关于「为什么这样设计」的推理是我基于以上文件与提交记录的整理，没有独立复现实验，也没有引用任何非公开数据。
