---
title: "可容忍的检查点失败默认是 0：断点该落在哪"
description: "Flink 默认不做检查点，Temporal 默认认为你的每个活动都会重复执行。两个官方文档给出的不是「该记多少进度」的建议，而是恢复成本的两条硬边界：断点必须切在系统能一致地重放的位置上，且切得越细，重复执行的那一段越短。"
date: '2026-10-05'
category: AI 工程
tags:
- AI工程
- 独立开发
- 长时间任务
authorship: assisted
draft: false
featured: false
---

Apache Flink 有一个配置项叫**可容忍的检查点失败次数**，默认值是 **0**：一次检查点失败，整个作业就触发 failover。更值得注意的是另一件事——在这份官方文档里，**检查点默认是关闭的**。也就是说，一个没打开检查点的 Flink 作业跑得再久，也不存在任何能回退到的进度；它跑了一整天，故障后从零开始。把断点放在「真正完成的阶段」上，说的其实不是进度记录该写多细，而是你是否提供了恢复所需的全部前提。这两个默认值正是前提的两端。

## 默认的 0：不是在催你记进度

Flink 的 [`Checkpointing`](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/datastream/fault-tolerance/checkpointing/) 文档写得很直白：`By default, checkpointing is disabled.` 打开它要显式调用 `enableCheckpointing(n)`。同一页还给出两个默认值：`tolerable checkpoint failure number` 默认是 **0**，意思是「no checkpoint failures will be tolerated, and the job will fail on first reported checkpoint failure」；而 `minimum time between checkpoints` 一旦设为 5000，下一个检查点不会早于上一个完成后 5 秒开始——`Note that this value also implies that the number of concurrent checkpoints is one.`

这两个数字放在一起说明断点是有价格的。你希望少重放，就要检查点更密；而这个「最小间隔」参数在阻止你无限加密——它同时把并发检查点数钉死为 1。原因是快照维护的是**整条流的最近一致状态**，做一次就要占掉一份吞吐，两次同时做就是两份。所以「多久记一次断点」不是文档替你规定的，是你按恢复成本换来的：一次故障重放多少，等于你容忍多久不记一次。状态越大、这份开销越贵，「多记几次」就越不是免费的选项，恢复速度的账最终会记到机器的账上。

对做长任务的人，这条推论很具体：不要问「要不要记录进度」，先确认默认状态是什么。定时任务、批处理、agent 循环，默认几乎都等于 Flink 的默认值——不记录，出故障重来。你后来想补，补的不是一个字段，而是整条执行路径上原本没被保存的状态。

## 一致性截面：快照为什么不能任意切

Flink 把检查点定义成一个整体承诺：`Checkpoints allow Flink to recover state and positions in the streams to give the application the same semantics as a failure-free execution.` 注意它恢复的是两样东西——状态**和**流里的位置。所以断点不是一张写着「提纲已完成」的便利贴，而是「这份状态 + 从这条流的这个位置重放」组成的配对。

这个配对有两个前置条件，文档把它们列成 Prerequisites：一个**能在一定时间内重放记录的持久化数据源**（Kafka、RabbitMQ、Kinesis，或文件系统），以及一块持久化的状态存储。断点本身只是一份元数据；让它可用的，是数据源那头还留着能回退的位置。这就是它和「手工记录进度」最本质的差别：手工记录只保存了产物，没保存输入侧的坐标。输入侧不可回退时，断点连自己的含义都保不住。

第二点更难被察觉：检查点是**整个拓扑在同一时刻的一致截面**。Flink 在 `checkpointing with finished tasks` 一节里说，默认情况下即使 DAG 的一部分已经处理完全部记录，系统仍会继续做检查点。这个默认值是在保护截面——状态必须来自同一个时刻，否则恢复出来的是一个从未真实存在过的组合：一半是本地的产物，一半是另一段输入对应的状态。

这条约束直接否掉了草稿里「进度 60%」这种写法。60% 不是一个状态，是一个估计；而恢复需要的是一个可重建的完整状态，加上从哪个输入位置继续。计划粒度太粗的时候，你其实是在要求系统凑出一个不存在的时刻。

