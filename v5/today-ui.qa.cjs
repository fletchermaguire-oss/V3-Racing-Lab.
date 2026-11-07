'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const fields=require('./cards/2026-11-07/official-final.json');
const shortlist=require('./cards/2026-11-07/independent-top10.json');
const picks=require('./cards/2026-11-07/race-selections.json');
class Element{
 constructor(tag){this.tag=tag;this.className='';this.textContent='';this.children=[];this.attrs={};this.listeners={};this.style={};this.isConnected=true;this.classList={add:()=>{}};}
 appendChild(n){this.children.push(n);return n;}
 replaceChildren(...ns){this.children=[...ns];}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(name,fn){this.listeners[name]=fn;}
}
function nodes(e){return [e,...e.children.flatMap(nodes)];}
function textOf(e){return [e.textContent,...e.children.map(textOf)].join(' ');}
async function boot(){
 const doc={createElement:tag=>new Element(tag)};
 const windows={location:{href:''}};
 const fakeFetch=async url=>({ok:true,json:async()=>url.endsWith('official-final.json')?fields:url.endsWith('race-selections.json')?picks:shortlist});
 vm.runInNewContext(fs.readFileSync('v5/today-ui.js','utf8'),{document:doc,window:windows,fetch:fakeFetch,console,Promise});
 const el=new Element('main'),navigations=[];
 const opts={page:'home',navigate:page=>navigations.push(page)};
 windows.RacingLabToday.render(el,opts);
 for(let k=0;k<4;k++)await new Promise(r=>setImmediate(r));
 return {api:windows.RacingLabToday,el,opts,navigations};
}
test('Saturday field UI renders 29 actual races and 302 active runners instead of an older card',async()=>{
 const a=await boot();
 assert.equal(a.api.getData().official.inventory.races,29);
 assert.equal(a.api.getData().official.inventory.active,302);
 assert.match(textOf(a.el),/Saturday 7 November/);
 for(const name of ['FLEMINGTON','ROSEHILL','ASCOT'])assert.match(textOf(a.el),new RegExp(name));
 assert.match(textOf(a.el),/Autumn Glow/);
 assert.match(textOf(a.el),/View every race/);
 assert.match(textOf(a.el),/Race-by-race first picks/);
 assert.equal(a.api.getData().selections.races.length,29);
 assert.equal(nodes(a.el).filter(n=>String(n.className).includes('rl-simple-dailyline')).length,9);
 assert.doesNotMatch(textOf(a.el),/Loading 3 November research/);
});
test('Races use direct meeting and race buttons and show original official runner names',async()=>{
 const a=await boot();
 a.api.render(a.el,{page:'races',navigate:a.opts.navigate});
 let buttons=nodes(a.el).filter(x=>x.tag==='button');
 assert.ok(buttons.find(b=>b.textContent==='R1'));
 assert.ok(buttons.find(b=>b.textContent==='R9'));
 assert.equal(nodes(a.el).filter(x=>x.tag==='select').length,0);
 const rosehill=buttons.find(b=>b.textContent==='Rosehill');
 assert.ok(rosehill);
 rosehill.listeners.click();
 buttons=nodes(a.el).filter(x=>x.tag==='button');
 buttons.find(b=>b.textContent==='R3').listeners.click();
 assert.match(textOf(a.el),/SAVVY SPY/);
 assert.match(textOf(a.el),/CRITERIA/);
 assert.match(textOf(a.el),/41\.7% working estimate/);
 assert.match(textOf(a.el),/Main dangers:/);
 assert.match(textOf(a.el),/CRITERIA/);
 assert.ok(nodes(a.el).some(n=>n.tag==='details'&&String(n.className).includes('rl-simple-analysis')));
 assert.equal(nodes(a.el).filter(x=>x.tag==='select').length,0);
});
test('Top 10 names are the independently reviewed Saturday shortlist and every row opens its race',async()=>{
 const a=await boot();
 a.api.render(a.el,{page:'daily',navigate:a.opts.navigate});
 let rows=nodes(a.el).filter(x=>x.className.includes('rl-simple-toprow'));
 assert.equal(rows.length,10);
 assert.match(textOf(a.el),/HORSESHOE HILL/i);
 assert.doesNotMatch(textOf(a.el),/V5 MODEL ESTIMATE/);
 rows[5].listeners.click();
 assert.deepEqual(a.navigations,['races']);
 a.api.render(a.el,{page:'races',navigate:a.opts.navigate});
 assert.match(textOf(a.el),/RANVET HANDICAP/);
});
test('All deep features remain reachable from one tool grid',async()=>{
 const a=await boot();
 a.api.renderTools(a.el,{page:'tools',navigate:a.opts.navigate});
 const names=['Simulator','Compare horses','Results & history','Weather & tracks','Model QA','Calibration','Data & sync','Archived model','Quaddie worksheets'];
 for(const n of names)assert.match(textOf(a.el),new RegExp(n,'i'));
 assert.equal(nodes(a.el).filter(x=>x.tag==='select').length,0);
});
test('Main site presents exactly 5 direct navigation tabs on desktop and mobile',()=>{
 const html=fs.readFileSync('index.html','utf8');
 const desktop=html.match(/<aside class="sidebar">([\s\S]*?)<\/aside>/)[1];
 const mobile=html.match(/<nav class="mobile-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
 const expected=['home','races','daily','multi','tools'];
 assert.deepEqual([...desktop.matchAll(/<button class="navbtn" data-page="([^"]+)"/g)].map(x=>x[1]),expected);
 assert.deepEqual([...mobile.matchAll(/<button data-page="([^"]+)"/g)].map(x=>x[1]),expected);
 assert.match(html,/\/v5\/today-ui\.js/);
 assert.match(html,/window\.RacingLabToday\.render/);
});


test('Each of 29 races has one official-starter-matched first pick, threats, and a substantive reason',async()=>{
 const a=await boot(),source=a.api.getData();
 assert.equal(source.selections.races.length,29);
 for(const p of source.selections.races){
  const m=source.official.meetings.find(x=>x.meeting===p.meeting);
  const r=m.races.find(x=>x.race===p.race);
  assert.ok(r.active_runners.find(x=>x.horse===p.first_pick.horse&&x.number===p.first_pick.saddlecloth));
  assert.ok(p.dangers.length>=2&&p.dangers.every(x=>r.active_runners.some(y=>x.horse===y.horse)),'Danger must be active: '+p.race_id);
  assert.ok(p.why.length>75&&p.caution.length>55,'Substantive pros/cons: '+p.race_id);
  a.api.select(p.meeting,p.race);
  a.api.render(a.el,{page:'races',navigate:a.opts.navigate});
  const text=textOf(a.el);
  assert.ok(text.includes(p.first_pick.horse),'Pick must be displayed: '+p.race_id);
  assert.ok(text.includes('Main dangers:'),'Danger controls must be visible: '+p.race_id);
  assert.ok(text.includes('Risk + source research'),'Deep form remains accessible: '+p.race_id);
 }
});
test('Previously reviewed Top 10 stays frozen and older started races are flagged',async()=>{
 const a=await boot(),source=a.api.getData();
 const ranking=source.selections.races.filter(r=>r.source_basis==='PRIOR_REVIEWED_TOP10');
 assert.equal(ranking.length,10);
 for(const p of ranking){
  const old=source.shortlist.entries.find(x=>x.meeting===p.meeting&&x.race===p.race);
  assert.equal(p.first_pick.horse.toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,''),old.horse.toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,''));
  assert.equal(p.working_win_pct,old.working_win_pct);
 }
 a.api.select('ROSEHILL',1);
 a.api.render(a.el,{page:'races',navigate:a.opts.navigate});
 assert.match(textOf(a.el),/ADDED AFTER SCHEDULED START/);
 assert.match(textOf(a.el),/DEFIANCE/);
});
test('Flemington R2 shows Fiorenot first, unlike former runner-only screenshot',async()=>{
 const a=await boot();
 a.api.select('FLEMINGTON',2);
 a.api.render(a.el,{page:'races',navigate:a.opts.navigate});
 const t=textOf(a.el);
 assert.match(t,/#2 FIORENOT/);
 assert.match(t,/SUPERFABULISTIC/);
 assert.match(t,/MAIN DANGERS/i);
 assert.match(t,/third-up|Third-up/i);
});
