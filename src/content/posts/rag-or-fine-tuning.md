---
title: "0.353 掉到 0.219：微调把新事实塞进参数，为什么反而更差"
description: "同一个任务上，基础模型答对 0.353，微调后掉到 0.219，检索把它抬到 0.585；商业微调 API 学新知识的平均泛化准确率是 37%，更新旧知识是 19%。这些数字指向同一条分工线：知识该进上下文，行为才该进参数。"
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

同一张表里，同一个模型，同一批题：基础模型答对 **0.353**，用新事实微调之后掉到 **0.219**，把资料放进上下文则升到 **0.585**（[arXiv:2312.05934](https://arxiv.org/abs/2312.05934)，Microsoft，v3 于 2024-01-30）。

微调把一个原本偶尔答对的模型，训练成了更常答错的模型。这不是训练没收敛，而是这类事实根本没进得去——参数里的更新推的不是一条事实，是一整片分布的形状。

## 01 / 一个受控对照：0.353、0.219、0.585

这篇论文把"新事实"单独做成了一个任务：2023 年 8 月到 11 月发生在美国的时事，全部在三个模型的训练截止之后，用 GPT-4 从维基百科段落生成多选题。论文对这个设计的说法是：

> This method enables us to mostly guarantee that the models have not been exposed to these facts, thus allowing us to directly test knowledge injection capabilities.

同一个语料库，两种用法——一半拿去微调，一半留给检索；评测题完全相同。结果是（数字取自该论文表 2，口径为准确率）：

| 模型 | 基础模型 | 加检索 | 常规微调 | 微调 + 检索 |
| --- | --- | --- | --- | --- |
| Mistral 7B | 0.481 | **0.875** | 0.504 | 0.810 |
| Llama2 7B | 0.353 | **0.585** | 0.219 | 0.326 |
| Orca2 7B | 0.456 | **0.876** | 0.511 | 0.820 |

三行读下来，只有检索那一列是干净上行的。微调让 Mistral 和 Orca2 各涨 0.023 和 0.055，让 Llama2 掉了 0.134——比什么都不做更差。加检索之后，微调带来的增量被压成 0.810 对 0.875、0.326 对 0.585。

论文自己的结论比表格更直白：

> Our findings reveal that while unsupervised fine-tuning offers some improvement, RAG consistently outperforms it, both for existing knowledge encountered during training and entirely new knowledge.

## 02 / 参数里能装多少事实

如果 0.219 只是"训练不够"，那就该有能补上的配方。换一个团队、换一种训练方式，去测微调到底能装多少。

一项用 LoRA 微调 Llama-3.1-8B-Instruct 的研究，把新事实按 1、10、50、100、500、3000 条逐档注入。前几档很漂亮：

> As it can be seen from Table 2, models can learn up to 500 unknown samples with 100% reliability score.

到了 3000 条这一档，同一张表里"3000 条未知 + 每条配 10 条已知事实"那一格的可靠性分数是 **0.48**，附加已知事实反而拖慢收敛。容量边界不是一个抽象顾虑，它在论文里就是一个具体的数。

换到"花钱就能用"的商业接口，边界同样存在。FineTuneBench 微调了五款前沿模型（OpenAI 的 GPT-4o、GPT-4o mini、GPT-3.5 Turbo，Google 的 Gemini 1.5 Pro、Flash），测两件事：学新事实（近期新闻、虚构人物档案）与改旧知识（更新的医疗指南、代码框架）：

> Our results reveal substantial shortcomings in all the models' abilities to effectively learn new information through fine-tuning, with an average generalization accuracy of 37% across all models. When updating existing knowledge, such as incorporating medical guideline updates, commercial fine-tuning APIs show even more limited capability (average generalization accuracy of 19%).

学新知识 37%，改旧知识 19%。更值得看的是失败长什么样：模型能把训练过的问答对背到几乎满分，一旦换个说法就散了。

> In the Fictional People dataset, the secondary and comparison questions are intended to test the ability of the models to make judgments based on the learned facts. … On the secondary questions, we observe a maximum 7% improvement in performance from baseline with gpt-4o-mini (from 38% to 45%); other models showed less improvement or regression after fine-tuning.

论文给的例子更刺眼：模型学会了"2024 年 9 月 8 日道奇体育场开球时气温 103 华氏度"，把题目里的日期换成 2030 年 9 月 8 日，它照样回答 103 度，而不是说无法预知未来。

注意那个 103 度：它错的不是数字，而是**把事实学成了一个不可撤销的默认值**。参数里没有"这条只在 2024 年成立"这种标注位置，日期改掉了，被触发的那片分布却没变。

看完这条线索，"知识该不该进参数"就不再是一个偏好问题，而是一个有边界的容量问题：几百条可以，三千条开始崩，而真实语料从来不是几百条。商业服务上还要再打折——37% 和 19%，而且掉得最狠的正是"更新已有知识"。

## 03 / 机制：写进权重的是先验，写进上下文的是约束

为什么更新旧知识比学新知识更难？FineTuneBench 的推测指向一个精确的位置：新知识只要"加上去"，更新则必须先顶掉旧答案，再把改动传播到这份知识出现的每一处。代码库里改一个函数名，模型得同时学会改名的定义和所有调用点。

顺着这条推测就能看到机制上的分界：写在权重里的东西是一个**先验**——它参与每一次前向计算，没有来源、没有作用域，也没法单独撤下；写进上下文里的东西是一条**约束**——只在这一条请求里成立，请求结束就消失，而且可检索、可替换、可事后核对。

微调改的是先验的形状。"事实微调"失败，不是梯度没走到，而是它压根没有"插入一条 $q \to a$"这种操作，只有"把整个分布推动一点"。于是它必然带来两个可观测的副产品。

**学得慢。** 一项受控研究把微调样本里"引入新知识"的比例当成自变量，发现引入新事实的样本学得比与模型已有知识一致的样本慢得多；而当这些新事实最终被学会时，它们让模型**线性地**更倾向于幻觉（[arXiv:2405.05904](https://arxiv.org/abs/2405.05904)，EMNLP 2024 长文，摘要原文）：

> We demonstrate that large language models struggle to acquire new factual knowledge through fine-tuning, as fine-tuning examples that introduce new knowledge are learned significantly slower than those consistent with the model's knowledge. However, we also find that as the examples with new knowledge are eventually learned, they linearly increase the model's tendency to hallucinate.

**没来源。** 检索答错的请求，你能指出是哪一段、哪一句、是不是排到了第三位；参数答错的请求，你只有一句同样自信的话，没有任何可追的线索。这正是开头那张表里最容易被忽略的差别：0.219 和 0.585 之间不只有分数差，还有"能不能改"的区别。

这也反过来解释了微调真正擅长什么。行为与格式的改动有一个共同点：**它是一条可以示范的转换规则**——"把这段对话压成十个字"、"只输出 JSON"、"先用一句话给结论"。这类规则在输入上处处成立，所以用几百条示例去推那一片分布，推对了就整体迁移。而一条事实恰恰相反：你无法预先示范它会在哪些输入上出现，也无法在训练时把不相关的输入排除在外。前者是给分布塑形，后者要求往分布里插一个点——后者不是微调做不到的问题，是它没有那个接口。

## 04 / 分工按错误类型切，不按"运行前还是运行时"

于是判据只剩一条，而且可以先看数据、不用先看方案：**这个错误能不能归因到某一次输入？**

打开那些答错的请求，如果正确的那一句其实已经躺在被处理过的文本里，只是没被选进来、被切碎了、或者旧版本排在前面——那是输入层的问题。修法在数据与检索那一侧：改切分、改排序、把该有的资料补进去。它的好处是可以一条一条验证，而且改动随时可以撤。

如果换十个完全不同的输入，错误是同一个形状——该输出 JSON 却讲了一段话、该拒绝却给了建议、该简短却每次写五段——那和资料无关。这时才轮到最后一步之前该做的事：把要求写清楚、给出几十条优质示例、把提示与上下文调到极限，仍不行再考虑微调。微调在这里是合适的，因为格式是输出分布的性质，和某条事实真假无关。

两边的差别可以压成一句话：**影响一条请求的改动，别写进影响之后所有请求的地方。**

还有一个更硬的判据：这笔知识接下来会怎么变。医疗指南、内部代码库、公司话术每隔一段时间就会更新——更新恰恰是那张表里最差的一档（19%）。拿到新版本时，模型手里同时有旧先验和新答案，而这正是更新比新增难的原因。落到库里则只是删掉一个 chunk、加进一个 chunk，下一条请求就生效，不需要重新训练、重新评测、重新上线。

反过来说，参数化的价值从来不是"记得更多"，而是"不必在每一次请求里现给"。当检索本身不可行（数据不能出域、延迟预算卡死、知识库远大于上下文窗口）时，才轮到为知识付训练的代价。也正是在这种处境里，那张表最后两列才有意义：**微调 + 检索**——训练负责让模型会用给它的材料，检索负责材料本身。

这也解释了整篇文章为什么不是"哪个更好"。0.353 掉到 0.219 的那一格，和 0.810 那一格，用的是同一个模型、同一批事实、同一个训练脚本，差别只在事实被写在哪里。**事实不该靠训练进去，行为不该靠一句指令稳住**；一旦把这两件事分开，"先做 RAG 还是先做微调"就不再是升级顺序问题，而是一个可以被验证的判断——加一条资料，看那十个问题的答案有没有变。

## 资料与边界

核对日期：2026-10-05。以下数字均取自各自论文或官方页面原文，并注明所用版本。

- [Fine-Tuning or Retrieval? Comparing Knowledge Injection in LLMs，arXiv:2312.05934](https://arxiv.org/abs/2312.05934)（Microsoft，v3，2024-01-30；数据页 [arXiv:2312.05934v3](https://arxiv.org/html/2312.05934v3)）：新事实任务（2023-08 至 2023-11 美国时事）上，基础模型 0.481 / 0.353 / 0.456，加检索 0.875 / 0.585 / 0.876，常规微调 0.504 / 0.219 / 0.511，微调加检索 0.810 / 0.326 / 0.820（该论文表 2，准确率口径）。结论引用自摘要。2024 年初的结果。
- [Does Fine-Tuning LLMs on New Knowledge Encourage Hallucinations?，arXiv:2405.05904](https://arxiv.org/abs/2405.05904)（v3，2024-10-01；EMNLP 2024 长文）：引入新知识的微调样本学得显著更慢；这些样本被学会后线性抬高模型的幻觉倾向。引文取自摘要原文。
- [How Much Knowledge Can You Pack into a LoRA Adapter without Harming LLM?，arXiv:2502.14502](https://arxiv.org/abs/2502.14502)（v3，2025-03-24）：Llama-3.1-8B-Instruct 用 LoRA 注入 1/10/50/100/500/3000 条未知事实，500 条时可靠性 1.0，3000 条时 0.48。数字取自该论文表 2 与 5.1 节正文。
- [FineTuneBench，arXiv:2411.05059](https://arxiv.org/abs/2411.05059)（v2，2024-11-11）：五款前沿模型（GPT-4o、GPT-4o mini、GPT-3.5 Turbo、Gemini 1.5 Pro、Gemini 1.5 Flash）在商业微调接口上学新知识的平均泛化准确率 37%，更新已有知识 19%；二次问题上最好模型仅提升 7%（38%→45%）。引文取自摘要与 3.1 节原文。
- [How to fine-tune chat models（OpenAI Cookbook）](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_finetune_chat_models.ipynb)：官方示例把微调用在命名实体识别这类结构化输出任务上，训练样本 30–50 条起步。用于说明厂商示例里的微调对应的是行为与格式，不是知识注入。

未采用的来源：OpenAI 的《Optimizing LLM accuracy》文档页在本机反复返回 403，无法取得逐字原句，因此文中没有引用它的任何文字与数字；没有使用任何第三方榜单、二手转述或镜像站（ar5iv、export 等）的数字，也没有引用 FineTuneBench 表 2 的逐模型分数，因为该表在原页被截断，未能完整核对。

文中"先看错误能不能归因到某次输入"的判据，是我根据上述结果的工程整理，没有独立复现实验，也没有引用任何非公开或私有数据。
