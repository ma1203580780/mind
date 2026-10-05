---
title: "标准说了别重试，队列说重复会来：去重窗口只有 5 分钟"
description: "HTTP 规范禁止自动重试非幂等请求已经四年，而 SQS 的文档直接承认“可能投递多份”，FIFO 的去重窗口只有 5 分钟，Kafka 的幂等保证只在单个生产者会话内成立。三层保证拼起来看，重复投递不是实现缺陷，而是去重状态的长度问题。"
date: '2026-10-05'
category: AI 工程
tags:
- AI工程
- 成本优化
- Agent
authorship: assisted
draft: false
featured: false
---

重试这件事上有两份官方文件是互相打架的。一份是 [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)，2022 年 6 月发布的 HTTP 语义标准，它写得很硬：客户端不该自动重试非幂等请求，代理绝不能自动重试非幂等请求。另一份是 [Amazon SQS 的开发者文档](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html)，它同样写得很直接：标准队列保证「至少一次」投递，而且**因为架构高度分布，消息可能被投递不止一份**。

一个是禁止，一个是承认。这不是谁写错了，而是两层系统在回答两个不同的问题：HTTP 规范管的是「这一次重试允不允许发生」，队列文档管的是「已经发生的重复你打算怎么办」。绝大多数线上事故落在后一个问题的盲区里，因为我们都以为合规等于干净。

## 规范只管资格，不管结果

RFC 9110 第 9.2.2 节的定义非常省事：

> A request method is considered "idempotent" if the intended effect on the server of multiple identical requests with that method is the same as the effect for a single such request.

关键词是 **intended effect**——意图上的效果，不是账上的效果。规范自己紧接着就点破了这层窗户纸：幂等只约束用户请求的那部分，服务器完全可以对每个幂等请求单独记日志、留版本历史，或者做别的非幂等副作用。

真正可操作的是下一段：

> Idempotent methods are distinguished because the request can be repeated automatically if a communication failure occurs before the client is able to read the server's response.

也就是说，一个方法配不配自动重试，取决于「重复一遍会不会出事」，而这个判断由调用方做。规范在后面收紧了边界：不幂等的方法不该自动重试，除非客户端有办法知道请求语义**实际上**是幂等的，或者有办法检测到原始请求**从未被应用**。它还专门点名了一种做法——有的客户端比较冒险，看到连接在收到响应任何一部分之前就关了，就直接重试 POST。规范没说不许，只说这有风险。

这里就是第一个断点：合规并不产生任何去重能力。规范只是把「能不能重试」这个决定推回给调用方，代价零存储、零延迟。JSON-RPC 没有方法幂等表，gRPC 的普通一元调用同样没有，所以我们自己包一层 `createArticle` 的时候，手上其实什么都没有。

## 队列把话说得更难听：重复是设计的一部分

SQS 标准队列的文档几乎没有给使用者留幻想：

> Standard queues ensure at-least-once message delivery, but due to the highly distributed architecture, more than one copy of a message might be delivered, and messages may occasionally arrive out of order.

「至少一次」在工程上应该读成「一份或更多份」。文档紧接着给出了判据：标准队列适合的场景，是**你的应用本来就能处理重复或乱序的消息**。不是「配置一下就能避免重复」，而是先证明你能扛住。

想要队列层帮你挡掉重复，得换 FIFO 队列，而它的承诺是有窗口的：

> If you retry the `SendMessage` action within the 5-minute deduplication interval, Amazon SQS doesn't introduce any duplicates into the queue.

5 分钟。这就是「精确一次」在 SQS 上的物理形态：一份 5 分钟内有效的去重账本。它不做永久去重，也没打算做。文档给的两种去重方式也说明了它的性质——要么按消息正文算 SHA-256 当去重 ID，要么由你显式提供去重 ID。前者意味着正文一改就是新消息，后者意味着那份 ID 的生成逻辑在你自己手上。

为什么会是「至少一次」而不是「至多一次」，机制藏在接口形状里。标准队列的消费是分开的两步：`ReceiveMessage` 把消息和被派生的收据句柄（receipt handle）交给消费者，`DeleteMessage` 才用这个句柄真正把消息从队列里删掉。取走和删除是两次独立调用，中间没有能同时包住两者的原子操作。消费者在两步之间死掉，消息就会重新可见、被再次投递——这正是「至少一次」的代数含义：删除最后发生，所以最坏情况是投递两次。

亚马逊把「消息不丢」和可用性排在「消息不重」前面，代价就落到了消费者头上——你要么自己带账本，要么换成 FIFO 队列，把这份账本交给 AWS 保管。而后一种选择的价格也写在文档里：标准队列支持「几乎无限」的每秒 API 调用量；[高性能 FIFO 的文档](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/high-throughput-fifo.html)给出的数字是：

> Each partition supports up to 3,000 messages per second with batching, or up to 300 messages per second for send, receive, and delete operations in supported regions.

排序和跨分区去重是分区级状态，状态要记账，记账就得串行化，串行化就吃吞吐。这不是 AWS 实现得不够好，这是「按序 + 去重」这个承诺本身的形状。窗口、分区、吞吐三个数字是一起动的，动一个另外两个就跟着动。

## Kafka 的幂等是一次会话的买卖

