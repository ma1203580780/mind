import { defineConfig } from 'astro/config';
const site = process.env.SITE_URL || 'https://ma1203580780.github.io';
const base = process.env.BASE_PATH === undefined ? '/mind' : (process.env.BASE_PATH || '/');
export default defineConfig({site, base, output:'static', trailingSlash:'always', markdown:{shikiConfig:{theme:'github-dark'}}});
