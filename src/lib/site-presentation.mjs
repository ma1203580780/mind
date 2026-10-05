// Route roles are independent of navigation: deep readers stay calm even inside news.
export function presentationForPath(pathname,base='/mind/',{reading=false,blogArchive=false}={}){
 let route=pathname.startsWith(base)?pathname.slice(base.length):pathname.replace(/^\//,'');
 try{route=decodeURIComponent(route)}catch{}
 route=route.replace(/^\/+|\/+$/g,'');
 // 资讯列表、筛选与来源页保持常驻天空；单篇阅读页与资讯归档仍是各自的深读/资料场景。
 const newsDeepRead=route.startsWith('news/story/')||route.startsWith('news/archive/');
 const persistentSky=['','picks','news','archive','lab','discover','search'].includes(route)||(route.startsWith('news/')&&!newsDeepRead);
 const result=(family,scene,embedded=false)=>({family,scene:route==='search'?'pool':persistentSky?'sky':scene,embedded:embedded||persistentSky,persistentSky});
 if(reading)return result('reading','sky',true);
 if(blogArchive||route==='archive')return result('library','sky',true);
 if(/^(posts|news\/story)\//.test(route))return result('reading','horizon');
 if(/^(archive|tags)(\/|$)/.test(route)||route==='news/archive')return result('library','horizon');
 if(route==='lab'||route.startsWith('lab/'))return result('studio','tide');
 if(['discover','about','build'].includes(route))return result('connection','dawn');
 if(['search','stats','news/sources'].includes(route))return result('utility','mist');
 if(route===''||route==='picks'||route==='news'||route.startsWith('news/'))return result('feed','air');
 return result('note','paper');
}
