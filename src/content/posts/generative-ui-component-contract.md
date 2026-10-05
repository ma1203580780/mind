---
title: "组件契约能保证渲染，保证不了选择：生成式界面的失效面在哪"
description: "15000 次生成的实测显示，硬约束能把格式合规率拉到 100%，同时把「格式全对、答案全错」的比例推到 88.9%。而 A2UI v1.0 规范自己写明：JSON Schema 无法推断组件属性的语义。契约收缩的是崩溃面，不是错误面。"
date: '2026-10-05'
category: 产品与交互
tags:
- 交互设计
- AI工程
- 产品设计
authorship: assisted
draft: false
featured: false
---

**2026 年 5 月的一份实验在消费级 GPU 上跑了 15000 次生成。给模型加上硬输出约束后，格式合规率从 61.5% 升到 100.0%，答对率却从 19.7% 掉到 11.0%；「格式完全合规、答案却是错的」输出占比从 49.5% 涨到 88.9%。** 约束把格式修好了，同时把错误换成了最难发现的那一种。

生成式界面正在重复这个动作。组件契约被当成质量方案引入，但它真正做的事只有一件：把失败从「渲染不出来」挪到「渲染出来但是错的」。而 A2UI v1.0 规范自己写明了这个边界为什么绕不过去。

## 约束改变的是失败分布，不是失败总量

那份论文把结构约束的代价命名为 constraint tax，并在固定模型、固定任务分布、固定题目实例的条件下测量——不换模型、不换题，只换输出格式的约束强度。原文对结论的表述只有一句：

> The error is semantic, not structural.

结构错误天生可见。括号没闭合、字段名写错、组件名不在 catalog 里，解析器第一个报错，日志里有一条红色的失败。语义错误不行：一个格式完美的确认按钮，配上一个不该被确认的动作，从 schema 到渲染器到埋点全是绿的。

最刺眼的对照是一组日历工具调用任务，同一个 Qwen2.5-1.5B。只用提示词要求它输出 JSON，可执行准确率 91.5%；换成同任务的硬工具调用 schema，掉到 48.0%。**两种模式下 schema 合规率都是 100.0%。** 合规率在这组对照里完全没有区分度——如果你只看它，会得出「两种方案一样好」，然后丢掉 43.5 个百分点。

这条机制解释了一个常被误读的现象：同一个模型纯文本问答答得不错，一套上严格 schema 就掉分。因为它现在必须一边推答案一边守格式。而错得更多的时候反而更难被发现，因为守格式本身消耗了判断力，格式正确又让下游检查全部通过。

为什么守格式会消耗判断力？约束在解码阶段生效，意思是每一步采样时，不满足 schema 的候选 token 被直接排除。这在格式上是对的，但当模型本来想说的内容恰好不符合 schema 时，它没有停下来重新想的余地——它只能在剩下的合法候选里挑一个。日历任务里那些「格式完美但日期错了」的输出就是这么来的：在错误的日期槽位上，任何合法日期都比「这里我不确定」更符合约束。约束越硬，模型越倾向给出一个合法的错误答案，而不是一个不合法的诚实答案。

## 契约是一次查找，不是一次理解

规范里最值得逐字读的一段，恰恰是它承认自己做不到什么的地方：

> Because JSON Schema cannot inspect arbitrary catalog component property semantics to infer which properties represent visible text labels or which components accept user interaction, accessibility rules are enforced through normative specification requirements and SDK tooling

这句话的分量在于它的位置。规范没有说「schema 里再补一个字段就行」，而是把无障碍要求整体移出了 schema 能表达的范围，交给规范性条文和 SDK 工具链。JSON Schema 只能看到一个属性的类型和名字，看不到它的所指。

所以契约的保证范围可以精确地划出来了。

**它保证可渲染性。** 模型吐出的结构一定被客户端认识，不会出现未知组件、不会出现解析不了的树。这是真实收益，也正是契约存在的理由。

**它不保证选择。** catalog 能告诉你 `DatePicker` 存在，不能告诉你用户这句话该配 `DatePicker` 还是 `TimeRangePicker`；能告诉你确认节点合法，不能告诉你这个动作根本不该被确认。类型系统从不检查你选对了哪个类型。

**它甚至不保证它看起来保证的那件事。** 规范对校验器机制的描述几乎是同义反复：

> Validators determine which fields represent structural links by looking for these specific schema references. If you use a raw string type for an ID, the validator will treat it as static text (like a URL or label) and will not check if the target component exists.

校验器查的是「这个引用指向的类型对不对」，不是「这个父子关系该不该存在」。把 ID 写成裸字符串，校验器就当它是静态文本，直接跳过存在性检查。契约的强度取决于 schema 写法，而 schema 写法是设计决定，不是自动获得的。

## 「没有 fallback」是一条设计决定

规范里还有一句被写成 IMPORTANT 的话，讲的是组件解析顺序：先看组件级 `catalogId`，再看 surface 级默认值，两者都没有就直接失败。

> There is **no fallback** to the list of catalogs declared in `rendererCapabilities` (even if the renderer only advertises a single supported catalog).

渲染器明明已经在能力协商里声明了自己支持哪些 catalog，解析失败时却不许回退过去猜。这是一个反直觉但正确的选择：猜中了省一次请求，猜错了留下一个用户看得见、系统查不到的界面。规范宁可立刻失败。

值得把这条想成一条通用的启示。回退逻辑的危险不在于它有时会错，而在于它错的方式：它把一次明确的失败换成了一次看似成功的降级。解析失败会立刻产生一条错误、一次可见的空白、一个可以报警的信号；而回退到某个「差不多能用」的组件，产生的是一张正常渲染的界面，没人知道它和 agent 的本意不一致。两害相权，规范的取舍是让失败保持吵闹。这和第一节讲的是同一件事的两面：schema 把结构错误变得吵闹，也就顺手把语义错误变得安静；那就在结构层不要额外制造安静。

