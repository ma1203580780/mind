import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const articles=JSON.parse(readFileSync('src/data/reading-articles.json','utf8'));
const config=JSON.parse(readFileSync('scripts/reading-kit/articles.json','utf8'));
assert.deepEqual(Object.keys(articles).sort(),Object.keys(config).sort());
for(const [slug,article] of Object.entries(articles)){
 const source=readFileSync(`src/content/posts/${slug}.md`,'utf8').replace(/\r\n/g,'\n');
 assert.match(source,/^draft: false$/m,`${slug} is not approved for publication`);
 assert.equal(article.source_sha256,createHash('sha256').update(source).digest('hex'),`${slug}: Markdown changed; run npm run reading:build`);
 assert.doesNotMatch(article.html,/127\.0\.0\.1|localhost|\/Users\/|本地草稿|\.v7\.html|\.before\.html|\.\.\/review\//,`${slug}: local preview material leaked`);
 assert.equal((article.html.match(/<h1>/g)||[]).length,1);
}
console.log(`Reading source checks passed: ${Object.keys(articles).length} published articles`);
