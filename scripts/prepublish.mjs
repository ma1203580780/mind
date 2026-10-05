// 增量发布准备：把 mind/ 里的文章搬进发布克隆，适配线上 schema，验证，然后停下来等你确认。
// 用法：
//   node scripts/prepublish.mjs <slug> [<slug> ...]            # 预检，不改任何文件
//   node scripts/prepublish.mjs --apply <slug> [...]           # 实际写入并跑构建与测试（不推送）
//   node scripts/prepublish.mjs --apply --force <slug> [...]   # 分类无法自动映射时仍继续
//
// 设计约束：只做增量。不改现有文件以外的内容，不新建分支，不推送。
import {readFileSync, writeFileSync, existsSync, readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));

// 与 src/lib/blog-categories.ts 保持一致；此处内联，避免脚本依赖 TypeScript 运行时。
const BLOG_CATEGORIES = ['AI 工程', '产品与交互', '独立创造', '思考与成长'];
const mindPosts = fileURLToPath(new URL('../../mind/src/content/posts/', import.meta.url));
const ourPosts = `${root}src/content/posts/`;

// mind/ 的宽松分类 → 线上四类。仅在这些名称上做映射，其余一律报错，不猜。
const CATEGORY_MAP = {
  '长期成长': '思考与成长',
  '方法论': '思考与成长',
  'AI 方法论': 'AI 工程',
  '创作实践': '独立创造',
  '独立开发': '独立创造',
  '创作与组件': '独立创造',
  '生成式界面': '产品与交互',
  '设计': '产品与交互',
};

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const force = args.includes('--force');
const slugs = args.filter(a => !a.startsWith('--'));
if (slugs.length === 0) {
  console.error('用法：node scripts/prepublish.mjs [--apply] [--force] <slug> [...]');
  process.exit(2);
}

