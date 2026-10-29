/* Racing Lab Intelligence V3 — evidence-first top-three upgrade.
   Reads saved Racing Lab data only. No probability modifications, no invented live feeds.
   Does not touch the simulator or original records. */
(()=>{'use strict';
if(window.__RL_INTELLIGENCE_V3__)return;window.__RL_INTELLIGENCE_V3__=true;
const css=`
#screen .rl3-summary{margin:14px 0;padding:15px 16px;border:1px solid #31575b;border-radius:14px;background:linear-gradient(135deg,#0d282e,#12212d);color:#e6f8f2}
#screen .rl3-kicker{font-size:10px;letter-spacing:.14em;color:#76e9be;font-weight:850;text-transform:uppercase}
#screen .rl3-summary h4{margin:7px 0 8px;font-size:17px;color:#fff}
#screen .rl3-summary p{font-size:12px;line-height:1.55;color:#bbd4d4;margin:7px 0}
#screen .rl3-row{display:flex;flex-wrap:wrap;gap:7px;margin:9px 0}
#screen .rl3-pill{display:inline-flex;padding:5px 8px;border-radius:7px;border:1px solid #335c61;background:#183b43;color:#d8f3ee;font-size:11px;font-weight:700}
#screen .rl3-insight{margin:12px 0 2px;padding:13px;border-radius:11px;background:#0b1d26;border:1px solid #35545a}
#screen .rl3-insight-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:9px;font-size:12px;font-weight:800;color:#f0fcf9}
#screen .rl3-evidence{font-size:10px;font-weight:750;color:#f4c96c;text-align:right}
#screen .rl3-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
#screen .rl3-cell{padding:10px;background:#152e38;border-radius:8px}
#screen .rl3-cell strong{display:block;font-size:10px;letter-spacing:.06em;color:#7decc3;margin-bottom:5px}
#screen .rl3-cell p{font-size:12px;line-height:1.55;color:#d3e3e4;margin:5px 0}
#screen .rl3-scenario{padding:10px 0 0;font-size:12px;line-height:1.55;color:#e1eae8}
#screen .rl3-warning{font-size:11px;color:#f1c67e;margin-top:8px}
@media(max-width:570px){#screen .rl3-cols{grid-template-columns:1fr}#screen .rl3-summary{padding:12px}#screen .rl3-insight{padding:10px}}
`;
const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n};
const norm=x=>String(x||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
const num=x=>Number.isFinite(Number(x))&&x!==null&&x!==''?Number(x):null;
const first=(arr)=>arr.find(Boolean);
const tidy=x=>typeof x==='string'?x.trim():'';
function dossier(data,horse,race){const m=/^RANDWICK_R(\d+)$/.exec(race||'');const n=m?Number(m[1]):null;const embedded=n&&n<=4?data['r'+n]?.[horse.name]:null;return embedded||data.research?.[horse.runnerId]||null}
function detail(h,d){
 const good=[],caution=[];const form=Array.isArray(d?.form)?d.form.filter(tidy):[];
 const wins=form.filter(x=>/\b1st\s*\/|\bwon by\b/i.test(x));const places=form.filter(x=>/\b(?:2nd|3rd)\s*\/|\bbeaten 0\.[0-9]+L/i.test(x));
 if(wins.length)good.push('Recorded win: '+wins[0]);
 else if(places.length)good.push('Recorded competitive finish: '+places[0]);
 if(form.length&&!wins.length&&!places.length)caution.push('Saved recent form does not establish a clear winning performance.');
 const note=tidy(d?.note);
 if(note){for(const phrase of note.split(/(?<=[.!?;])\s+/).filter(Boolean).slice(0,6)){
   if(/uncertain|doubt|poor|risk|wide|unproven|negative|concern|no heavy|first (?:time|1400|1600|1800|2000|randwick)|0 from|0 wins|untried/i.test(phrase))caution.push('Analyst note: '+phrase);
   else if(/strong|solid|favour|suited|improv|consistent|advantage|win|positive|class/i.test(phrase))good.push('Analyst note: '+phrase);
 }}
 const soft=tidy(d?.soft),heavy=tidy(d?.heavy);
 if(/0 from 0/i.test(heavy))caution.push('No Heavy-track race sample in saved evidence.');
 if(/0 from [1-9]/i.test(soft))caution.push('Saved Soft-track record: '+soft+' (context and sample size matter).');
 if(tidy(d?.rob).toLowerCase()==='low')caution.push('Saved robustness flag is Low: sensitive to assumptions.');
 const weight=num(d?.weight);if(weight!==null&&weight>=60)caution.push('Carries '+weight+'kg; weight effect requires a field-relative comparison.');
 const settle=num(d?.settle);const barrier=num(h?.barrier);
 const path=settle===null?'No reliable settling evidence saved: a specific early-position prediction would be guesswork.':settle<=3?'Conditional route: secure a forward position without spending excessive energy, then sustain the finish.':settle<=6?'Conditional route: obtain cover in midfield, then find a clear run at the right time.':'Conditional route: settle with cover and rely on tempo plus clear running room to finish strongly.';
 const draw=barrier===null?'Barrier not saved.':'Saved barrier '+barrier+'; its benefit depends on actual field speed, track layout and scratchings.';
 const coverage=[form.length>0,!!note,settle!==null,barrier!==null,!!tidy(d?.rob),!!tidy(d?.trial)].filter(Boolean).length;
 return {good:good.slice(0,3),caution:caution.slice(0,3),path,draw,coverage,settle,form};
}
function render(){const board=document.querySelector('#screen .hu-board');if(!board)return;
 const race=document.querySelector('[data-change="race-jump"]')?.value;
 const data=window.RacingLabApp?.data||window.DATA;if(!race||!data)return;
 const horses=(data.records||[]).filter(h=>h.race===race&&Number.isFinite(h.p)).sort((a,b)=>b.p-a.p).slice(0,3);
 const root=board.querySelector('.ev2');if(!root||horses.length===0)return;
 const cards=[...root.querySelectorAll('.ev2-card')];if(cards.length<Math.min(3,horses.length))return;
 const signature=race+'|'+horses.map(h=>h.name+':'+h.p).join('|');
 const old=root.querySelector('.rl3-summary');if(old?.dataset.signature===signature&&cards.slice(0,horses.length).every(c=>c.querySelector('.rl3-insight')))return;
 root.querySelectorAll('.rl3-summary,.rl3-insight').forEach(x=>x.remove());
 const summary=el('section','rl3-summary');summary.dataset.signature=signature;
 summary.append(el('div','rl3-kicker','Race intelligence · evidence audit'));
 summary.append(el('h4','',race.replace('_R',' · Race ')));
 const gap=horses.length>1?(horses[0].p-horses[1].p):null;
 const chips=el('div','rl3-row');chips.append(el('span','rl3-pill','Saved board · '+(data.date||'date unverified')));
 chips.append(el('span','rl3-pill','Top three · '+horses.length));
 if(gap!==null)chips.append(el('span','rl3-pill','1st–2nd gap · '+gap.toFixed(2)+' pts'));
 summary.append(chips);
 const profiles=horses.map(h=>detail(h,dossier(data,h,race)));
 const settling=profiles.filter(p=>p.settle!==null);
 const paceText=settling.length<2?'Insufficient saved settling data for even a top-three positional comparison.':settling.map((p,i)=>{const idx=profiles.indexOf(p);return horses[idx].name+' (historical settling '+p.settle+')'}).join(' · ')+'. These are historical references, not a complete-field pace map.';
 summary.append(el('p','',paceText));
 summary.append(el('p','',gap!==null&&gap<5?'The two leading saved forecasts are closely separated; avoid treating the ranking as a clear standout.':'Ranking separation is descriptive only; it is not a calibrated measure of certainty.'));
 summary.append(el('p','', 'No live scratching, current track bias, full-field speed verification or independent model rerun is claimed. Forecasts and simulator remain unchanged.'));
 const firstCard=cards[0];root.insertBefore(summary,firstCard);
 for(let i=0;i<horses.length;i++){
  const h=horses[i],d=dossier(data,h,race),p=profiles[i],card=cards[i];
  if(norm(card.querySelector('.ev2-head b')?.textContent)!==norm(h.name))continue;
  const section=el('section','rl3-insight');const header=el('div','rl3-insight-title');header.append(el('span','','WHY THIS RANK? · '+h.name));
  header.append(el('span','rl3-evidence',d?'Saved dossier · '+p.coverage+'/6 evidence types':'No saved dossier'));
  section.append(header);
  const columns=el('div','rl3-cols');
  const pos=el('div','rl3-cell');pos.append(el('strong','','SUPPORTING EVIDENCE'));
  (p.good.length?p.good:['No runner-specific positive established in the saved evidence.']).forEach(t=>pos.append(el('p','',t)));
  const neg=el('div','rl3-cell');neg.append(el('strong','','VULNERABILITIES / GAPS'));
  (p.caution.length?p.caution:['No documented runner-specific negative. This is an evidence gap, not proof of safety.']).forEach(t=>neg.append(el('p','',t)));
  columns.append(pos,neg);section.append(columns);
  section.append(el('div','rl3-scenario','RUN SCENARIO · '+p.path+' '+p.draw));
  section.append(el('div','rl3-warning','Saved forecast '+h.p.toFixed(2)+'% · not a live or calibrated win probability. Evidence coverage is not win confidence.'));
  const grid=card.querySelector('.ev2-grid');if(grid)card.insertBefore(section,grid);else card.append(section);
 }
}
let pending=false;const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;try{render()}catch(e){console.error('Racing Lab intelligence V3:',e)}})};
const start=()=>{new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});schedule()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