而它对「契约从哪来」的回答同样直接：定义自己的 catalog 是为了把 agent 限制在你应用里真实存在的组件和视觉语言上。

> Defining your own catalog allows you to restrict the agent to using exactly the components and visual language that exist in your application. To use your own catalog, simply include it in the prompt in place of the basic catalog.

注意「include it in the prompt」。契约进入模型的方式是提示词，也就是说它和模型对任务的理解共享同一个上下文预算。这正好接回第一节：约束在解码期和答案争夺同一份算力。契约不是外挂的检查层，它是生成过程的一个输入。

把生成式界面每一轮的判断拆开，契约的管辖范围会更清楚。模型在一轮里要做三层决定：这一轮该不该给界面、还是回一句话；如果给，该是哪种界面，表单、对比还是确认；最后是每个节点填什么、绑哪个字段。catalog 对第三层有完全的发言权，对第二层几乎只有「不能选不存在的那个」这种否定式约束，对第一层完全没有发言权——而「这个任务就不该用界面」恰恰是最容易错、代价也最大的那层判断。这也解释了为什么把组件清单做得再细，都无法替代对「什么时候该生成界面」的判断。

## 88.9% 说的不是契约没用

把两个来源放在一起，得到一条可分层的判断。

结构这一层，契约几乎能做成确定性：解析、引用解析、必填字段、命名规则，全部可以在模型之外判定。规范甚至给了让校验器可靠工作的写法要求（ID 属性必须用 `ComponentId` 类型引用，不能用裸 `string`）——这一层是工程，做好就是做好。

语义这一层，契约没有任何杠杆。该不该确认、这个任务要哪几个动作、用户填的这句话对应哪个字段，这些判断发生在模型内部，schema 无法表达，因此也无法校验。88.9% 这个数字就是这一层的失败率：结构走通了，答案错了。

这也决定了语义层该怎么补。既然失败是安静的，检测手段就不能依赖报错，只能依赖第二路信号——动作执行后的真实结果、用户是否撤销、这一步是否产生了不可回退的副作用。契约做的事情是把界面结构变成可校验对象，从而把「检测语义错误」这件事从「排查一片模糊的失败」收窄成「比对一次实际结果」。契约不解决语义问题，但它让语义问题第一次变得可以被单独观测。

所以「先约定组件，再生成表达」这个方向是对的，理由被说反了。约定组件不是为了让生成更准，而是为了让失败变得可归因——把「界面渲染不出来」这种立刻可见、却无法定位到具体判断的错误，压成「界面正常但决定错了」这种需要专门检测、但至少能定位的错误。

由此得到一个上线检查项，也是论文给的：报表要分开报告 schema 合规率、答案准确率、可执行准确率，以及「格式合规但答案错误」的比例。前三项大多有人看，**第四项几乎没人报——而它正是这套架构下最典型的失败形态。** 一张把合规率从 61.5% 拉到 100% 的报表，和一张 88.9% 错误输出的报表，可以是同一次实验的同一批数据。

契约的边界不是缺陷，是它作为一份类型签名的定义。知道边界在哪，才知道那道语义闸门该装在哪里：谁来确认这一步该不该做。这个问题 schema 永远答不了，因为它本来就不是 schema 的问题。

## 资料与边界

核对日期：2026-10-05。

- [The Constraint Tax: Measuring Validity-Correctness Tradeoffs in Structured Outputs for Small Language Models，arXiv:2605.26128](https://arxiv.org/abs/2605.26128)（v1，2026-05-20 提交，`abs` 页显示为唯一版本）。文中实测数字均出自该 `abs` 页摘要原文：15000 次生成，Qwen2.5-0.5B / Qwen2.5-1.5B / SmolLM2-1.7B；schema 合规率 61.5% → 100.0%；答案准确率 19.7% → 11.0%；格式合规但答案错误的比例 49.5% → 88.9%；日历工具调用任务 91.5%（prompt-only JSON）对 48.0%（硬工具调用 schema），两者 schema 合规率均为 100.0%。「The error is semantic, not structural.」为摘要逐字原句。
- **边界**：该论文的对象是 3B 以下小模型与端侧、低成本部署场景，原文亦明确限定于此；这是 2026 年 5 月的结果，不代表大模型或当前前沿水平。「约束在解码期与答案争夺同一份算力」是我基于上述结果的机制解释，论文没有做强断言。
- [A2UI Protocol v1.0 规范原文](https://github.com/a2ui-project/a2ui/blob/main/specification/v1_0/docs/a2ui_protocol.md)（文件头标注 Version 1.0、Status Candidate、Created Nov 20, 2025、Last Updated Jun 8, 2026）。引用段落均为该文件逐字原文：JSON Schema 无法推断组件属性语义（L508）、无 fallback 的组件解析规则（L504）、校验器按 schema 引用判定结构链接（L168）、自定义 catalog 用于限制 agent 可用组件并需放入 prompt（L155）。本节引用的 A2UI 章节与已上线文章《生成式界面必须留住用户的修改》所用章节不同。
- 本文没有写入任何来自 MCP-UI、OpenAI Structured Outputs 文档或 A2UI 其他版本的具体条文与数字：检索预算内未抓到这些页面的可逐字引用原文（`raw.githubusercontent.com` 的错误路径两次 404、`github.com` blob 页超时、`openai.com` 与 `platform.openai.com` 均返回 403）。「契约 = 类型签名」是我的类比，不是任何规范的原文说法。
