/* V5 14 November direct race centre: a dated research interface with all actual accepted form.
 * All displayed percentages come ONLY from unchanged L5 calculations and are uncalibrated.
 * Independent research order is separately saved; no model favourite is silently substituted.
 */
(function(global){
'use strict';
if(!global.RacingLabV5Card||global.RacingLabV5Card.date!=='2026-11-14')return;
const original=global.RacingLabToday;
if(!original)return;
const displayOrder=['SANDOWN','NEWCASTLE','DOOMBEN','ASCOT'];
const st={meeting:'SANDOWN',race:8,top:10,filter:'ALL',horse:null,showOut:false};
let last=null,styleAdded=false;
function E(tag,cls,content){let n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined&&content!==null)n.textContent=String(content);return n;}
function A(parent,...nodes){for(const n of nodes)if(n)parent.append(n);return parent;}
function txt(parent,text,cls){return A(parent,E('p',cls||'',text));}
function btn(title,fn,active){const n=E('button','v14-btn'+(active?' v14-active':''),title);n.type='button';n.addEventListener('click',fn);return n;}
function link(label,url){const a=E('a','v14-link',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function rerender(){if(last)render(last.el,last.opts);}
function go(page){if(last&&last.opts&&last.opts.navigate)last.opts.navigate(page);}
function choose(r){st.meeting=r.meeting;st.race=r.race;st.horse=r.id||null;st.showOut=false;go('races');}
function uiStyle(){if(styleAdded)return;styleAdded=true;const css=`
.v14-wrap{display:grid;gap:20px;padding:8px 0 35px;color:var(--ink,#e9f7ff)}.v14-hero{padding:22px;border:1px solid #304950;border-radius:17px;background:linear-gradient(125deg,#17312f,#111d29)}.v14-hero h1{font-size:clamp(1.55rem,3.5vw,2.2rem);margin:5px 0 10px}.v14-muted{color:#a4b8c3;font-size:.87rem;line-height:1.5}.v14-caption{color:#9cb5c0;font-size:.78rem}.v14-alert{border-left:3px solid #e2c285;background:#202622;border-radius:6px;padding:11px 14px;color:#efdbab}.v14-actions{display:flex;gap:8px;flex-wrap:wrap}.v14-btn{border:1px solid #365059;background:#162733;color:#dbeef3;border-radius:9px;padding:10px 12px;font-weight:700;font-size:13px;cursor:pointer}.v14-btn:hover,.v14-active{background:#245343;color:#b5f5d7;border-color:#5dbaa3}.v14-link{color:#a5e4da;text-decoration:underline;text-underline-offset:3px;font-size:.88rem}.v14-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.v14-stat,.v14-card{border:1px solid #304450;border-radius:12px;padding:13px;background:#14232e}.v14-stat strong{font-size:1.55rem;display:block}.v14-stat small{color:#a8bac4;font-size:.74rem}.v14-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:11px}.v14-card h3{font-size:1.05rem;margin:4px 0 8px}.v14-card p{margin:7px 0}.v14-card button{width:100%;text-align:left}.v14-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.v14-head h2{margin:0;font-size:1.17rem}.v14-count{font-weight:800;color:#9de9c5;font-size:.88rem}.v14-tag{display:inline-block;color:#a8dce3;font-size:.75rem;font-weight:800;letter-spacing:.03em}.v14-rank{display:inline-flex;align-items:center;justify-content:center;width:33px;height:33px;border-radius:9px;background:#254a3d;color:#a5f3ce;font-weight:900}.v14-pick{display:flex;gap:10px;align-items:flex-start}.v14-pick main{flex:1;min-width:0}.v14-sep-info{font-size:.83rem;font-weight:750;color:#99e3c6;margin:5px 0}.v14-sep-small{font-size:.75rem;color:#99e3c6;line-height:1.4}.v14-pick main strong{font-size:1.05rem}.v14-model{font-size:.91rem;color:#b3c8cf;font-weight:750;white-space:nowrap}.v14-long{overflow-wrap:anywhere}.v14-gear{color:#eed494;font-size:.82rem}.v14-entries{display:grid;gap:8px}.v14-runner{display:grid;gap:4px;width:100%;text-align:left;border:1px solid #34505e;border-radius:11px;background:#14232f;color:#ecf8fa;padding:12px;cursor:pointer}.v14-runner.active{border-color:#7be5c2;background:#1c3e36}.v14-runner strong{font-size:.96rem}.v14-runner small{font-size:.78rem;color:#b6c6cc}.v14-field{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:9px}.v14-pill{border-radius:99px;background:#244a43;color:#b5edd5;padding:4px 8px;font-size:.68rem;font-weight:800;white-space:nowrap}.v14-review{border:1px solid #41616b;background:#112936;padding:13px;border-radius:11px}.v14-review h3{margin:2px 0 8px}.v14-review p{line-height:1.48}.v14-list{padding-left:20px;margin:7px 0}.v14-list li{margin:6px 0}.v14-races{display:flex;gap:7px;flex-wrap:wrap}.v14-races .v14-btn{min-width:48px}.v14-sep{border:0;border-top:1px solid #30434c;margin:11px 0}.v14-note{padding:9px 11px;background:#1b2d39;border-radius:8px;margin:8px 0;font-size:.86rem}.v14-flag{color:#f3d09e}.v14-section{display:grid;gap:12px}.v14-scratch{opacity:.76;text-decoration:line-through}@media(max-width:650px){.v14-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.v14-hero{padding:16px}.v14-card{padding:12px}}
`;const style=E('style');style.textContent=css;document.head.append(style);}
function base(root,title,sub){root.classList.add('v14-wrap');root.replaceChildren();let h=A(E('div','v14-hero'),E('div','v14-tag','V5 · SATURDAY 14 NOVEMBER 2026'),E('h1','',title),E('p','v14-muted',sub));root.append(h);return h;}
function metrics(c){const box=E('div','v14-metrics');const arr=[[c.board.raceCount,'Races'],[c.board.sourceCount,'Accepted entries'],[c.board.activeCount,'In Friday model'],[c.board.excludedCount,'Scratched / inactive reserves']];for(const [n,label] of arr)A(box,A(E('div','v14-stat'),E('strong','',n),E('small','',label)));return box;}
function warning(root){root.append(E('div','v14-alert','SATURDAY OFFICIAL UPDATE: 121 listed withdrawals/eliminations, 410 runners modelled, 134 excluded including inactive emergencies. Sandown & Newcastle post-deadline; Doomben & Ascot still awaiting closing deadlines. Heavy 8 Sandown/Doomben; Soft 5 Newcastle/Ascot. Emergency promotions not attested. Raw V5 percentages are uncalibrated.'));}
function tabs(root,selected,fn,withAll){const x=E('div','v14-actions');for(const m of (withAll?['ALL',...displayOrder]:displayOrder))x.append(btn(m==='ALL'?'All meetings':m.charAt(0)+m.slice(1).toLowerCase(),()=>fn(m),selected===m));root.append(x);}
function sourceMeeting(c,m){return c.data.meetings.find(x=>x.meeting===m);}
function research(c,id){return c.curated?.entries.find(x=>x.race_id===id&&x.eligible)||null;}
function winners(c){return c.curated?.entries||[];}
function rawRecord(c,id){return c.board.baseline.records.find(x=>x.id===id);}
function separation(c,id,raceId){
 const rows=c.board.baseline.records.filter(x=>x.race_id===raceId).sort((a,b)=>b.p_exact-a.p_exact||a.id.localeCompare(b.id));
 const idx=rows.findIndex(x=>x.id===id);
 if(idx<0||rows.length<2)return null;
 const selected=rows[idx],opponent=idx===0?rows[1]:rows[0];
 return {rank:idx+1,total:rows.length,pp:selected.p_exact-opponent.p_exact,opponent:opponent.horse,opponent_pct:opponent.p_exact,
  leader:rows[0].horse,runner_up:rows[1].horse,top_gap:rows[0].p_exact-rows[1].p_exact};
}
function separationLabel(c,id,raceId){
 const s=separation(c,id,raceId);if(!s)return 'Model separation unavailable for this runner';
 const signed=(s.pp>=0?'+':'')+s.pp.toFixed(2);
 return 'Model rank #'+s.rank+'/'+s.total+' · Separation '+signed+' pp '+(s.rank===1?'ahead of ':'behind ')+s.opponent+' ('+s.opponent_pct.toFixed(2)+'% raw)';
}
function formCard(c,h){const raw=rawRecord(c,h.id),p=E('article','v14-review');const headline=A(E('div','v14-head'),E('h3','',h.horse),E('strong','v14-model',raw?Number(raw.p).toFixed(2)+'% raw V5':'Not modelled'));p.append(headline);
 txt(p,'#'+h.tab+' · '+h.jockey+' · '+h.trainer+' · '+h.weight_kg+'kg · gate '+h.barrier,'v14-muted');
 txt(p,separationLabel(c,h.id,h.race_id),'v14-sep-info');
 txt(p,h.statistics||'Career statistics unavailable','v14-muted');
 if(h.gear_source_notes?.length)txt(p,'Gear: '+h.gear_source_notes.join('; '),'v14-gear');
 if(h.form){p.append(E('h4','','Dated recent race form'));const lines=h.form.split('\n').slice(0,6);for(const line of lines)txt(p,line,'v14-muted');}
 if(h.historical_map)txt(p,'Running positions: '+h.historical_map,'v14-muted');
 if(h.research_evidence?.length){p.append(E('h4','','Trainer, gear and pace notes'));for(const n of h.research_evidence){const q=E('div','v14-note');q.append(E('strong','',n.kind+' · '+n.verification_status));txt(q,n.note);txt(q,'V5 interpretation: '+n.assessment,'v14-muted');const src=E('div','v14-actions');n.sources?.slice(0,3).forEach((u,i)=>src.append(link('Source '+(i+1),u)));q.append(src);p.append(q);}}
 if(raw?.quality_flags?.length)txt(p,'Model uncertainty: '+raw.quality_flags.join(', '),'v14-flag');
 const origin=E('div','v14-actions');origin.append(link('Official runner form',h.source?.url||'/v5/cards/2026-11-14/research.json'));p.append(origin);
 return p;}
function highlight(c,x){const b=E('article','v14-card');const row=E('div','v14-pick');row.append(E('span','v14-rank',x.rank));const main=E('main');const title=E('div','v14-head');title.append(E('strong','',x.horse),E('span','v14-model',x.model_pct===null?'No raw model score':Number(x.model_pct).toFixed(2)+'% raw model'));main.append(title,E('p','v14-muted',x.meeting+' R'+x.race+' · Form '+x.form_tier+' · '+(x.eligible?'Accepted, final starter unverified':'OUT OF FIELD')),E('p','v14-sep-info',separationLabel(c,x.id,x.race_id)),E('p','',x.reason),E('p','v14-flag','Risk: '+x.risk));row.append(main);b.append(row);
 if(x.notes?.length)txt(b,'Model checks: '+x.notes.slice(0,5).join(' · '),'v14-caption');
 b.append(btn('Full race form and rivals',()=>choose(x),false));return b;}
function renderHome(root,c){const h=base(root,'Saturday race centre','Sandown · Newcastle · Doomben · Ascot. Official Saturday withdrawals applied to Friday source form for every accepted horse, with the independently reviewed research shortlist kept separate from raw V5 percentages.');
 warning(root);root.append(metrics(c));const actions=E('div','v14-actions');actions.append(btn('All 40 races',()=>go('races')),btn('Top 5 / 10 / 15',()=>go('daily')),btn('Multi Lab',()=>go('multi')),btn('Simulator',()=>go('sim')));h.append(actions);
 const tracks=A(E('div','v14-section'),A(E('div','v14-head'),E('h2','','Track reports and sources'),E('span','v14-caption','Saturday latest official track and scratching report')));
 const grid=E('div','v14-grid');for(const m of displayOrder){const row=sourceMeeting(c,m),card=E('div','v14-card');card.append(E('div','v14-tag',m),E('h3','',c.going[m]+' · rail '+row.rail),E('p','v14-muted',row.source_last_published),E('p','v14-caption',row.saturday_scratched+' listed withdrawals · '+(row.deadline_passed_for_snapshot?'after scheduled closing':'deadline still pending')));card.append(link('Official scratching sheet',row.scratching_source));grid.append(card);}tracks.append(grid);root.append(tracks);
 const group=E('section','v14-section');group.append(A(E('div','v14-head'),E('h2','','Independently reviewed Top 5'),E('span','v14-caption','Not model-ranked or calibrated')));const picks=E('div','v14-grid');winners(c).slice(0,5).forEach(x=>picks.append(highlight(c,x)));group.append(picks);root.append(group);
 const all=E('section','v14-section');all.append(A(E('div','v14-head'),E('h2','','Every race · current research coverage'),E('span','v14-caption','No automatic pick where human review missing')));tabs(all,st.meeting,m=>{st.meeting=m;rerender()},false);
 const races=E('div','v14-grid');c.data.races.filter(r=>r.meeting===st.meeting).forEach(r=>{const p=research(c,r.id);const box=E('div','v14-card');box.append(E('div','v14-tag','R'+r.race+' · '+r.distance_m+'m'),E('h3','',r.title),E('p','v14-muted',p?'Reviewed: '+p.horse+' · form '+p.form_tier:'No independently frozen winning selection'));box.append(btn('View official field',()=>{st.race=r.race;st.horse=p?.id||null;go('races')}));races.append(box);});all.append(races);root.append(all);
 root.append(A(E('div','v14-actions'),link('Four-meeting trainer and gear research','/v5/saturday-2026-11-14.html'),link('Newcastle deep review','/v5/cards/2026-11-14/newcastle-deep-review.json'),link('7 Nov results archive','/v5/saturday-2026-11-07.html')));
}
function renderDaily(root,c){base(root,'Reviewed Top '+st.top+' · 14 November','Qualitative, form-first order with independent reasons and major dangers. Percentages come unchanged from the V5-L5 model and are NOT calibrated probabilities.');warning(root);
 const controls=E('div','v14-actions');for(const n of [5,10,15])controls.append(btn('Top '+n,()=>{st.top=n;rerender()},n===st.top));root.append(controls);tabs(root,st.filter,m=>{st.filter=m;rerender()},true);const entries=winners(c).slice(0,st.top).filter(x=>st.filter==='ALL'||x.meeting===st.filter);const grid=E('div','v14-grid');entries.forEach(x=>grid.append(highlight(c,x)));root.append(grid);if(!entries.length)txt(root,'No independently reviewed candidate in this range for the selected meeting.');root.append(link('Historical shortlist archive','/v5/saturday-2026-11-07.html'));}
function renderRaces(root,c){base(root,'Race-by-race form · 40 races','Choose the meeting and race, then open any horse dossier. Scratched runners and unactivated emergencies are not shown as active contenders.');warning(root);tabs(root,st.meeting,m=>{st.meeting=m;st.race=1;st.horse=null;rerender()},false);
 const buttons=E('div','v14-races');c.data.races.filter(r=>r.meeting===st.meeting).forEach(r=>buttons.append(btn('R'+r.race,()=>{st.race=r.race;st.horse=null;st.showOut=false;rerender()},st.race===r.race)));root.append(buttons);
 let r=c.data.races.find(x=>x.meeting===st.meeting&&x.race===st.race)||c.data.races.find(x=>x.meeting===st.meeting);if(!r)return;st.race=r.race;const all=c.data.runners.filter(h=>h.race_id===r.id),active=all.filter(h=>c.model.isEligible(h)),out=all.filter(h=>!c.model.isEligible(h)),pick=research(c,r.id);const box=E('div','v14-card');box.append(E('div','v14-tag',st.meeting+' · R'+r.race),E('h2','',r.title+' · '+r.distance_m+'m'),E('p','v14-muted',active.length+' modelled · '+out.length+' scratched/unactivated · '+c.going[st.meeting]+' (Saturday official report)'));
 if(pick){box.append(E('h3','','Our V5 pick (independent research): '+pick.horse));txt(box,pick.reason);txt(box,'Pick separation: '+separationLabel(c,pick.id,r.id),'v14-sep-info');txt(box,'Main risk: '+pick.risk,'v14-flag');}else txt(box,'No independent selection for this race: raw model rank alone is not a credible betting pick.','v14-alert');
 if(r.analyst_review){const r0=r.analyst_review;box.append(E('div','v14-note','Pace / rivals: '+r0.evidence));txt(box,'Key risk: '+r0.pace_risk,'v14-flag');}
 const leading=c.board.baseline.records.filter(x=>x.race_id===r.id).sort((a,b)=>b.p_exact-a.p_exact||a.id.localeCompare(b.id));
 if(leading.length>=2)txt(box,'Raw model race separation: '+leading[0].horse+' '+leading[0].p_exact.toFixed(2)+'% vs '+leading[1].horse+' '+leading[1].p_exact.toFixed(2)+'% · +'+(leading[0].p_exact-leading[1].p_exact).toFixed(2)+' pp','v14-sep-info');
 const source=sourceMeeting(c,st.meeting);box.append(link('Latest official scratching sheet',source.scratching_source));root.append(box);
 const rows=E('div','v14-field');active.sort((a,b)=>(rawRecord(c,b.id)?.p||0)-(rawRecord(c,a.id)?.p||0)).forEach(h=>{const x=rawRecord(c,h.id),n=btn('',()=>{st.horse=h.id;rerender()},st.horse===h.id);n.className='v14-runner'+(st.horse===h.id?' active':'');const hrow=E('div','v14-head');hrow.append(E('strong','','#'+h.tab+' '+h.horse),E('span','v14-model',x?Number(x.p).toFixed(2)+'% raw':'—'));n.append(hrow,E('small','',h.jockey+' · '+h.weight_kg+'kg · barrier '+h.barrier+' · '+(h.statistics||'Career unknown').split(';')[0]),E('small','v14-sep-small',separationLabel(c,h.id,r.id)));if(pick&&h.id===pick.id)n.append(E('span','v14-pill','OUR V5 PICK'));if(h.gear_source_notes?.length)n.append(E('span','v14-gear','Gear: '+h.gear_source_notes.join(', ')));rows.append(n);});root.append(rows);
 if(st.horse){const h=active.find(x=>x.id===st.horse);if(h)root.append(formCard(c,h));}
 root.append(btn(st.showOut?'Hide withdrawn/reserves':'Show '+out.length+' withdrawn / inactive reserves',()=>{st.showOut=!st.showOut;rerender()},false));
 if(st.showOut){const x=E('div','v14-grid');out.forEach(h=>txt(x,'#'+h.tab+' '+h.horse+' — '+h.status,'v14-scratch'));root.append(x)}
 const nav=E('div','v14-actions');if(r.race>1)nav.append(btn('Previous R'+(r.race-1),()=>{st.race--;st.horse=null;rerender()}));if(r.race<10)nav.append(btn('Next R'+(r.race+1),()=>{st.race++;st.horse=null;rerender()}));root.append(nav);
}
function render(el,opts){last={el,opts};uiStyle();const c=opts&&opts.controller;if(!c){el.replaceChildren(E('p','v14-muted','Loading dated model source...'));return;}const page=opts.page||'home';if(page==='daily'||page==='top10')renderDaily(el,c);else if(page==='races')renderRaces(el,c);else renderHome(el,c);}
original.render=render;
original.select=function(meeting,race){st.meeting=meeting;st.race=race;st.horse=null;rerender()};
})(window);
