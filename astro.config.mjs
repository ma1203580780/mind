import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkUploads from './scripts/remark-uploads.mjs';
const site = process.env.SITE_URL || 'https://ma1203580780.github.io';
const base = process.env.BASE_PATH === undefined ? '/mind' : (process.env.BASE_PATH || '/');
export default defineConfig({site, base, output:'static', trailingSlash:'always', markdown:{processor:unified({remarkPlugins:[[remarkUploads,{base}]]}),shikiConfig:{theme:'github-dark'}}});
