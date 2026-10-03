/** Public reading topics. Legacy records retain their original data on disk. */
export const NEWS_TOPICS = ['全部', 'AI 资讯', '一人公司', '产品设计', '审美提升', '产品营销', 'AI 协作', '经济观察'];
export const LEGACY_TOPICS = {'AI 动态':'AI 资讯','AI 研究':'AI 资讯','开源工具':'AI 协作','工程实践':'AI 协作','产品观察':'产品设计','创作设计':'审美提升','宏观经济':'经济观察','经济研究':'经济观察','经济数据':'经济观察'};
export const newsTopic = category => LEGACY_TOPICS[category] || category;
export const TOPIC_DESCRIPTIONS = {
 '全部':'从技术进展到独立创造，保留值得追溯的原始信息。',
 'AI 资讯':'模型进展、研究论文与行业动态。论文和厂商公告分别标注。',
 '一人公司':'独立创业者的产品、经营与复盘，也收录小团队的实践。',
 '产品设计':'交互、用户研究与产品体验，读研究方法，也看真实案例。',
 '审美提升':'视觉、艺术与创作现场。配图来自对应的发布者原文。',
 '产品营销':'内容分发、搜索与增长实践。数据和结论以原文条件为准。',
 'AI 协作':'智能体、自动化工作流与开源工具，关注可落地的协作方式。',
 '经济观察':'宏观政策、经济数据与研究，保留机构及原文出处。'
};
