// 把 mind/ 草稿的 frontmatter 适配发布分支的 content schema
// 用法：node scripts/adapt-drafts.mjs <slug> [<slug> ...]
// 规则：删除 mind 专有的 demo 字段；把 mind 的分类名映射到发布分支允许的四类
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const CATEGORY_MAP = {
  '长期成长': '思考与成长',
  '思考与成长': '思考与成长',
  '方法论': '思考与成长',
  'AI 方法论': 'AI 工程',
  '创作实践': '独立创造',
  '独立开发': '独立创造',
  '创作与组件': '独立创造',
  '生成式界面': '产品与交互',
  '产品与交互': '产品与交互',
  '设计': '产品与交互',
};
const slugs = process.argv.slice(2);
if (slugs.length === 0) { console.error('用法：node scripts/adapt-drafts.mjs <slug> [...]'); process.exit(2); }
for (const slug of slugs) {
  const file = `${root}src/content/posts/${slug}.md`;
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { console.error(`找不到 ${slug}.md`); continue; }
  const notes = [];
  // 1) 删除 mind 专有字段 demo
  if (/^demo:.*$/m.test(text)) { text = text.replace(/^demo:.*\n/m, ''); notes.push('移除 demo 字段'); }
  // 2) 分类名映射
  const cat = text.match(/^category:\s*["']?(.+?)["']?\s*$/m);
  if (cat) {
    const mapped = CATEGORY_MAP[cat[1].trim()];
    if (mapped && mapped !== cat[1].trim()) { text = text.replace(/^category:.*$/m, `category: "${mapped}"`); notes.push(`分类 ${cat[1].trim()} → ${mapped}`); }
    else if (!mapped && !['AI 工程', '产品与交互', '独立创造', '思考与成长'].includes(cat[1].trim())) {
      console.error(`⚠ ${slug} 分类 "${cat[1].trim()}" 没有映射，请手工确认`);
    }
  }
  writeFileSync(file, text);
  console.log(`${slug}: ${notes.length ? notes.join('；') : '无需调整'}`);
}
