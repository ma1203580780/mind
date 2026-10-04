import {writeFile, mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const folder=new URL('../src/content/posts/',import.meta.url);
const file=new URL('my-first-post.md',folder);
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
await mkdir(folder,{recursive:true});
try {
  await writeFile(file,`---
title: "我的第一篇博客"
description: "写下这篇文章希望带给读者的价值。"
date: ${date}
category: "独立创造"
tags: []
authorship: author
featured: false
draft: true
---

从这里开始写。保存后，在 Front Matter 中点击预览即可看到真实页面。

## 我想记录什么


## 我的观察与实践


## 接下来


`,{flag:'wx'});
  console.log('已创建入门草稿：'+fileURLToPath(file));
} catch(error) {
  if(error.code!=='EEXIST') throw error;
  console.log('已有入门文章，保留原内容：'+fileURLToPath(file));
}
