export function sectionForPath(pathname, base='/mind/') {
  const relative=pathname.startsWith(base)?pathname.slice(base.length):pathname;
  if(/^(archive(?:\/|$)|posts\/|tags\/)/.test(relative))return 'articles';
  if(relative.startsWith('topics/'))return 'topics';
  if(relative.startsWith('lab/'))return 'lab';
  if(relative.startsWith('reading/'))return 'reading';
  if(relative===''||relative.startsWith('picks/')||relative.startsWith('news/'))return 'news';
  return 'site';
}
