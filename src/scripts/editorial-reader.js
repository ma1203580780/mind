(function(){
 const mount=root=>{
  if(root.dataset.ready)return; root.dataset.ready='true';
  const bar=root.querySelector('.ed-progress');
  const progress=()=>{const max=document.documentElement.scrollHeight-innerHeight;if(bar)bar.style.width=(max>0?Math.max(0,Math.min(100,scrollY/max*100)):0)+'%'};
  addEventListener('scroll',progress,{passive:true});progress();
  const toc=root.querySelectorAll('.ed-toc nav a');
  if('IntersectionObserver'in window){const obs=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){toc.forEach(a=>a.setAttribute('aria-current',String(a.getAttribute('href')==='#'+e.target.id)));}},{rootMargin:'-10% 0px -65% 0px'});root.querySelectorAll('h2[id]').forEach(h=>obs.observe(h));}
  root.querySelectorAll('.ed-mode').forEach(b=>b.addEventListener('click',()=>{const active=root.classList.toggle('ed-outline');root.querySelectorAll('.ed-mode').forEach(x=>{x.setAttribute('aria-pressed',String(active));x.textContent=active?'回到完整文章':'只看图解与方法'});root.querySelectorAll('.ed-toc nav a,.ed-mobile-toc nav a').forEach(a=>{const h=root.querySelector(a.getAttribute('href'));a.hidden=active&&Boolean(h?.closest('.ed-prose'));});progress();}));
  root.querySelectorAll('.ed-checklist').forEach(el=>{const inputs=[...el.querySelectorAll('input[type=checkbox]')],s=el.querySelector('.ed-check-count');const update=()=>{if(s)s.textContent='已检查 '+inputs.filter(x=>x.checked).length+' / '+inputs.length+' 项';};inputs.forEach(x=>x.addEventListener('change',update));update();});
  root.querySelectorAll('.ed-tabs').forEach(el=>{const buttons=[...el.querySelectorAll('[role=tab]')],panels=[...el.querySelectorAll('.ed-tab-panel')];if(!buttons.length)return;const select=i=>{buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;});panels.forEach((p,j)=>{p.hidden=i!==j;p.querySelector('h4')?.setAttribute('hidden','');});};buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('keydown',ev=>{let j=i;if(ev.key==='ArrowRight')j=(i+1)%buttons.length;else if(ev.key==='ArrowLeft')j=(i-1+buttons.length)%buttons.length;else if(ev.key==='Home')j=0;else if(ev.key==='End')j=buttons.length-1;else return;ev.preventDefault();select(j);buttons[j].focus();});});select(0);});
  root.querySelectorAll('.ed-calculator').forEach(el=>{const form=el.querySelector('form');if(!form)return;const summary=el.querySelector('.ed-calc-summary');
   const read=name=>{const input=form.elements.namedItem(name);return input.value.trim()===''?null:Number(input.value);};
   const calculate=()=>{const values={};let anyInvalid=false;
    ['a','b'].forEach(k=>{const cost=read(k+'cost'),count=read(k+'count'),output=el.querySelector('[data-result='+k+']');let value=null;
     if(cost===null||count===null||!Number.isFinite(cost)||!Number.isFinite(count)||cost<0||count<0||!Number.isInteger(count)){output.textContent='请填完整有效数字';anyInvalid=true;}
     else if(count===0){output.textContent='暂无可用结果';}
     else{value=cost/count;output.textContent=value.toFixed(3)+' 元 / 个';}
     values[k]=value;
    });
    if(anyInvalid)summary.textContent='费用需为非负数，结果数需为非负整数。空值不作为零。';
    else if(values.a===null||values.b===null)summary.textContent='至少一组没有可用结果，无法比较单位成本。零产出不等于零成本。';
    else if(Math.abs(values.a-values.b)<1e-9)summary.textContent='当前输入下，两组的单位自动成本相同。还需比较质量、人工时间与未完成任务。';
    else summary.textContent='就当前输入，方案 '+(values.a<values.b?'A':'B')+' 的每个可用结果自动成本更低。未计入人工时间与补齐未完成任务的费用。';
   };
   el.querySelector('.ed-preset')?.addEventListener('click',()=>{form.elements.namedItem('acount').value='69';calculate();});
   form.addEventListener('submit',ev=>ev.preventDefault());form.addEventListener('input',calculate);el.querySelector('.ed-reset').addEventListener('click',()=>{form.reset();calculate();});calculate();
  });
 };
 const init=()=>document.querySelectorAll('.ed-site').forEach(mount);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 document.addEventListener('astro:page-load',init);
})();
