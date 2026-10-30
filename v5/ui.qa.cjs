'use strict';
/* Dependency-free browser-shaped smoke check for original-shell embedded V5 pages.
 * Model QA alone cannot prove the simulator or daily rankings render.
 */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Model=require('./model.js'),Curated=require('./curated.js'),State=require('./site-state.js');
const D=require('./research.json'),O=require('./official-latest.json'),Q=require('./shortlists/current.json');
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.dataset={};this.style={};this.listeners={};this.value='';this.textContent='';
  this.classList={add(){},remove(){}};this.disabled=false;}
 append(...nodes){for(const x of nodes)if(x!==null&&x!==undefined)this.children.push(x);}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 addEventListener(type,fn){this.listeners[type]=fn;}
 setAttribute(name,value){this[name]=value;}
 getAttribute(name){return this[name];}
}
function flatten(el){return [el,...(el.children||[]).flatMap(flatten)];}
function boot(){
 const C=State.create(State.applyOfficialOverlay(D,O),{checkpoint:Q,going:O.going});
 const doc={createElement:tag=>new Element(tag),getElementById:()=>null,body:new Element('body')};
 const win={location:{search:''},localStorage:{getItem:()=>null,setItem(){}},
  RacingLabV5Model:Model,RacingLabV5Curated:Curated,RacingLabHorseAnalysis:require('./horse-analysis.js'),
  RacingLabV5State:State,scrollTo(){},requestAnimationFrame:null};
 const context=vm.createContext({window:win,document:doc,console:console,Set:Set,Map:Map,Promise:Promise});
 for(const file of ['v5/workshop.js','v5/dashboard.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
 return {C,win};
}
test('original-shell embedded studio opens every page without a blank screen or exceptions',()=>{
 const {C,win}=boot();
 for(const page of ['overview','top10','races','multi','sim','compare','qa','cal','weather','sync','results']){
  const root=new Element('main');
  assert.doesNotThrow(()=>win.RacingLabV5Dashboard.renderInto(root,page,C,()=>{},D.races[0].id),page);
  const nodes=flatten(root);
  assert.ok(nodes.length>5,'Empty page '+page);
  assert.ok(nodes.some(x=>x.tag==='h2'),'Missing page heading '+page);
 }
});
test('simulator visibly renders runners and 10,000 draws, and can produce one sample winner',()=>{
 const {C,win}=boot(),root=new Element('main');
 win.RacingLabV5Dashboard.renderInto(root,'sim',C,()=>{},D.races[0].id);
 let nodes=flatten(root);
 assert.ok(nodes.some(x=>x.className==='workshop-track'));
 const run=nodes.find(x=>x.tag==='button'&&x.textContent==='Run 10,000 draws');
 assert.ok(run&&run.listeners.click);
 run.listeners.click();
 nodes=flatten(root);
 assert.ok(nodes.some(x=>String(x.textContent).includes('Completed 10,000 draws')));
 assert.ok(nodes.some(x=>x.tag==='table'));
 const play=nodes.find(x=>x.tag==='button'&&String(x.textContent).includes('Play one draw'));
 assert.ok(play&&play.listeners.click);
 assert.doesNotThrow(()=>play.listeners.click());
 assert.ok(flatten(root).some(x=>String(x.textContent).includes('Sampled winner:')));
});
test('original homepage and Top5/10/15 present curated names; edit controls render and respond',()=>{
 const {C,win}=boot(),root=new Element('main');
 assert.equal(C.curated.count,15);
 assert.equal(C.curated.additional_review_count,5);
 assert.deepEqual(C.curated.entries.slice(10).map(x=>x.research_lane),Array(5).fill('CONDITIONAL_REVIEW'));
 win.RacingLabV5Dashboard.renderInto(root,'overview',C,()=>{},D.races[0].id);
 let nodes=flatten(root);
 for(const h of ['Sheza Alibi','Regal Ambition','Hot And High']){
  assert.ok(nodes.some(x=>String(x.textContent).includes(h)),'Original shell must display '+h);
 }
 win.RacingLabV5Dashboard.renderInto(root,'top10',C,()=>{},D.races[0].id);
 nodes=flatten(root);
 assert.ok(nodes.some(x=>x.tag==='h2'&&String(x.textContent).includes('Top 10 Selections')));
 assert.ok(nodes.some(x=>String(x.textContent).includes('Our researched horses in original rank order')));
 const edit=nodes.find(x=>x.tag==='button'&&x.textContent==='Edit grade / rank');
 assert.ok(edit&&edit.listeners.click);
 assert.doesNotThrow(()=>edit.listeners.click());
 assert.ok(flatten(root).some(x=>x.tag==='input'&&x.placeholder.includes('Explain form')));
});


test('provisionally promoted emergencies cannot be auto-filled into the multi or manually added',()=>{
 const {C,win}=boot();
 const reserve=C.data.runners.find(h=>/^EMERGENCY\b/i.test(String(h.status||''))&&h.emergency_activated===true&&
  C.board.baseline.records.some(x=>x.id===h.id));
 assert.ok(reserve,'Friday source must contain an included but uncertified projected emergency');
 C.board.winFirst.priority.unshift({runner_id:reserve.id,horse:reserve.horse,race_id:reserve.race_id});
 const root=new Element('main');
 win.RacingLabV5Dashboard.renderInto(root,'multi',C,()=>{},D.races[0].id);
 const auto=flatten(root).find(n=>n.tag==='button'&&n.textContent==='Use researched top 2');
 assert.ok(auto,'Multi auto-fill control must render');
 if(!auto.disabled)auto.listeners.click();
 const chosen=flatten(root).filter(n=>n.className==='workshop-leg-top').flatMap(flatten);
 assert.ok(chosen.every(n=>!String(n.textContent).includes(reserve.horse)),
  'projected emergency must never appear in an automatically filled multi');
 let selects=flatten(root).filter(n=>n.tag==='select');
 const meeting=selects.find(n=>n.children.some(o=>o.value==='FLEMINGTON'))||selects[1];
 meeting.value=reserve.race_id.split('_')[1];meeting.listeners.change();
 selects=flatten(root).filter(n=>n.tag==='select');
 const raceSelect=selects.find(n=>n.children.some(o=>o.value===reserve.race_id));
 assert.ok(raceSelect,'Multi Lab must offer the runner’s race');
 raceSelect.value=reserve.race_id;raceSelect.listeners.change();
 const addButtons=flatten(root).filter(n=>n.className==='workshop-candidate');
 const reserveRow=addButtons.find(n=>flatten(n).some(x=>String(x.textContent).includes(reserve.horse)));
 assert.ok(reserveRow,'Projected runner must remain visible as an excluded candidate');
 assert.ok(flatten(reserveRow).some(n=>n.tag==='button'&&n.disabled&&n.textContent==='Excluded'),
  'projected emergency cannot be manually promoted by Multi Lab');
});


test('every horse has readable evidence sections in both Race Centre and Compare',()=>{
 const {C,win}=boot(),root=new Element('main');
 const sheza=D.runners.find(x=>x.horse==='Sheza Alibi');
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},sheza.race_id);
 let nodes=flatten(root);
 assert.ok(nodes.some(x=>x.textContent==='Why it can win'));
 assert.ok(nodes.some(x=>x.textContent==='What could beat it'));
 assert.ok(nodes.some(x=>x.textContent==='Still to confirm'));
 assert.ok(nodes.some(x=>String(x.textContent).includes('Golden Eagle field')));
 const count=nodes.filter(x=>x.className==='horse-brief').length;
 assert.equal(count,1,'analysis appears in selected horse panel, not duplicated below the whole race');
 win.RacingLabV5Dashboard.renderInto(root,'compare',C,()=>{},sheza.race_id);
 nodes=flatten(root);
 assert.equal(nodes.filter(x=>x.className==='horse-brief').length,2,'each compared runner gets a clear assessment');
});


