---
title: "写进文件的规则才能被断言：一条让某篇文章不许存在的测试"
description: "我的仓库里有一条测试，它断言的不是某个功能能用，而是某篇文章不许出现在搜索索引、构建产物和 RSS 里。从这条断言出发，看需求、约束、流程与权限为什么要分开存放：它们的寿命、作用域和拦截方式都不一样。"
date: '2026-10-05'
category: AI 工程
tags:
- AI工程
- Agent
authorship: assisted
draft: false
featured: false
---

在 `.publish-wt/scripts/v2.test.mjs` 的第 43 行，曾经有一条测试，它的断言对象不是某个功能能不能用，而是**一篇文章不许存在**：

```js
for(const id of ['ai-engineering-four-layers']){
  assert.ok(!index.some(p=>p.id===`post:${id}`));
  assert.ok(!existsSync(`dist/posts/${id}/index.html`));
  assert.ok(!readFileSync('dist/rss.xml','utf8').includes(`/posts/${id}/`));
}
```

三个断言分别盯着三份产物：搜索索引、构建出的页面、RSS。任何一个里出现了这个 slug，`npm run test:v2` 就是红的。这条测试之所以写得出来，不是因为作者谨慎，而是因为「这篇文章先别上线」在这个仓库里有一个具体地址，也有一个程序能判定它是否被满足。同样这句话如果只出现在对话里，它的强度上限就是注意力。

**这条守卫已经在本文上线时被移除了。** 移除它的方式是删掉同一个文件里的那一行——一个可以被看到、被审阅、也会进入 git 历史的改动，而不是在对话里改口说「那篇现在可以发了」。这正好是本文要讲的那件事的第一个实例：要求住在哪里，决定它被改动时留下多少痕迹。

下面是这条断言背后的机制：为什么一条要求要生效，先得有个地方住。

## 一条要求要生效，先得有地址

一条要求要被重复执行，需要两个属性。第一是**地址**：它在哪个范围内有效。第二是**可判定性**：有没有一个程序能判断它是否被满足。对话里的句子两个都没有——它随会话结束而消失，也无法表达「只在 `mind/` 下生效」。写进文件的要求两样都有。

`AGENTS.md` 的官方站点把这件事说得很朴素。它被描述为：

> A simple, open format for guiding coding agents, used by over 60k open-source projects.

它同时被定义成「一个专门的、可预测的位置」：

> Think of AGENTS.md as a **README for agents**: a dedicated, predictable place to provide the context and instructions to help AI coding agents work on your project.

「dedicated, predictable place」是这句话里真正的技术内容。如果指令的位置本身是可预测的，那么读取它的程序、检查它的脚本、修改它的编辑者就不需要互相约定；位置就是接口。

更能说明分层不是文档整理癖的，是它的作用域规则。官方说明里写着嵌套写法：

> Place another AGENTS.md inside each package. Agents automatically read the nearest file in the directory tree, so the closest one takes precedence and every subproject can ship tailored instructions. For example, at time of writing the main OpenAI repo has **88 AGENTS.md files**.

一个仓库里 88 份同类文件，看起来是重复；实际上它们承担的是不同作用域上的规则。冲突怎么解，同一页给了答案：

> The closest AGENTS.md to the edited file wins; explicit user chat prompts override everything.

这条解析规则解释了分层的本质：**它是一条优先级排序，而不是一次文档归档**。离被编辑文件越近的规则越优先，作用域越窄；对话里的显式要求优先级最高，但寿命最短——它只覆盖这一次。所以「需求、约束、流程、权限」四层不是四个文件夹，而是一个按寿命和作用域排出来的偏序。

还有一句常被忽略的定性：

> (Are there required fields?) No. AGENTS.md is just standard Markdown. Use any headings you like; the agent simply parses the text you provide.

能被解析，靠的是它躺在文件系统里，而不是格式有什么魔法字段。反过来说，任何把指令留在聊天窗口里的做法，都放弃了这三件事：可寻址、可解析、可被别的程序读到。

## 需求与约束分开，是因为失效时间不同

需求层和约束层的区别不在篇幅，也不在重要性，而在**什么时候该被删掉**。需求层说的是「这一次要交付什么」，交付完成它就该过期；约束层说的是「这个仓库一直怎么运转」，只有当运转方式改变时才该改。把两者放进同一份文件，两种事故会同时发生：交付完成后，旧需求变成误导线；而真正的长期约束被当作一次性说明，随手删掉。

这个仓库里有一次真实的收敛。提交 `1ea87cd`（2026-10-04，`refactor: separate original blog from sourced news`）把博客的四个一级分类从散落处收进一份 5 行的常量文件 `src/lib/blog-categories.ts`：

