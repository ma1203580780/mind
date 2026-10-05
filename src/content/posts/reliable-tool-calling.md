---
title: "格式全过，值全错：工具调用的可靠性漏在哪一层"
description: "约束解码能把 schema 合法率从 78.6% 拉到 100%，可真实的参数值错误仍占全部失败的一半以上。把错误拆成四类并看清每类由什么决定，才知道重试、校验和工具定义各自该修哪一段。"
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

约束解码能把结构化输出的 schema 合法率从 78.6%–92.9% 直接顶到 100%，这是 2026 年 9 月一篇论文在 5 个模型、14 类任务上测出来的。但同一批实验里，指导多步函数调用的语义错误一个都没被解掉。另一组数字更直接：在真实的函数调用失败里，**参数值错误占 57.2%**，而真正格式层面的参数结构错误只有 5.2%。

这两组数字放在一起说明一件事：格式和值由两套不同的机制决定，一套能在解码阶段锁死，另一套锁不住。把可靠性押在"JSON 合法"上，等于只修了最小的一块。

## 01 / 真实分布 / 四类错误，大小差一个量级

先看错误分布本身，它比任何清单都更能决定先修什么。

那篇约束解码论文的设定是：0.6B–4B 参数的小模型，14 类结构化输出任务（JSON、函数调用、数据抽取），三种解码条件（原生、Outlines、XGrammar）。它把评估拆成两根轴——结构正确性（schema 合法）和语义正确性（内容对不对）。结果分成两半：**conformance 这一侧被彻底解决，semantic 这一侧原样留下**。

另一组分布来自 Dialpad 团队 2026 年 5 月的论文，它在 Confetti 数据集上做了一件很干净的事：每个语音样本都配一份完全相同的文本样本，只统计"文本模式答对、语音模式答错"的配对失败，然后把这些失败归入四个互斥类别。三款模型的答案都指向同一件事。

| 错误类型 | 含义 | 三款模型占比 | 谁能修 |
| --- | --- | --- | --- |
| 参数值错误 | 工具和字段都对，值填错 | 39.5%–57.2% | 流程与上下文 |
| 决策错误 | 该不该调用的高层判断错 | 25.8%–37.4% | 提示与任务定义 |
| 工具选择错误 | 发起了调用，但选错 API | 5.5%–15.5% | 工具定义 |
| 参数结构错误 | 漏必填项、加无效参数 | 2.8%–14.6% | 约束解码 |

Gemini-3.1-Flash-Live 的参数值错误占 57.2%，GPT-Realtime-1.5 占 54.3%。真正属于结构层面的那一栏，两款分别是 5.2% 和 2.8%。工具选择错误在 5.5%–15.5% 之间，也远小于参数值错误。

**修好格式不能代替修好参数：这一栏相差的 26 个百分点，不在解码器的作用范围里。** 这就是分布给出的第一个判断。

那篇约束解码论文有一句话把这个不对称说到了底：type coercion 类失败能被约束解码完整救回，而 instruction-semantic 类失败"remain CD-resistant"。两类失败长在同一段输出里，一类归解码器管，另一类不归。所以"参数总出错"这个说法本身没法落地——它把两种修法完全不同的东西捆成了一个词。那种“总准确率卡在七八成、再调提示词也没用”的困境，有一部分就是这么来的：参数值错误和决策错误被算进了同一个总分，而它们要走的路完全不同。

## 02 / 机制 / 为什么参数错误躲得过校验

结构化输出天生只能保证形状。它能强制类型、枚举、必填项和嵌套结构，但强制不了"这个链接是活的"、"这个清单 id 真的存在"、"这个日期在业务允许范围内"。这不是实现问题，是表达能力边界。

Azure OpenAI 的 structured outputs 文档把这条边界写得很具体。它先区分了两代能力：JSON mode "guaranteed valid JSON but couldn't ensure strict adherence to the supplied schema"；structured outputs 才是真正按你给的 JSON Schema 走。

但它支持的是 JSON Schema 的一个子集，而缺的正好是校验语义的那部分。官方的"Unsupported type-specific keywords"表里，字符串的 `minLength`、`maxLength`、`pattern`、`format` 全部不支持；数字的 `minimum`、`maximum`、`multipleOf` 全部不支持；数组的 `minItems`、`maxItems`、`uniqueItems` 全部不支持。

