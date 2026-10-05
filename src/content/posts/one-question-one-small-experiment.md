---
title: "97% 的原始研究都显著，复现只剩 36%：小实验只能问一个问题"
description: "同一批研究重做一遍，显著比例从 97% 掉到 36%，效应量缩到一半；癌症生物学里计划重做的 193 个实验只完成 50 个。这组数字说明了为什么「一次只改一个变量、事先写下失败条件」不是谨慎，而是让一次实验真的留下信息。"
date: '2026-10-05'
category: 思考与成长
tags:
- 长期成长
- 评测
authorship: assisted
draft: false
featured: false
---

2015 年，一个跨机构团队把 100 项已发表的心理学研究按原样重做了一遍。原研究里 97% 有统计显著的结果；重做之后，显著的比例掉到 36%，复现测到的效应量平均只有原来的一半。六年后，癌症生物学的复现项目给出另一个数字：他们计划重做 53 篇高影响力论文里的 193 个实验，最终只完成了 50 个——26%。

这两组数字并排看，说的不是「论文不靠谱」，而是一次实验的信息量到底从哪里来。你看到一个方法，比如「按标题切分资料比按固定长度切分更适合我的问答」，最省事的验证方式是一次换掉分块方式、推理模型和提示词，再从结果里挑最好看的那个数字。这样得到的成功，和那 97% 里的多数一样，扛不住第二次。

这条线只讲一个动作：一次只问一个能被推翻的小问题。它决定了一次实验最后还剩多少信息，剩下的都是它的推论。

## 一、显著性是针对单次比较的报价

显著这个门槛，本身只说明一件事：如果实际上什么都没发生，你有多频繁会看到「有效」。在心理学里这份报价是 ≤.05，Simmons、Nelson 和 Simonsohn 在 2011 年把它称为研究者的「名义承诺」。他们那篇文章的结论是，收集、分析、报告上的灵活性会大幅抬高实际的假阳性率——「很多时候，研究者错误地发现一个效应存在的机会，比正确发现它的机会还大」。

关键在于报价的单位：一次比较。你同时改两个变量，多出来的不是一次实验，而是一组比较。两个变量各自的效果、组合带来的差异、以及任何你在看到结果之后才决定要看的指标，每一个都单独走一遍这套计价。比 k 次、每次都按 5% 算，你实际承担的错误率远高于 5%，而门槛上的数字一个字都没变。所以「顺手多加点东西」的实验特别容易得出令人满意的结论：不是方法成立，是同一份报价被反复消费了。

落到自己手上：这次只换分块方式，资料、问题集、回答方式全部固定，那么「结果变好」这句话只剩一个解释通道。你要的正是这个效果——把其余解释一次性排除掉，让一次运行只能回答一个问题。改了三样，即使变好，也是把三种解释一起装进了结论；下次它变差时，你不知道该退回哪一样，只能从头再猜。一次只动一个变量不是为了显得严谨，而是为了让变好和变坏都能指向一个具体的东西，而不是指向一堆同时被改动的东西。

## 二、小样本只会把大效应筛出来

门槛固定在噪声上，而噪声随样本量下降。样本越小，要跨过同一个门槛，信号本身就得越大；运气也越容易替你把结果推过去。于是小实验里活下来的，很少是「某个效应存在」，多数是「某个大效应加上一次好运气」。

这解释了复现时效应量为什么系统性缩水。心理学那 100 项研究的复现实验里，复现效应量是原文的一半——不是原来的方向错了，而是原文报出的放大倍数里有一半来自小样本。癌症生物学的数据更极端：在能完成的实验里，复现效应量的中位数比原文小 85%，92% 的复现效应量都小于原文。更说明问题的是功效预期：按这些实验自身的功效推算，如果复现结果与原文一致，本应有约 87% 达到统计显著，实际只有 43%。

