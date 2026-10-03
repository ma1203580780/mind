import {readingIndex} from '../lib/reading-index';
export async function GET(){return new Response(JSON.stringify(await readingIndex()),{headers:{'Content-Type':'application/json; charset=utf-8'}});}
