// Run in an isolated checkout: temporary articles must never be committed or deployed.
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,readdir,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {dev} from 'astro';

const root=new URL('../',import.meta.url);
const id=`writing-check-${randomUUID()}`;
const marker=`WritingSmoke${id}`;
const post=new URL(`src/content/posts/${id}.md`,root);
const image=new URL(`public/uploads/${id}.svg`,root);
const temporary=await mkdtemp(join(tmpdir(),'mind-writing-'));
const outDir=pathToFileURL(join(temporary,'dist')+'/');
let server;
const article=draft=>`---
title: "${marker}"
description: "Temporary automated writing verification"
date: 2026-10-03
category: "创作实践"
tags: ["WritingSmokeTag"]
draft: ${draft}
---

![预览图片](/uploads/${id}.svg)
`;
const config={root,base:'/mind',logLevel:'error'};
const output=async p=>readFile(new URL(p,outDir),'utf8');
async function productionBuild() {
  // Keep Astro's development process state out of production builds.
  const child=spawn(process.execPath,['--input-type=module','-e',
    "import {build} from 'astro'; await build({root:process.cwd(),base:'/mind',outDir:process.argv[1],logLevel:'error'});",
    fileURLToPath(outDir)],{cwd:root,env:{...process.env,NODE_ENV:'production',ASTRO_TELEMETRY_DISABLED:'1'},stdio:'inherit'});
  await new Promise((resolve,reject)=>{
    child.on('error',reject);
    child.on('exit',code=>code===0?resolve():reject(new Error(`Build exited ${code}`)));
  });
}
async function assertNoMarker(folder) {
  for(const entry of await readdir(folder,{withFileTypes:true})) {
    const file=new URL(entry.name+(entry.isDirectory()?'/':''),folder);
    if(entry.isDirectory()) await assertNoMarker(file);
    else if(/\.(html|json|xml)$/.test(entry.name)) assert.ok(!(await readFile(file,'utf8')).includes(marker),`Draft leaked into ${file}`);
  }
}
try {
  await writeFile(post,article(true),{flag:'wx'});
  await writeFile(image,'<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="blue"/></svg>',{flag:'wx'});
  server=await dev({...config,server:{host:'127.0.0.1',port:0}});
  const base=`http://127.0.0.1:${server.address.port}/mind`;
  const response=await fetch(`${base}/posts/${id}/`);
  assert.equal(response.status,200);
  const html=await response.text();
  assert.ok(html.includes(marker));
  assert.ok(html.includes('本地草稿预览'));
  assert.match(html,/<meta[^>]+name="robots"[^>]+content="[^"]*noindex/);
  assert.ok(html.includes(`/mind/uploads/${id}.svg`));
  assert.equal((await fetch(`${base}/uploads/${id}.svg`)).status,200);
  for(const route of ['/archive/','/search-index.json','/rss.xml','/feed.xml']) {
    const res=await fetch(base+route);
    assert.equal(res.status,200,route);
    assert.ok(!(await res.text()).includes(marker),route);
  }
  await server.stop();server=undefined;
  console.log('PASS: local draft preview, image and public index isolation');

  await productionBuild();
  await assert.rejects(access(new URL(`posts/${id}/index.html`,outDir)));
  await assertNoMarker(outDir);
  console.log('PASS: production build contains no draft page or metadata');

  await writeFile(post,article(false));
  await productionBuild();
  const published=await output(`posts/${id}/index.html`);
  assert.ok(published.includes(marker));
  assert.ok(!published.includes('本地草稿预览'));
  assert.ok(published.includes(`/mind/uploads/${id}.svg`));
  for(const file of ['archive/index.html','search-index.json','rss.xml','feed.xml']) assert.ok((await output(file)).includes(marker),file);
  console.log('PASS: published article appears in blog, search and RSS with the correct image URL');
} catch(error) {
  console.error(error);
  process.exitCode=1;
} finally {
  await server?.stop();
  await rm(post,{force:true});
  await rm(image,{force:true});
  await rm(temporary,{recursive:true,force:true});
  await assert.rejects(access(post));
  await assert.rejects(access(image));
  console.log('PASS: temporary articles and images removed');
}
