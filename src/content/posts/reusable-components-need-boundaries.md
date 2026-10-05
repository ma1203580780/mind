---
title: "44% 的破坏性变更藏在「兼容」里：组件库最该存下的不是漂亮效果"
description: "一项针对 npm 生态的研究发现，44% 的破坏性变更出自本应兼容的次版本与补丁版本，12% 的下游包因此被改坏，一半的下游只能自己想办法恢复。把这条链子搬回个人组件库，结论不太客气：只存漂亮效果，等于只存了实现，没存接口。"
date: '2026-10-05'
category: 独立创造
tags:
- 创作
- 独立开发
authorship: assisted
draft: false
featured: false
---

2023 年 1 月提交的一项研究盯着 npm 生态里最难堪的一幕：上游发了一个向后兼容的版本，下游却编译不过。作者统计了依赖树上的实际发作情况，得到的第一个数字是 **12% 的下游包、14% 的下游发布，被依赖方的非主版本更新改坏**；第二个数字更刺眼——在所有真正发作的破坏性变更里，**44% 出自次版本（minor）和补丁版本（patch）**，按版本号的字面承诺，这两个位置本来不该出现破坏。

版本号本来是一句承诺。它失守并非因为写版本号的人不诚实，而是因为承诺有内容：你得先说清「公开接口是什么」，才有资格判断这次改动算不算破坏它。这恰好是个人组件库最缺的一环。你存下了一个很漂亮的入场动效，等于存下了实现，却把接口留在了自己脑子里，于是每一次复用都是一次无人记录的破坏性变更。

## 一 / 版本号是承诺，前提是先声明接口

SemVer 2.0.0 规范把顺序写得很直白。规范正文第 1 条要求：「Software using Semantic Versioning MUST declare a public API.」Introduction 里还有一句更根本的话：「For this system to work, you first need to declare a public API.」之后才有第 8 条：「Major version X (X.y.z | X > 0) MUST be incremented if any backward incompatible changes are introduced to the public API.」

先有接口，才有 MAJOR / MINOR / PATCH 的判据。规范对此毫不含糊，FAQ 里甚至给了判据式的回答：「If your software is being used in production, it should probably already be 1.0.0. If you have a stable API on which users have come to depend, you should be 1.0.0.」也就是说，1.0.0 不是「做得差不多了」，而是「接口已经存在，并且有人依赖它」。

规范对接口还有第二个要求，常被跳过去：它「SHOULD be precise and comprehensive」。FAQ 里有人直接抱怨这件事太费工，规范的回应是「It is your responsibility as a professional developer to properly document software that is intended for use by others.」把这段话放回个人组件库：你不需要为每个组件写一个文档站，你需要的是让接口有唯一的一份定义。因为「兼容」只有相对于某个被写下的表面才可判断——凡是没被写下来的部分，改动它永远不算破坏，也就永远没人被提醒。44% 这个数字正是这样长出来的。

那项 npm 研究补上了另一半：接口没说清时，代价落在谁头上。除了 44% 这个比例，作者还记录了恢复方式：「Clients recovered themselves from these breaking changes in half of the cases, most frequently by upgrading or downgrading the provider's version without changing the versioning configuration in the package manager.」一半的情况由下游自行解决，最常见的手段是把上游版本升回去或降回去，而不是改自己的依赖配置。换成日常语言：下游并不清楚自己坏了什么，只知道动一下版本号就好了。

把这条链子搬到个人组件库上，接口是什么？不是代码行数，而是四件必须写在组件之外的事：进来的是什么内容（标题、图片、条目数）、哪些值可以调、默认组合长什么样、哪种内容进来会坏。前三条决定「这次改动有没有破坏别人」，第四条决定「坏了之后你知道为什么」。只存一个能跑的动效文件，这四条一条都不在，于是每次复用都在制造一次没人记账的破坏性变更。

## 二 / 演示用的内容，永远是最短的那一版

第二块证据来自排版本身。W3C 的国际化文章《Text size in translation》引用 IBM《Guidelines to design global solutions》，给出了一组平均膨胀率：英文原文不超过 10 个字符时，翻译后平均膨胀 **200–300%**；31–50 个字符时是 140–160%；超过 70 个字符才降到 130%。同一页还有一份 Flickr 界面的实测对照，以英文 "views" 为 1 倍：意大利语 "visualizzazioni" 是 3 倍，德语 "-mal angesehen" 是 2.8 倍，法语 "consultations" 是 2.6 倍。