把这些串起来看就清楚了：链接格式要靠 `format`，金额上限要靠 `maximum`，条目数量要靠 `maxItems`——一个都用不了。约束解码能把输出钉在 schema 上，但 schema 本身表达不出业务约束。

还有一条更隐蔽的设计。同一份文档要求 "All fields must be required"，想模拟可选参数只能用 `null` 联合类型。也就是说，schema 层面没有"我不知道"这个状态，只有"必须给一个值"。填不出正确答案时，模型唯一被允许的动作是填一个看起来合理的值。

这一条直接解释了为什么结构错误少、值错误多。不是模型偏好瞎填，是接口不允许它留空——留空会直接违反 schema。参数值错误的成因因此有相当一部分不在模型推理里，而在 schema 的必填约束里。

**约束解码改变的其实是错误的形状，不是错误的总量。** 它把"JSON 解析不了"换成"JSON 完全合规范、语义完全错"。后者的排查成本更高，因为它不再有任何自动告警：没有任何一层会报错，schema 校验器会给你一个绿勾。这也是为什么 schema 合法率从 78.6% 涨到 100% 之后，交付质量的涨幅远小于 21.4 个百分点——那 21.4 个百分点里，有一批本来就只是解析失败，重试一次就能过；剩下那批被原样搬到了语义层。

想验证这一点不需要跑实验，看 schema 自己就够了。Azure OpenAI 那份文档里的示例请求是"look up all my orders in may of last year that were fulfilled but not delivered on time"，配一个 `table_name`、`columns`、`conditions`、`order_by` 四个字段全部必填的 schema，枚举里能用的日期列只有 `ordered_at`、`shipped_at`、`delivered_at`、`expected_delivery_date`、`canceled_at` 这几个。它能约束的是：这四个字段必须存在。它约束不了的是：`columns` 里到底该放 `expected_delivery_date` 还是 `delivered_at`，"未按时送达"该落在哪个 operator 上。模型必须自己把这句话翻译成条件数组，翻译错了 schema 依然给它满分。

同一个团队的 When2Call 结果从另一侧印证了机制的可分性：核心挑战不是生成参数，而是判断该不该调用。Qwen3-Omni 在需要调用的样本上准确率 92.7%，在不需要调用的样本上只有 43.9%；GPT-Realtime-1.5 是 85.2% 对 73.1%；Gemini-3.1-Flash-Live 是 74.1% 对 58.8%。**工具执行环节可以做到九成准，而"该不该动手"这个环节掉到四成多。** 这两件事显然不由同一个机制决定。

## 03 / 恢复 / 错误分类决定了重试有没有意义

再看失败之后怎么办。这里有一个被普遍浪费的信号：错误码本身携带了"能不能重试"的信息，而多数调用代码只把它当成"失败了"。

RFC 9110 对两类错误的定义是分开的。4xx 类是 "the client seems to have erred"——请求方出了错；5xx 类是 "the server is aware that it has erred or is incapable of performing the requested method"——服务端自己知道它错了。对参数错误的接口来说，一个 400 或 422 意味着这次请求的内容有毛病。原样重发，就是让同一个校验规则再拒一次，重试预算换来零新信息。

真正危险的第三种情形不在这个分类里：超时、连接中断、响应永远没回来。请求可能已经执行了，也可能没执行。RFC 9110 在幂等性一节里给的原则很硬：**"A client SHOULD NOT automatically retry a request with a non-idempotent method unless it has some means to know that the request semantics are actually idempotent, regardless of the method, or some means to detect that the original request was never applied."** 判断依据不是方法名，是请求语义本身幂等，或者有办法确认原始请求从未生效。

所以恢复策略的落脚点是给每次失败先贴一个"是否已生效"的标签，标签决定之后所有动作：

| 失败类别 | 判定依据 | 动作 |
| --- | --- | --- |
| 参数值错误 | 服务返回 4xx/422 | 不重试，向模型回传具体字段错误，修正一次 |
| 工具选择错误 | 命中的是错的 API | 不重试，改工具定义与描述 |
| 服务端 5xx、限流 | 服务端自认出错 | 可重试，必须有退避与上限 |
| 超时、连接中断 | 响应未返回 | 状态未知，先读回或凭幂等依据判定 |

