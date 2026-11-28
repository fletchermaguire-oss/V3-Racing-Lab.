/* V5 28 November fields-only race centre. No selections or win probabilities are published from this import. */
(function(global){
'use strict';
if(!global.RacingLabV5Card||global.RacingLabV5Card.date!=='2026-11-28')return;
const original=global.RacingLabToday;
if(!original)return;
const displayOrder=['SANDOWN-HILLSIDE','ROSEHILL','ASCOT','DOOMBEN'];
const st={meeting:'SANDOWN-HILLSIDE',race:1,horse:null,showOut:false};
let last=null,styleAdded=false;
function E(tag,cls,content){const n=document.createElement(tag);if(cls)n.className=cls;if(content!==undefined&&content!==null)n.textContent=String(content);return n;}
function A(parent,...nodes){for(const n of nodes)if(n)parent.append(n);return parent;}
function txt(parent,text,cls){return A(parent,E('p',cls||'',text));}
function btn(title,fn,active){const n=E('button','v14-btn'+(active?' v14-active':''),title);n.type='button';n.addEventListener('click',fn);return n;}
function link(label,url){if(!url)return null;const a=E('a','v14-link',label);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function rerender(){if(last)render(last.el,last.opts);}
function go(page){if(last&&last.opts&&last.opts.navigate)last.opts.navigate(page);}
function uiStyle(){
 if(styleAdded)return;styleAdded=true;
 const css='.v14-wrap{display:grid;gap:18px;padding:8px 0 35px;color:var(--ink,#e9f7ff)}.v14-hero{padding:22px;border:1px solid #304950;border-radius:17px;background:linear-gradient(125deg,#17312f,#111d29)}.v14-hero h1{font-size:clamp(1.5rem,3.5vw,2.1rem);margin:5px 0 10px}.v14-muted{color:#a4b8c3;font-size:.87rem;line-height:1.5}.v14-caption{color:#9cb5c0;font-size:.78rem}.v14-alert{border-left:3px solid #e2c285;background:#202622;border-radius:6px;padding:11px 14px;color:#efdbab}.v14-actions{display:flex;gap:8px;flex-wrap:wrap}.v14-btn{border:1px solid #365059;background:#162733;color:#dbeef3;border-radius:9px;padding:10px 12px;font-weight:700;font-size:13px;cursor:pointer}.v14-btn:hover,.v14-active{background:#245343;color:#b5f5d7;border-color:#5dbaa3}.v14-link{color:#a5e4da;text-decoration:underline;text-underline-offset:3px;font-size:.88rem}.v14-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:11px}.v14-card,.v14-review{border:1px solid #304450;border-radius:12px;padding:13px;background:#14232e}.v14-card h3{font-size:1.02rem;margin:4px 0 8px}.v14-card p{margin:7px 0}.v14-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap}.v14-tag{display:inline-block;color:#a8dce3;font-size:.75rem;font-weight:800;letter-spacing:.03em}.v14-races{display:flex;gap:7px;flex-wrap:wrap}.v14-entries{display:grid;gap:8px}.v14-runner{display:grid;gap:4px;width:100%;text-align:left;border:1px solid #34505e;border-radius:11px;background:#14232f;color:#ecf8fa;padding:12px;cursor:pointer}.v14-runner.active{border-color:#7be5c2;background:#1c3e36}.v14-runner strong{font-size:.96rem}.v14-runner small{font-size:.78rem;color:#b6c6cc}.v14-field{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:9px}.v14-gear{color:#eed494;font-size:.82rem}.v14-scratch{opacity:.76;text-decoration:line-through}.v14-pill{border-radius:99px;background:#244a43;color:#b5edd5;padding:4px 8px;font-size:.68rem;font-weight:800;white-space:nowrap}@media(max-width:650px){.v14-hero{padding:16px}.v14-card{padding:12px}}';
 const s=E('style');s.textContent=css;document.head.append(s);
}
function base(root,title,sub){
 root.classList.add('v14-wrap');root.replaceChildren();
 const h=A(E('div','v14-hero'),E('div','v14-tag','V5 · SATURDAY 28 NOVEMBER 2026'),E('h1','',title),E('p','v14-muted',sub));
 root.append(h);return h;
}
function warning(root){
 root.append(E('div','v14-alert','FIELDS ONLY · Four priority meetings retained: Sandown-Hillside, Rosehill, Ascot and Doomben (40 races). All other meeting fields are excluded from this active card. No independent shortlist, approved V5 selections, calibrated win probabilities or final-starter attestations are included.'));
}
function sourceMeeting(c,m){return (c.data.meetings||[]).find(x=>x.meeting===m)||null;}
function sourceLabel(row){return row&&row.source_kind==='OFFICIAL_RACING_AUSTRALIA'?'Racing Australia official form':'Racing & Sports third-party fields';}
function tabs(root,selected,fn){
 const row=E('div','v14-actions');
 for(const m of displayOrder)row.append(btn(m,()=>fn(m),selected===m));
 root.append(row);
}
function renderHome(root,c){
 const h=base(root,'Saturday fields · 4 meetings','Official fields and sourced third-party field cards loaded into the V5 race centre. This is not a completed V5 prediction run.');
 h.append(A(E('div','v14-actions'),btn('Open Race Centre',()=>go('races')),btn('Field import status',()=>go('daily'))));
 warning(root);
 const grid=E('div','v14-grid');
 for(const m of displayOrder){
  const src=sourceMeeting(c,m),rs=c.data.races.filter(r=>r.meeting===m),listed=c.data.runners.filter(x=>rs.some(r=>r.id===x.race_id));
  const active=listed.filter(x=>c.model.isEligible(x)).length;
  const card=E('article','v14-card');
  card.append(E('div','v14-tag',m),E('h3','',rs.length+' races · '+listed.length+' listed rows'));
  txt(card,active+' listed active · '+(listed.length-active)+' scratched / unactivated / excluded','v14-muted');
  txt(card,(src&&src.official_going)||('Scenario going: '+(src&&src.scenario_going||'not set')),'v14-sep-info');
  txt(card,sourceLabel(src)+' · '+(src&&src.source_last_published||'source timestamp unavailable'),'v14-caption');
  if(src&&src.track_condition_reported)txt(card,'Track report: '+src.track_condition_reported+(src.going_verified?' · official grade':' · not independently verified'),'v14-caption');
  if(src&&src.rail)txt(card,'Rail: '+src.rail,'v14-caption');
  if(src&&src.source)card.append(link('Open field source',src.source));
  card.append(btn('View '+m+' fields',()=>{st.meeting=m;st.race=1;st.horse=null;st.showOut=false;go('races');}));
  grid.append(card);
 }
 root.append(grid);
 root.append(link('Open imported 28 November V5 research data','/v5/cards/2026-11-28/research.json'));
}
function renderDaily(root,c){
 base(root,'Field import status','No Top 5 / 10 / 15 has been generated or approved from this fields-only import.');
 warning(root);
 const n=E('div','v14-card');
 n.append(E('h3','','No selections published'));
 txt(n,'The model can calculate diagnostic outputs from the imported card, but the field import does not contain a complete dated-form, sectionals, trials, pace-map or independent runner review pass. I have therefore not turned its raw outputs into betting picks.','v14-muted');
 n.append(btn('Open all imported fields',()=>go('races')));
 root.append(n);
}
function formCard(c,h){
 const p=E('article','v14-review');
 p.append(E('div','v14-head'),E('h3','',h.horse));
 txt(p,'#'+h.tab+' · '+(h.barrier?'Barrier '+h.barrier:'Barrier unavailable')+' · '+(h.weight_kg?h.weight_kg+'kg':'Weight unavailable'),'v14-muted');
 txt(p,(h.jockey||'Jockey not listed')+' · '+(h.trainer||'Trainer not listed'),'v14-muted');
 if(h.statistics)txt(p,h.statistics,'v14-muted');
 if(h.form)txt(p,h.form,'v14-muted');
 if(h.gear_source_notes&&h.gear_source_notes.length)txt(p,'Gear: '+h.gear_source_notes.join('; '),'v14-gear');
 if(h.source&&h.source.url)p.append(link('Open source runner form',h.source.url));
 return p;
}
function renderRaces(root,c){
 if(!displayOrder.includes(st.meeting))st.meeting=displayOrder[0];
 base(root,'Race Centre · '+st.meeting,'Choose a race to view its imported runners, weights, barriers, jockeys, trainers and available form notes.');
 warning(root);tabs(root,st.meeting,m=>{st.meeting=m;st.race=1;st.horse=null;st.showOut=false;rerender();});
 const raceList=c.data.races.filter(r=>r.meeting===st.meeting).sort((a,b)=>a.race-b.race);
 const raceButtons=E('div','v14-races');
 raceList.forEach(r=>raceButtons.append(btn('R'+r.race,()=>{st.race=r.race;st.horse=null;st.showOut=false;rerender();},st.race===r.race)));
 root.append(raceButtons);
 const r=raceList.find(x=>x.race===st.race)||raceList[0];
 if(!r){root.append(E('div','v14-alert','No race field was imported for this meeting.'));return;}
 st.race=r.race;
 const src=sourceMeeting(c,st.meeting),all=c.data.runners.filter(h=>h.race_id===r.id);
 const active=all.filter(h=>c.model.isEligible(h)).sort((a,b)=>a.tab-b.tab);
 const out=all.filter(h=>!c.model.isEligible(h)).sort((a,b)=>a.tab-b.tab);
 const box=E('article','v14-card');
 box.append(E('div','v14-tag',st.meeting+' · R'+r.race),E('h2','',r.title+' · '+r.distance_m+'m'));
 txt(box,(r.local_start?'Jump: '+r.local_start+' · ':'')+active.length+' listed active · '+out.length+' scratched / unactivated','v14-muted');
 txt(box,sourceLabel(src)+' · '+(src&&src.source_last_published||'timestamp unavailable'),'v14-caption');
 if(src&&src.track_condition_reported)txt(box,'Track: '+src.track_condition_reported+(src.going_verified?'':' · source not independently verified'),'v14-caption');
 if(src&&src.rail)txt(box,'Rail: '+src.rail,'v14-caption');
 if(src&&src.source)box.append(link('Open meeting field source',src.source));
 root.append(box);
 const rows=E('div','v14-field');
 active.forEach(h=>{
  const n=btn('',()=>{st.horse=st.horse===h.id?null:h.id;rerender();},st.horse===h.id);
  n.className='v14-runner'+(st.horse===h.id?' active':'');
  const head=E('div','v14-head');
  head.append(E('strong','', '#'+h.tab+' '+h.horse),E('span','v14-caption',h.barrier?'Gate '+h.barrier:'Gate —'));
  n.append(head,E('small','',(h.weight_kg?h.weight_kg+'kg':'Weight —')+' · '+(h.jockey||'Jockey —')+' · '+(h.trainer||'Trainer —')));
  if(h.form)n.append(E('small','',h.form));
  if(h.gear_source_notes&&h.gear_source_notes.length)n.append(E('span','v14-gear','Gear: '+h.gear_source_notes.join('; ')));
  rows.append(n);
 });
 root.append(rows);
 if(st.horse){const h=active.find(x=>x.id===st.horse);if(h)root.append(formCard(c,h));}
 root.append(btn(st.showOut?'Hide withdrawn / unactivated':'Show '+out.length+' scratched / unactivated',()=>{st.showOut=!st.showOut;rerender();}));
 if(st.showOut){const withdrawn=E('div','v14-entries');out.forEach(h=>txt(withdrawn,'#'+h.tab+' '+h.horse+' — '+h.status,'v14-scratch'));root.append(withdrawn);}
 const nav=E('div','v14-actions');
 if(r.race>1)nav.append(btn('Previous R'+(r.race-1),()=>{st.race--;st.horse=null;rerender();}));
 if(r.race<raceList.length)nav.append(btn('Next R'+(r.race+1),()=>{st.race++;st.horse=null;rerender();}));
 root.append(nav);
}
function render(el,opts){
 last={el,opts};uiStyle();const c=opts&&opts.controller;
 if(!c){el.replaceChildren(E('p','v14-muted','Loading 28 November fields...'));return;}
 const page=opts.page||'home';
 if(page==='daily'||page==='top10')renderDaily(el,c);
 else if(page==='races')renderRaces(el,c);
 else renderHome(el,c);
}
original.render=render;
original.select=function(meeting,race){st.meeting=meeting;st.race=race;st.horse=null;rerender();};
})(window);