它也让「昨天确认的提纲，今天被改过」这类问题变得可分析。上一节那个配对意味着：做断点时，你同时固定住了两样东西——当时的产物，和当时那份输入在流里的位置。恢复时若输入换了版本，手里就只有旧产物配旧位置。要么沿着旧版本把这一段走完，要么把它当成一段新输入，从新位置重新排队；前一种做法会产出与目标不一致的结果，后一种做法则要求新输入本身携带位置信息。没有第三种选择，也没有「合并一下」的中间态——输入是可回放的流，它就一定有坐标，把坐标记下来才是断点的一部分。

## 粒度可以换：从整个拓扑到一次调用

如果恢复的代价由「重放多少」决定，那么一种自然优化就是把恢复单元做小。Temporal 走的就是这条路。

它的架构文档把前提写得同样清楚：系统以事件溯源方式工作，`an append-only history of events is stored for each workflow execution, and all required workflow state can be recreated at any time by replaying this history.` 可重放的那部分叫 Workflow，条件很硬——`Workflow code must be deterministic and have no side effects`；真正产生副作用的动作被推到 Activity 上，条件是 `activity code must either be idempotent or non-retryable (i.e. at least once or at most once).`

事件历史的粒度决定了一切。[`Activity Definition`](https://docs.temporal.io/activity-definition) 文档给出了一句很关键的保证：`By design, completed Activities will not re-execute as part of a Workflow Replay.` 已完成的活动在重放时不会被重新执行——这是把断点从「整个作业」缩小到「一次活动调用」换来的收益。但这份文档紧接着补了一句不该被跳过的话：活动只有**在返回结果或报错之后**才会写进事件历史，`If an Activity fails to report to the server at all, it will be retried.` 官方自己举的例子是一个真实存在的窗口：`The Activity function completes successfully, but the Worker crashes just before it notifies the Temporal Service.` 这种情况下历史里没有任何成功记录，活动会被重试。系统层面它给出的保证很有意思，也很有分寸：`Temporal guarantees that the Activity will be observed as completed exactly once. However, the Activity may be executed multiple times`——「观察到一次」和「执行一次」是两件事。

单次活动的内部还有一条属于时间维度的事实。[`Activities`](https://docs.temporal.io/activities) 文档说：`Each attempt starts from the initial state, unless your code uses a Heartbeat detail payload for checkpointing.` 一次活动重试时默认从头开始，唯一能携带进度的机制是心跳明细。这也解释了为什么文档反复要求把大块功能拆成多个活动：拆开之后，失败只让失败的那一步重来。

换来的东西是恢复；代价则记在另一本账上。活动定义文档在同一个例子里提醒，把一步拆成三步，事件历史里就会有三条 Activity Execution 而不是一条。恢复单元越小，需要被记录、被重放的条目越多。到这里「上游变了怎么办」也就有了各自的答案：事件历史里已经记下的调用，恢复时按记录重放，不会再碰一次外部世界；而历史里没写下的那部分，重试本来就是设计好的行为。也就是说，系统并不试图让恢复后的状态等于当初计划的状态，它只保证一件事——已经写进历史的副作用不会被重做，没写进历史的一切都可以重来。

于是断点改造的真实方向浮出来了。它不是把「阶段」写得更好看，而是**把恢复单元切到你能为它写出一条确定性的重放规则为止**：一个阶段内部如果含多次外部调用，那这个阶段就不是断点，只是一个时间区间。

## 幂等键要能被重新推导出来

粒度变细之后，剩下的风险全部集中在「执行过」和「记下来了」之间的那条缝里。活动定义文档给出的机制是幂等键：`You can use a combination of the Workflow Run ID and the Activity ID as an idempotency key since this is guaranteed to be consistent across retry attempts but unique among Workflow Executions.` 注意这两个性质缺一不可——重试之间保持一致，不同执行之间互不相同。支付服务端拿到键之后查表，有记录就忽略，没有就写入新记录。

这里有个容易被忽略的推论：幂等键必须**可推导**，不能是「上次自己生成并随手记下来的那个」。因为裂缝的另一半是重放本身——上面那个崩溃场景里，执行过的活动在历史中没有留下任何痕迹，恢复时不会有任何记录去跟它比对，它是一个全新的尝试。唯一能挡住第二次副作用的东西，是两次尝试都能独立算出同一个键。这也是为什么「记录一下执行过没有」单独存在时并不成立：没被记录的那一次，恰恰是最需要被识别的那一次。

所以草稿的判断需要换一个说法。断点的作用不是给任务一个踏实的停顿感，而是把「已完成」压缩成系统能重放的最小单元，并让每个单元的副作用可以被重复执行而不改变结果。恢复依据从来不是「我以为完成了什么」，而是历史里到底写了什么、以及没写的那部分重来一次是否安全。

## 资料与边界

核对日期：2026-10-05。以下数字与引文均取自各自官方文档页面的原文，取用时页面显示的版本为 Apache Flink 1.20.3 与 Temporal 当前在线文档（架构页对应仓库标签 v1.25.0）。

- [Apache Flink 1.20 文档：Checkpointing](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/datastream/fault-tolerance/checkpointing/)（页面标注 v1.20.3）：`By default, checkpointing is disabled.`；`tolerable checkpoint failure number` 默认 `0`，「no checkpoint failures will be tolerated, and the job will fail on first reported checkpoint failure」；`minimum time between checkpoints` 设为 5000 的示例，以及「the number of concurrent checkpoints is _one_」；`checkpoint timeout` 的定义（检查点在超时未完成时中止）；`exactly-once vs. at-least-once` 两种保证级别与「Exactly-once is preferable for most applications. At-least-once may be relevant for certain super-low-latency (consistently few milliseconds) applications.」；Prerequisites 中「A persistent (or durable) data source that can replay records for a certain amount of time」与「A persistent storage for state」；`checkpointing with finished tasks` 一节。
- [Apache Flink 1.20 文档：Checkpoints](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/ops/state/checkpoints/)（页面标注 v1.20.3）：`Checkpoints make state in Flink fault tolerant by allowing state and the corresponding stream positions to be recovered, thereby giving the application the same semantics as a failure-free execution.`；`Checkpoints are by default not retained and are only used to resume a job from failures.`；外部化检查点「write their meta data out to persistent storage」。
- [Temporal 架构文档（temporalio/temporal，标签 v1.25.0）](https://github.com/temporalio/temporal/blob/v1.25.0/docs/architecture/README.md)：`The system functions via event sourcing: an append-only history of events is stored for each workflow execution, and all required workflow state can be recreated at any time by replaying this history.`；`Workflow code must be deterministic and have no side effects (with specific exceptions), and activity code must either be idempotent or non-retryable (i.e. at least once or at most once).` 该页只描述语义，不含性能或失败率数字。
- [Temporal 文档：Activity Definition](https://docs.temporal.io/activity-definition)：`By design, completed Activities will not re-execute as part of a Workflow Replay. However, Activities won't record to the Event History until they return or produce an error. If an Activity fails to report to the server at all, it will be retried.`；`The Activity function completes successfully, but the Worker crashes just before it notifies the Temporal Service.`；`Temporal guarantees that the Activity will be observed as completed exactly once. However, the Activity may be executed multiple times and may even partially complete more than once during this process.`；幂等键「a combination of the Workflow Run ID and the Activity ID ... guaranteed to be consistent across retry attempts but unique among Workflow Executions」；拆分活动会带来「three Activity Executions instead of one」的事件历史代价（文中「这条账记在事件历史上」一句即指此处）。
- [Temporal 文档：Activities](https://docs.temporal.io/activities)：`Each attempt starts from the initial state, unless your code uses a Heartbeat detail payload for checkpointing.`；`Larger pieces of functionality should be broken up into multiple Activities.`；`We recommend that it be idempotent, so retries can be processed without duplicate side effects.`

边界：以上全部是官方文档规定的**语义与默认值**，不是实测失败率或性能数据。本文没有引用任何基准分数、事故统计或私有运行数据；Flink 的具体默认值随大版本变动，引用时应对齐你实际部署的版本；Temporal 的「observed as completed exactly once」是平台侧观察口径，官方同页明确说明活动本身仍可能执行多次。文中「断点该切在哪里」的判据，是我根据这些语义做的工程整理。
