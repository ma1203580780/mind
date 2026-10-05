---
title: "220 个工具全都接上了：63.3% 的失败，出在协议管不到的地方"
description: "MCP-Atlas 把 36 个真实 MCP 服务器、220 个工具接到同一套协议上，1,000 个多步任务里最好的模型做到 82.2%。但被诊断出的失败里，63.3% 属于认知问题而不是工具调用问题，而且高水平模型常常是「工具调成功之后才失败」。协议统一的是怎么通信，它不管任务是什么，也不管怎么算做完。"
date: '2026-10-05'
category: AI 工程
tags:
- AI工程
- Agent
- 评测
authorship: assisted
draft: false
featured: false
---

36 个真实 MCP 服务器、220 个工具，全部按同一套协议声明、同一套 schema 调用，理论上不存在「这个工具连不上」的问题。在 1,000 个多步任务上，成绩最好的模型（Muse Spark）通过率 [82.2%](https://arxiv.org/abs/2602.00933)。

也就是说，还有 17.8% 没做成。原因不是连不上。同一篇论文的诊断结果是：

> Automated diagnostics show that 63.3% of diagnosed failures are cognitive rather than tool-call related.

被诊断出的失败里，**63.3% 是认知问题，而不是工具调用问题**。论文紧接着补了一句更刺眼的：

> Notably, several high-performing models fail after successful tool execution due to premature stopping or incorrect synthesis.

高水平模型在**工具执行成功之后**才失败——原地停下，或者把已经拿到的证据拼错。

## 一、协议把「怎么连」标准化了，任务本身没有被标准化

MCP 官方规范对自己的边界写得很直白：

> MCP focuses solely on the protocol for context exchange—it does not dictate how AI applications use LLMs or manage the provided context.

翻译过来是：MCP 只负责上下文交换，它不规定 AI 应用怎么用模型、怎么管理上下文。规范里 MCP 给自己列的能力范围也很窄——分享上下文、暴露工具、拼装集成与工作流；基础协议部分是 JSON-RPC 消息格式、连接状态、能力协商；工具之外只多出进度追踪、取消、错误上报这几项。

也就是说，「协议里有什么」是一份很短的清单，而且每一项都只描述消息和能力的形状。**它定义了消息长什么样，没有定义一次任务长什么样。**

这一点在最新版规范里看得更清楚：长任务的异步执行、中途输入、可持久恢复的句柄，属于 Tasks 扩展，而扩展是 opt-in 的。长任务能不能撑住，在协议里是可选功能，取决于客户端和服务端是否都实现了它——不是接上就有。规范自己的措辞也承认了这条分工线：

> All implementations **MUST** support the base protocol and lifecycle management components. Other components **MAY** be implemented based on the specific needs of the application.

强制实现的只有基础协议与生命周期管理，其余组件按应用需要自行选择。线划在这里，就意味着工具怎么被编排、上下文怎么被管理，全部落在「MAY」的另一侧。

MCP-Atlas 的失败分布是这句话的实测后果。它给每个失败任务配一个主导失败模式，来自一套 11 类诊断分类法，分成两族：

| 失败族 | 包含哪些 | 占总失败比 |
| --- | --- | --- |
| 工具调用问题 | 参数格式错误、工具选错、根本没调工具、错误恢复失败 | 36.7% |
| 认知问题 | 任务误解、结论拼错、回答解析失败、提前终止、编造事实、逻辑错误、违反约束 | 63.3% |

如果瓶颈在连接，失败应该堆在传输、鉴权、schema 解析上，而且应该随服务器变多而放大。实测的分布反过来。而「根本没调工具」这一项本身就很说明问题：o3 Pro 是数学和编程基准上的强推理模型，在这套任务里落到接近末尾的 44.5%，论文的归因是**它 40% 的失败轨迹里一次工具调用都没有发**。

不是调不通，是没调。

## 二、任务一变长，成功率的塌法是陡的

MCP-Atlas 的 82.2% 是通过率的顶；另一份基准把「链长」本身变成了自变量，于是能看到这条顶在哪里开始崩。

LiveMCP-101（[arXiv:2508.15760](https://arxiv.org/abs/2508.15760)，101 个真实查询、41 个 MCP 服务器、260 个工具）的执行计划平均 5.4 次工具调用，最长 15 次。按难度分桶的结果是这样的：

| 难度 | 计划链长 | GPT-5 任务成功率 |
| --- | --- | --- |
| Easy（30 个） | 短链 | 86.67% |
| Medium（30 个） | 中等 | 56.67% |
| Hard（41 个） | 多约束、长编排 | 39.02% |

总计 58.42%。同一批工具、同一个协议、同一个模型，**从短链到长链掉了 47.65 个百分点**，而「能不能调通」这个变量全程没变过。

机制是乘法，不是加法。假如单步成功率是 90%，五步是 59%，十五步只剩 21%。这组数字是我的推算，不是论文结论，只用来说明形状。真实数据里的形状要平缓一些（长链 39% 高于 21%），因为错误并不独立：模型会看到上一步的返回再决定下一步，某些错误在下一步里被自然修掉了。但指数衰减这个方向被数据确认了：链越长，成功率越低。

**协议带来的连接收益是一次性的，而任务的失败风险是逐步累积的。** 所以「接上 MCP 以后任务仍不稳定」不是接入质量问题，而是链长问题；短任务上你几乎不会遇到它，长任务上它每一次都会出现。

同样的形状在工具协议之外也存在，说明它不是 MCP 特有的毛病。WebArena（[arXiv:2307.13854](https://arxiv.org/abs/2307.13854)）搭了四个真实站点域的网页环境，任务多样、长程、可复现，最好的 GPT-4 agent 端到端成功率 **14.41%**，人类是 **78.24%**。浏览器什么都能点，人和模型用的是同一套接口，差距却是一个量级——接口对齐从来不等于任务对齐。

## 三、真正的缺口是「谁记住上一步，谁判断做完了」

上一节的 47.65 个百分点落在哪里，要看具体的错法。LiveMCP-101 把失败归成三类七种，其中两种最典型：

**一是忽略需求、自作主张。** 油箱里还有 5 加仑、上限 50 加仑，用户说「够开到 Rivermist 就行，油要花钱」。模型直接 `fillFuelTank(50)`——它跳过了「先看还剩多少」这一步。选工具、填参数都没错，缺的是「这一步能不能省」的判断。

**二是明明已经登录，却先走了鉴权。** 场景里 Twitter 已认证，用户只要求发一条带标签和 @ 的推文。模型先调 `authenticate()`，拿不到凭据就回报失败——本该直接 `post_tweet()`。

这两个例子有同一个形状：**每一步单独看都执行成功了，合起来却没完成任务。** 平台层收到的信号是「工具调用成功」；任务层要的答案是「这算不算做完」。工具返回 success 只证明消息送达，不证明任务状态对——它没说「油箱现在是 44 加仑」，也没说「你已经是登录状态了」。

这正是 63.3% 的来源。MCP-Atlas 的通过门槛是**覆盖率 0.75**：一道题的答案要覆盖七成半以上的事实声明才算过，而覆盖率是按条款逐条打分的。所以那些失败里有相当一部分，不是「什么都没做出来」，而是**把已经执行成功的步骤拼不成一个达标答案**——论文把这一类叫 incorrect synthesis。协议能回报每一步的状态，它没法表达这种「做了大半但不算完成」。

所以缺口不在连接层，而在协议没管的另外三件事：**当前在哪一步（状态）**、**上一步留下了什么（状态传递）**、**什么条件算完成（验收）**。状态被放在协议之外，就必须有人把它放在别的地方；否则模型每走一步都得从上下文里重新猜一遍，而它猜错的方式，就是上面那两种错法。

这里要把两个常被混用的东西分开：**上下文窗口是模型每一轮看到的东西，任务状态是这件事客观上走到哪一步。** 两者可以完全对不上——上下文里堆着十几轮工具返回，「已认证」这个事实却要模型自己从里面推出来；消息一条没丢，状态仍然可能是错的。协议管的是前者怎么搬，后者从来不在它的字段里。

## 四、判据：这一步的完成，能不能被声明

把上面三节压成一个问题：**这一步的完成，能不能被一句话声明出来？**

能声明，协议就够了，重试和分支都在协议的错误上报和取消里。不能声明，就必须在协议之外补三样东西：这一步的输入是什么、输出写到哪、什么条件算过。

| 任务形状 | 协议够用吗 | 要补什么 |
| --- | --- | --- |
| 单步、结果就是返回值 | 够 | 不需要 |
| 多步但有固定顺序 | 部分 | 步骤编号；每步的输入输出留痕 |
| 有分支、取决于上一步结果 | 不够 | 显式的状态记录：现在在哪、已做什么 |
| 跨服务器需要同一实体 | 不够 | 两侧一致的 ID 或键，别让模型自己对齐 |
| 长链（十几步） | 不够 | 进度标记 + 明确的停止条件 |

补这三样东西不等于要引入一个框架。Anthropic 在《Building effective agents》（[2024-12-19](https://www.anthropic.com/engineering/building-effective-agents)）里提醒过这件事的另一面：

> If you do use a framework, ensure you understand the underlying code.

框架会顺手把「状态放在哪、什么算完成」也一起抽象掉，这恰好是协议之外那一层。抽象盖住之后，长链上的失败会变成静默的：没有报错、没有重试提示，只有一份格式正常的完成报告。

这也解释了 τ-bench 的那个数字为什么会那么刺眼。它测的是重复运行的一致性（pass^k，同一个任务跑 k 次全部成功），而**一致性比单次成功率低得多**。

> even state-of-the-art function calling agents (like gpt-4o) succeed on <50% of the tasks, and are quite inconsistent (pass^8 <25% in retail).

单次能过、八次全过低于 25%——差的就是「每一步是否被声明清楚」。链越长，这个差额越大。

回到开头那个 82.2%。它反映的是这类基准能诚实给出的天花板：协议把连接这一层做到接近零成本，然后把剩下的问题完整地留给了任务设计。省下来的只是最贵那部分工作的入场券。

一个可以立刻用的排序：**先写下验收标准，再画步骤，最后才选工具。** 倒过来的顺序会让你在长链上反复失败，而每次都以为是模型不够聪明。

## 资料与边界

核对日期：2026-10-05。以下数字均取自各自论文、官方页面或官方博客的原文；引文按英文原文照抄。**同一篇 arXiv 论文存在多个版本，本文统一采用各页所标注的最新版本；引用 MCP-Atlas 时以 arXiv 摘要页为准确认版本。**

- [MCP-Atlas: A Large-Scale Benchmark for Tool-Use Competency with Real MCP Servers，arXiv:2602.00933v3](https://arxiv.org/abs/2602.00933)（Scale AI / NUS，v3 于 2026-05-19；核对页面为 [arXiv 摘要页](https://arxiv.org/abs/2602.00933)与 [HTML v3](https://arxiv.org/html/2602.00933v3)）：36 个真实 MCP 服务器、220 个工具、1,000 个任务；每题工具集 6–37 个（均值 15.2），其中只有 2–8 个是必需的（均值 4.1），干扰项均值 11.1 个；98.6% 的任务需要两个以上服务器；每题平均 4.7 条事实声明，参考轨迹平均 9.8 步；评测 20 个模型、6 家提供方；成绩最好的是 Muse Spark 82.2%，其后 Claude Opus 4.7 79.1%、Gemini 3.1 Pro Preview 78.2%，长尾最低 Claude Haiku 4.5 为 40.2%；o3 Pro 为 44.5%，其 40.1% 的失败轨迹没有工具调用；失败被归入 11 类诊断分类法，分工具调用问题与认知问题两族，比例为 36.7% 比 63.3%。**版本差异提示**：该论文 v1/v2 的摘要与表格给出的是另一组数字（4 类失败归因；当时最好的模型 Claude Opus 4.5 为 62.3%）。正文已全部改用 v3；如果你此前看到 62.3%，那是旧版。
- [LiveMCP-101: Stress Testing and Diagnosing MCP-enabled Agents on Challenging Queries，arXiv:2508.15760](https://arxiv.org/abs/2508.15760)（v2，2026 年 5 月）：101 个真实查询、41 个 MCP 服务器、260 个工具；执行计划平均 5.4 次工具调用、最长 15 次；GPT-5 总体 TSR 58.42%，Easy 86.67%，Medium 56.67%，Hard 39.02%；失败归为三类七种；油箱与鉴权两个失败案例出自该文。摘要原文另注 “even frontier LLMs achieve a success rate below 60%”。
- [τ-bench，arXiv:2406.12045](https://arxiv.org/abs/2406.12045)：摘要原文 “even state-of-the-art function calling agents (like gpt-4o) succeed on <50% of the tasks, and are quite inconsistent (pass^8 <25% in retail)”。2024 年 6 月的结果，不代表当前水平；除 retail 之外的 pass^k 数字我未取到原句，因此文中只用 retail 一个域。
- [MCP 官方架构文档](https://modelcontextprotocol.io/docs/learn/architecture)与 [MCP 规范 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28)：规范原文 “MCP focuses solely on the protocol for context exchange—it does not dictate how AI applications use LLMs or manage the provided context.”（[2025-06-18 版](https://modelcontextprotocol.io/specification/2025-06-18)含同句）；“All implementations **MUST** support the base protocol and lifecycle management components. Other components **MAY** be implemented based on the specific needs of the application.”（[基础协议](https://modelcontextprotocol.io/specification/2025-06-18/basic)）；能力清单与 Tasks 扩展 opt-in 的说明取自规范正文与 [Extensions](https://modelcontextprotocol.io/extensions/overview)。
- [WebArena，arXiv:2307.13854](https://arxiv.org/abs/2307.13854)：摘要原文 “our best GPT-4-based agent only achieves an end-to-end task success rate of 14.41%, significantly lower than the human performance of 78.24%”。2024 年 4 月 v4 的结果，用来说明「接口齐备」与「任务完成」之间的量级差，不代表当前水平。
- [Anthropic《Building effective agents》](https://www.anthropic.com/engineering/building-effective-agents)（2024-12-19）：原文 “If you do use a framework, ensure you understand the underlying code.” 该文发表于 2024 年 12 月，文中提到的工具生态此后有变化。

弃用与说明：

- **MCP-Atlas v3 的逐类失败百分比**（四个工具调用子类各自占比）：HTML v3 我在 `Table 3` 处被截断，无法逐字核对全部行，因此正文只用摘要与引言里可逐字确认的两族比例（36.7% / 63.3%）和「40.1% 的 o3 Pro 失败轨迹没有工具调用」这一句，不写更细的子类占比。
- **MCP-Atlas 的平均覆盖率 78.5%**：那是 v1/v2 的数字，v3 没有给同口径值，已从正文删除。
- **LiveMCP-101 的失败模式百分比**：正文只引用该文的失败分类与两个完整案例，没有引用七种模式的占比——抓取到的页面版本里没有那张表的逐字数字，宁可不写。
- **第三方榜单站与自媒体转述的 MCP 采用率、工具数量增长数据**：全部弃用，未能追到一手页面。
- **BFCL V3/V4 博客**：只用于确认「多步/多轮」这一维度确实被单独评测，没有引用其分数（该站排行榜按周更新，数字不稳定，不适合写进文章）。
- 「单步 90%、五步 59%、十五步只剩 21%」是我为解释链长效应做的乘法推算，不是任何论文的数据，文中已明确标注为推算。其余出现在正文里的数字，均对应上面来源的原文。
- 全篇没有引用任何非公开数据，也没有引用我自己的运行结果。
