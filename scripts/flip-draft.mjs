// 把指定文章的 frontmatter draft 标记改为 false（发布用）
// 用法：node scripts/flip-draft.mjs <slug> [<slug> ...]
import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const slugs = process.argv.slice(2);
if (slugs.length === 0) { console.error('用法：node scripts/flip-draft.mjs <slug> [...]'); process.exit(2); }
let changed = 0;
for (const slug of slugs) {
  const file = `${root}src/content/posts/${slug}.md`;
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { console.error(`找不到 ${slug}.md`); continue; }
  const next = text.replace(/^draft: *["']?true["']?$/m, 'draft: false');
  if (next === text) {
    console.log(text.match(/^draft: *false$/m) ? `已是发布状态：${slug}` : `未找到 draft: true，请手工确认：${slug}`);
    continue;
  }
  writeFileSync(file, next);
  changed++;
  console.log(`已改为 draft: false：${slug}`);
}
console.log(`共修改 ${changed} 篇`);