Kafka 走的是另一条路：让代理端参与去重。[KIP-98](https://cwiki.apache.org/confluence/spaces/KAFKA/pages/66854913/KIP-98+-+Exactly+Once+Delivery+and+Transactional+Messaging)（采纳稿，最近更新于 2026 年 3 月）在动机一节里把默认行为说清楚了：

> Kafka currently provides at least once semantics... Duplicates may occur in the stream due to producer retries. For instance, the broker may crash between committing a message and sending an acknowledgment to the producer, causing the producer to retry and thus resulting in a duplicate message in the stream.

注意失败点在协作的接缝上，不在任何一方内部：代理提交了消息、还没把确认发出去就崩了，生产者等不到确认只能重发。

KIP-98 引入生产者 ID（PID）和序列号来堵这个缝：代理记录每个 PID 对每个分区的序列号，序列号不是恰好比上次大 1 就拒绝，偏低报「重复」可以直接忽略，偏高报「失序」是致命错误。到这里看，重复确实被实现层消掉了。但紧接着一句限定了范围：

> Further, since each new instance of a producer is assigned a new, unique, PID, we can only guarantee idempotent production within a single producer session.

**单个生产者会话内**。生产者一重启就是新 PID，账本从头开始；跨多个 TopicPartition 的写入还得再叠加事务，而事务要求显式配置，`enable.idempotence` 在 KIP-98 里默认是 false。把三层放一起看：HTTP 在语义层回避判断，SQS 在队列层做 5 分钟的窗口去重，Kafka 在会话层内做序列号去重。

## 去重不是策略，是一本会过期的账

三层机制的共同点比差异更有价值：**谁负责去重，谁就必须存下「我怎么认出同一次操作」的状态，而这份状态一定有生命周期。**

HTTP 把状态成本降到零——它不存任何东西，所以它给不出任何重复保证，只能把决定权交回调用方。SQS FIFO 把账本存在队列里，于是有了 5 分钟这个明确的过期时间，也就有了分区和吞吐的账单。Kafka 把账本存在生产者会话里，于是 PID 一换，账本即失效——而 PID 换掉的时刻，恰好就是重试最容易发生的时刻（进程崩了、发布上线了、连接重建了）。

这才是「去重窗口」这个说法的真正含义。它不是防火墙上的一个参数，而是**你能承担多长的记性**。窗口之外的重试，在任何一层的视角里都是一条全新的消息，因为证明它是旧消息的那份状态已经被回收了。

于是工程上的判断顺序就很清楚了：先问这条消息从产生到落地，中间隔了哪些层；再问每一层的记性有多长；最后拿最长的那个窗口去比对最坏情况下这条消息可能在路上的时间——也就是队列积压、可见性超时、进程重启、发布窗口和人工补跑叠在一起的那段时间。这个时间会显著超过 5 分钟，超出的部分就是重复投递的入口，任何一层的合规都堵不上。

窗口的长短还决定了一件反直觉的事：**重复率不由可靠性决定，由重试跨度决定。** 一个偶尔投递重复、但重复总在两秒内到达的队列，比一个极少投递重复、但重复可能在两小时后从积压里翻出来的队列要安全得多——因为后者落在任何一处窗口之外。判断风险时看的是「同一次意图最坏隔多久回来」，不是「重复有多常见」。这也解释了为什么重试退避策略会把事情弄糟：指数退避把重试一次一次往后推，正好是在把重试推出队列窗口的那一侧，而每推出一次，应用层就要多接住一次重复。

这也解释了为什么应用层总还得自己带一份账本。业务里的「保存这篇文章」跨越的是一次 HTTP 调用、一条队列消息和一次数据库写入；队列能保证的是队列收到过一次，保证不了应用只执行过一次。到最后，唯一还能认出「这只是同一个意图换了条路径」的地方，是业务自己的存储——一个由业务定义、以业务 id 为键的账本。它的有效期该有多长，不取决于任何厂商的文档，取决于同一个意图最坏可能隔多久才绕回来。

## 资料与边界

核对日期 2026-10-05，以下数字与引文均取自各页面的当前版本原文。

- [RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)（IETF，Standards Track，2022 年 6 月，STD 97）：第 9.2.2 节给出幂等定义（`intended effect`）、自动化重试的前提、非幂等请求不应自动重试的要求，以及「代理不得自动重试非幂等请求」。文中引文为该节原文。
- [Amazon SQS standard queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html)（AWS 开发者指南）：至少一次投递、可能投递多份的原文表述；「几乎无限」的每秒 API 调用量。核对于 2026-10-05，属会随时间变化的托管服务文档。
- [Exactly-once processing in Amazon SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/FIFO-queues-exactly-once-processing.html)（AWS 开发者指南）：5 分钟去重间隔，以及两种去重 ID 生成方式（正文 SHA-256 或显式提供）。
- [High throughput for FIFO queues in Amazon SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/high-throughput-fifo.html)（AWS 开发者指南）：每个分区在批处理下最多 3,000 条/秒，非批处理 300 条/秒（仅限已支持的区域）。这是 FIFO 队列的吞吐口径，不代表标准队列。
- [KIP-98 - Exactly Once Delivery and Transactional Messaging](https://cwiki.apache.org/confluence/spaces/KAFKA/pages/66854913/KIP-98+-+Exactly+Once+Delivery+and+Transactional+Messaging)（Apache Kafka 改进提案，状态 Adopted，页面最近更新 2026-03-04）：Kafka 当前为至少一次、重复来自生产者重试、PID + 序列号去重、幂等保证只在单个生产者会话内成立、`enable.idempotence` 默认 false。
- 关于 Kafka 官方文档站点（kafka.apache.org/documentation）的 delivery semantics 一节：本次核对时该地址只能取到跳转页，未取得正文，因此本文的 Kafka 数字一律以 KIP-98 原文为准，不引用社区文档或二手转述。
- 文末「先问跨了哪些层、再问每层记性多长」的判断顺序是我根据以上材料做的工程整理，没有跑过对照实验，也没有引用任何私有运行数据。
