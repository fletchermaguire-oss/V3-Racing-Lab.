/* Racing Lab — manual field review v1.0
   Browser-local review; does NOT fetch official scratchings, publish to Airtable,
   or rerun the model. Conditional shares are transparently reweighted.
*/
(()=>{'use strict';
// V5 exclusions must rerun the shared formula, rather than reweight one screen.
if(window.RacingLabV5Enabled)return;
if(window.__RL_MANUAL_SCRATCH_V1__)return;
window.__RL_MANUAL_SCRATCH_V1__=true;
const KEY='racingLab.manualScratch.v1';
const RETURN='racingLab.manualScratch.return.v1';
const $=(s,r=document)=>r.querySelector(s);
const norm=x=>String(x||'').trim().toLowerCase();
const fmt=x=>Number(x).toFixed(2)+'%';
const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const save=(key,val)=>{try{localStorage.setItem(key,JSON.stringify(val));return true}catch{return false}};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let data=null,baseline=null,variants=null,scope='',state=null,applying=false,renderQueued=false;
function source(){return window.RacingLabApp?.data||window.DATA||null}
function signature(d){return [d.date||'',d.model||'',(d.records||[]).length].join('|')}
function makeScope(d){return 'board:'+signature(d)}
function readState(d){const all=safeRead(KEY,{});return all[makeScope(d)]||{scratched:{},reviewed:{},updatedAt:null}}
function writeState(){const all=safeRead(KEY,{});all[scope]=state;return save(KEY,all)}
function archive(d){data=d;baseline=d.records.map(h=>({...h}));variants={r4Adjusted:d.r4Adjusted?{...d.r4Adjusted}:null,fridayR6:d.fridayR6?{...d.fridayR6}:null};scope=makeScope(d);state=readState(d);apply()}
function originals(id){return baseline.filter(h=>h.race===id)}
function names(id){return new Set((state.scratched[id]||[]).map(norm))}
function adjusted(id,original,removed){const remaining=original.filter(h=>!removed.has(norm(h.name)));
  const sum=original.reduce((v,h)=>v+Number(h.p||0),0);
  const eligible=original.length>=2&&Math.abs(sum-100)<.16&&remaining.length>=2&&remaining.reduce((v,h)=>v+Number(h.p||0),0)>0;
  const remainSum=remaining.reduce((v,h)=>v+Number(h.p||0),0);
  return {remaining,eligible,sum,remainSum};
}
function apply(){if(!data||applying)return;applying=true;try{
  const scratched=state.scratched||{};
  const next=[];
  for(const race of new Set(baseline.map(h=>h.race))){
    const original=originals(race),removed=names(race),a=adjusted(race,original,removed);
    const reweight=removed.size>0&&a.eligible;
    for(const h of a.remaining)next.push({...h,p:reweight?Number(h.p)*100/a.remainSum:Number(h.p)});
  }
  data.records=next;
  for(const [fieldName,race] of [['r4Adjusted','RANDWICK_R04'],['fridayR6','CAULFIELD_R06']]){
    const src=variants[fieldName];if(!src)continue;
    const removed=names(race),active=originals(race).filter(h=>!removed.has(norm(h.name)));
    const vals=active.map(h=>Number(src[h.name]??h.p));
    const sum=vals.reduce((a,b)=>a+b,0);
    const total=originals(race).reduce((a,h)=>a+Number(src[h.name]??h.p),0);
    const can=removed.size>0&&active.length>=2&&Math.abs(total-100)<.16&&sum>0;
    const nextVariant={};active.forEach((h,i)=>nextVariant[h.name]=can?vals[i]*100/sum:vals[i]);
    data[fieldName]=nextVariant;
  }
}catch(e){console.error('Manual scratch application failed',e)}finally{applying=false}}
function currentRace(){return $('[data-change="race-jump"]')?.value||null}
function raceTitle(id){const r=(data?.races||[]).find(x=>x.id===id);return r?`${id.replace('_',' · ')} — ${r.name}`:id}
function page(){return window.RacingLabApp?.page||''}
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function raceReviewStatus(id){const a=adjusted(id,originals(id),names(id));return { ...a, scratched:names(id).size, reviewed:!!state.reviewed?.[id] }}
function download(name,txt){const blob=new Blob([txt],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function confirmRace(id){state.reviewed[id]={at:new Date().toISOString(),names:originals(id).length,scratched:(state.scratched[id]||[]).slice()};state.updatedAt=new Date().toISOString();writeState();$('#rlms-panel')?.remove();draw()}
function changeScratch(id,selected){const all=originals(id).map(h=>h.name);const valid=new Set(all.map(norm));const filtered=selected.filter(x=>valid.has(norm(x)));
  if(filtered.length>all.length-2){window.alert('At least two runners must remain for a race forecast.');return}
  const previous=state.scratched[id]||[];
  if(JSON.stringify(previous.slice().sort())===JSON.stringify(filtered.slice().sort()))return;
  state.scratched[id]=filtered;delete state.reviewed[id];state.updatedAt=new Date().toISOString();
  if(!writeState()){window.alert('Could not save to this browser. No changes applied.');return}
  const stored=safeRead('v3v2_multi',[]);
  if(Array.isArray(stored))save('v3v2_multi',stored.filter(key=>!filtered.some(n=>key===id+'|'+n)));
  try{sessionStorage.setItem(RETURN,JSON.stringify({page:page()==='simulator'?'races':page(),race:id}))}catch{}
  location.reload(); // Guarantees simulator state is discarded and all site views use same runner field.
}
function panel(id){const wrap=el('section','rlms-panel');wrap.id='rlms-panel';
  const info=raceReviewStatus(id),removed=names(id),orig=originals(id);
  wrap.innerHTML=`<div class="rlms-head"><div><span class="rlms-kicker">FINAL FIELD CONTROL · MANUAL</span><h3>Scratchings & race approval</h3><p>Mark horses out, apply changes, then confirm this race before using it in final selections.</p></div><span class="rlms-pill">${info.reviewed?'✓ REVIEWED':'REVIEW REQUIRED'}</span></div>`;
  const summary=el('div','rlms-status');summary.textContent=`${orig.length-info.scratched} active / ${orig.length} entered · ${info.scratched} manually scratched · ${info.scratched&&info.eligible?'Conditional probabilities total 100%':info.scratched?'Original field incomplete — no probability normalization':'Original forecast unchanged'}`;wrap.append(summary);
  const list=el('div','rlms-list');
  for(const h of orig){const label=el('label','rlms-runner');const check=el('input');check.type='checkbox';check.checked=removed.has(norm(h.name));check.dataset.horse=h.name;
    const name=el('span','rlms-runnername',h.name);const pct=el('span','rlms-base',fmt(h.p)+' base');label.append(check,name,pct);list.append(label)}wrap.append(list);
  const buttons=el('div','rlms-actions');const applyBtn=el('button','rlms-primary','Apply scratchings');applyBtn.type='button';applyBtn.addEventListener('click',()=>{
    const selected=[...list.querySelectorAll('input:checked')].map(x=>x.dataset.horse);
    changeScratch(id,selected);
  });
  const reviewBtn=el('button','rlms-secondary',info.reviewed?'✓ Field reviewed':'Confirm field reviewed');reviewBtn.type='button';reviewBtn.disabled=info.reviewed;
  reviewBtn.addEventListener('click',()=>{const selected=[...list.querySelectorAll('input:checked')].map(x=>x.dataset.horse);const existing=state.scratched[id]||[];
    if(JSON.stringify(selected.slice().sort())!==JSON.stringify(existing.slice().sort())){window.alert('Apply the scratching changes first, then confirm the field.');return}
    if(orig.length-selected.length<2){window.alert('At least two active runners are required.');return}
    confirmRace(id)
  });buttons.append(applyBtn,reviewBtn);wrap.append(buttons);
  const note=el('p','rlms-note','Only saved in this browser/device. You must verify scratchings yourself. Conditional reweighting is not a fresh pace/model rerun. A confirmed field is your manual review, not official verification.');wrap.append(note);
  return wrap;
}
function finalPanel(){const wrap=el('section','rlms-panel rlms-final');wrap.id='rlms-final';
  const keys=safeRead('v3v2_multi',[]),valid=Array.isArray(keys)?keys:[];
  const chosen=valid.map(k=>data.records.find(h=>h.race+'|'+h.name===k)).filter(Boolean);
  const missing=chosen.filter(h=>!state.reviewed[h.race]);
  wrap.innerHTML=`<span class="rlms-kicker">FINAL SELECTION CHECKPOINT</span><h3>${chosen.length} selected · ${missing.length} races awaiting field review</h3><p>Only create the reviewed selection sheet once each selected race is confirmed.</p>`;
  const b=el('button','rlms-primary','Save reviewed selections');b.type='button';b.disabled=!chosen.length||missing.length>0;
  b.addEventListener('click',()=>{
    const current=safeRead('v3v2_multi',[]);const selected=current.map(k=>data.records.find(h=>h.race+'|'+h.name===k)).filter(Boolean);
    if(!selected.length||selected.some(h=>!state.reviewed[h.race])){window.alert('Review all selected races first.');return}
    const lines=['RACING LAB — MANUALLY REVIEWED SELECTION SHEET',`Board date: ${data.date||'unknown'}`,`Model: ${data.model||'unspecified'}`,`Saved: ${new Date().toISOString()}`,'Manual field confirmation only; NOT official verification.','Probabilities are conditional estimates when scratchings were applied.',''];
    selected.forEach((h,i)=>lines.push(`${i+1}. ${h.race} | ${h.name} | ${fmt(h.p)} | ${names(h.race).size} manual scratchings | reviewed ${state.reviewed[h.race].at}`));
    download(`racing-lab-reviewed-${data.date||'board'}.txt`,lines.join('\n'));
  });wrap.append(b);
  if(missing.length){const p=el('p','rlms-note','Pending: '+[...new Set(missing.map(h=>h.race))].join(', '));wrap.append(p)}
  return wrap;
}
function draw(){if(!data)return;const host=$('#screen');if(!host)return;
  const old=$('#rlms-panel');const oldFinal=$('#rlms-final');
  const id=currentRace();
  if(id&&page()==='races'){
    if(!old||old.dataset.race!==id){old?.remove();const anchor=$('#race-detail')||host;const p=panel(id);p.dataset.race=id;anchor.prepend(p)}
  }else old?.remove();
  if(page()==='multi'){
    if(!oldFinal){const p=finalPanel();host.prepend(p)}
  }else oldFinal?.remove();
}
function refresh(){const d=source();if(!d||!Array.isArray(d.records))return;
  if(d!==data)archive(d);
  if(!renderQueued){renderQueued=true;requestAnimationFrame(()=>{renderQueued=false;draw()})}
}
const style=el('style');style.textContent=`
.rlms-panel{border:1px solid #3e7771;border-radius:15px;padding:16px;margin:14px 0 18px;background:linear-gradient(135deg,#102b32,#0d1e2b);color:#eaf6f4;box-shadow:0 10px 30px #0003}
.rlms-head{display:flex;justify-content:space-between;align-items:start;gap:12px}.rlms-head h3,.rlms-final h3{font-size:19px;margin:5px 0 7px}.rlms-head p,.rlms-final p{font-size:13px;color:#b3cecd;margin:0 0 9px;line-height:1.5}.rlms-kicker{font-size:11px;letter-spacing:.09em;font-weight:800;color:#68e9b5}.rlms-pill{border:1px solid #45736f;border-radius:30px;padding:7px 9px;font-size:10px;font-weight:800;white-space:nowrap;color:#bce9d5}.rlms-status{font-size:12px;color:#f9d78c;margin:10px 0 12px;line-height:1.5}.rlms-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:7px;max-height:330px;overflow:auto}.rlms-runner{display:flex;align-items:center;gap:9px;border:1px solid #35535a;border-radius:9px;padding:10px;background:#17323b;font-size:13px;cursor:pointer}.rlms-runner input{accent-color:#edb46b;width:18px;height:18px;flex-shrink:0}.rlms-runnername{flex:1}.rlms-base{font-size:11px;color:#a6c5c4;white-space:nowrap}.rlms-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.rlms-primary,.rlms-secondary{border:1px solid #56c9a2;border-radius:10px;padding:11px 15px;cursor:pointer;font-size:13px;font-weight:800}.rlms-primary{background:#31d7a2;color:#07241f}.rlms-secondary{background:#173b42;color:#d8faf0}.rlms-primary:disabled,.rlms-secondary:disabled{opacity:.45;cursor:not-allowed}.rlms-note{color:#9db8bd;font-size:11px;line-height:1.5;margin:12px 0 0}@media(max-width:600px){.rlms-panel{padding:13px}.rlms-head{display:block}.rlms-pill{display:inline-block;margin:4px 0 6px}.rlms-list{grid-template-columns:1fr}.rlms-actions button{flex:1}}
`;document.head.append(style);
function boot(){refresh();const obs=new MutationObserver(()=>refresh());const root=$('#screen');if(root)obs.observe(root,{childList:true,subtree:true});setInterval(refresh,1500);
  let ret=null;try{ret=JSON.parse(sessionStorage.getItem(RETURN)||'null');sessionStorage.removeItem(RETURN)}catch{};if(ret){setTimeout(()=>{
    const link=$(`[data-page="${ret.page==='multi'?'multi':'races'}"]`);link?.click();
    if(ret.page!=='multi'&&ret.race){const select=$('[data-change="race-jump"]');if(select&&[...select.options].some(o=>o.value===ret.race)){select.value=ret.race;select.dispatchEvent(new Event('change',{bubbles:true}))}}
  },750)}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.RacingLabManualScratch={getState:()=>JSON.parse(JSON.stringify(state||{})),getActive:(id)=>data?.records.filter(h=>h.race===id)||[],has:(id)=>!!(state?.scratched?.[id]?.length)};
})();
