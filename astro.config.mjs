import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkUploads from './scripts/remark-uploads.mjs';
const site = process.env.SITE_URL || 'https://ma1203580780.github.io';
const base = process.env.BASE_PATH === undefined ? '/mind' : (process.env.BASE_PATH || '/');

// trailingSlash 用 'ignore' 而不是 'always'：
// 线上 GitHub Pages 会把 /mind/discover 301 到 /mind/discover/，两种写法都能看；
// 而 astro dev 在 'always' 下对缺尾斜杠的地址直接吐裸的 "404: Not Found"——那个响应既没有
// 公共顶栏也没有页脚，本地预览就会看起来「这页缺头少尾」（Vite 中间件拦不到：请求在进入
// middlewares 之前就被判掉了）。'ignore' 让 dev 直接命中同一个页面，未知路径则走
// src/pages/404.astro，同样带完整外框。
// 构建产物不变：build.format 仍是默认的 directory，输出 dist/<route>/index.html。
export default defineConfig({site, base, output:'static', trailingSlash:'ignore', markdown:{processor:unified({remarkPlugins:[[remarkUploads,{base}]]}),shikiConfig:{theme:'github-dark'}}});