```ts
export const BLOG_CATEGORIES = ['AI 工程', '产品与交互', '独立创造', '思考与成长'] as const;
```

值得注意的是，验证脚本 import 的是**同一个文件**，而不是自己抄一份：

```js
import {BLOG_CATEGORIES,blogCategories} from '../src/lib/blog-categories.ts';
```

于是「分类只有这四类」这句话不会随页面改版而漂移——站点读它，测试也读它，两边看的是同一行。这类内容就是约束层：它不因为某一篇文章发布而失效。

同一次提交里还有 `docs/CONTENT-SEPARATION.md`，形态完全不同：开头写着日期 2026-10-04、基线 commit `bedf6019…`、目标与结果、改动文件清单。这是需求层的正确形态——它记录这一次交付了什么，过期后应当归档，而不是继续被当作现行约定。

这一层的边界也要说清：约束的「单一来源」并不总能做到。发布脚本 `scripts/prepublish.mjs` 第 14 行写着：

> `// 与 src/lib/blog-categories.ts 保持一致；此处内联，避免脚本依赖 TypeScript 运行时。`

也就是说，这份常量在发布脚本里有一份**内联副本**，一致性靠注释维持，不靠 import。这是分层实践中真实存在的一道缝：当某一层的运行时不允许你复用来源时，你只能退回约定，而约定需要在每次修改时被人记得。承认这道缝存在，比宣称"已经统一"更有用——它指明了下一个该被消掉的失败点。

## 流程层只固化能被断言的部分

一个流程值不值得固化成 Skill 或脚本，判据不是「它重复了几次」，而是**它的验收能不能落在产物上**。落在产物上，重复才有复利；只能靠自我描述，固化下来的只是一份更长的说明书。

`docs/CONTENT-SEPARATION.md` 的「最终验证」一节给了一组很具体的数字：

> 构建通过，682 个静态页面。
> `node --test scripts/*.test.mjs`：45/45 通过。新增内容隔离检查已接入 `npm run test:v2`，发布流水线会执行。
> Python 资讯测试：11/11 通过。

真正关键的是紧接着那句：

> `node scripts/verify-writing.mjs`：草稿预览、生产隔离、发布收录、图片路径和临时文件清理通过。资讯分类、多分类数组及 `demo` 字段三项负向验证均按预期阻止构建。

682 个页面全部构建成功，并不能证明隔离生效——一个什么都没挡住的网站同样会构建成功。证明来自后半句：三项特意构造的坏输入**被构建拒绝**了。流程层的验收方式就是这个：不是跑通，而是**该失败的时候失败**。反向验证一次，等于给流程装上了牙齿。

同样的设计出现在测试的观察对象上。`scripts/content-separation.test.mjs` 的四个测试读的全是 `dist/` 里的构建产物——`search-index.json`、`archive/category/*/index.html`、`rss.xml`、`subscribe/index.html`——而不是源码里的意图。所以它能挡住「某次重构让资讯文章重新混进博客分类」这类回归：无论代码怎么改，只要产物错了，测试就红。断言产物而不是断言意图，这是流程能被固化的前提。

发布脚本的第 19 行是同一原则在流程上的第二次应用：

> `// mind/ 的宽松分类 → 线上四类。仅在这些名称上做映射，其余一律报错，不猜。`

映射表覆盖不到的输入直接失败。这是一个反直觉但正确的取舍：**在这里猜，只会把失败推到更远、更难定位的地方**——比如线上出现一篇分类错误的文章。让流程在最近的位置报错，是它便宜的原因。

## 权限层：能不能做，由通道决定

前三层都在回答「做什么」，只有权限层回答「能不能做」。它们的机制根本不同：前三层是**信息**，可以被写错、被忽略、被误解；权限是**拓扑**——某条路径存在，或者不存在。把「不要发布」写成一句要求，等于用信息去解决拓扑问题。

MCP 官方规范（版本 2025-06-18）在 Authorization 一节里给了一个干净的示范。它没有先规定权限清单，而是先规定权限的来源：

> Authorization is **OPTIONAL** for MCP implementations. When supported:
> - Implementations using an HTTP-based transport **SHOULD** conform to this specification.
> - Implementations using an STDIO transport **SHOULD NOT** follow this specification, and instead retrieve credentials from the environment.

第二句是重点：走 STDIO 的实现**不应该**遵循这套授权规范，而应当从环境里取凭据。规范把「权限从哪来」绑定在**通道**上，而不是绑定在调用方的描述上。这就是权限层的形态——它挂在执行环境与通道上，因此不依赖任何人的记性。

这个仓库里对应的实例是发布脚本 `scripts/prepublish.mjs`。它的第 1 行写着：