const splitFrontmatter = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return null;
  return {head: m[1], body: text.slice(m[0].length)};
};
const readField = (head, key) => {
  const m = head.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  return m ? m[1].replace(/^['"]|['"]$/g, '').trim() : null;
};

// 有些草稿被测试显式保护（例如 v2.test.mjs 断言它不得进入搜索与 RSS）。
// 只把「既是 mind 草稿、又出现在测试文件里」的 slug 视为受保护，避免误报普通字符串。
const guardedSlugs = () => {
  const guards = new Map();
  let drafts = [];
  try { drafts = readdirSync(mindPosts).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, '')); } catch { return guards; }
  const draftOnly = drafts.filter(slug => {
    try { return /^draft:\s*true\s*$/m.test(readFileSync(`${mindPosts}${slug}.md`, 'utf8')); } catch { return false; }
  });
  let files = [];
  try { files = readdirSync(`${root}scripts`).filter(f => f.endsWith('.mjs')); } catch { return guards; }
  for (const file of files) {
    let text;
    try { text = readFileSync(`${root}scripts/${file}`, 'utf8'); } catch { continue; }
    if (!/test\(/.test(text)) continue;
    for (const slug of draftOnly) {
      const line = text.split('\n').findIndex(l => l.includes(`'${slug}'`) || l.includes(`"${slug}"`));
      if (line >= 0 && !guards.has(slug)) guards.set(slug, {file, line: line + 1});
    }
  }
  return guards;
};
const guards = guardedSlugs();

let failures = 0;
const plans = [];

for (const slug of slugs) {
  const source = `${mindPosts}${slug}.md`;
  const target = `${ourPosts}${slug}.md`;
  const notes = [];

  // 被测试显式保护的草稿在写入之前就拦下，避免白跑一轮构建。
  if (guards.has(slug) && !force) {
    const {file, line} = guards.get(slug);
    console.error(`✘ ${slug}：被测试保护，不能发布 —— scripts/${file}:${line} 显式断言它不在搜索/RSS 中。`);
    console.error(`  若确实要发布，先改那条断言，或加 --force 跳过本检查。`);
    failures++;
    continue;
  }

  if (!existsSync(source)) {
    // 允许直接编辑发布克隆里的文章（比如本就在仓库里的那几篇）
    if (existsSync(target)) {
      plans.push({slug, source: null, target, notes: ['源不在 mind/，按仓库内已有文件处理'], head: null, body: null});
      continue;
    }
    console.error(`✘ ${slug}：mind/ 与发布克隆里都找不到`);
    failures++;
    continue;
  }

  const raw = readFileSync(source, 'utf8');
  const parts = splitFrontmatter(raw);
  if (!parts) { console.error(`✘ ${slug}：缺少 frontmatter`); failures++; continue; }

  let head = parts.head;
  const category = readField(head, 'category');
  const draft = readField(head, 'draft');
  const demo = readField(head, 'demo');

  // 1) demo 字段在线上是 z.never()，必须删除。注意它可能是 frontmatter 的最后一行，
  //    因此行尾允许是 \n 或字符串结束。
  if (demo !== null) { head = head.replace(/^demo:.*(?:\n|$)/m, ''); notes.push('移除 demo 字段'); }

  // 2) 分类映射
  if (category === null) { console.error(`✘ ${slug}：缺少 category`); failures++; continue; }
  const direct = BLOG_CATEGORIES.find(c => c === category);
  const mapped = direct || CATEGORY_MAP[category];
  if (mapped && mapped !== category) { head = head.replace(/^category:.*$/m, `category: "${mapped}"`); notes.push(`分类 ${category} → ${mapped}`); }
  else if (!mapped) {
    console.error(`✘ ${slug}：分类 "${category}" 无法映射到 ${BLOG_CATEGORIES.join(' / ')}`);
    if (!force) { failures++; continue; }
    notes.push(`分类 "${category}" 未映射，按 --force 保留`);
  }

  // 3) 草稿标记
  if (draft !== 'false') { head = head.replace(/^draft:.*$/m, 'draft: false'); notes.push(`draft ${draft ?? '缺失'} → false`); }

  if (existsSync(target)) notes.push('将覆盖发布克隆里的同名文件');
  plans.push({slug, source, target, notes, head, body: parts.body});
}

console.log(`\n计划处理 ${plans.length} 篇${apply ? '（--apply 实际写入）' : '（预检，不写文件）'}：\n`);
for (const p of plans) console.log(`  · ${p.slug}  ${p.notes.join('；') || '无需调整'}`);
if (failures) console.log(`\n有 ${failures} 篇因上述问题跳过。`);

if (!apply) {
  console.log('\n确认无误后加 --apply 执行写入与验证。');
  process.exit(failures ? 1 : 0);
}
if (failures) { console.log('\n存在跳过项，已中止，未写入任何文件。'); process.exit(1); }

for (const p of plans) {
  if (p.head === null) continue;
  writeFileSync(p.target, `---\n${p.head}\n---\n${p.body}`);
  console.log(`写入 ${p.target.replace(root, '')}`);
}

console.log('\n开始验证（构建 + 测试），不会推送。');
const steps = [
  ['npm', ['run', 'build']],
  ['npm', ['run', 'test:news']],
  ['npm', ['run', 'test:writing']],
  ['npm', ['run', 'test:v2']],
  ['node', ['--test', ...readdirSync(`${root}scripts`).filter(f => f.endsWith('.test.mjs')).map(f => `scripts/${f}`)]],
];
for (const [cmd, cmdArgs] of steps) {
  const label = `${cmd} ${cmdArgs.slice(0, 3).join(' ')}${cmdArgs.length > 3 ? ' …' : ''}`;
  try {
    execFileSync(cmd, cmdArgs, {cwd: root, stdio: ['ignore', 'pipe', 'pipe'], env: {...process.env, BASE_PATH: '/mind'}});
    console.log(`  ✔ ${label}`);
  } catch (error) {
    console.error(`  ✘ ${label} 失败`);
    const out = `${error.stdout || ''}${error.stderr || ''}`;
    console.error(out.split('\n').slice(-25).join('\n'));
    process.exit(1);
  }
}
console.log(`
验证通过。下一步由你确认后执行：

  cd mind-articles-release
  git add src/content/posts
  git commit -m "Publish ${plans.map(p => p.slug).join(', ')}"
  GIT_SSH_COMMAND="ssh -F <workspace>/.tools/ssh_config" \\
    git push ssh://git@github-mind/ma1203580780/mind.git HEAD:main
`);
