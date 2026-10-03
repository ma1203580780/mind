/** Reject obvious decoding failures, not a claim of semantic translation accuracy.
 * Keep this rule aligned with scripts/enrich-news.py. */
export function usableTranslation(value, original='') {
  if(typeof value!=='string'||!/[\u3400-\u9fff]/u.test(value))return false;
  const compact=value.replace(/[\s\p{P}]/gu,'');
  if(/([\u3400-\u9fff]{1,20})\1{5,}/u.test(compact))return false;
  if(original&&value.length>Math.max(160,original.length*3))return false;
  return true;
}

export function cleanStoryTranslation(story) {
  const result={...story};
  for(const key of ['title','summary'])if(result[`${key}Zh`]&&!usableTranslation(result[`${key}Zh`],result[key]))delete result[`${key}Zh`];
  if(result.sourceLanguage==='en')result.translationStatus=result.titleZh&&result.summaryZh?'ready':result.titleZh||result.summaryZh?'partial':'unavailable';
  return result;
}

/** Release notes remain searchable in the archive; the shortlist favors articles. */
export function isReleaseNote(story) {
  return story.kind==='版本发布';
}
