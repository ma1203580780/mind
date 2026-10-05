---
title: "单轮 74.9%，五轮 37.3%：生成式界面丢的不是内容，是寻址"
description: "EvoGenUI-Bench 上最强的模型单轮通过率 74.9%，五轮全过只剩 37.3%，一半的断点是「把先前对的东西改坏了」。这不是模型不够小心，而是状态被放在了那份会被重写的产物里。"
date: '2026-10-05'
category: 产品与交互
tags:
- 产品设计
- 交互设计
- AI工程
authorship: assisted
draft: false
featured: false
---

EvoGenUI-Bench 里最强的那个模型，单轮任务通过率是 **74.9%**。让同一批任务连着走五轮修改，全部通过的只剩 **37.3%**。把八个模型平均一下更刺眼：单轮 42.7%，五轮 11.8%。

掉下去的那部分不是能力不够，而是**被前面几轮的自己弄坏的**。这篇论文对 110 个相邻轮次断点做了归因，其中 **58 个（52.7%）属于「对先前行为的回归」**——前面已经做对了，后面一轮把它改回去或者改没了。

这就是「AI 重画界面，用户刚填的东西没了」的量化版本。它有一个确定的成因，也有一个确定的解，但解不在提示词里。

## 01 / 丢的不是内容，是状态和界面之间的那条线

先看一个原始案例。论文追踪了三类失败，其中一例是无人机 PID 抗风扰实验台：界面有目标输入框、一个 Run Gust Test 按钮、通过/失败徽章和诊断文字。操作者把增益 Kp 从 2.20 依次改成 1.0、1.5、0.5，每一轮都跑一次。

显示增益的那一行确实更新了。但仿真结果**每一次都返回同样的 100.0% overshoot、10.00 s settling、5.000 m SSE**。看上去在算，其实没在算。

论文把这类失败单独命名为 derived-state propagation（派生状态传播）：依赖别的状态的视图，在源状态变了以后保持陈旧。在 2750 次被执行的失败调用里，这一类占 **586 次**，是六类机制里的第二大类。

把这个机制换到用户输入上，就是那件让人不想再用的事：用户填了一半的联系方式、选了周三晚上的时段、正在第三个输入框里打字，然后补了一句「顺便加个筛选」——模型重写了整份界面。字面意义上，它交出了一个新的界面，而用户填的东西不在里面。

所以丢的其实不是「内容」。内容只是一个症状。丢的是**状态与界面之间的寻址关系**：哪一份状态，属于界面上的哪一个位置。

## 02 / 为什么「重新生成」必然丢东西

React 官方文档把这件事写得非常直白：

> React associates each piece of state it's holding with the correct component by **where that component sits in the render tree**.

状态不进 JSX 标签。它挂在渲染树的位置上。文档的总结句是：

> State is not kept in JSX tags. It's associated with the tree position in which you put that JSX.

这条规则有个直接推论：**重新生成一份结构，等于重新洗一遍状态与位置的对应表。** 位置没变、类型没变的子树能接住原来的状态；位置挪了、类型换了的子树会在原地重建，而文档对这件事的措辞极其冷静：

> Every time a counter appears on the screen, its state is created. Every time it is removed, its state is destroyed.

React 给的解法是 `key`，而 `key` 的语义恰恰说明问题所在：

> Specifying a key tells React to use the key itself as part of the position, instead of their order within the parent.

也就是说：默认情况下，身份是**位置**——第几个、在谁下面；`key` 的作用是把身份从位置换成**标识**，变成一个不随排序改变的名字。生成式界面每轮重画代码，动的正是位置。没有稳定标识，它每轮都在重新分配身份。

焦点是同一件事的另一面。焦点也是绑在某个具体 DOM 节点上的状态；节点被重建，焦点就落回文档起点。这不是体验瑕疵，WCAG 2.2 已经把它写进规范：3.2.2 On Input 要求「改变任何界面组件的设置，不得自动引发上下文的改变，除非用户事先被告知」；而规范对「上下文改变（changes of context）」的定义里明确列着 **focus**（焦点），并在示例里写明「显著重排页面内容」也算。用户敲字时整张表单重排，规范上就是一次未被预告的上下文改变。

模型只是在按指令重写文件。对它来说，那些行都是它自己写下的代码，它没有「哪一行是人手打的」这个概念，也就不会把用户的输入当成必须保住的约束。

而且这条规则带来的坏结果有两种，第二种比第一种更隐蔽。**状态被销毁**是前一种：空白。**状态被挂错**是后一种：用户在第 3 行填的电话，跑到第 1 行去了——因为新的第 1 行占了旧第 3 行在树里的位置，于是接住了属于它的那份状态。看起来有数据，但张冠李戴，比空着更难发现。生成式界面如果每轮重新分配身份，又同时允许排序和分组变化，这两种失败就会同时出现。

