export function track(name: string, data: Record<string,string|number> = {}) {
  try {
    if(navigator.doNotTrack==='1'||localStorage.getItem('analytics-opt-out')==='true')return;
    const umami=(window as any).umami;
    if(typeof umami?.track==='function')umami.track(name,{path:location.pathname,...data});
  } catch {}
}
