---
title: "两种训练数据用两套标准：DPO 的力气花在了哪儿"
description: "同一批人类偏好，可以做成给模型看的排名，也可以做成给模型吃的 chosen/rejected 对。DPO 论文摘要说它比 PPO 更简单、在摘要与单轮对话上不逊或更好，却在情感控制上明确超出——这提示两套数据标准之间的落差，正落在数据本身。"
date: '2026-10-05'
category: AI 工程
tags:
- AI工程
- 评测
- 上下文工程
authorship: assisted
draft: false
featured: false
---

DPO 论文自己的摘要把结论摆得很平：*"matches or improves response quality in summarization and single-turn dialogue while being substantially simpler to implement and train."* 但紧接着还有半句常被略过：*"exceeds PPO-based RLHF in ability to control sentiment of generations."*

两个关系词并列在同一篇论文里，摘要没有解释为什么。但方向已经给出来了：**同一套方法在三个目标上给出的结论不一样，差别不在优化过程，而在那个目标能不能被"两两比较"表达清楚。** 换数据格式很简单，换标准很难。

这篇文章只顺着这一条线走：当两套训练数据从同一个源头长出两套标准，落差会落在哪里。

## 偏好数据不是"更好"这个结论，而是一串被压扁的判断

聊天机器人竞技场（[Chatbot Arena，arXiv:2403.04132](https://arxiv.org/abs/2403.04132)，2024 年 3 月）用的数据形态最接近源头：用户在两个匿名模型的回答里投票，平台积累了 *"over 240K votes"*。它把这些票做成什么？做成排名和置信区间——每一票都是"这两条里这条更好"，而输出是"某个模型在统计意义上排第几"。

关键在于，它交卷之前先查了一遍自己：摘要说 *"the crowdsourced human votes are in good agreement with those of expert raters."*

这一步很轻，但它把一件事做实了：**众包来的偏好，在聚合之前先和专家口径对过一次表。** 对不上，说明投票问的维度和专家用的维度不是同一个，排名再精确也是在量另一把尺子。

而 preference pair 走的是另一条路。同一次比较、同一个"这条更好"，被压成 chosen / rejected 两个字段，一个"更好"的连带条件——谁在什么维度上判的、分歧有多大、能不能被推翻——全都留在工序里，没有进文件。

从数据形态看，这两者是同一种原始材料走了两种工序：一种保留分歧的分布，另一种把分歧折叠掉。折叠本身不是错误，DPO 的卖点之一正是折叠——论文摘要说它 *"eliminating the need for sampling from the LM during fine-tuning"*，一个二分类损失就够了。问题在于，**被折叠掉的那一维，恰好是判断"这条更好"到底有没有统一标准的唯一依据。**

## 简化的代价不写在算法里，写在数据的标准上

把 DPO 和 PPO 的差别当成"算法复杂度"来读，会漏掉摘要里最有用的一条信息。

DPO 摘要的原句是："matches or improves response quality in summarization and single-turn dialogue while being substantially simpler to implement and train"，又在情感控制上"exceeds"。**"不逊或更好"（matches or improves）和"明确超出"（exceeds）是两种不同的关系词。** 前者是在同一个水平带里，说明这两个目标上，偏好数据承载的信息量已经够用；后者出现了明显落差，说明这个目标上，有多出来的信息被谁接住了。

谁接住的？摘要对 RLHF 的描述里写着，它先拟合一个反映人类偏好的奖励模型，再用强化学习去最大化这个估计出来的奖励。也就是说 PPO 路线里有一个独立训练出来的奖励模型，它拿到偏好对之后还能继续学、还能被单独检查、还能被单独换掉。DPO 省掉了这一步——摘要说它把标准 RLHF 问题化成了"a simple classification loss"——省掉这一步，也就省掉了那个可以单独看一眼的中间物。当目标可以被"两两比较"完全表达时，这个中间物是冗余的；当目标里有比较表达不了的部分时，它就成了唯一的兜底。

情感控制属于后一类。**"A 比 B 更温和"和"温和到什么程度才算合格"是两个不同的问题**，前者是偏好对能承载的，后者需要一条阈值线，而阈值线没有办法塞进 chosen / rejected 两个字段里。

如果目标能拆成"这一维比那一维更重要"，比较就够用；如果目标取决于"达到某个程度才算数"，比较永远差一口气——两两之间分得出高低，分不出够不够。这两类目标混在同一份偏好数据里，用的是同一个 chosen 字段，但要的东西不一样。

这就是机制层面的落差：**偏好数据压缩的是判断的连带信息，而算法压缩的是流程的中间物。** 两个压缩同时发生，被压掉的往往还是同一类东西——可被单独检查的标准。所以"换个更简单的算法"带来的风险，从来不在算法本身的稳定性上，而在那个算法不再需要你显式写出标准。

## 两套数据的标准分叉，从标注那一端就开始

把镜头挪到偏好数据是怎么造出来的，落差会更清楚。

一条 preference pair 出生时至少经过四次格式转换：真人看到两条回答、在脑子里比较、把比较结果说出来、被记录成 chosen 与 rejected。每一次转换都在丢东西，而丢得最狠的一次是最开始那步——**"更好"不是一个可以直接观测的量，它必须先被拆成可问的维度，才能被问出口。**

拆维度的方式决定了后面所有事。如果把"更好"拆成"是否更温和"，那么温和之外的东西就默认等价，标注者被要求只在温和这一维上判；如果把"更好"拆成"综合起来哪个更值得给人看"，标注者就会把长度、语气、格式、有没有多给一句安慰全都算进去——而这些东西不同的人权重不同。

于是同一个 chosen 字段，底下压着两种不同的判断工序。**在数据文件里，这两种工序长得一模一样。**

这就是为什么"两套标准是否一致"这个问题，在偏好数据这一侧特别难被察觉。示范数据有一个可对照的期望输出摆在明面上，标准不一致时至少能看到两条示范自相矛盾；偏好数据没有这个对照物，它只有一个被折叠后的胜者。**标准的分歧不会表现为数据错误，它会表现为数据里一条看不见的主线。** 模型照单全收之后，这条主线就成了它默认的取舍习惯，而没有任何一列数据能指给你看它是从哪来的。

## 让两套标准对齐，唯一有效的动作是把它写下来

回到开头那半句被略过的话。"在摘要和单轮对话上不逊或更好，在情感控制上明确超出"——这不是算法在两种任务上表现不同，这是**同一批偏好数据在不同目标下暴露出的信息完备度不同**。

所以真正的动作，不是选算法，而是把判断维度和底线先写出来，再让两种数据都按同一份标准生成：

- 哪些维度是硬底线，越界不能被文笔弥补；
- 哪些维度允许权衡，权衡时各自的权重是多少；
- 哪个维度上有阈值，阈值定在哪里，由谁定；
- 达不到阈值时，数据里留下的标记是什么。

写下来之后，示范数据和偏好数据才能共用一个口径：示范体现底线的边界在哪，偏好体现底线之上怎么取舍。缺了这份东西，两者各自内部一致，合起来仍然互斥——模型一边从示范里学到"遇到不确定要说明"，一边从偏好里学到"任何情况都要给出结论"，因为后者在那个具体标注者的标准里确实"更好看"。

这也解释了为什么检查表救不了这件事。检查表能查"数据里有没有 chosen 字段"、"有没有去重"、"长度分布是否偏斜"，查不了"标注者和示范者用的是不是同一把尺子"——**因为尺子不在数据里，它在工序里。** 数据文件只能证明工序被执行过，不能证明工序执行的是同一个标准。

顺着这条线回到那个摘要：DPO 不是更弱的算法，它只是把标准这件事从算法里挪走了。它把奖励模型内化的同时，也内化了"标准必须被写清楚"这个要求。写清楚了，简化就是净收益；没写清楚，简化只是让落差更晚才被发现。

论文在那个特定目标上的结果，是这条落差留下的痕迹，而不是原因。

## 资料与边界

核对日期：2026-10-05。**本节的每一条都注明了我实际读到的页面层级**；文中凡不属于逐字原句的判断，我都归入"我的整理"。

- [Direct Preference Optimization: Your Language Model is Secretly a Reward Model，arXiv:2305.18290](https://arxiv.org/abs/2305.18290)。核对页面：abs 摘要页（v3，最后修订 2024-07-29，初次提交 2023-05-29）。取到的逐字原句：*"matches or improves response quality in summarization and single-turn dialogue while being substantially simpler to implement and train"*、*"exceeds PPO-based RLHF in ability to control sentiment of generations"*、*"eliminating the need for sampling from the LM during fine-tuning"*、*"allowing us to solve the standard RLHF problem with only a simple classification loss"*、以及 RLHF 流程的摘要描述 *"first fitting a reward model that reflects the human preferences, and then fine-tuning the large unsupervised LM using reinforcement learning to maximize this estimated reward"*。**重要边界：我只抓到了 abs 摘要页（HTML 全文页两次抓取均超时，未取得正文数字），因而本文没有引用 DPO 的胜率百分比、也没有断言三项实验是否共用同一数据集或同一批标注者，只用了摘要里可核对的表述。** 论文的具体实验设置与数值请以原文为准。
- [Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference，arXiv:2403.04132](https://arxiv.org/abs/2403.04132)。核对页面：abs 摘要页（v1，2024-03-07）。取到的逐字原句：*"amassing over 240K votes"*、*"the crowdsourced human votes are in good agreement with those of expert raters"*。**摘要只写"in good agreement"，没有给出 κ 或具体一致性数值**，因此本文没有写任何一致性百分比。
- [Three Models of RLHF Annotation: Extension, Evidence, and Authority，arXiv:2604.25895](https://arxiv.org/abs/2604.25895)。核对页面：abs 摘要页（v1，2026-04-28，已收录 ACM FAccT '26）。它在本文中只作为方向性旁证：偏好标注的规范角色（延伸设计者判断 / 提供独立证据 / 代表群体行使权威）很少被明说，而不同角色对"该如何征求、验证和聚合标注"有不同要求。**为避免过度引用，摘要原文未在正文中直接引用，本文也没有使用该论文的任何实验数字。**
- 我未能核对的项：**偏好数据的标注者间一致性（IAA / κ）真实数值**。Chatbot Arena 摘要页只说"good agreement"，不给数字；本次 5 次抓取预算内没有取到带 κ 原句的可公开页面。按标准要求，这个数字从正文中删掉了，不等同于"没有分歧"。
- 正文中关于"两次压缩各自压掉了什么"、"拆维度方式决定标注行为"、"检查表查不到尺子"的分析，是我基于以上来源自行整理的工程解读，没有独立复现实验，也没有引用任何非公开的运行数据。
