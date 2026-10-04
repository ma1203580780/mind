export function sectionForPath(pathname, base='/mind/') {
  const relative=pathname.startsWith(base)?pathname.slice(base.length):pathname;
  if(/^(archive(?:\/|$)|posts\/|tags\/)/.test(relative))return 'articles';
  if(/^(discover|build|about)(?:\/|$)/.test(relative))return 'discover';
  if(relative.startsWith('lab/'))return 'lab';
  if(relative.startsWith('search/'))return 'search';
  if(relative===''||relative.startsWith('picks/')||relative.startsWith('news/'))return 'news';
  return 'site';
}
