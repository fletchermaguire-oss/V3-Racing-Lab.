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
 assert.ok(nodes.some(x=>x.tag==='h2'&&String(x.textContent).includes('Daily Top')));
 assert.ok(nodes.some(x=>String(x.textContent).includes('original research, 5 conditional Top 15 additions')));
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
 assert.ok(refreshed.some(n=>String(n.textContent).includes('PROVISIONAL COMBINED MODEL ESTIMATE')));
});
test('race detail explicitly distinguishes preserved independent choice from dynamic model leader',()=>{
 const {C,win}=boot(),root=new Element('main');
 const sheza=D.runners.find(h=>h.horse==='Sheza Alibi');
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},sheza.race_id);
 const nodes=flatten(root).map(x=>String(x.textContent));
 assert.ok(nodes.some(x=>x.startsWith('Independent research choice: Sheza Alibi')));
 assert.ok(nodes.some(x=>x.startsWith('Live model #1:')));
 assert.ok(nodes.some(x=>x.includes('may change with field data')));
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
 assert.ok(nodes.some(n=>String(n.textContent).includes('Official scratching refresh pending')||
   String(n.textContent).includes('Awaiting official refresh')));
});
test('Race Centre is an accessible analyst layout with two honest pick identities and full readable evidence',()=>{
 const {C,win}=boot(),root=new Element('main');
 const sheza=D.runners.find(h=>h.horse==='Sheza Alibi');
 win.RacingLabV5Dashboard.renderInto(root,'races',C,()=>{},sheza.race_id);
 const nodes=flatten(root);
 assert.ok(nodes.some(n=>n.textContent==='Race Centre'));
 assert.ok(nodes.some(n=>n.textContent==='Independent research choice: Sheza Alibi'));
 assert.ok(nodes.some(n=>String(n.textContent).startsWith('Live model #1:')));
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
  assert.match(html,/\/v5\/site\.css\?v=command-race-20261030/);
  assert.match(html,/\/v5\/dashboard\.js\?v=command-race-20261030/);
  assert.match(html,/\/v5\/model\.js\?v=shared-20261030/,'original V5 model is unchanged');
 }
});
