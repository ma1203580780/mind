---
title: "把任务改成异步并不省 token：批处理那 50% 折扣，是另一笔账"
description: "异步把等待挪走，却不动计算量。OpenAI 的 Batch API 便宜 50%，代价是 24 小时 SLA、没有流式、没有多轮工具调用；真正让账单变大的是缓存、重试与冗余验证。"
date: '2026-10-05'
category: AI 工程
tags:
- 成本优化
- AI工程
- Agent
authorship: assisted
draft: false
featured: false
---

OpenAI 对 Batch API 的定价说明只有一句话：**"Each model will be offered at 50% cost discount vs. the synchronous APIs."** 同一批请求、同一个模型，只是改成异步提交，账单直接砍半。这看起来是对"异步省 token"最有力的支持。

但它省下的不是 token。同一份官方 FAQ 里写着，这些请求"will process these requests within 24 hours"，而流式"is not supported on the Batch API"——那 50% 不是白拿的，它是你接受 24 小时交付窗口换来的。折扣动的是每一万个 token 的单价，不是这次任务要生产多少个 token。

把这两件事分开之后，异步的真实收益和真实风险才能看清：它不会让模型少算一次，但它会给你一个更便宜的价目表，同时把"这一笔到底算不算数"的账单挪到一个你看不见的地方。

## 01 / 异步省的不是计算量，是单位价格

先接受一个事实：异步本身对服务端的计算没有任何删减。用户不再盯着进度条，调度器可以把请求排在资源空闲时执行，但同一段 prompt 仍然要被 prefill 一遍，同一批输出 token 仍然要被 decode 出来。GPU 上的工作量由 token 数决定，而 token 数不关心谁在等。

那 50% 是怎么来的？它是把"我愿意等"这件事折算成的价格。既然折扣买的是交付窗口而不是计算量，它就必然带着窗口的条件。窗口是什么，官方文档说得很直白：24 小时内交付，期间的进度只能靠 `validating`、`in_progress`、`finalizing` 这类状态查询，中间结果拿不到；批处理请求返回在输出文件里——"Batch requests return results through output files rather than streamed responses"，流式在这个端点上不存在。而这 24 小时只能由平台一侧解释："Our current specified time window is 24 hours. We currently cannot change this time period." 你不能买一个 2 小时的批处理。

更关键的是，24 小时窗口和 agent 的形态互斥。Bedrock 的批处理文档把这层限制说穿了：批处理不支持工具调用和结构化输出，因为"Each record in the input JSONL file is processed independently without multi-turn interaction"——每条记录独立处理、没有多轮交互。而多轮恰恰是 agent 的基本形状：调一次工具、看结果、再调一次。批处理只能承接"一次请求、一次回答"的任务；重试、追问、用工具验证这类必须来回往返的工作，天然被挡在折扣门外。

所以异步的第一层账不是"省了多少"，而是"哪部分工作有资格打折"。如果你的链路必须交互，异步给你的只有等待的重新分配，一分钱也不会少。

## 02 / 账单跟着轨迹走，不跟着调度走

那"计算量不变"这句话，究竟哪个量才是被计费的那个？三份 2026 年的实测研究给出了一致的答案：计费跟着 agent 的**轨迹**走，而轨迹由 prompt、effort、harness 和执行环境共同决定，跟请求是同步还是异步没有任何关系。

第一份研究（arXiv:2607.12161，v5，2026 年 8 月 12 日修订）专门去证伪"少 token 就少花钱"这个直觉。它在受控编码任务上把三种 token 压缩方案和未修改的基线对比，测的是**provider-billed cost**，不是压缩率。结果最大的那个压缩方案把交付的工具输出 token 减少了 38.4%，账单反而上升 6.8%；token 减少量与费用减少的相关性只有 Pearson r = 0.15。论文对成本的拆解解释了原因："Cost decomposition shows that prompt-cache creation and reads dominate the measured input-side cost"——成本的大头在缓存的写入与读取上，真正能被工具输出压缩影响到的那部分很小。作者还注意到第二种反噬：压缩会改变 agent 的轨迹，"through additional retrieval, diagnosis, testing, and turns, offsetting local token savings"，多出来的检索、诊断、测试和轮次把省下的部分吃了回去。