这组数字的方向和直觉相反：**字符串越短，膨胀倍数越高。** 它说的其实不是语言问题，而是采样问题。为什么演示稿总会选短文案？因为组件的第一次使用场景就是短内容——给自己搭一个页面时，标题是最短的，条目数是最整齐的。你用了整个分布里最省空间的那个点去定尺寸，而尺寸一旦写进组件，就变成了之后所有内容的上限。而短字符串落在哪里？按钮、角标、标签、表头、指标卡——恰好是组件里留给文字最紧的位置。演示时那个槽位里放的是「浏览」，换到真实内容后，同一个槽位要装的是「未读消息提醒」。W3C 那篇文章的原话是：「The problem tends to be that the smaller the English text, the more likely it is to be squeezed into a small space」。

膨胀也不只发生在横向。同一页还有两条：中文、日文、韩文的字符即使数量更少，占用的横向空间也往往更大（英文 "desktop" 变成 "デスクトップ"，字符数少了一个，宽度却明显增加）；非拉丁文字的行高普遍更高，页面里的泰文示例占到了拉丁文本约 150% 的垂直空间。

所以「长标题放不下」不是边缘输入，而是默认输入。演示稿里那版短文案不是组件的正常状态，而是这个组件全部可能输入中最省空间的一版；用最短输入标定出来的排版预算，从第一天起就是超支的。机制在这里就清楚了：你把演示内容当成了样本，它其实是极值。

## 三 / 失败样例是接口的一部分

回到 44% 那个数字。它能发生，是因为「兼容」这个判断没有共同的比对对象——上游认为没变，下游认为变了，双方说的接口不是同一个东西。个人组件库里的对应现象天天可见：你换了内容，某处挤了、裁了、换行了，你当场调了一下；下一次再用，同一个问题再出现一次。

那项研究记录的下游恢复行为，正好说明了这种成本的形状：一半的情况靠下游自己恢复，最常见的手段是升回或降回上游版本。这也是下游唯一能做的事——它手上没有一份关于「这版改了什么、哪种输入会坏」的记录。

把失败样例写进组件，作用不是自我检讨，而是提前结清这笔成本。做法很具体：除了最漂亮的那份演示，再放几份难看但真实的输入——最长的那条标题（按 200–300% 的膨胀率倒推）、最窄的容器、只有一项和很多项的数据、缺掉可选字段的情况。这些样例本身就是判据：如果某个样例放不下，你要做的决定是换布局、缩字号，还是明确写「不适用」。三种都可以，唯独不能留给下一个使用者现场猜。

还有一层更隐蔽的成本：没有失败样例时，坏掉的样子是不可复现的。你只记得「上次好像溢出了」，不记得当时标题多少字、容器多宽、图片是什么比例。下一次撞上同一个问题，你得把它重新造一遍——诊断成本被反复支付，而每次支付的人都以为这是个新问题。

动效还要多查一层：静止时放得下，不等于旋转、放大、位移之后仍然完整。动画的中间帧是组件真实经过的布局状态，那些帧需要各自的边界样例，否则你只是测试了它的起点和终点。

## 四 / 复用方式与成熟度，比组件总数有用

SemVer 里有一个区分可以直接借来标记成熟度：「Major version zero (0.y.z) is for initial development. Anything MAY change at any time. The public API SHOULD NOT be considered stable.」相对的另一句是：「Version 1.0.0 defines the public API.」

放在组件上：只用过一次、每次用都在改内部实现的组件，处在 0.y.z；第二次使用时不改代码就能换内容，它才进入 1.0.0。这条线是判据而不是修辞，它把「组件是否成熟」从感觉变成了三个可以回答的问题：换内容要改几处？出了问题能不能定位到某个槽位？默认结果能不能直接用？

这里的默认组合，其实就是组件版本的承诺。有默认值，调用方只需要提供内容；没有默认值，每个调用点都要在现场做一次设计决策，等于把同一个组件分叉成若干份互不认识的实现。这也是「组件被用了多少次」这个指标会骗人的地方：调用点多，不代表组件被复用得多，只代表默认值缺失，而每一个缺失的默认值都是一处将来要单独维护的分支。

