import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
const posts = defineCollection({loader:glob({pattern:'**/*.md',base:'./src/content/posts'}),schema:z.object({title:z.string(),description:z.string(),date:z.coerce.date(),category:z.string(),tags:z.array(z.string()),authorship:z.enum(['author','assisted']).default('author'),featured:z.boolean().default(false),draft:z.boolean().default(false),demo:z.boolean().default(false),cover:z.object({src:z.string().url(),alt:z.string().min(1),sourceUrl:z.string().url(),sourceName:z.string().min(1)}).optional(),audio:z.object({src:z.string(),duration:z.string().optional()}).optional(),video:z.object({src:z.string().optional(),bvid:z.string().regex(/^BV[0-9A-Za-z]{10}$/).optional(),poster:z.string().optional(),captions:z.string().optional(),duration:z.string().optional(),label:z.string().optional()}).optional()})});
export const collections = {posts};