test('Multi Builder starts with only 2/3 legs and keeps optional manual selection collapsed',()=>{
 const {C,win}=boot(),root=new Element('main');
 win.RacingLabV5Dashboard.renderInto(root,'multi',C,()=>{},D.races[0].id);
 const nodes=flatten(root);
 assert.ok(nodes.some(n=>n.textContent==='Multi Builder'));
 assert.ok(nodes.some(n=>n.textContent==='Your 2-leg selection'));
 const custom=nodes.find(n=>n.tag==='details'&&n.className==='workshop-advanced');
 assert.ok(custom,'manual advanced controls should be grouped');
 assert.equal(custom.open,false,'manual race and horse grids are initially collapsed');
 assert.ok(flatten(custom).some(n=>n.textContent==='Choose or replace horses manually'));
 const fill=nodes.find(n=>n.tag==='button'&&n.textContent==='Use researched top 2');
 assert.ok(fill&&!fill.disabled,'the original #1 and #2 can both appear as research suggestions');
 fill.listeners.click();
 const refreshed=flatten(root),legs=refreshed.filter(n=>n.className==='workshop-leg-top').flatMap(flatten);
 assert.ok(legs.some(n=>n.textContent==='Sheza Alibi'));
 assert.ok(legs.some(n=>n.textContent==='Regal Ambition'));
 assert.ok(refreshed.some(n=>String(n.textContent).includes('UNCALIBRATED COMBINED MODEL ESTIMATE')));
});
test('Race Centre shows one research selection, with model-only comparison collapsed',()=>{
 const {C,win}=boot(),root=new Element('main');
 const sheza=D.runners.find(h=>h.horse==='Sheza Alibi');
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},sheza.race_id);
 const nodes=flatten(root);
 const selections=nodes.filter(x=>x.className==='rlv5-race-selection');
 assert.equal(selections.length,1,'only one primary pick panel per race');
 assert.ok(flatten(selections[0]).some(x=>x.textContent==='Sheza Alibi'));
 assert.ok(!nodes.some(x=>String(x.textContent).startsWith('Live model #1:')),
  'raw model rank must not appear as a competing recommended selection');
 const modelNotes=nodes.find(x=>x.tag==='details'&&x.className==='rlv5-model-notes');
 assert.ok(modelNotes&&!modelNotes.open,'model disagreement must be collapsed by default');
 assert.ok(flatten(modelNotes).some(x=>String(x.textContent).includes('not a recommendation or an additional top pick')));
});

