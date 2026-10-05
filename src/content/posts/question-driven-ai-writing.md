---
title: "编程只占一小部分，容易的问题在消失：追热词的 AI 写作错在哪"
description: "两组公开数据放在一起：ChatGPT 的真实会话里「计算机编程」只占很小的份额，而 Stack Overflow 上 2020–2025 年两百多万条问题中，容易的问题在急剧减少。供给方向和需求迁移的方向正好相反，这就是追热词选题的结构性错误。"
date: '2026-10-05'
category: 独立创造
tags:
- 创作
- 长期成长
authorship: assisted
draft: false
featured: false
---

2025 年 9 月的 NBER 工作论文 34255 把 ChatGPT 的真实会话分了类，其中有两条并排看很有意思：**「实用指导」（Practical Guidance）、「找信息」（Seeking Information）、「写作」（Writing）三类合计占了近 80% 的对话；而「计算机编程」只占相对较小的份额。** 一年后，一篇分析 Stack Overflow 两百多万条问题的论文给出了另一组数字：**容易的问题在急剧减少，难的问题在变多；资料丰富的话题在丢份额，资料稀缺的话题在涨。**

把两组数字叠在一起，追热词写 AI 文章的路径就露出了破口：热词集中的那段话题，恰好是资料最丰富、被自动化回答得最彻底的一段——需求正在离开的地方；而真实提问里在增长的那部分，是没人愿意写的部分。这不是品味问题，是供给方向和需求迁移方向相反。

## 01 真实需求是问句，不是领域

那份 NBER 论文（2025 年 9 月，Working Paper 34255）用的是一套保护隐私的自动化流程，对一份有代表性的 ChatGPT 会话样本做分类，覆盖到 2025 年 7 月——那时它已被约 10% 的全球成年人使用。论文里还有一条容易被忽略的趋势：**非工作用途的消息从 53% 涨到了 70% 以上**。

这条趋势比 80% 那个数字更值得琢磨。非工作用途意味着更低的前置知识、更具体的生活处境、更少的行业术语。需求正在往「我不懂这套行话，但我现在要解决一件事」的方向扩散。而 AI 技术写作的默认开头是另一套东西：一个领域名词，加一段它为什么重要。

问题出在名词和请求不是同一种东西。**「Agent」「RAG」「上下文工程」是分类；读者手里的是请求。** 分类只有在读者已经知道自己在找什么的时候才有用——他得先知道该搜哪个词，才能从一个领域名词里认出自己。但卡住的人提供不了词，他只能提供一个现象：「工具调用返回成功了，任务为什么还是没完成」「知识库明明有这份文档，回答里就是不用它」。这两句话里没有任何术语，却比术语精确得多。

写作者的活就在这次翻译里：把现象翻译成结构，而不是把结构（领域）摊开成现象清单。一篇《Agent 概览》要求读者判断「我要不要读一篇关于 Agent 的东西」——这个判断他做不了，因为他不知道自己需要的是哪一部分。一篇《工具调用返回成功，任务为什么还是没完成》不需要判断，读者一眼就能确认是否与自己有关。选题的具体程度不是文风选择，它是读者能不能做筛选动作的前提。

## 02 供给正在撞上需求的反方向

Stack Overflow 那篇论文（arXiv:2609.36069，v1，2026 年 9 月 28 日）把 ChatGPT-3.5 的发布当作一次自然冲击，分析了 2020 到 2025 年间发布的两百多万条问题，沿两个维度追踪：难度，以及资料的可得性。结论是一升一降同时发生——容易的问题急剧减少，难的问题变得更常见；资料丰富的话题和标签丢掉份额，资料稀缺的反而涨。

这条分布变化里藏着选题的算术。**一个题目能写成「综述」，前提是资料足够多；而资料足够多，意味着它恰好也最容易被检索和生成式回答处理掉。** 于是「热词 + 资料丰富」这一段成了自动化供给最强的地方：官方文档、已有问答、现成教程层层叠叠。人在这一格里的增量接近零——你写第三十篇「RAG 是怎么工作的」，是在跟一个不需要你的场景竞争。

