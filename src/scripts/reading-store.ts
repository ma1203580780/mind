const KEY='mind-reading-v1';
export type ReadingState={saved:Record<string,number>;read:Record<string,number>};
export function readState():ReadingState {
  try {const value=JSON.parse(localStorage.getItem(KEY)||'{}');return {saved:valid(value.saved),read:valid(value.read)};}catch{return {saved:{},read:{}};}
}
function valid(value:unknown):Record<string,number>{
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  return Object.fromEntries(Object.entries(value).filter(([key,time])=>/^(news|post):[\w-]{1,200}$/.test(key)&&typeof time==='number'&&Number.isFinite(time)).slice(-5000));
}
export function changeState(kind:'saved'|'read',id:string,enabled:boolean){
  const state=readState();if(enabled)state[kind][id]=Date.now();else delete state[kind][id];
  try {localStorage.setItem(KEY,JSON.stringify(state));document.dispatchEvent(new Event('reading:change'));return true;}catch{return false;}
}
export function clearReading(){try{localStorage.removeItem(KEY);document.dispatchEvent(new Event('reading:change'));return true;}catch{return false;}}
export function isRead(id:string){return !!readState().read[id];}