test('command dashboard preserves real research order, shows source status and keeps results pending',()=>{
 const {C,win}=boot(),root=new Element('main');
 win.RacingLabV5Dashboard.renderInto(root,'overview',C,()=>{},D.races[0].id);
 const nodes=flatten(root);
 assert.ok(nodes.some(n=>n.textContent==='Saturday Command Centre'));
 assert.ok(nodes.some(n=>n.textContent==='Independent Top 10'));
 assert.ok(nodes.some(n=>n.textContent==='Sheza Alibi'));
 assert.ok(nodes.some(n=>n.textContent==='Regal Ambition'));
 const picks=nodes.filter(n=>String(n.className).includes('rlv5-command-pick')&&n.tag==='button');
 assert.equal(picks.length,10,'exactly ten unchanged human research ranks');
 assert.deepEqual(picks.slice(0,3).map(n=>n.dataset.runnerId),
  C.curated.entries.slice(0,3).map(x=>x.id));
 assert.ok(nodes.some(n=>n.textContent==='Pre-race published lock: not verified'));
 assert.ok(nodes.some(n=>n.textContent==='Calibration: not established'));
 assert.ok(nodes.some(n=>String(n.textContent).includes('model estimates, not verified win probabilities')));
 assert.ok(nodes.some(n=>String(n.textContent).includes('59 in saved field across all meetings')));
 assert.ok(!nodes.some(n=>String(n.textContent).includes('Awaiting official refresh')));
});
test('Race Centre shows one research selection and full readable evidence',()=>{
 const {C,win}=boot(),root=new Element('main');
 const sheza=D.runners.find(h=>h.horse==='Sheza Alibi');
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},sheza.race_id);
 const nodes=flatten(root);
 assert.ok(nodes.some(n=>n.textContent==='Race Centre'));
 assert.equal(nodes.filter(n=>n.className==='rlv5-race-selection').length,1);
 assert.ok(nodes.some(n=>n.textContent==='Sheza Alibi'));
 assert.ok(nodes.some(n=>n.tag==='details'&&n.className==='rlv5-model-notes'&&!n.open));
 assert.ok(nodes.some(n=>n.textContent==='Why it can win'));
 assert.ok(nodes.some(n=>n.textContent==='What could beat it'));
 const active=nodes.filter(n=>n.className==='rlv5-runrow active');
 assert.equal(active.length,1,'single selected horse');
 assert.equal(active[0].dataset.runnerId,sheza.id,'opens on independent researched pick by default');
 assert.ok(nodes.some(n=>n.textContent==='Top four · live model, not research picks'));
 assert.ok(nodes.some(n=>n.textContent==='Open race simulator'));
 const advanced=nodes.find(n=>n.tag==='details'&&n.className==='rlv5-race-advanced');
 assert.ok(advanced&&!advanced.open,'track scenario changes should be collapsed by default');
 const deep=nodes.find(n=>n.tag==='details'&&n.className==='rlv5-horse-technical');
 assert.ok(deep&&!deep.open,'technical form and local exclusions are optional');
});
test('design entrypoints both use the same single CSS and JS revision and do not modify formula',()=>{
 const home=fs.readFileSync('index.html','utf8'),studio=fs.readFileSync('v5/index.html','utf8');
 for(const html of [home,studio]){
  assert.match(html,/\/v5\/site\.css\?v=reviewed-separation-20261031/);
  assert.match(html,/\/v5\/dashboard\.js\?v=reviewed-live-20261031/);
  assert.match(html,/\/v5\/model\.js\?v=shared-20261030/,'original V5 model is unchanged');
 }
});