第二份研究（arXiv:2608.01347，v6，2026 年 9 月 10 日修订）把这种轨迹依赖量化得更狠。它加入标注之后发现，同一批任务里，"冗余验证"这条轨迹特征的严重程度和成本几乎是指数关系：最干净的一档中位成本记为 1×，最高一档（level 3+，n=213）是它的 18.25×，同时多跑 2.5 倍的工具调用、多花 3 倍墙钟时间，"with no success gradient"——成功率并没有跟着涨。产生这种轨迹的往往是措辞层面的东西：一个"要非常确定"的说法就会加上约 1.75 次解题后调用和额外测试执行，最极端的一次观测是把已经全绿的测试套件重跑了六遍。

第三份研究（arXiv:2608.13571，v1，2026 年 7 月 2 日）则把"重试"直接命名成一种通胀。它把真实工作流成本与单次调用成本的比值称为 token inflation：模型第一次没答对，系统就重试，每次重试都重新消耗 token，于是单价隐含的成本和一次完整流程的实际成本之间裂开一个缺口，在多跳问答上对 7B 模型测到的通胀最高达 4.25×。

这三组数字放在一起，机制就清楚了：**计费单位是"这次轨迹消耗了多少输入与输出 token"，而不是"这次请求占了多少墙钟时间"。** 异步操作移动的是后者。所以它可以改变你什么时候付钱、付多少单价，但不会改变等号左边那个被乘的数量；而那个数量，是由 prompt 请求了多少工作、harness 允许多少轮往返、执行环境给了多少可验证信号决定的。

## 03 / 异步真正加的东西：延迟与计费之间的缝

反过来看，异步也不是零成本。它把"谁在等"这件事解耦了：客户端可以走开，服务端的作业还在跑，中间没有一个双方都同意的时刻说"到此为止"。而现在的计费规则恰好都长在这条缝上。

OpenAI 的 FAQ 里有两个容易被忽略的条款。批处理在 24 小时内没做完就叫过期：剩余工作被取消、已完成的部分返回，然后——"Developers will be charged for any completed work." 手动取消同一条：已经完成的部分照样收费。Azure 的同一套 Batch 文档把这个漏洞说得更明白："The service aims to process batch requests within 24 hours, but it doesn't expire jobs that take longer. You can cancel the job anytime." 也就是说，作业超过 24 小时并不会自动停，它会继续跑，直到你去取消；而取消本身也不是瞬时的，"The batch will be in status `cancelling` for up to 10 minutes"。上游在这 10 分钟里继续产生的工作，仍然算已完成的量。

把这段和第二节的数字接上，风险就变得具体了。如果你在客户端设了超时、超时后重试，而服务端那一份从未被真正停止，那么重试不是"再试一次"，而是"再买一份"。2608.13571 测出的 4.25× 通胀正是这种形态——它衡量的是重试带来的额外消耗，而重试的动机往往就是客户端等不下去。缓存也是同一类陷阱：2607.12161 的实测显示缓存写入与读取占了输入侧成本的大头，这意味着如果你为了让各阶段能独立重跑而频繁改写前缀，你买到的是"可恢复"，付出的是缓存失效重算和丢掉批次折扣的组合。

同样的逻辑也解释了为什么"批处理跑满利用率"不等于"便宜"：Bedrock 的 Reserved 层按预留容量收费——"Customers pay a fixed price per 1K tokens-per-minute and are billed monthly"，并且"Billing continues until you delete the Reserved Tier reservation"。在这个模型下，利用率低就是你自己的事，异步调度既不增加也不减少账单一分钱。