## 03 / 把状态挪出会被重写的那一层

A2UI 协议的做法是把结构**和**状态分开成两种消息：`updateComponents` 改的是结构，`updateDataModel` 改的是数据模型。规范里对这一层的定位是：数据绑定用 JSON Pointer 路径把组件接到应用状态上，从而「show updated content without regenerating it from scratch」——不靠从头重新生成，来展示更新后的内容。官方文档的措辞更直接，把系统拆成两块：

> 1. **UI Structure** (Components): What the interface looks like
> 2. **Application State** (Data Model): What data it displays

同一条数据流里有个细节值得抄：用户把 guests 从 2 改成 3，是**客户端自动写回 `/reservation/guests`**，模型不参与这一笔。用户点确认时，模型收到的已经是 3。性能一节还给了三条很具体的做法——按 16ms 批量提交更新、对比新旧组件只改变化的属性、更新 `/user/name` 而不是整个 `/`。

这三条合起来的名字就是**补丁式更新**：不重新生成制品，只改动差异。而这样做的收益是可测的。FronTalk（100 段多轮前端对话，每轮同时给文字指令和等价的视觉指令）测了 20 个模型，原文的 forgetting rate（先前做对的功能被后续修改覆盖掉的比例）在 **4.3% 到 44.6%** 之间，「results in a performance degradation of up to 46%」。它提出的 AceCoder 只做一件事：让一个 web agent 去操作**已经构建出来的站点**，逐条核验历史指令是否还成立，再把核查结果拿去改写。实验结果是把 forgetting rate 从 8.0–28.2% 压到接近零，纯文字指令下的总成绩从 56.0% 提到 65.3%。

注意这里有两个被证伪的直觉。

第一，**把历史指令重放一遍是不够的**。论文明确对比了 Replay 基线：重放对多轮聊天有效，在它这里收益明显更小，因为「mere replay can fail to reveal subtle implementation errors or complex code conflicts」——单纯重述发现不了实现层的冲突。真正的核验必须落到运行中的制品上。这也解释了为什么只保留代码上下文不够：代码是意图的声明，运行结果才是事实。

第二，**遗忘不是长上下文衰减**。论文专门做了区分：长上下文衰减是模型相关的，Claude-4-Sonnet 会掉、GPT-4o 和 Gemini-2.5-Pro 相对稳；而遗忘**跨所有模型稳定出现**，包括那些对长上下文很稳的模型。它不是「记不住」，是「重写时没把旧的当成必须保留的约束」。

## 04 / 保留是有边界的，而且两个方向的代价不对称

把「保住用户已填内容」当成永远正确的规则，会撞上另一组数字。Maru 做了 N=12 的用户研究，让人在多轮对话里反复生成同一类界面：没有持久层的基线条件，界面接受率从前半程的 **71% 塌到后半程的 33%**；有 IA 持久层的条件，**74% 到 61%**，基本守住。同一个研究里，「平均提问长度」从 28.7 词降到 18.1 词——少了 10.6 词。用户不再需要每轮重新说一遍自己要什么，因为系统替他们记住了。

但论文的结论句是「persistence needs boundaries」。它同时报告了两类反例：一是**在子任务切换时**，持久化反而伤害对齐；二是**规则过量累积**。研究里规则最多的两位参与者 P5（194 条规则）通过率 33%、P11（198 条）50%，是全场最低；作者把 Maru 后半程 74%→61% 的那点下滑，部分归因于这种累积。

这两组数字摆在一起，指向的不是「保留越多越好」，而是**保留的对象要选对，而且要有寿命**。我把判据拆成两层：

**必须稳定的是身份，不是布局。** 用户说「就是周三晚上那节课」，指的是那个具体对象，不是它在表格里的行号。所以数据对象要有一个不随排序、不随重新生成改变的标识（React 的 `key`、A2UI 的 JSON Pointer 路径，都是同一件事的不同实现）；位置、顺序、分组、呈现形式都可以变，因为它们不承载「这是同一个东西」这个判断。

**两个方向的失败代价不对称。** 丢掉用户输入，用户看到自己的劳动消失，信任是一次性的，而且他会用复制粘贴和不再生成新界面来自己兜底——Maru 的访谈里就出现了这两种补偿行为：一部分人把上一轮的提问复制下来再追加条件，另一部分人干脆不再生成新界面，回到旧界面里继续操作，因为**单个组件内部的状态是自己留着的**。反过来，忽略用户的新要求是可见的、当场就会被指出的。所以默认应当偏向保留，但保留集要能过期、能合并，不能像 P5 那样只进不出。

一个可操作的判断：**这轮改动里，用户还没说的东西，比他已经说的更值得保护。**

## 收束

