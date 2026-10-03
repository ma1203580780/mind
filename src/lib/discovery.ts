import {allNews,issues} from './news';
import {path} from '../site';
export {topics,readingCandidates,candidateReason,groupStories} from './discovery-rules.mjs';
export const storyUrl=(story:{id:string})=>path(`news/story/${story.id}/`);
export const latestNewsDate=issues[0]?.date||new Date().toISOString().slice(0,10);
export const storiesForTopic=(topic:{categories:string[]})=>allNews.filter(s=>topic.categories.includes(s.category));

import configuredPicks from '../config/editor-picks.json';
export const editorPicks=(configuredPicks as {id:string;reason:string;confirmed:boolean}[]).map(pick=>{
 const story=allNews.find(s=>s.id===pick.id);
 if(!story||pick.confirmed!==true||!pick.reason?.trim())throw new Error('Invalid or unconfirmed editor selection: '+pick.id);
 return {...story,editorReason:pick.reason};
});
