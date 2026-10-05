---
title: "90000 条短视频与 173 段课程视频：30 秒快讯的胜负在第 5 秒"
description: "Snapchat 对 90000 条短视频的实测显示，第 5 秒的留存与整体观看时长相关性 0.926；而一份医学课程视频研究里，观众一旦开始看，92% 会看完。把这两组数字放在一起，30 秒快讯的剪辑顺序会被迫重排：先救开头，再谈压缩。"
date: '2026-10-05'
category: 独立创造
tags:
- 创作
- 产品设计
- 交互设计
authorship: assisted
draft: false
featured: false
---

制作 30 秒 AI 快讯时，我们习惯的收尾动作是压缩：删形容词、砍铺垫、核对时长。但公开实测里的观看行为，并不是这样分布的。

Snap 与香港中文大学 MMLab 在 2024 年公开了 SnapUGC 数据集：**90000 条真实的 Snapchat Spotlight 短视频**，每条视频的互动数据来自**超过 2000 名观看者**的聚合。他们发现，判断一条短视频能不能留住人，最稳定的指标不是平均观看时长，而是「**观看时长超过 5 秒的比例**」——论文把它命名为 ECR，并测出 ECR 与归一化平均观看百分比的相关性是 **0.926**（[arXiv:2410.00289v1](https://arxiv.org/abs/2410.00289)）。

0.926 这个相关系数需要解释一下：ECR 是「看过第 5 秒的人数比例」，NAWP 是把不同时长的平均观看时长归一化到 0 到 1 之后的量，也就是一条视频整体被看了多少。两者相关系数 0.926，意味着**一条 30 秒短视频最终被看了多少，几乎在第 5 秒就已经决定了**。压缩只能改变已经留下来的那部分人看到什么，而这些人是谁，是开头定下的。

## 「压缩」这个词，假设错了衰减曲线

把「30 秒」当成一个要往里塞东西的容器，背后有一个隐含假设：注意力是一条缓坡，从头到尾均匀变少，所以只要总量控制住就行。

公开数据里的曲线不是缓坡。

同一篇论文报告，短视频的 NAWP（归一化平均观看百分比）和 ECR 的分布都是**双峰**的——不是一条中间高、两边低的钟形曲线，而是两个分开的峰。作者把它归因于短视频平台的界面设计：用户会「快速划过」不感兴趣的视频，而对自己感兴趣的视频投入相对更长的时间。于是行为只有两种状态：几乎没看，和看了很久。

双峰意味着中间地带很薄。为「观众可能只看一半」而设计的叙事——先铺垫、再展开、最后总结——对着的是一群要么已经走掉、要么本来就会看完的人。

另两组来自课程视频的公开数据，把这条曲线钉得更死。一份 2025 年 3 月发表于 *Medical Education Online* 的研究（[PMC11912274](https://pmc.ncbi.nlm.nih.gov/articles/PMC11912274/)，PMID 40084627），统计了 152 名学生、173 段神经外科视频、三个学年的观看行为。它给出的全部数字中，最反常的一个是：

- 观众留存率（AR，看完的人占开始看的人的比例）中位数：**92.0%**（四分位区间 85.7–97.1）；
- 视频观看百分比中位数：**36.7%**（22.6–48.6）；
- 未访问率中位数：**61.2%**（49.1–75.5）；
- 提前流失率（在前 10% 时长内退出）中位数：**0%**。

看这三行：**一旦一个人按下了播放，他有 92% 的概率看完；但只有 36.7% 的内容被看了，因为 61.2% 的人根本没开始。** 中位的提前流失率是 0——视频内部没有「看到一半觉得没意思」这回事。

这才是 30 秒快讯真正的漏斗。损失几乎全部发生在播放之前和头几秒之内，而不是发生在第 15 秒。把精力投在「怎么把三条消息压进 30 秒」，是在改写曲线最平坦的那一段。

需要说明范围：这是本科医学翻转课堂的课程视频，时长 2:42–21:55 分钟，不是社交平台短视频。同一个漏斗形状能不能迁移到 30 秒快讯，取决于一件事——如果观众走掉的原因在语义上发生在开头，那么时长从 20 分钟缩到 30 秒只是把这个开头压缩了，没有把它挪走。

## 为什么开头决定一切：一次点击只买到一个判断

机制不难拆。

观众在信息流里面对一个视频时，掌握的信息只有三样：封面帧、标题文字、以及前一两秒的画面和声音。他必须用这三样东西做一个判断——**这个视频要讲的事，是不是我现在要知道的事**。判断做完，要么走，要么留；留下来之后，退出成本就变了：他已经投入了几秒钟，而下一个视频要重新做一次同样的判断。

这解释了两件在制作现场经常被归因错的事。

第一，**为什么讲短不是解药**。上面那份课程视频研究还测试了 4/5/6/7/8/9/10 分钟共七个时长门槛，结论是 5 分钟为最优（受众留存 p=0.039、嵌入问题作答率 p=0.045），但 7 分钟门槛的观看指数 p=0.031、8 分钟以上几乎全不显著。也就是说，长度的影响在 5 分钟上下最明显，再往长和再往短，边际效应迅速变小。短视频同理：把内容从 40 秒压到 25 秒，改变的是留下者看到的信息量，不是留下者的人数。

第二，**为什么「说得清」比「说得多」重要**。同一篇论文报告，把字幕转写文本加进预测模型，**没有带来提升**。作者给了两个原因：只有 **30%** 的短视频带有有效转写；而且「观众往往根据最开始的几秒来决定是否继续观看，在这段时间里他们只能捕捉到很少的口语内容」。

这是很硬的一条推论。观众做决定的那一刻，他还几乎没听到你说什么。所以开头几秒的胜负不由「说了多少信息」决定，而由「能不能让对方判断出这是什么」决定。一个报出主体、时间、变化的开头，和一个先从背景铺起的开头，在语义上差别很大——前者让观众能判断，后者逼观众再等几秒。

## 剪辑顺序：从时长分配改成信息前移

按上面的机制，30 秒快讯的排布原则可以从「怎么分配 30 秒」改写成三个动作。

**先写第一句，再写剩下的。**因为判断发生在开头，第一句必须自带主体、动作和时间——它承担的是过滤功能，不是引入功能。这件事不能等到配音生成之后再优化，那时候第一句往往已经是为了「顺场」而写的过渡句。

**用留存信号验收，而不是用时长验收。**时长是成本项，不是效果项。可以拿来验收的量是「前 5 秒还剩下多少人」和「看完的人占开始看的人的比例」，前者对应 ECR，后者对应 AR。这两个指标都要求把 30 秒拆成几段单独看数据；只看整体的平均播放时长，会把开头的问题平均掉。

**把「压缩」留给已经通过开头的部分。**删形容词、删重复铺垫、删不影响理解的限定词，这些动作只在留下来的人身上生效。它们该做，但顺序在后面。把压缩当第一步，等价于对着一群已经走掉的人优化画面。

还有一条边界值得写下来：Snapchat 的推荐系统本身也在用类似的信号做分发，所以「前 5 秒留存」不只是一个观看体验指标，它同时是分发信号。开头做不好，后面的画面再讲究也没有第二次机会。论文也明确了这一点——NAWP 与 ECR 都取决于具体推荐系统，不同平台的偏好分布会带来偏差，因此这些数字应被读作「在该平台的真实用户互动中测得」，而不是放之四海的常数。

## 收束

「先压缩叙事，再选择动效」这句话本身没错，但它跳过了最贵的环节。90000 条短视频的数据说，第 5 秒的留存与最终观看量相关性 0.926；173 段课程视频的数据说，视频内部几乎不流失（提前流失率中位数 0%），损失都发生在播放之前和开头（未访问率 61.2%）。

所以顺序应该是：先把开头做成一个能被判断的句子，再决定这 30 秒里留下什么，最后才是压缩与动效。压缩是对的，只是它不是第一件事——它是对已经进来的人做的事。

## 资料与边界

核对日期：2026-10-05。以下两条来源的数字均取自对应页面原文；论文版本按 `abs` 页记录。

**1. [Delving Deep into Engagement Prediction of Short Videos，arXiv:2410.00289](https://arxiv.org/abs/2410.00289)**（v1，提交于 2024-09-30，ECCV 2024；核对的是 [`arxiv.org/html/2410.00289v1`](https://arxiv.org/html/2410.00289v1)。该论文只有 v1，`abs` 页无 last revised 记录。）

逐字原句：

> Rather than relying on view count, average watch time, or rate of likes, we propose two metrics: normalized average watch percentage (NAWP) and engagement continuation rate (ECR) to describe the engagement levels of short videos.

> For quantifying engagement levels of short videos, we propose to employ two key metrics: normalized average watch percentage (NAWP) and engagement continuation rate (ECR). … ECR represents the probability of watch time exceeding 5 seconds, which assesses whether the video's outset is captivating enough to retain viewers' interest in continuing to watch.

> To mitigate sampling bias from small number of views, only short videos with view numbers exceeding 2000 are selected.

> Furthermore, we observe a robust correlation of 0.926 between ECR and NAWP.

> It is observed in Figure 2(f) and (g), that distributions of NAWP and ECR exhibit a bimodal pattern. … This behavior exists due to the common UI designs that encourages "swiping" to skip boring videos in short video platforms.

> However, our findings indicate that adding transcripts does not yield improvements. This observation can be attributed to the fact that only 30% of short videos include effective transcripts. Additionally, viewers often decide whether to continue watching based on the initial seconds, during which they only catch a small amount of the spoken content.

论文中该数据集为 90000 条 Snapchat Spotlight 短视频，时长 10–60 秒，指标由超过 2000 名观看者的聚合互动数据得出（摘要与 Table 2：`Annotators number ≥ 2000`；Table 2 原文写 "Real User Interactions"）。

用在文中：开头段（90000 条、2000 名观看者、ECR 定义、0.926）；第 2 节（双峰分布）；第 3 节（字幕转写无提升、30%、"基于最初几秒做决定"）；第 4 节（推荐系统偏差）。

**2. [Student engagement in a flipped undergraduate medical classroom to measure optimal video-based lecture length，PMC11912274](https://pmc.ncbi.nlm.nih.gov/articles/PMC11912274/)**（*Medical Education Online*，2025-03-14，30(1):2479752，doi:10.1080/10872981.2025.2479752，PMID 40084627。）

逐字原句：

> The median percentage of video viewing was 36.7% (22.6; 48.6). The median AR percentage was 92.0% (85.7; 97.1). The median viewing index was 1.34 (1.20; 1.44). The median non-access rate was 61.2% (49.1; 75.5), much higher in 2023/24 (71.4%) than in the previous two academic years. The median early dropout rate was 0% (0; 2.56).

> Videos under 5 minutes in length were associated with higher audience retention and higher response rates to embedded questions in the univariable analysis (p = 0.039 and p = 0.045, respectively).

> No statistically significant difference was observed between the groups for the outcome viewing percentage. … A higher viewing index was observed in videos under 4, 5, and 7 minutes (median 1.35 in all cases). However, the differences were only statistically significant between videos longer and shorter than 7 minutes (p = 0.031).

> Video length was variable (range 2:49–21:55 minutes), with a mean duration of 7:29 minutes (SD 3:28).

> Based on these findings, a 5-minute cut-off was identified as the optimal video length, as student retention and feedback tasks were significantly improved for videos less than or equal to 5 minutes in length.

样本：152 名学生（174 名选课学生中注册平台者）、3 个学年（2021/22–2023/24）、173 段视频，单一授课者，课程内容与教学方法保持不变。文中「4/5/6/7/8/9/10 分钟七个门槛」即该研究 Table 1 的全部切点；「8 分钟以上几乎全不显著」指 Table 1 中 ≥8 分钟各行的 p 值（0.221、0.950、0.065、0.256、0.147、0.911）。

用在文中：第 2 节（36.7% / 92.0% / 61.2% / 提前流失率 0%）；第 3 节（5 分钟门槛、7 分钟门槛、8 分钟以上不显著、视频时长范围与均值）。

**未采用，以及为什么**

- 草稿里「前 3 秒建立主题，中间约 23 秒，最后约 4 秒」的时间分配：查不到任何公开来源给出这组数字，已从正文删除，未替换。
- [Guo, Kim & Rubin, *How Video Production Affects Student Engagement*（L@S 2014，doi:10.1145/2556325.2566239）](https://doi.org/10.1145/2556325.2566239)：被公认为「MOOC 视频 6 分钟最优」的原始出处，但本轮 `dl.acm.org` 的摘要页与 PDF 均返回 HTTP 403，Univ. of Michigan 的仓库直链抓取超时，**我没有拿到该论文页面上的逐字原句**，因此正文没有引用它的 6 分钟结论。上面那句「6 分钟」若出现在别处，同样属于我未核对的内容。
- 检索中出现过的第三方榜单页、自媒体转述与 ar5iv 镜像：一律未使用，也未据其写入任何数字。
- 该研究本身提示：约 36% 的观看百分比与 61.2% 的未访问率意味着「内容被需要」是首要变量；视频时长不是唯一决定因素，发布时间与课程结构同样显著（seminar 结构 +14.19 个百分点，p<0.001；距期末考试的周数 +5.87 个百分点，p<0.001）。

**本文的性质**：正文第 4 节把上述两组数据整理为 30 秒快讯的剪辑原则，属于我基于公开结果的工程推断，没有独立复现实验，也没有任何私有或未公开的运行数据。两组数据分别来自 2024 年的社交平台短视频与 2021–2024 年的医学课程视频，都不代表当前平台算法或当前观众行为。
