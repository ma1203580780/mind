---
title: "同一批生效时间戳：一张卷子 +0.220，另一张 −0.045"
description: "把生效时间当作检索的硬条件，收益不是常数。同一批维基百科来源、同一套 valid_from / valid_until，在 TempLAMA 上把 F1 抬高 0.220，在 TimeQA 上压低 0.045。更麻烦的是，你存的「发布日期」记录的是采集时间而不是事实何时成立——一份 2023 年的语料 dump 里，超过 80% 的维基百科文档是旧版本。"
date: '2026-10-05'
category: AI 工程
tags:
- AI工程
- RAG
- 评测
authorship: assisted
draft: false
featured: false
---

给检索到的每条事实附上一个 `valid_from` / `valid_until`，会得到两个方向相反的结果。

TempLAMA 用 34963 个时间探针测「模型能不能利用有效期窗口做日期过滤」，基线 F1 是 0.717；把这一层生效区间加上去，F1 提高 0.220。换成 TimeQA——6150 道基于维基百科段落的时效问题，同一个领域、同一批资料来源、同一套 `valid_from` / `valid_until`——这同一层把 F1 压低 0.045。

一正一负。这不是调参事故，它说明时间在检索里真正的位置：时间不是一条用来排序的特征，而是一个判定谓词——**在时刻 t，这条事实是否成立**。加上去是帮忙还是添乱，取决于你的问题能不能被归约成这个谓词的一次求值。

## 01 / 时间元数据只在一种操作上兑现