## 04 / 换调度不如换轨迹：能砍掉的是重复，不是等待

那么异步到底有没有用？有，而且顺序要摆正：它是**在已经省下计算量之后**用来降单价的第二步，不是省计算量的手段。

价格阶梯确实存在，而且方向清楚。想更快，Bedrock 的 Priority 层"delivers the fastest response times for a price premium over standard on-demand pricing"；愿意等，Flex 层"offers cost-effective processing for a pricing discount"，官方点名的适用场景里就写着 agentic workflows；OpenAI 的批处理给 50% 折扣，Azure 的全局批处理同样是"a 24-hour target turnaround at 50% less cost than global standard"。这些都是可核实的价格事实——但它们全部作用在单价上。你的任务在拿到折扣之前就已经消耗了固定的 token 数量，折扣只决定这些 token 是 1 块钱还是 5 毛钱。

能真正改变 token 数量的手段，都长在轨迹上而不是调度上。2608.01347 的数据给了两个可测的抓手：带一个未被使用的候选分支的运行，成本中位数是干净运行的 1.9 倍（n=1,934 干净 vs 354 单分支），而工具调用中位数只从 7 变成 8——多出来的钱主要花在被丢弃的推理上；反过来，把"范围、最小充分改动、停止条件"写清楚的模板"had no measurable cost penalty and reduced reasoning for one model"。一个删掉分支、一个收紧停止条件，都不需要任何异步基础设施，但它们动的是被乘数。

所以判断一次优化值不值得推广，问法不该是"它异步了吗"，也不该是"它省了多少 token"，而应该是：**这次改动是在改单价，还是在改轨迹？** 改单价的收益稳定、可预测、与任务无关，代价是交付条件的让步；改轨迹的收益依任务而定，必须用同一批任务上的成本和成功率一起验证。两者都会让你在账单上看到变化，但只有后者让模型少算。

开头那 50% 折扣因此不是反例，而是分界线：拿它之前，异步一分钱也没省；拿它之后，省下的是单价。而如果你拿它的代价是把链路改成一次性请求——像 Bedrock 的批处理那样失去工具调用和多轮交互——你省下的钱可能会被一个更笨的链路吃掉。异步能改的账从来只有两栏：什么时候付，按什么价付。token 那一栏，得靠别的办法去动。

## 资料与边界

核对日期：2026-10-05。以下每个数字都取自当天实际抓取并在页面原文中确认过的来源；无法确认原句的说法没有写进正文。