Button 等人在 2013 年把这件事写成了机制：低统计功效不仅降低发现真效应的机会，也降低了一个显著结果真的反映真效应的几率，直接后果是高估效应量与低复现率。换句话说，小样本不是降低了实验的分辨率，而是改变了它输出的东西——它系统性地把大数字递给你。

回到那个分块实验。如果你只挑 10 个问题跑一轮，固定长度切分赢了两个点，这两个点里有相当一部分是你挑这 10 个问题时带进去的噪声。样本小的时候，「胜出」这个事实本身就在提示：你测到的差值被放大了。看到大效果，先怀疑样本，再考虑方法。这里还有一个容易忽略的对称性：小样本不只放大赢的幅度，也放大输的幅度。同一份噪声，这一轮帮你把方法推过门槛，下一轮就能把它推到门槛以下，而你对方法的判断会跟着这两次结果来回摆动。

## 三、把问题写下来，写的是「什么算失败」

事前声明不是道德要求，它改的是数字的含义。同一个 0.04：如果它是你试了十二个指标之后剩下的那一个，它的含义是「十二次里的一次意外」；如果它是你事前指定的唯一指标，它才落在那份 5% 的报价之内。数值一样，证据强度不一样。

Kaplan 和 Irvin 在 2015 年提供了一个真实对照。他们找出 1970–2012 年间所有大型 NHLBI 心血管试验，共 55 个。2000 年前发表的 30 个里，17 个（57%）在主结局上报告了显著获益；2000 年后发表的 25 个里，只有 2 个（8%）报告了显著获益。前后最大的差别不是药，是规则：2000 年之后所有试验都必须先在 ClinicalTrials.gov 登记，主结局必须在看到数据之前声明。而在这 25 个预先登记的试验里，有 12 个在「非主结局」的心血管指标上得到了显著正向结果。论文的原话是：如果不要求事前声明主结局，几乎一半的试验都能报出一个阳性结果。

同一批数据，8% 和接近一半。差别只在于「哪个数字算数」是在看数据之前还是之后决定的。事前写下判据，等于把事后挑选这条路封掉了。

癌症生物学那个 193 → 50 属于同一层，方向相反：143 个实验没能重做，原因不是结论有问题，而是原文没有把方法、材料、数据写到别人能照着做的程度。写不下来的部分，就是这次实验测不到的部分，这条标准对个人实验一样成立。跑之前你要能回答三个问题：输入是什么、判据是什么、哪个结果会推翻我现在的判断。第三个答不出来，那还不算一个问题，只是一个愿望。这三个问题的答案不取决于你多聪明，只取决于你有没有在看结果之前把它写过一遍。

## 四、允许一次实验得出「停」

一个总能被解释成成功的设计没有信息量：变好是方法有效，没变化是效果需要时间，变差是环境不同。三种结果都保住原判断，实验就白跑了。

事前写下失败条件之后，结果只剩两种。达到条件，是弱证据——你只做了一次比较，效应量仍被小样本放大，它只配换到「值得再问一次」。没达到，是强信息——它一次排除了这个方法的这一种用法，你不必再去试它的变体。这也是为什么那些复现项目值得重做上百个实验：单个失败说明不了什么，成规模的失败本身就是一个结论。

个人实验最容易漏掉的一格恰好是停止条件。写判据的时候，人会本能地写成「如果变好，就继续做」；而一个只能通向继续的条件，等于没有条件。把它写成「如果 X 没有发生，我就停」，这句话才真正把实验锁在一个问题上。小实验的价值也不在于结论多大，而在于它能被下一个问题很快接上：一个允许自己停下来的实验，才会把下一步交给真正待验证的那一点，而不是交给上一次结果里最讨喜的那个数字。

回到开头。100 项研究里 97% 当初显著，重做后 36% 显著，不是那 61 项的作者在编数据，而是一次实验能同时扛住的解释数量有限，而「显著」这个标签扛不住事后无限次挑选。小实验的机会也在这里：一次只问一个能被推翻的问题，答案就只有一个——要么它被推翻，要么它值得你再问一次。其余的提问方式，最后拿到的都是同一句话：有点效果。