这张表里最容易被跳过的是最后一行，因为它在日志里长得像一次普通的网络抖动。而它恰恰是唯一会同时产生"漏做"和"重复做"两种后果的类别。

这个类别还有一个性质值得单独说：它没有确定的时长。5xx 会在几百毫秒内给出结论，幂等键会在第二次写入时挡住重复；而"在途"状态没有上界，你在任何时刻观察都得到同一个"不知道"。可以给它设一个等待窗口，但那个窗口是工程约定的，不是事实上的确证。

参数错误的另一个特性是它默认静默。服务端收到一个语法正确、语义错误的值，返回的通常是成功——而写入已经发生。**执行成功且值错误，是最贵的一类失败，因为它不产生任何错误信号。** 让重试逻辑覆盖它没有意义；它只能在下游被发现，或者永远不被发现。

## 04 / 评测 / 只报总准确率会掩盖最贵的一类失败

把上面的分布折成一个可执行结论：**工具调用系统不能用一个总准确率评价，因为四类错误的修复成本差得远。**

参数结构错误是唯一能靠解码约束清掉的，它应该被盯成一个接近零的指标。参数值错误和决策错误要靠上下文、字段语义和流程设计，改一次要动的是产品定义。而"不需要调用却发起了调用"这类错误性质完全不同——一次多余的写操作会留下副作用，而漏调用只是多问一句。

按类别分开记账，收益不只在评测上。它也让每一次失败有确定的下游动作：结构错误回到工具无关的基础设施层，参数错误回到上下文与字段定义，决策错误回到提示与任务边界。混在一个总分里，这些落点全被抹平。

这就是分类本身的价值所在——每类错误的成因分布在不同层，不分类等于把所有失败归到一个没有落点的原因上。这也解释了为什么“让模型再谨慎一点”这类改法几乎不改变结果：它没有触碰任何一层的判断依据。

## 资料与边界

核对日期：2026-10-05。以下数字均取自对应页面的原文。

- [Constrained Decoding Eliminates Structural Failures in Small LLMs but Reveals a Scale-Dependent Semantic Gap，arXiv:2609.23742](https://arxiv.org/abs/2609.23742)：5 个模型、3 个家族、14 类结构化输出任务、3 种解码条件；schema 合法率 78.6%–92.9% → 100%；指令语义类失败（含多步函数调用）无法被约束解码救回。2026 年 9 月结果，范围为 0.6B–4B 小模型。
- [From Text to Voice: A Reproducible and Verifiable Framework for Evaluating Tool Calling LLM Agents，arXiv:2605.15104](https://arxiv.org/abs/2605.15104)：Confetti 配对失败的四类分解（参数值 39.5%–57.2%、决策 25.8%–37.4%、参数结构 2.8%–14.6%、工具选择 5.5%–15.5%）；When2Call 上调用 / 不调用两侧准确率（92.7% 对 43.9%、85.2% 对 73.1%、74.1% 对 58.8%）。2026 年 5 月结果，样本为语音智能体场景，不是通用 API 场景；四类占比取自该论文 Table 5。
- [Structured outputs，Azure OpenAI in Microsoft Foundry Models](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/how-to/structured-outputs)：JSON mode 与 structured outputs 的能力差别；不支持的关键字清单；"All fields must be required" 与 `null` 联合类型的可选参数写法。这是某一家的实现约束，不是所有供应商的统一限制。
- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)：4xx 与 5xx 两类状态码的定义，以及非幂等方法不得自动重试的条件。协议层面的原则，约束的是传输语义，不约束业务语义。

弃用与未采用的来源：[Berkeley Function Calling Leaderboard](https://gorilla.cs.berkeley.edu/blogs/8_berkeley_function_calling_leaderboard.html) 给出的是评测方法与常见错误模式，没有可引用的逐类错误占比，故未用于任何数字；OpenAI 的 structured outputs 发布页与 function calling 指南两次抓取均返回 403，无法取得原句，因此 OpenRouter 与第三方转述中的"100% 可靠"类表述一律未采用；多份第三方榜单与博客中的错误分布数字找不到可核对的一手页面，同样未采用。

文中的错误分类表、失败标签判据与分项记账建议，是我根据上述来源做的工程整理，没有独立复现实验，也没有引用任何非公开或个人运行数据。