- [Batch API FAQ，OpenAI Help Center](https://help.openai.com/en/articles/9197833-batch-api-faq)（页面标注 Updated: 2 months ago）："Each model will be offered at **50% cost discount** vs. the synchronous APIs."；"We will process these requests within 24 hours."；"No, streaming is not supported on the Batch API. Batch requests return results through output files rather than streamed responses."；"Developers will be charged for any completed work."（过期与手动取消两条各出现一次）；"Our current specified time window is 24 hours. We currently cannot change this time period."。用于开头的 50%、24 小时、无流式，以及第三节的过期/取消计费。
- [Getting started with Azure OpenAI batch deployments，Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/batch)：支持页面标注的 "a 24-hour target turnaround at [50% less cost than global standard]"；以及 "The service aims to process batch requests within 24 hours, but it doesn't expire jobs that take longer. You can cancel the job anytime."；"The batch will be in status `cancelling` for up to 10 minutes"。用于第一节的 50%、第三节的"不自动过期"与 10 分钟取消窗口。该页面会随产品更新变动，价格请以 Azure 定价页为准。
- [Process multiple prompts with batch inference，Amazon Bedrock User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/batch-inference.html)："Batch inference does not support tool calling (function calling) or structured output (`response_format`). Each record in the input JSONL file is processed independently without multi-turn interaction"。用于第一节"批处理接不了 agent 的多轮形态"。
- [Service tiers for optimizing performance and cost，Amazon Bedrock User Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/service-tiers-inference.html)：Priority 层 "delivers the fastest response times for a price premium over standard on-demand pricing"；Flex 层 "For workloads that can handle longer processing times, the Flex tier offers cost-effective processing for a pricing discount"，适用场景含 "agentic workflows"；Reserved 层 "Customers pay a fixed price per 1K tokens-per-minute and are billed monthly" 与 "Billing continues until you delete the Reserved Tier reservation"。用于第四节的加价/折扣方向与第三节的容量计费。该页只说"有折扣/有溢价"，未给百分比，所以正文没有写任何 Bedrock 的折扣数字。
- [Token Reduction Is Not Cost Reduction，arXiv:2607.12161（v5，2026-08-12 修订）](https://arxiv.org/abs/2607.12161)：38.4% 的 token 压缩换来 6.8% 的账单上升；"token reduction was weakly correlated with cost reduction (Pearson r = 0.15)"；"Cost decomposition shows that prompt-cache creation and reads dominate the measured input-side cost"；"compression can alter agent trajectories through additional retrieval, diagnosis, testing, and turns, offsetting local token savings"。四个数字全部取自 abs 页摘要原文。我用的是 v5 摘要口径；该论文的 html 全文页在核对时未能抓取成功，因此正文只引用摘要中已确认的表述。
- [Prompt-Induced Waste in Coding Agents，arXiv:2608.01347（v6，2026-09-10 修订）](https://arxiv.org/abs/2608.01347)：冗余验证 level 3+（n=213）中位成本 18.25×、调用数 15 对 6、"execute 2.5× the tool calls, and take 3× the wall-clock, with no success gradient"；未使用分支 "runs with one unused branch have ≈1.9× the median cost of clean runs (n=1,934 clean vs. 354 one-branch runs)"，工具调用中位 7→8；测试段 "+1.75 post-success calls (sign-consistent on 6/6 models), extra test executions, +4s latency; the most extreme observed loop re-ran an already-green suite six times"；"A bounded-efficiency template specifying scope, a smallest-sufficient-change criterion, and a stopping rule had no measurable cost penalty and reduced reasoning for one model"。取自 html 全文 v6。这是编码 agent、单一 provider 计费口径下的实测，任务集为 24 个确定性编码任务，不代表所有 agent 形态。
- [Not All Tokens Are Equal: Inflation-Aware Routing for Agentic LLM Systems，arXiv:2608.13571（v1，2026-07-02）](https://arxiv.org/abs/2608.13571)：token inflation 的定义 "the ratio of true workflow cost to single-call cost"，以及 "finding inflation as high as $4.25\times$ for a 7B model on multi-hop question answering"。用于第二、三节的重试通胀。这是 v1，作者未发布修订版；数字仅覆盖其测试的任务类型。

弃用与边界：

- OpenAI 的 `platform.openai.com/docs/pricing`、`developers.openai.com/api/docs/guides/latency-optimization`、`prompt-caching` 与 Google Gemini 的定价/批处理文档，在核对时返回 403 或连接失败，**没有取到原句**，因此本文没有引用其中的任何百分比、缓存折扣或 flex 倍率——包括草稿里原本引用的那篇延迟优化文档。
- Anthropic 的批处理文档同样无法直接抓取（跨域重定向），虽然其批处理折扣在多方转述中是 50%，但没有官方原句，一律未写入。
- arXiv:2608.22191（Risa）里有一句关于前缀缓存减少重复 prefill 的工程描述，但它是方法附带的说明性文字、不是实测结论，本文只在机制推理处参照，未作为数字来源引用。
- 正文中关于"计费单位是 token 而非墙钟时间"的表述，是我对以上官方计费条款与三份实测的工程归纳，不是任何一份来源的原话；我没有跑自己的对照实验，也没有使用任何非公开的账单数据。
- 以上价格与折扣均为 2026-10-05 的页面状态，云厂商与模型厂商的价目表会变动，引用前请以当日官方页面为准。