回到开头那三个数字。74.9% 到 37.3%、52.7% 的断点来自「改坏先前对的东西」、586 次派生状态陈旧——它们说的都是同一件事：生成式界面的可靠性问题，大半不在「这一版画得好不好」，而在「版本之间的接续」。

而接续之所以会断，是因为状态被放在了那份会被整个重写的产物里。React 的文档给了机制，A2UI 的协议给了分工，FronTalk 的实验证明核验必须打到运行中的制品上，Maru 的用户研究划出了「可以持久，但要能过期」的边界。四条合起来是一句话：

**不要让用户的工作活在那份会被重写的产物里。** 用户说「改周四吧」的时候，他希望系统改的是一个字段，而不是重造一个世界。

## 资料与边界

核对日期：2026-10-05。以下数字均取自各自论文或官方页面的原文，论文同时标注所用版本。

- [EvoGenUI-Bench: Evaluating LLMs as Multi-Turn Generative UI Assistants，arXiv:2608.29387](https://arxiv.org/abs/2608.29387)（v2，last revised 2026-09-07；EMNLP 2026 接收）。150 个五轮任务、750 轮；最强模型 Turn Pass 74.9%、五轮全过 37.3%；八模型平均 TP 42.7%、TP@5 11.8%；110 个 APR 断点中 58 个（52.7%）为对先前行为的回归；2750 次失败调用中派生状态传播 586 次。无人机 PID 案例（Kp 2.20 → 1.0/1.5/0.5，指标恒为 100.0% overshoot、10.00 s、5.000 m）取自该文 6.2 节。
- [FronTalk: Benchmarking Front-End Development as Conversational Code Generation with Multi-Modal Feedback，arXiv:2601.04203](https://arxiv.org/abs/2601.04203)（v3，last revised 2026-08-09；CoLM 2026）。100 段多轮对话；原文 forgetting rate 4.3%–44.6%，性能损失最高 46%；AceCoder 将 forgetting rate 从 8.0–28.2% 降至接近零，文字指令下 56.0% → 65.3%。「遗忘不同于长上下文衰减」的判断来自附录 C.1。
- [Maru: Information Architecture as a Shared Language for Generating Aligned and Persistent User Interfaces，arXiv:2608.25565](https://arxiv.org/abs/2608.25565)（v1，2026-08-26）。N=12 用户研究；基线接受率前半程 71% → 后半程 33%，Maru 74% → 61%；平均提问长度 28.7 → 18.1 词；P5（194 条规则）33%、P11（198 条）50%。
- [React 官方文档《Preserving and Resetting State》](https://react.dev/learn/preserving-and-resetting-state)（react.dev，核对日页面版本选择器显示 v19.3）。状态绑定渲染树位置、`key` 把身份从位置换成标识、以及状态随节点出现/移除而创建/销毁的三处原文，均逐字取自该页 Recap 与正文。
- [W3C WCAG 2.2 Understanding SC 3.2.2 On Input](https://www.w3.org/WAI/WCAG22/Understanding/on-input.html)（页面标注 Updated 28 June 2026）。规范原文对 changes of context 的定义含 focus，示例含「significantly re-arranging the content of a page」。
- [A2UI 协议规范（a2ui-project/a2ui，Last Updated 2026-06-08）](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md) 与 [Data Binding 概念文档](https://github.com/a2ui-project/a2ui/blob/main/docs/public/concepts/data-binding.md)。结构与状态分离、`updateComponents` 与 `updateDataModel` 的分工、`/reservation/guests` 由客户端写回、16ms 批量与 diff 三条性能做法，均出自这两份文档。

**边界。** 前四组是 2026 年的实验结果和被测模型清单，分数只代表当时那批模型，不代表今天的能力上限；EvoGenUI-Bench 与 FronTalk 评测的是模型生成的网页与前端代码，不是任何具体产品的线上表现；Maru 的 N=12 是实验室规模的用户研究，不能外推成普遍用户行为。文中「保留什么、按什么顺序做」的判据，是我把上述结果整理成的工程判断，没有独立复现实验，也没有引用任何非公开数据。第 01 节的失败案例转述自论文 6.2 节的表述，我没有访问其原始制品。

**未采用。** 检索中出现过几个二手页面（含 ar5iv 类镜像站点、第三方榜单与自媒体转述），均未采信：按版本纪律，任何数字一律以 `arxiv.org/abs` 与 `arxiv.org/html/<id>vN` 为准。另有一篇讨论「受约束生成式座舱界面」的 ACM 论文与一篇驾驶舱界面比较研究，与本文的「多轮状态保持」问题不同轴，故未引用。A2UI 官网 `a2ui.org` 在核对当日 DNS 解析失败，所有 A2UI 引文改取自其官方 GitHub 仓库中的规范与概念文档，内容与站点同源。