上面那组数字出自一篇把 RAG 上下文增益逐层拆开的论文：[Metadata, Structure, or Strategy? A Decomposition of RAG Context Enrichment](https://arxiv.org/abs/2606.29645)（arXiv:2606.29645，v1 于 2026-06-28 提交，ECML-PKDD 2026）。作者在 6 个基准、3 个模型家族的 4 个模型上跑了五个递进的富化层级，共 24000 多条回答：

- G0——原始段落，不做任何处理
- G1——原子事实的 JSON，但质量字段全部留空（关键的格式对照）
- G2——G1 加上生效区间（`valid_from` / `valid_until`）
- G3——G2 加上置信度与冲突标注
- G4——G3 加上完整的来源链（provenance）

| 基准（任务类型） | G0 基线 | 加上生效区间 | 加满元数据 |
| --- | --- | --- | --- |
| TempLAMA（日期过滤） | 0.717 | **+0.220** | +0.196 |
| TimeQA（段落内时效理解） | 0.188 | **−0.045** | −0.036 |
| MuSiQue（多跳） | 0.315 | — | −0.032 |
| HotpotQA（多跳） | 0.489 | — | −0.063 |
| FEVER（事实核查） | 0.708 | — | −0.006 |
| SimpleQA（事实召回） | 0.660 | — | −0.010 |

增量取自论文表 1：TempLAMA 的 +0.220 是 G1→G2 这一层；TimeQA 的 −0.045 是正文里 G2 相对 G0 的比较（表 1 中该列给出 G0→G1 −0.035、G1→G2 −0.010、G0→G4 −0.036）；MuSiQue、HotpotQA、FEVER、SimpleQA 只报了 G0 与 G0→G4，中间层没有列出。论文的原话是「Temporal windows account for 112% of the total improvement」——生效区间贡献了 112%，后面几层（置信度、冲突、来源链）反而把它抵消掉一点。

112% 这个数字指出了机制的位置。一条事实带上生效区间之后，「2007 年他在哪支球队」只需要一次日期比较就能判定；把这个操作交出去，模型就不用再从散文里推断时间。而 TimeQA 要的恰恰是从段落里推断时间——把段落切成带时间戳的原子事实，叙述连续性没了，推断也就没了。论文自己的说法是：TempLAMA 需要 date filtering，TimeQA 需要 comprehending interleaved temporal facts across a passage。

格式也是这个机制的一部分。论文还测了序列化方式：同样的内容换成 Markdown 序列化，比 JSON 少用 33–46% 的输入 token，同时在两个主基准上分数更高（TempLAMA +0.013、MuSiQue +0.037）。一条元数据划不划算，取决于它换来的判定能力，而不是它占的版面。

这就解释了一个常见落差：给知识库每一条都补上日期，检索分数却不动。因为日期进入的是排序，而进入判定的必须是生效区间；生效区间的价值又取决于问题是不是一个 as-of 问题。

## 02 / 会过期的不只是资料，还有答案和题目

时间敏感问题的定义本身就在说这件事。TimeQA 给出三条判据（[A Dataset for Answering Time-Sensitive Questions](https://arxiv.org/abs/2108.06314)，arXiv:2108.06314v5，2021-10-25）：问题里含一个时间限定词；**改动这个限定词会改变答案**；回答问题需要时间推理。第二条才是核心——它测的不是「资料对不对」，而是「同一条资料在 t 时刻给出什么值」。

TimeQA 从 WikiData 挖出约 15 万条随时间演化的三元组，人工核验后留下 5060 条黄金的（文本，时效事实）对，平均每条事实有 4 个时间段，覆盖 70 个关系；每个难度版本各生成 20000 道题。结果：最好的模型 FiD 只有 46% 准确率，人类是 87%。

更麻烦的一层是，题目本身也有保质期。FreshQA（[arXiv:2310.03214](https://arxiv.org/abs/2310.03214)，v2 于 2023-11-22）把 600 道题分成四类：答案几乎不变的、几年一变的、一年内会变的、以及前提本身就是错的、需要被驳倒的。论文明确写道，一部分标准答案是会随时间变化的，一道题的分类还会在之后被挪到别的类别——它举的例子是「Elon Musk 和他现任配偶结婚多久了」：今天属于假前提类，如果他再婚一次，就会变成快变类。所以作者承诺定期更新标准答案，并要求评测尽量贴着数据集的发布日做。

所有模型都在同一天评测：2023 年 4 月 26 日。总体准确率在 Strict 口径（答案里任何一条都不能过时或有幻觉）下是 0.8%–32.0%，在 Relaxed 口径（只看主答案对不对）下是 0.8%–46.4%。对 2022 年以后的知识，GPT-4 在两个口径下都没超过 15%；面对快变类问题，GPT-4 有 60% 的时候直接拒答，ChatGPT 是 16%。

接上检索，数字变化很大。GPT-4 + FreshPrompt 在 Strict 下提高 47 个百分点、Relaxed 下 31.4 个百分点；Strict 与 Relaxed 之间的差距从 17.8% 缩到 2.2%——也就是说，过时答案和幻觉造成的落差被检索基本抹平了。

真正值得注意的是另一条：连 2022 年以前的老知识，也涨了 30.5 个百分点。这批问题不需要新知识，涨分说明检索带进来的不只是「更新的事实」——FreshPrompt 给每条证据都配上了来源网页与日期，并把证据按从旧到新排序，论文的敏感性分析显示，证据的数量和顺序都会影响正确率。

## 03 / 你存的那个日期，不是生效时间

如果生效区间才是该进检索条件的东西，下一个问题是：我们通常存的「发布日期」是不是它。基本不是。

[Dated Data: Tracing Knowledge Cutoffs in Large Language Models](https://arxiv.org/abs/2403.12958)（arXiv:2403.12958v2，2024-09-17）把「报告的截止日期」和「有效截止日期」分开：前者是模型方宣称的训练数据采集时间，后者是用逐月版本探出来的、模型知识真正对齐的那个时间。论文在 2016–2023 的逐月维基百科快照（5000 个最常被编辑的条目）和 2016–2020 的纽约时报文章上测困惑度，结论是「effective cutoffs often drastically differ from reported cutoffs」。

最清楚的例子是 RedPajamas：它明确包含了一个 2023 年 3 月的维基百科 dump，但论文测出的有效截止日期是 2019 年。原因在 CommonCrawl——论文的原话是「a CommonCrawl dump in 2023 contains many versions of documents dating back to 2016」，而在 RedPajamas 的全部维基百科来源里，超过 80% 的文档是 2023 年以前的版本，于是困惑度的最低点落在 2019 年年中。论文给这个现象配了一句很好懂的话：一个用大模型报税的人，不会想到税法知识实际上停在 2022 年，而说明里写的是 2023 年。

去重救不了这件事，有时还帮倒忙。FalconRW 特意剔除了 wikipedia.org 这个顶级域，以为这样就不含维基百科，但镜像站和其它域名里的近似重复文档仍然留在里面；C4 声称「任何出现超过一次的三句片段只保留一份」，实际仍能找到语义等价、只差空白的文档对；RedPajamas 做过段落级去重，仍能找到完全相同的重复文档。更反直觉的一条是：把 Pile 里刻意上采样 3 倍的维基百科 dump 去掉之后，Pythia 的有效截止日期不是变新，而是变旧——因为剩下的全是 CommonCrawl 里更老的版本。

所以「文档的日期」至少混了三件不同的事：文本被写下的时间、被采集进语料的时间、以及文中事实开始成立的时间。三者可以差好几年。存前三者中的任何一个，时间过滤能过滤掉的只是「采得晚」，不是「已经不成立」。

这三者的顺序不是随机的：采集时间总是晚于写作时间，写作时间又总是晚于或等于事实开始成立的时间——一条事实在文里被写下的那一刻，它已经成立了。所以拿采集时间当生效时间，误差方向是系统性偏晚；拿「这份资料看起来很新」当判据，则会系统性地把重印的旧事实判成新的。RedPajamas 的 2023 年 dump 里装着 2016 年的版本，就是这条链走到底的结果。

StreamingQA（[arXiv:2205.11388](https://arxiv.org/abs/2205.11388)，2022-05-23）换了个做法：把日期同时贴在两边。资料侧给文章前缀发布日期，问题侧给问题前缀提问日期（"Today is Wednesday, May 6, 2020."），然后用提问日期把语料切成 ≤ t 的快照——问某个季度的问题，只用该季度之前发表的文章。它的语料是 2007–2020 共 14 年的新闻、约 1100 万篇。结论里有一条直接相关：把新文章加进检索空间能让系统快速适应，但底层语言模型过时的半参数系统，仍然打不过底层模型重新训练过的系统。

## 04 / 该存的是区间，不是日期

把三条线并起来，剩下的是一个很窄的判断。

**时间元数据必须先能回答一个判定问题，才有资格进检索条件。** 这个问题是「在时刻 t，这条事实是否成立」。发布日期回答不了它，生效区间能。这是 TempLAMA 上 +0.220 的来源。

**这个判定只在任务可以被归约成它的时候兑现。** TimeQA 的 −0.045 是同一枚硬币的另一面：那里的问题要求在段落中交错的若干时间段之间做推断，不是一次比较。MuSiQue −0.032、HotpotQA −0.063、FEVER −0.006、SimpleQA −0.010 提醒的是同一件事——论文的总结是「adding more metadata reduces accuracy on every benchmark」，连 TempLAMA 也是加满不如加到 G2。格式本身也有代价：G0→G1（只是换成结构化 JSON、字段全空）在 MuSiQue 上是 −0.078。

**存成区间，而不是一个点。** 生效区间在两个端点上是不对称的：已经结束的事实有明确的 `valid_until`；仍在成立的事实没有——它的右端点是空的。这带来两个直接的工程后果。第一，过滤条件不能写成「按日期排序取最新」，因为一条 2019 年就结束的事实和一条至今仍然为真的事实之间，序关系不代表正确性；条件必须是「t 落在区间内」。第二，`valid_until` 缺失比 `valid_from` 缺失更危险：一条事实没有结束时间，既意味着「还没结束」，也意味着「我们不知道它什么时候结束」；这两件事在检索里不是一回事，混在一起就等于把「未验证」当成「仍然为真」。

**所以先问问题，再决定贴什么。** 如果你的问题里真的有一个 as-of 时刻——「2021 年他在哪支球队」「这个参数在 v3 里叫什么名字」——那就存生效区间，并且在检索时用它做条件、在答案里把它带出来。如果你的问题是在一篇长文里读懂一段演变，那么把这段演变切成带时间戳的原子事实，只会让它更难。

判据不是「这条资料有多新」，而是 TimeQA 的第二条：**换掉时间限定词，答案会不会变**。会变，时间就必须是硬条件；不会变，时间戳只是占预算的噪声。

回到开头那两张卷子。+0.220 和 −0.045 不矛盾，它们是同一个机制的两端：时间能不能用，取决于你的问题有没有被写成一次「在 t 时刻是否成立」的求值。

## 资料与边界

核对日期：2026-10-05。以下数字均取自各自页面的原文；引用论文时按 arXiv `abs` 页标注的版本。

- [Metadata, Structure, or Strategy? A Decomposition of RAG Context Enrichment，arXiv:2606.29645（v1，2026-06-28；ECML-PKDD 2026）](https://arxiv.org/abs/2606.29645)：TempLAMA 34963 个时间探针、TimeQA 6150 道题；G0 基线 TempLAMA 0.717 / TimeQA 0.188 / MuSiQue 0.315 / HotpotQA 0.489 / FEVER 0.708 / SimpleQA 0.660；TempLAMA G1→G2 +0.220、G0→G4 +0.196；TimeQA G2 相对 G0 −0.045、G0→G4 −0.036；MuSiQue −0.032、HotpotQA −0.063、FEVER −0.006、SimpleQA −0.010；G0→G1 在 MuSiQue 上 −0.078；「Temporal windows account for 112% of the total improvement」；Markdown 序列化比 JSON 少用 33–46% 输入 token 且分数更高；6 个基准、4 个模型、超过 24000 条回答。**边界**：该论文的 TimeQA 是它自己重采样并原子化的 6150 道题，与 TimeQA 原论文的 20000 道模板题不是同一份数据，因此「时间窗口在 TimeQA 上为负」有多少来自时间元数据、有多少来自原子化，论文没有拆开。数字口径为 GPT-4.1 家族 seed-42，TempLAMA / MuSiQue 为 3 seed 均值 ±SE。
- [A Dataset for Answering Time-Sensitive Questions（TimeQA），arXiv:2108.06314v5（2021-10-25）](https://arxiv.org/abs/2108.06314)：时间敏感问题的三条判据；约 150K 条演化三元组、5060 条黄金（文本，时效事实）对、平均每条事实 4 个时间段、70 个关系、每个难度版本 20000 道题；最好模型 FiD 46% 对 人类 87%。2021 年结果，不代表当前水平。
- [FreshLLMs: Refreshing Large Language Models with Search Engine Augmentation（FreshQA），arXiv:2310.03214v2（2023-11-22）](https://arxiv.org/abs/2310.03214)：600 道题的四类划分与重分类示例；全部模型同日（2023-04-26）评测；Strict 0.8%–32.0%、Relaxed 0.8%–46.4%；2022 年后知识 GPT-4 未超过 15%；GPT-4 快变类拒答 60%、ChatGPT 16%；GPT-4 + FreshPrompt 在 Strict 下 +47%、Relaxed 下 +31.4%，Strict–Relaxed 差距 17.8%→2.2%，2022 年以前有效前提题 +30.5%。2023 年结果。
- [Dated Data: Tracing Knowledge Cutoffs in Large Language Models，arXiv:2403.12958v2（2024-09-17）](https://arxiv.org/abs/2403.12958)：reported cutoff 与 effective cutoff 的区分；RedPajamas 包含 2023-03 维基 dump 而有效截止为 2019；「a CommonCrawl dump in 2023 contains many versions of documents dating back to 2016」；RedPajamas 的维基文档超过 80% 是 2023 年以前的版本；FalconRW / C4 / RedPajamas 的去重失效例；去重后的 Pythia 有效截止更早；报税例子。**边界**：该分析针对 2024 年可获取的开放权重模型与当时的 CommonCrawl / 去重管线，不能直接外推到闭源模型的当前版本。
- [StreamingQA: A Benchmark for Adaptation to New Knowledge over Time in Question Answering Models，arXiv:2205.11388（v1，2022-05-23）](https://arxiv.org/abs/2205.11388)：资料前缀发布日期、问题前缀提问日期的设计；2007–2020 共 14 年、约 11M 篇文章；评测集约 28k 生成题 + 8.8k 人类撰写题；「models with an outdated underlying LM under-perform those with a retrained LM」。2022 年结果。

弃用与未能核对：

- **无法定位**官方文档原文。`platform.openai.com/docs/models` 返回 403（Cloudflare 拦截），`docs.claude.com` 与 `platform.claude.com` 的模型文档页跨域跳转到 anthropic.com，抓取失败。因此本文没有引用任何厂商官方关于「知识截止」的原文表述，这一方向由 arXiv:2403.12958 的 reported / effective cutoff 分析替代。
- `arXiv:2509.01306`（Re3: Learning to Balance Relevance & Recency for Temporal Information Retrieval）的 `abs` 页标注「This paper has been withdrawn by Jiawei Cao」，v2（2026-01-06）已撤稿、无 PDF，弃用。
- `TempQuestions`（WWW 2018 Companion）只找到 ACM DL 页面，没有可抓取的 arXiv 版本，弃用。
- 第三方「知识截止日期汇总」站点、自媒体转述与二手榜单页面一律未使用。

文中关于「该存生效区间还是发布日期」「先问问题再决定贴什么」的判据，是我根据上述结果的工程整理，没有独立复现实验。