test('Top 10 header and 10 horse cards are separate siblings, never grid children of the header',()=>{
 const {C,win}=boot(),root=new Element('main');
 win.RacingLabV5Dashboard.renderInto(root,'overview',C,()=>{},D.races[0].id);
 const lists=flatten(root).filter(n=>n.className==='rlv5-command-picks');
 assert.equal(lists.length,1,'one Top 10 list wrapper');
 const items=lists[0].children;
 assert.equal(items.length,11,'one header plus ten separate rows');
 assert.equal(items[0].className,'rlv5-command-picks-head');
 assert.equal(items[0].children.length,5,'header contains ONLY five column labels');
 const horses=items.slice(1);
 assert.ok(horses.every(n=>n.tag==='button'&&n.className.startsWith('rlv5-command-pick')));
 assert.deepEqual(horses.map(n=>n.dataset.runnerId),C.curated.top10.map(x=>x.id),'original ranking unchanged');
 const css=fs.readFileSync('v5/site.css','utf8');
 assert.match(css,/\.rlv5-command-picks>\.rlv5-command-pick\{display:grid/);
 assert.match(css,/grid-template-areas:"rank horse pct" "\. grade status"/);
 assert.match(css,/\.rlv5-command-picks>\.rlv5-command-picks-head\{display:none\}/);
});
test('both entrypoints bust cached UI files without touching the model version',()=>{
 for(const path of ['index.html','v5/index.html']){
  const html=fs.readFileSync(path,'utf8');
  assert.match(html,/site\.css\?v=reviewed-separation-20261031/);
  assert.match(html,/dashboard\.js\?v=reviewed-live-20261031/);
  assert.match(html,/model\.js\?v=shared-20261030/);
 }
});


test('Top 10 page has one clean list of stable independent rankings and only three obvious choices',()=>{
 const {C,win}=boot(),root=new Element('main');
 win.RacingLabV5Dashboard.renderInto(root,'top10',C,()=>{},D.races[0].id);
 const nodes=flatten(root),list=nodes.find(n=>n.className==='rlv5-shortlist-cards');
 assert.ok(nodes.some(n=>n.textContent==='Top 10 Selections'),'short heading');
 assert.ok(list,'primary shortlist');
 assert.equal(list.children.length,10,'exactly one visible research card per ranked horse');
 assert.ok(list.children.every(n=>n.tag==='button'&&n.className.startsWith('rlv5-shortlist-card')));
 assert.deepEqual(list.children.map(n=>n.dataset.runnerId),C.curated.entries.slice(0,10).map(x=>x.id),
  'original research order and runner identities are preserved');
 assert.ok(list.children.every(n=>flatten(n).some(y=>y.textContent==='MODEL ESTIMATE')));
 assert.ok(list.children.every(n=>flatten(n).some(y=>y.className==='rlv5-shortlist-grade')));
 const controls=nodes.filter(n=>n.className&&n.className.includes('rlv5-shortlist-tab'));
 assert.deepEqual(controls.map(n=>n.textContent),['Top 5','Top 10','Top 15']);
 assert.equal(nodes.filter(n=>n.className==='rlv5-shortlist-warning').length,1);
 assert.ok(!nodes.some(n=>String(n.textContent).includes('Change track scenario')),
  'advanced track scenarios should be on the Weather page, not crowd this list');
 const advanced=nodes.find(n=>n.tag==='details'&&n.className==='rlv5-shortlist-advanced');
 assert.ok(advanced&&!advanced.open,'audit options stay collapsed');
 assert.equal(nodes.filter(n=>n.className==='rlv5-shortlist-cards').length,1);
});
test('Top 5/15 toggles adjust visible count without changing saved research or formula',()=>{
 const {C,win}=boot(),root=new Element('main');
 const original=C.curated.entries.map(h=>[h.id,h.original_rank,h.model_pct]);
 const render=()=>flatten(root);
 win.RacingLabV5Dashboard.renderInto(root,'top10',C,()=>{},D.races[0].id);
 const top5=render().find(n=>n.tag==='button'&&n.textContent==='Top 5');
 top5.listeners.click();
 assert.equal(render().find(n=>n.className==='rlv5-shortlist-cards').children.length,5);
 const top15=render().find(n=>n.tag==='button'&&n.textContent==='Top 15');
 top15.listeners.click();
 const list=render().find(n=>n.className==='rlv5-shortlist-cards');
 assert.equal(list.children.length,15);
 assert.ok(render().some(n=>String(n.textContent).includes('additional review candidates')));
 assert.deepEqual(C.curated.entries.map(h=>[h.id,h.original_rank,h.model_pct]),original);
});
test('Top 10 mobile layout is separate cards, no multi-column table or overlap-prone nested headers',()=>{
 const html=fs.readFileSync('v5/site.css','utf8'),js=fs.readFileSync('v5/dashboard.js','utf8');
 assert.match(html,/\.rlv5-shortlist-cards\{[^}]*display:flex;flex-direction:column/);
 assert.match(html,/\.rlv5-shortlist-card\{[^}]*grid-template-columns:39px minmax\(0,1fr\) minmax\(85px,107px\)/);
 assert.match(html,/@media\(max-width:780px\)/);
 assert.match(js,/var list=e\('div','rlv5-shortlist-cards'\)/);
 assert.doesNotMatch(js.slice(js.indexOf('function top10(){'),js.indexOf('function raceNav(){')),/scenarios\(\)/);
});


test('Enamorada Randwick R6 retains missing jockey evidence but follows current official scratching',()=>{
 const {C,win}=boot(),root=new Element('main');
 const h=D.runners.find(x=>x.horse==='Enamorada'&&x.race_id.endsWith('RANDWICK_R06'));
 assert.ok(h&&!h.jockey,'archived source does not declare a jockey');
 const now=C.data.runners.find(x=>x.id===h.id);
 assert.match(now.status,/SCRATCHED/,'confirmed Saturday withdrawal overrides unverified original rider');
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},h.race_id);
 const nodes=flatten(root);
 // The Race Centre may retain an excluded horse in its research history,
 // but the runner must not appear in the modelled active-field distribution.
 assert.ok(nodes.length>0,'Race Centre remains readable after scratching');
 assert.ok(!C.board.baseline.records.some(x=>x.id===h.id),'no invented active rider or starter');
});