## 资料与边界

核对日期：2026-10-05。以下数字均取自各页面原文，使用的都是论文正式发表版本，不是预印本。这些研究来自心理学与生物医学，本文用它们说明实验方法层面的机制，不表示软件或 AI 实验有相同的复现率。

- [Estimating the reproducibility of psychological science（Open Science Collaboration），Science 349(6251):aac4716，2015-08-28，PMID 26315443](https://pubmed.ncbi.nlm.nih.gov/26315443/)：摘要原文「Ninety-seven percent of original studies had statistically significant results. Thirty-six percent of replications had statistically significant results」以及「Replication effects were half the magnitude of original effects」。用于开头的 97% 与 36%，以及第二节的「效应量是一半」。样本为三个心理学刊物 2008 年前后发表的 100 项研究，不代表当前其他学科。
- [Investigating the replicability of preclinical cancer biology（Errington 等），eLife 10:e71601，2021-12-10，DOI 10.7554/eLife.71601](https://pmc.ncbi.nlm.nih.gov/articles/PMC8651293/)：原文「we only completed 50 of the 193 experiments (26%) we planned to repeat」；「the median effect size in the replications was 85% smaller than the median effect size in the original experiments, and 92% of replication effect sizes were smaller than the original」；「we would expect approximately 87% of replications to be statistically significant and positive … which is considerably higher than what we observed (43% …)」。用于 193 → 50、85%、92%、87% 对 43%。实验对象是细胞与小鼠等临床前研究，不是软件系统。
- [False-Positive Psychology: Undisclosed Flexibility in Data Collection and Analysis Allows Presenting Anything as Significant（Simmons、Nelson、Simonsohn），Psychological Science 22(11):1359–1366，2011-11，DOI 10.1177/0956797611417632](https://pubmed.ncbi.nlm.nih.gov/22006061/)：摘要原文「flexibility in data collection, analysis, and reporting dramatically increases actual false-positive rates. In many cases, a researcher is more likely to falsely find evidence that an effect exists than to correctly find evidence that it does not.」以及「nominal endorsement of a low rate of false-positive findings (≤ .05)」。用于第一节的 5% 报价与「灵活性抬高实际假阳性率」。文中「比 k 次」的错误率推算是我按同一门槛做的算术推演，不是该文给出的数字。
- [Likelihood of Null Effects of Large NHLBI Clinical Trials Has Increased over Time（Kaplan、Irvin），PLOS ONE 10(8):e0132382，2015-08-05，DOI 10.1371/journal.pone.0132382](https://pmc.ncbi.nlm.nih.gov/articles/PMC4526697/)：原文「17 out of 30 (57%) reported significant benefit for their primary outcome … only 2 of 25 trials (8%) reported a significant benefit」以及「12 reported significant, positive effects for cardiovascular-related variables other than the primary outcome. Importantly, almost half of the trials might have been able to report a positive result if they had not declared a primary outcome in advance.」。用于第三节的 57% 对 8% 与 12/25。这是历史对照的观察性研究，论文只主张预注册与零结果趋势「强相关」，不能读成一次因果实验。
- [Power failure: why small sample size undermines the reliability of neuroscience（Button 等），Nature Reviews Neuroscience 14(5):365–376，2013-05，DOI 10.1038/nrn3475](https://pubmed.ncbi.nlm.nih.gov/23571845/)：摘要原文「low power also reduces the likelihood that a statistically significant result reflects a true effect … The consequences of this include overestimates of effect size and low reproducibility of results.」。用于第二节的机制表述；该文提到的具体功效数值我未在原文页面上核对，因此没有引用。
- 没有使用任何第三方榜单、自媒体转述或二手汇总。文中「按标题切分比固定长度切分更适合问答」只是设计示例，没有对应的实验数据。
