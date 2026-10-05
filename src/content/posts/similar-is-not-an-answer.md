---
title: "相似度是排序的货币，不是证据：高分文档为什么把答案带偏"
description: "四项公开研究给出的数字放在一起：语义相近、检索分数最高的文档会让准确率下降六成以上，而真正无关的随机文档反而能提升它。落差出在相似度衡量的东西和答案需要的东西不是同一件。"
date: '2026-10-05'
category: AI 工程
tags:
- RAG
- 评测
- AI工程
authorship: assisted
draft: false
featured: false
---

同样是把文档塞进上下文：随机抽来的无关文档，让准确率最多**提高 36%**；检索分数最高、语义最相近的那一批，让准确率下降**超过六成**（[arXiv:2401.14887](https://arxiv.org/abs/2401.14887)，SIGIR 2024）。如果相似度等于答案，这两个数字应该反过来。

这组数字来自 Cuconasu 等人对 RAG 检索策略做的第一项系统研究。他们把可检索的文档分成四类：包含答案的 gold、同样包含答案的其他 relevant、语义相近但不含答案的 distracting、以及完全无关的 random。

distracting 的定义被写得毫不含糊：

> distracting documents are semantically similar to the query but do not contain the correct answer. … In practice, these are the top-scoring retrieved documents that are not relevant.

也就是说，干扰文档不是检索失败的产物，而是检索成功时的产物——它们是相似度打分最高、却在定义上答不出问题的那批。检索器把"主题最接近"这件事做到了最好，恰好也把最能误导模型的段落排到了最前面。论文用的例子是：问拿破仑的马是什么颜色，检索到一段讲约瑟芬的马是什么颜色的文字。主题一致，词也接近，答不了。

## 相似度衡量的是主题，不是可用性

先看这批文档造成的实际损失。同一篇论文统计了 10K 条查询，只放 gold 加上若干干扰文档：

> This was observed across all LLMs, with accuracy deteriorating by more than 0.38 ( − 67 % ) in some cases. Even more importantly, adding just one distracting document causes a sharp reduction in accuracy, with peaks of 0.24 ( − 25 % )

一个干扰文档就能让准确率掉掉两成半。而随机文档的方向恰好相反：论文发现在 gold 旁边补入随机文档，表现最好的设置下准确率提升 0.08，即 MPT 上 **+36%**。

一年后的续作把"干扰"再切了一刀，区别只在干扰强度。所有传统检索指标都会给这两种情境相同的分数，但答案准确率有明显差别。

> All traditional IR metrics would score these two scenarios equally, although their end-to-end accuracy changes significantly, exhibiting differences of up to 9 accuracy points.

强干扰（DE>0.8）对弱干扰（DE<0.2），Qwen 7B 上是 87.78 对 78.67，差 9.11 个百分点；Llama 3B 是 81.11 对 75.56。同一套上下文，检索分数分毫不动，答案差了将近一成。

## 为什么相似的东西比无关的东西更危险

如果只是"上下文太长、噪声太多"，随机文档应该同样有害。但事实相反：随机文档甚至是用随机单词拼出的无意义句子，加进去依然是提升。真正拖垮准确率的是"像答案"的文本。

论文给出了一张注意力热图作为解释。它来自一个模型答错的样本：

> This figure highlights the model's disproportionate focus on a distracting document (leftmost) at the expense of the gold document (rightmost), likely contributing to the erroneous response.

模型把注意力过度集中在干扰文档上，而冷落了真正含答案的那一段。随机文档不会被这样对待——它占着位置，但不争夺解释权。语义相近的干扰文档占的恰恰是"答案通常所在的位置"，于是模型读它、围绕它组织措辞，输出的是一段通顺但没有任何依据的话。

这也解释了为什么"把检索做得更好"不自动解决正确率。高质量检索器返回的不相关文档，比低质量检索器返回的不相关文档更有害——续作把这条证据单独引了出来：

> Jin et al. (2025) provide evidence of this by showing that irrelevant passages retrieved by high-performing retrieval systems are more distracting, and therefore they cause more harm, than irrelevant passages retrieved by weaker retrieval systems.

更好的嵌入模型让返回的东西更像查询，而"像查询"和"能回答查询"是两个不同的判断。这正是问题所在：相似度是排序的货币，而排序的货币不能直接当证据花。

## 排序指标和答案正确率是两把尺子：87% 对 71.6%

把尺子本身拿出来量，落差就更直白。同一批作者在 [arXiv:2510.21440](https://arxiv.org/abs/2510.21440) 里把检索上限和答案上限分开报：

> For 87% of the queries across the five benchmarks, there is at least a relevant passage among the 25 we retrieved … therefore, a perfect LLM would provide 87% correct responses

87% 是检索的得分——正确文档确实躺在检索结果里。但在同一批数据上，用二元相关性标注选出最好的五段、再让模型作答，准确率是这样的：

| 模型 | 检索上限 | 答案正确率（5 段理想上下文） | 答错 |
| --- | --- | --- | --- |
| Llama 3B | 87% | 71.6% | 15.0% |
| Llama 8B | 87% | 73.5% | 10.6% |
| Llama 70B | 87% | 78.4% | 9.5% |
| Gemma 4B | 87% | 74.2% | 18.2% |
| Mistral 7B | 87% | 76.2% | 13.3% |
| Qwen 7B | 87% | 72.1% | 9.4% |

检索给了 87% 的机会，答案只兑现了 71.6% 到 78.4%，剩下的是实打实的错答。差的那十几个点，就是"文档在上下文里"和"文档被用作依据"之间的距离。

这篇论文还顺手把另一把常见的尺子拆了。eRAG 用"只给这一段时模型答得怎么样"给文档打分，看起来非常接近"证据价值"。但实验里即便是理想选段，按 eRAG 选出的上下文也只有 71% 到 77% 含相关段落：

> the passage selection according to the eRAG annotation schema sometimes favors irrelevant passages over relevant ones, resulting in only 71% to 77% of the contexts that include at least a relevant passage among the selected five

原因是 eRAG 用 ROUGE-L 这类词面重合来估计"答得好不好"，而词面重合本身就是相似度的近亲。用相似的东西去度量可用性，度量会跟着偏。

更早的一份基准也印证过同一件事。BEIR 收了 18 个数据集、10 个检索系统，结论之一是域内分数不能外推（[arXiv:2104.08663](https://arxiv.org/abs/2104.08663)）：

> We observe BM25 heavily underperforms neural approaches by 7-18 points on in-domain MS MARCO. However, beir reveals it to be a strong baseline for generalization and generally outperforming many other, more complex approaches.

在 MS MARCO 上，神经检索把 nDCG 拉开 BM25 七到十八个点；换到没见过的领域，这个优势消失了，BM25 反而更稳。也就是说，在"相似度算得准"的域内把指标做上去，换到真实场景未必还能赢。指标涨的是它自己，它自己被谁消费才是答案。

## 证据到了上下文里，也未必变成依据

不过最该担心的不是答错，而是看起来答对了。一项眼科长问答研究用 70,000 篇专业文档搭了 RAG，请 10 位医生评估 100 个问题、500 多条引用（[arXiv:2409.13902](https://arxiv.org/abs/2409.13902)）：

> In contrast, LLMs with RAG significantly improved accuracy (54.5% being correct) and reduced error rates (18.8% with minor hallucinations and 26.7% with errors).

有 RAG 之后，最终答案里"正确"的引用只有 54.5%，另有一成九是轻微幻觉、两成七是错误。同一个系统里，检索到的 10 篇文档有 62.5% 被模型选为 top 引用——检索确实在起作用，但起作用的证据本身仍有近一半站不住。这里要分清两件事：检索器的任务是把正确文档放进上下文，它做到了；把上下文变成一份能站住的依据，是生成环节的任务，而它只做到了一半。

引文归因的评测更直接。REASONS 基准收了 12,723 条句子级引用实例，同时报幻觉率（HR）和弃权率（AR）：

> Advanced RAG lowers HR relative to Naive RAG (65.4% vs. 87.6%) but reduces AR from 5.0% to 0%.

高级 RAG 把幻觉率从 87.6% 降到 65.4%，代价是弃权率从 5.0% 压到 0%：模型不再说"我不知道"，而是一律附上引用。论文的人类评估还给出：

> Human evaluation of 1,000 outputs (κ = 0.78) finds a 12.7:1 ratio of factual hallucinations to acceptable paraphrases.

12.7:1——这条归因判断失败时，产出的不是可接受的改写，而是事实性幻觉。相似度把文档送进了上下文，但送进去的是不是依据，得另有人签字。

还有一份研究把这件事拆成三个维度来量，切口正好对上本文的问题：链接能不能打开、内容在不在同一主题、这句话是否被来源支持（[arXiv:2605.06635](https://arxiv.org/pdf/2605.06635.pdf)）。

> even the strongest frontier models maintain link validity above 94% and content relevance above 80%, yet achieve only 39–77% factual accuracy

前两个维度都在八成以上，第三个维度只有 39% 到 77%。同一份研究还发现，把检索深度从 2 次工具调用加到 150 次，链接与相关性指标稳定不动，事实核验在两个前沿模型上平均掉约 42%——检索得更多，不产生更可信的引用。

链接、相关性、事实支持，越往后越接近"这段文字能不能当依据"，也就越难做好。第三个维度才是问题所在，而且它不在检索器的工作范围内。

## 机制：相似度是双向对称的，支持是单向的

这些落差的根源不在模型不够聪明，而在两把尺子的形状不同。三个收尾的判断。

第一，相似度不是坏指标，它只是回答另一个问题。它衡量词汇、语义或主题上的接近程度，这个量天生对称——"A 像 B"和"B 像 A"是一回事。而"这段文字能不能推出这个答案"是单向的：能推出答案的段落必须包含答案所需的那个条件，反过来不成立。拿破仑的马和约瑟芬的马互相都很像，但只有一段能答。相似度看不到这个方向，因为方向性根本不在它的定义里。

第二，多个相似段落叠加不会自动变成证据。五段各自都很像查询的文本，联合起来也证明不了任何一句结论——这是若干段"相关"的并列，不是一份可推导的依据。检索分数把它们加总，答案需要对它们做逻辑合成，两件事没有共同的刻度。

第三，也是开头那两个数字真正指向的东西：随机文档加进去能提升 36%，是因为模型知道该忽略它；而相似文档会损伤六成，是因为模型会去读它、引用它、被它带着走。当判据是"像不像"时，越像的东西越有权威——这个权威和它能不能支撑一句话无关。

这里还有一层常被忽略的后果：分数会变成训练信号。一个检索器只要还在用相关性标注、nDCG 或 rerank 分数做优化目标，它学到的就是"什么样的段落在这把尺子上得分高"。而按 UDCG 那篇论文的结论，这把尺子和答案正确率的相关系数本身就不高——论文给出的改进幅度是**最多 36%**：

> UDCG improves correlation by up to 36% compared to traditional metrics.

注意这个数字的含义：它是说换一把新尺子，能把"指标和答案正确率"的相关性提上去三成六，反过来说，原来的尺子和答案之间的关系本来就松。拿一把和答案关系松的尺子当训练目标，模型会稳稳地朝它收敛，只是收敛到的不是答案。这解释了为什么有些系统检索指标年年涨，用户体感不变——涨的是排序，不是正确率。阈值调高也没用：调高只让上下文变短，治不了"最像的那几段恰好都不能用"。

所以返工的做法不是换一个更强的嵌入模型，而是把两把尺子分开：排序继续用相似度，但"这段话能不能推出答案、能不能支撑这一句"必须独立检查；检查不通过时，明确说缺什么，而不是再找一段相似的。相似度是入口，不是结论。

## 资料与边界

核对日期：2026-10-05。以下数字均取自下列页面的原文，引用为逐字英文原句。

- [The Power of Noise: Redefining Retrieval for RAG Systems，arXiv:2401.14887](https://arxiv.org/abs/2401.14887)（SIGIR 2024，v4 修订于 2024-05-01）：干扰文档的定义（semantically similar to the query but do not contain the correct answer / the top-scoring retrieved documents that are not relevant）；NQ-open 训练集 10K 条查询下，准确率最多下降超过 0.38（−67%），单个干扰文档最多下降 0.24（−25%）；随机文档带来的提升最多 0.08（+36%，MPT）；注意力热图显示模型过度关注干扰文档而冷落 gold。这是 2024 年的实验，用 Contriever + Llama2/MPT/Phi-2/Falcon，不代表当前模型水平。
- [Redefining Retrieval Evaluation in the Era of LLMs，arXiv:2510.21440](https://arxiv.org/abs/2510.21440)（EACL 2026）：五个基准、六个 LLM（Llama 3B/8B/70B、Gemma 4B、Mistral 7B、Qwen 7B）上，87% 的查询在检索到的 25 段中含至少一段相关文档，而用二元相关性标注选出最优五段后答案正确率为 71.6%–78.4%；弱干扰与强干扰在传统指标下同分，答案准确率最多相差 9 个百分点；eRAG 选段只有 71%–77% 的上下文含相关段落；UDCG 与传统指标相比把相关性最多提高 36%。文中的回答准确率由 LLM-as-a-judge（Gemini 2.0 Flash 判等）给出。
- [BEIR: A Heterogenous Benchmark for Zero-shot Evaluation of Information Retrieval Models，arXiv:2104.08663](https://arxiv.org/abs/2104.08663)（NeurIPS 2021 Datasets & Benchmarks）：18 个数据集、10 个检索系统；BM25 在 MS MARCO 域内落后神经方法 7–18 个点，但在 BEIR 的零样本泛化上普遍优于更复杂的方法。2021 年的结果，当时的最强模型与今天不同，但"域内分数不外推"这一结论不因此失效。
- [Enhancing LLMs with Domain-specific RAG: A Case Study on Long-form Consumer Health Question Answering in Ophthalmology，arXiv:2409.13902](https://arxiv.org/abs/2409.13902)（2024-09）：70,000 篇眼科文档的 RAG、100 个问题、10 位医生、500 多条引用；有 RAG 时引用正确率 54.5%，另有 18.8% 轻微幻觉与 26.7% 错误；检索到的 top 10 文档有 62.5% 被选为模型 top 引用。单一专科领域的小样本案例研究，数字不宜外推到其他领域。
- [Abstention vs. Hallucination: Benchmarking LLM Source Attribution for Scientific Citations，arXiv:2405.02228](https://arxiv.org/abs/2405.02228)（REASONS 基准，v5，2026-09）：12,723 条句子级引用实例；Advanced RAG 幻觉率 65.4% 对 Naive RAG 87.6%，弃权率从 5.0% 降到 0%；1,000 条输出的人类评估（κ=0.78）中，事实性幻觉与可接受改写之比为 12.7:1。任务限定在科学文献的作者/标题归因。
- [Cited but Not Verified: Parsing and Evaluating Source Attribution in LLM Deep Research Agents，arXiv:2605.06635](https://arxiv.org/pdf/2605.06635.pdf)（PwC，2026）：14 个模型的深度研究报告，按链接有效性 / 主题相关性 / 事实核验三个维度分别打分；最强前沿模型链接有效性 >94%、内容相关性 >80%，事实准确率仅 39%–77%（FactCheck 分数从 24% 到 77%，跨 53 个百分点，区分度最高的是事实核验）；工具调用从 2 次加到 150 次，链接与相关性稳定，事实核验准确率在两个前沿模型上平均下降约 42%。三维评分均由经人工校准的 LLM-as-a-judge 给出，不是人工逐条判定。

文中"相似度是双向对称的，支持是单向的"以及"排序与支持应分作两个独立检查项"是我对以上结果的机制整理，没有独立复现实验，也没有引用任何非公开或私有运行数据。以下材料我查过并弃用：[Optimizing Retrieval for RAG via Reinforcement Learning，arXiv:2510.24652](https://arxiv.org/abs/2510.24652) 只报端到端提升百分比，没有"检索分与答案分同表对照"的数字；搜索命中的一篇 ACL 2026 论文摘要片段提到"Separating retrieval coverage from LLM utilization"，但我无法打开该页面确认原句，因此未引用；另有若干第三方榜单页与自媒体转述未采用。