test('crowded wide fields show no standout rather than claiming an uncalibrated 9% lock',()=>{
 const {C,win}=boot(),root=new Element('main');
 const noStandout=D.races.find(r=>r.meeting==='RANDWICK'&&r.race===4);
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},noStandout.id);
 let nodes=flatten(root);
 assert.ok(nodes.some(n=>n.className==='rlv5-race-no-standout'));
 assert.ok(nodes.some(n=>String(n.textContent).includes('No clear model standout')));
 assert.ok(nodes.some(n=>String(n.textContent).includes('crowded race, not a high-confidence single')));
 const contrast=D.races.find(r=>r.meeting==='RANDWICK'&&r.race===8);
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},contrast.id);
 nodes=flatten(root);
 assert.ok(!nodes.some(n=>n.className==='rlv5-race-no-standout'), 'not all race leaders are labelled as crowded');
});


test('races without independently researched contenders explicitly show no selection, not model No.1 as an automatic pick',()=>{
 const {C,win}=boot(),root=new Element('main');
 const without=D.races.find(r=>!C.curated.entries.some(h=>h.race_id===r.id));
 assert.ok(without);
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},without.id);
 const nodes=flatten(root),panel=nodes.find(n=>n.className==='rlv5-race-selection no-pick');
 assert.ok(panel,'no-selection state must exist for races outside the Top 15');
 assert.ok(flatten(panel).some(n=>n.textContent==='No current Top 10 research selection'));
 const notes=nodes.find(n=>n.tag==='details'&&n.className==='rlv5-model-notes');
 assert.ok(notes&&!notes.open);
 assert.ok(!flatten(panel).some(n=>String(n.textContent).includes('Model rank')));
 const code=fs.readFileSync('v5/dashboard.js','utf8');
 assert.doesNotMatch(code,/Live model #1:/,'model No.1 is no longer marketed as a second selection');
});
test('when independently researched horse differs from model first, researched pick remains the single visible selection',()=>{
 const {C,win}=boot(),root=new Element('main');
 // Deliberately simulate a differing live leader; Friday's saved model may
 // currently agree with every researched Top 10 horse.
 const diff=C.curated.entries.find(h=>h.eligible&&h.research_lane==='TOP10_RESEARCH');
 assert.ok(diff,'an eligible human-reviewed contender must exist');
 const race=C.board.baseline.races.find(x=>x.id===diff.race_id);
 const alternative=C.data.runners.find(h=>h.race_id===diff.race_id&&h.horse!==diff.horse&&
  C.board.baseline.records.some(x=>x.id===h.id));
 assert.ok(race&&alternative,'test requires a different real included runner in this race');
 race.leader=alternative.horse;
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},diff.race_id);
 const nodes=flatten(root),pick=nodes.find(n=>n.className==='rlv5-race-selection');
 assert.ok(pick&&flatten(pick).some(n=>n.textContent===diff.horse));
 const diagnostics=nodes.find(n=>n.tag==='details'&&n.className==='rlv5-model-notes');
 assert.ok(diagnostics&&!diagnostics.open);
 assert.ok(flatten(diagnostics).some(n=>String(n.textContent).includes('Model disagrees with the researched horse')));
 const chip=nodes.filter(n=>n.tag==='button'&&n.className.includes('racechip'));
 assert.ok(chip.some(n=>flatten(n).some(x=>String(x.textContent).includes('Research: '+diff.horse))));
});