数据稀缺的那一端是另一回事。文档没写清楚的地方、需要判断取舍的地方、只能靠一手运行才能说清的地方，生成式回答给不出稳定结果，因为它的原料本来就不存在。这类问题在涨，而它们几乎不可能被写成领域综述——它们只以问句的形式存在。

落到 AI 写作上，这个判断会筛掉很多看起来很好的题。「Agent」「RAG」「提示工程」这些词自带海量官方文档和二手教程，围绕它们再写一篇「是什么、怎么做」，等于主动站进最饱和、且读者最不需要人写的那一格。真正稀缺的是别处不敢写的那部分：什么时候不该用这套方案、失败长什么样、那个被反复引用的数字出自哪一版。这些内容无法靠热度生成，只能靠有人真的做过或真的查过。

需要说明的是，这篇论文观察的是 Stack Overflow，一个以编程问答为主的社区，它的因果识别建立在生成式 AI 发布这个时间点前后。把它当成编程领域的需求迁移证据是合适的；把它当成「所有内容领域的普遍规律」就越界了。但方向性的事实是可用的：可被检索和模板化回答的问题正在退场，剩下的提问更依赖判断与一手经验。

## 03 以问题为纲，先解决判断，再解决记忆

为什么按问题组织比按主题组织有效？这里有两项被引很多的实验，它们给出的答案比直觉窄，也比直觉有用。

第一项是 2023 年发表在《Applied Cognitive Psychology》的研究（Prinz-Weiß & König，37 卷 4 期）。51 名大学生读文本，一部分文本带标题。结果是：标题帮助了学习者理解文本，也帮助他们更准确地判断自己理解到什么程度；而对记忆、以及对「记忆的自我判断准确度」的影响不显著。

第二项是 Roediger 与 Karpicke 2006 年发表于《Psychological Science》的经典实验（17 卷 3 期）。学生读文章，一组反复重读，一组做即时自由回忆测试，之后在不同延迟上做最终测试。摘要把结论写得很直接：在延迟测试上，先前的测试带来了远高于反复重读的保持率，**尽管反复重读提高了学生对自己记忆能力的信心**。

把两条放在一起，机制就清楚了：**读者的失败模式不是「没读」，而是「读完了以为自己懂了」。** 反复重读会增强这种错觉，这是实验直接测到的。而标题的作用落在理解与自我判断这一层，不在记忆层——这与「记忆效应不显著」并不矛盾，恰恰说明它起作用的位置是判断。

问题式结构做的就是把这个判断动作交回给读者。小标题写成一个问句，读者读到这里必须能回答它；答不出来，说明这段没有接上他的问题。术语式目录做不到这件事，因为它只回答「我讲了什么」，读者拿不到一个当场可执行的自检动作。一篇文章的解释力，很大一部分不在信息量，而在于它让读者知道自己是懂了还是没有。

由此推出的写法只有一条：每个小标题写成读者真的会问的那句话，每节末尾真的回答它。答不出来时，正确动作是回去补证据或改题目，不是加篇幅。

## 04 三条判据

上面所有机制可以压成三道门，顺序不能换。

**第一，有没有原句。** 这个问题必须真的在某个地方被问过——issue、问答站、群里、读者私信、你自己的搜索记录——而且你手上留着那句话。「这个话题最近挺热」不算，因为它是分类不是请求。没有原句的题，写出来就是领域综述。

**第二，资料稀不稀缺。** 去搜一遍：如果一搜就有十篇同题文章，说明供给不缺，你能提供的只能是判断或一手数据；如果搜不到、或者搜到的都是转述同一个二手数字，这才是可以写的题。

**第三，证据存不存在。** 你能不能给出可核对的东西：一份文档的原句、一个版本的日期、一组自己跑出来的数。填不出第三格，题目就该退回「待验证」，而不是先写出来再补。

这三条落到操作上，是一张五行卡片：读者是谁；他在什么情境下卡住；他的原话是什么；这篇文章能回答到哪里；还缺哪份证据。最后一行是止损线——它空着的时候，说明这篇还只是话题。

