# 博客 Hero 与目录背景参考

调研日期：2026-10-04。查阅作者公开页面和技术说明；本轮浏览器策略检查不可用，未声称完成动态页面视觉对比。下面区分参考来源与本站实际实现。

## 推荐方向：保留蓝天主题，降低装饰重量

标题中央保持开阔，远云集中在边缘和下方，暖光只作右上角的少量色温变化。文章详情与目录共用一份原生 SVG 和一套背景样式。图形不包含文字、主题图标或业务内容，可以复用于其他文章。

目录页的蓝天背景从主导航下方展开，包裹标题和前几行文章，底部渐隐到原站底色。卡片使用白色表面、20px 圆角和色彩一致的三层轻阴影；手机单栏优先保证标题可读。文章字号仍沿用已认可的 14/16/18/22/26px。

## 值得保留的公开参考

| 参考 | 为什么值得研究 | 本站采用的部分 |
| --- | --- | --- |
| [Josh W. Comeau — A Million Little Secrets](https://www.joshwcomeau.com/blog/whimsical-animations/) / [Whimsical Animations](https://whimsy.joshwcomeau.com/) | 作者说明了其页面中基于 SVG、CSS、JavaScript 的细小趣味交互。适合研究如何把个人气质放进可复用的细节。 | 保留轻松的自然背景；图形与文案分离。没有复制课程插画或收费素材。 |
| [Josh — Designing Beautiful Shadows in CSS](https://www.joshwcomeau.com/css/designing-shadows/) | 将阴影视为统一光照环境，采用多层、与环境色协调的阴影，而不是一块模糊灰影。 | 目录卡片共用蓝色调的三层轻阴影；用圆角、留白与阴影建立层次。 |
| [Emil Kowalski — You Don't Need Animations](https://emilkowal.ski/ui/you-dont-need-animations) | 从动效目的、使用频率和速度解释何时适合动画；提示重复出现的装饰可能变成负担。 | 标题与正文保持静止；云层只做小幅慢移，离屏暂停，减少动态偏好下静止。卡片仅轻微悬浮。 |
| [Codrops — Animate Anything Along an SVG Path](https://tympanus.net/codrops/2022/01/19/animate-anything-along-an-svg-path/) | 展示以 SVG 路径数据控制对象运动的具体示例，适合寻找更鲜明的路径动画。 | 作为未来可选方向。本轮没有加入粒子、轨迹或复杂库，避免争夺阅读注意力。 |

这些参考不等于直接复制它们的成品界面。本站 SVG 路径为当前主题重新绘制，阴影和动效依据上述公开方法调整；尚待用户在本地确认最终视觉效果。

## 实现入口

- `scripts/reading-kit/sky-clouds.svg`：薄云、远景、中景、前景，中央保留完整标题空间。
- `src/styles/blog-sky.css`：共用日夜配色、慢移、目录布局、圆角和阴影。
- `src/scripts/sky-background.js`：离屏及后台暂停，支持 Astro 站内导航。
- `src/pages/archive.astro`：目录背景与年份列表。
- `src/styles/reading-kit/site-adapter.css`：三篇详情页共享的排版适配。

本轮仅本地修改，未提交、推送或发布。