配套的是记录复用方式。直接调用整个组件、抄走动画思路重新实现、只借它暴露出的参数，是三件不同的事：第一种意味着上游更新时你要跟版本，第二种意味着你只欠一笔思路的钱，第三种意味着你依赖那份参数契约。不写清楚，就会制造一种很难发现的假复用——文件复制进来了，但没有任何一处真正调用它；组件改了，你既不知道自己受影响，也不知道自己不受影响。

顺带一条从规范借来的习惯：弃用要留出一个缓冲版本。SemVer 的 FAQ 说，在下一个主版本彻底移除功能之前，「there should be at least one minor release that contains the deprecation so that users can smoothly transition to the new API」。组件也一样：把旧版直接删掉，等于强迫未来那个已经忘了上下文的自己重新读一遍实现。

那项 npm 研究的两组数字其实说的是一句话：44% 的破坏性变更藏在「兼容」的名义下，12% 的下游替它付账，而付账的方式是「把版本号动一下」。版本号之所以能承诺兼容，是因为规范强迫你先交出接口。组件库没有版本号可调，唯一的办法就是把接口写下来——进来的是什么内容、哪些值可调、默认组合是什么、哪种输入会坏。

存下漂亮效果，只存了这件事的一半。另一半是你承认的边界和已经踩过的失败样例；它们不是给组件库补文档，而是让「复用」这个词有了可判定的含义。第二次使用一个组件时，如果还要靠眼睛发现哪里挤了、哪里裁了，那这个组件一直停在 0.y.z。

## 资料与边界

核对日期：2026-10-05。以下三个来源的数字与英文引句均取自各自页面原文。

- [Semantic Versioning 2.0.0 规范](https://semver.org/)：第 1 条「Software using Semantic Versioning MUST declare a public API.」；Introduction「For this system to work, you first need to declare a public API.」；第 8 条 MAJOR 的定义句；FAQ「If you have a stable API on which users have come to depend, you should be 1.0.0.」；第 4 条与第 5 条关于 0.y.z 与 1.0.0 的定义；FAQ 关于弃用需先有一个 minor 版本的说明。该规范为长期稳定的 2.0.0 文本，无版本变动风险。
- [I depended on you and you broke me: An empirical study of manifesting breaking changes in client packages，arXiv:2301.04563](https://arxiv.org/abs/2301.04563)：**用的是 v1（2023-01-11 提交，摘要页显示无后续修订）**，发表于 TOSEM 2023。摘要原文：「around 12% of the dependent packages and 14% of their releases were impacted by a breaking change during updates of non-major releases of their dependencies」；「from all of the manifesting breaking changes, 44% were introduced both in minor and patch releases, which in principle should be backward compatible」；「Clients recovered themselves from these breaking changes in half of the cases, most frequently by upgrading or downgrading the provider's version without changing the versioning configuration in the package manager」。范围边界：这是 npm 生态的观测结果，不是对个人项目或设计系统的测量，且数据截止于 2023 年。
- [W3C i18n，《Text size in translation》](https://www.w3.org/International/articles/article-text-size)：IBM《Guidelines to design global solutions》的膨胀率表（英文源文 ≤10 字符为 200–300%，31–50 字符为 140–160%，>70 字符为 130%）；Flickr「views」实测比值（意大利语 3、德语 2.8、法语 2.6）；「each Chinese and Korean character is counted as two English characters in width」；日文 "desktop" 与泰文行高的两个例子（泰文占拉丁文本约 150% 的垂直空间）。范围边界：膨胀率针对「英文译入欧洲语言」的均值，中文创作场景的实测膨胀可能低于该表；这里引它是为了说明「短字符串膨胀倍数最高」这一方向，而不是把 200–300% 当作中文项目的预期值。

无法定位的部分：Carbon（IBM 设计系统）案例页与 Figma 官方博文《Design Systems 104: Making Metrics Matter》均为 JS 渲染的空壳，抓取只拿到标题与 cookie 提示；CMU 上的《How to Break an API》与 ACM 的复用缺陷密度研究只有 PDF，PDF 通道不可用。以上四项一律未引用，也没有用二手转述顶上。

文中关于组件接口应包含哪四项、失败样例如何选取、0.y.z 与 1.0.0 如何映射到组件成熟度，是我根据上述来源做的工程整理，没有独立复现实验，也没有引用任何非公开的私有数据。