回到开头那两组数字。近 80% 的对话在要一个具体的答案，两百多万条问题里增长的是难而资料稀缺的那部分，而编程话题在真实使用里只占一小块。AI 写作的对手从来不是别的作者，是读者手里那个具体的卡顿。所以选题的入口不是「我在写哪个领域」，而是「我在回答谁的原话」，以及「这句话是谁问的、我在哪看到的」。

## 资料与边界

核对日期：2026-10-05。以下每条数字均取自我实际抓取过的页面原文；抓不到的一律没有写进来。

- [How People Use ChatGPT，NBER Working Paper 34255](https://www.nber.org/papers/w34255)（2025 年 9 月，DOI 10.3386/w34255）。用到的原句：
  > "We classify messages by conversation topic and find that “Practical Guidance,” “Seeking Information,” and “Writing” are the three most common topics and collectively account for nearly 80% of all conversations."
  > "Computer programming and self-expression both represent relatively small shares of use."
  > "non-work-related messages, which have grown from 53% to more than 70% of all usage"
  > "through July 2025, when it had been adopted by around 10% of the world's adult population"

  用在文章开头与第 01、04 节。边界：这是 ChatGPT 消费者产品的代表性会话样本，不是「所有读者的需求分布」。文章里只用它说明需求的形状（请求式、低前置知识）和方向，没有把它当作 AI 文章受众规模的估计。
- [The Uneven Decline of Collective Knowledge Production: Evidence from Stack Overflow After Generative AI，arXiv:2609.36069](https://arxiv.org/abs/2609.36069)（v1，2026 年 9 月 28 日提交，仅此一版）。用到的原句：
  > "Analyzing over two million questions posted between 2020 and 2025, we track how two dimensions of collective knowledge, difficulty and data availability, change following Gen AI's release."
  > "Easy questions decline sharply while difficult questions become more common, a pattern corroborated by rising code complexity. Data-rich topics and tags lose share of questions, while data-scarce ones gain ground."

  用在开头和第 02 节。边界：研究对象是 Stack Overflow（2020–2025），因果识别以 ChatGPT-3.5 发布为时间冲击，不代表其他内容领域。
- [Caption it! The impact of headings on learning from texts，Applied Cognitive Psychology 37(4): 804–813（2023），DOI 10.1002/acp.4076](https://publikationen.bibliothek.kit.edu/1000164494)。摘要原句：
  > "In the present experiment with 51 university students, we investigated to what extent headings within texts promote these processes. The results revealed that headings supported learners in comprehending the texts as well as in accurately judging their comprehension. The effects of headings on memory and judgment accuracy concerning memory were not significant."

  用在第 03 节。边界：实验对象是标题（不是问句形式的标题），参与者 51 名大学生，2023 年发表；把它迁移到「问题式小标题」是推论，不是复现。
- [Test-enhanced learning: taking memory tests improves long-term retention，Psychol Sci. 2006 Mar;17(3):249-55，PMID 16507066](https://pubmed.ncbi.nlm.nih.gov/16507066/)。摘要原句：
  > "on the delayed tests, prior testing produced substantially greater retention than studying, even though repeated studying increased students' confidence in their ability to remember the material."

  用在第 03 节，只用于「重读提高自信」这一条机制。该摘要没有给出任何百分比，因此文中没有写具体数值——网上常见的 61% 与 40% 出自论文正文，我没有抓到原文，故不采用。

没有用到的方向，也一并说明：本次没有找到可公开核对的「长尾问句 vs 宽泛词的点击率/转化率对比」原始数据，所以文章里没有任何关于搜索量与转化的数字；检索中出现的第三方榜单站与自媒体转述（例如转述 Stack Overflow 提问量下滑的二手文章）一律未采用。Adjunct questions 的元分析（Hamaker, 1986）两次抓取失败、出版商屏蔽摘要，我没有引用它的效应量。

最后一条边界：第 03 节的两项实验都是学习心理学研究，不是「博客写法」的实验。文中「问题式小标题把判断动作交回读者」是从这两项结果推出的写作判断，属于工程整理，没有独立实验支撑。