test('additional review ranks 11–15 are not presented as top race selections',()=>{
 const {C,win}=boot(),root=new Element('main');
 const watch=C.curated.entries.find(h=>h.research_lane==='CONDITIONAL_REVIEW'&&
  !C.curated.entries.some(x=>x.race_id===h.race_id&&x.research_lane==='TOP10_RESEARCH'));
 assert.ok(watch,'at least one review-only runner must be present');
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},watch.race_id);
 const n=flatten(root),pick=n.find(x=>x.className==='rlv5-race-selection no-pick');
 assert.ok(pick);
 assert.ok(flatten(pick).some(x=>x.textContent==='No current Top 10 research selection'));
 assert.ok(!flatten(pick).some(x=>x.textContent===watch.horse));
 const note=n.find(x=>x.className==='rlv5-model-notes');
 assert.ok(note&&!note.open);
 assert.ok(flatten(note).some(x=>String(x.textContent).includes('Additional review candidate: '+watch.horse)));
});


test('saved Saturday scratchings show on dashboard and Race Centre without live official service',()=>{
 const {C,win}=boot(),root=new Element('main');
 assert.equal(C.official,null);
 assert.equal(C.data.official_overlay_scratchings.RANDWICK_R05.length,6);
 win.RacingLabV5Dashboard.renderInto(root,'overview',C,()=>{},D.races[0].id);
 let nodes=flatten(root);
 assert.ok(nodes.some(x=>x.textContent==='59 in saved field across all meetings'));
 assert.ok(!nodes.some(x=>String(x.textContent).includes('Awaiting official refresh')));
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},'2026-10-31_RANDWICK_R05');
 nodes=flatten(root);
 assert.ok(nodes.some(x=>x.textContent==='Saved race scratchings: 6'));
 const included=C.board.baseline.records.filter(x=>x.race_id==='2026-10-31_RANDWICK_R05');
 assert.equal(included.length,6);
 assert.deepEqual(included.map(x=>x.horse).sort(),['Bestower','Cavalry','Columbus','Koolibah','Steel Blaze','Think Itz You'].sort());
});