> `// 增量发布准备：把 mind/ 里的文章搬进发布克隆，适配线上 schema，验证，然后停下来等你确认。`

第 7 行的三条设计约束更直接：

> `// 设计约束：只做增量。不改现有文件以外的内容，不新建分支，不推送。`

三条里没有一条是「请不要乱改」这种提醒，全部是可执行判定的边界：不新建分支、不推送、动完就停。而「停下来等你确认」把最后一步交回给人——这不是不信任，而是把不可逆的动作放在人的一侧。

更彻底的一层在目录拓扑上：草稿住在 `mind/`，线上构建由独立的工作副本完成。写稿这个动作的操作范围被限定在工作区内，越界的文件操作会被直接拒绝，而不是弹窗征求意见（当前环境里审批提示是关闭的，需要审批的动作直接失败）。于是「不要动仓库其他文件」在这个环境里不是一条纪律，而是一次会失败的调用。

回到开头那条守卫断言。它能存在，是因为「这篇文章不许出现」有地址（三份具体的产物），也有判定方式（文件存在性与字符串包含）。这正好是权限层该有的样子：**不是增加一条禁令，而是消掉一条路径。**

## 回到那条断言

四层不是四个文件夹。它们是同一个问题的四个答案：一条要求住在哪里、活多久、由谁验收、谁来拦。

| 层 | 住在哪里 | 活多久 | 由什么判定 |
| --- | --- | --- | --- |
| 需求 | 这次交付的文档里 | 交付完即过期 | 验收标准 |
| 约束 | 仓库里的常量、配置与约定文件 | 跨交付有效 | 读它的程序与读它的人 |
| 流程 | 脚本、测试与 Skill | 每次重复时被调用 | 产物的正向与负向验证 |
| 权限 | 通道与工作目录的拓扑 | 与执行环境同寿 | 越界调用直接失败 |

分层的收益不是整齐，而是**错误可定位**。产物落进了错误的目录，是流程层的事；线下能构建、线上构建失败，是约束层的事；文章还没定稿却出现在 RSS 里，是权限层没拦住——就像那条断言正在盯着的地方。

压成一句判据：一条要求如果落不进某个文件的一行，或者一段能跑的断言里，它对下一次任务来说就不存在。

## 资料与边界

核对日期：2026-10-05。公开来源的数字均逐字取自下述页面；仓库来源以本地只读查询（`git show`、读取文件）核对。

- [AGENTS.md 官方站点](https://agents.md/)：提供「used by over 60k open-source projects」「the main OpenAI repo has 88 AGENTS.md files」「the closest AGENTS.md to the edited file wins; explicit user chat prompts override everything」「dedicated, predictable place」「AGENTS.md is just standard Markdown」等原句。该站点说明 AGENTS.md 现由 Linux Foundation 下的 Agentic AI Foundation 托管；格式的仓库为 [agentsmd/agents.md](https://github.com/agentsmd/agents.md)。
- [Model Context Protocol 规范，Authorization 一节（版本 2025-06-18）](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)：提供「Authorization is **OPTIONAL** for MCP implementations」以及 HTTP / STDIO 两种通道适用性对比的原句。该页面较长，本次抓取在「Standards Compliance」之后被截断，因此文中未引用该节之后的任何内容（例如令牌权限限制、confused deputy 各小节的具体条文）。
- 仓库来源（本地，路径相对发布工作副本）：`scripts/v2.test.mjs` 第 40、43、44 行（守卫断言原文）；`scripts/content-separation.test.mjs`（四个测试断言 `dist/` 产物，import 语句见第 4 行）；`src/lib/blog-categories.ts`（5 行常量）；`docs/CONTENT-SEPARATION.md`（682 个静态页面、45/45、11/11、三项负向验证）；`scripts/prepublish.mjs` 第 1、7、14、19 行；提交 `1ea87cd`（2026-10-04，`refactor: separate original blog from sourced news`，`git show` 核对）。
- 未能定位的来源：Codex 的沙箱与审批文档。`developers.openai.com/codex/security` 返回 403，`raw.githubusercontent.com/openai/codex/main/docs/sandbox.md` 只有一句指向该页面的跳转说明。因此本文没有引用任何沙箱模式的默认值或权限清单数字，「权限挂在通道上」这一判断只依据 MCP 规范原文与仓库自身的目录拓扑，论证范围相应收窄。
- 时间与版本边界：仓库数字取自 2026-10-04 的提交与验收记录，`1ea87cd` 的基线是 `bedf6019`；MCP 规范引用的是 2025-06-18 版本，该版本之后是否修订授权章节，本文未核对。文中「四层」的划分是按寿命、作用域与拦截方式对上述材料的工程整理，没有独立实验或对照数据。
