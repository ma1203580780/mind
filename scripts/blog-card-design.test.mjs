import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// 博客归档列表页的视觉基线：卡片材质、分色标签、字号层级。
// 这些值来自 2026-10 的竞品研究（docs/COMPETITOR-RESEARCH.md），改动前先读那份文档。
const css=readFileSync('src/styles/blog-sky.css','utf8');
const card=readFileSync('src/components/PostCard.astro','utf8');
const CATEGORIES=['ai-engineering','product-interaction','independent-creation','thinking-growth'];

const rule=(pattern)=>css.match(pattern)?.[0];

test('archived cards keep the 12px radius and the floating shadow',()=>{
 const base=rule(/body\.site-shell\.blog-archive-layout \.blog-grid \.blog-card \{[^}]*\}/);
 assert.ok(base,'归档卡片规则存在');
 assert.match(base,/border-radius:12px/);
 assert.match(base,/box-shadow:0 1px 2px/);
 assert.match(base,/background:var\(--paper\)/);

 const hover=rule(/body\.site-shell\.blog-archive-layout \.blog-grid \.blog-card:hover \{[^}]*\}/);
 assert.ok(hover,'悬停规则存在');
 // 站点通用悬停是 -3px（styles/motion.css），归档卡片要更明显地浮起。
 assert.match(hover,/translateY\(-4px\)/);
 assert.match(hover,/box-shadow:0 2px 4px/);
});

test('archive tags take their colour from the post category',()=>{
 for(const slug of CATEGORIES){
  assert.match(css,new RegExp(`\\.blog-card\\[data-category=${slug}\\]`),`${slug} 浅色标签`);
  assert.match(css,new RegExp(`html\\[data-theme=dark\\] body\\.site-shell\\.blog-archive-layout \\.blog-grid \\.blog-card\\[data-category=${slug}\\]`),`${slug} 深色标签`);
 }
 // 分类 slug 必须真的挂到卡片上，否则上面的规则全部落空。
 assert.match(card,/data-category=\{categorySlug\}/);
 assert.match(card,/blogCategories\.find\(item=>item\.name===post\.data\.category\)/);
 // 标签是圆角胶囊，分类是同色系纯文字。
 assert.match(css,/\.blog-grid \.blog-tags a \{[^}]*border-radius:999px/);
 assert.match(css,/\.blog-grid \.blog-tags a\.category \{[^}]*background:transparent/);
});

test('archive metadata stays at 13px with tabular figures',()=>{
 const meta=rule(/body\.site-shell\.blog-archive-layout \.blog-grid \.blog-meta \{[^}]*\}/);
 assert.ok(meta,'元数据规则存在');
 assert.match(meta,/font-size:13px/);
 assert.match(meta,/font-variant-numeric:tabular-nums/);
 assert.match(css,/\.blog-grid \.blog-card h2 \{font-size:19px/);
 assert.match(css,/\.blog-grid \.blog-card>p \{font-size:13\.5px/);
});