test('researched shortlist labels are Reviewed selection, not provisional starter recommendations',()=>{
 const {C,win}=boot(),root=new Element('main');
 win.RacingLabV5Dashboard.renderInto(root,'overview',C,()=>{},D.races[0].id);
 let nodes=flatten(root);
 assert.ok(nodes.some(x=>x.className==='rlv5-pick-status'&&x.textContent==='Reviewed selection'));
 assert.ok(!nodes.some(x=>x.className==='rlv5-pick-status'&&x.textContent==='Provisional'));
 const sheza=D.runners.find(h=>h.horse==='Sheza Alibi');
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},sheza.race_id);
 nodes=flatten(root);
 assert.ok(nodes.some(x=>String(x.textContent).includes('Reviewed research selection')));
 assert.ok(nodes.some(x=>String(x.textContent).includes('Starter status is based on')));
});

test('all 15 researched selections expose percentage and signed separation against highest rival',()=>{
 const {C,win}=boot(),root=new Element('main');
 win.RacingLabV5Dashboard.renderInto(root,'top10',C,()=>{},D.races[0].id);
 let nodes=flatten(root);
 const tab=nodes.find(n=>n.tag==='button'&&n.textContent==='Top 15');
 assert.ok(tab&&tab.listeners.click);
 tab.listeners.click();
 nodes=flatten(root);
 const cards=nodes.filter(n=>n.className&&n.className.startsWith('rlv5-shortlist-card')&&n.tag==='button');
 assert.equal(cards.length,15);
 cards.forEach(card=>{
  const row=C.curated.entries.find(h=>h.id===card.dataset.runnerId);
  const all=C.board.baseline.records.filter(x=>x.race_id===row.race_id);
  const chosen=all.find(x=>x.id===row.id);
  const rival=all.filter(x=>x.id!==row.id).sort((a,b)=>b.p-a.p)[0];
  const expected=Math.round((chosen.p-rival.p)*100)/100;
  const n=flatten(card);
  assert.ok(n.some(x=>x.className==='rlv5-shortlist-percent'&&x.textContent===chosen.p.toFixed(2)+'%'),row.horse+' percentage');
  assert.ok(n.some(x=>String(x.textContent).includes('Sep '+(expected>=0?'+':'')+expected.toFixed(2)+'pp vs '+rival.horse)),row.horse+' separation');
 });
 win.RacingLabV5Dashboard.renderInto(root,'overview',C,()=>{},D.races[0].id);
 nodes=flatten(root);
 assert.equal(nodes.filter(x=>x.className&&String(x.className).startsWith('rlv5-command-pick')&&x.tag==='button').length,10);
 assert.ok(nodes.filter(x=>x.className==='rlv5-pick-description').every(x=>flatten(x).some(y=>String(y.className).includes('rlv5-selection-margin'))));
 const sheza=D.runners.find(h=>h.horse==='Sheza Alibi');
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},sheza.race_id);
 nodes=flatten(root);
 assert.ok(nodes.some(x=>x.className==='rlv5-selection-metrics'));
 assert.ok(nodes.some(x=>x.className==='rlv5-selection-model-percent'));
 assert.ok(nodes.some(x=>String(x.className).startsWith('rlv5-selection-margin')));
});
