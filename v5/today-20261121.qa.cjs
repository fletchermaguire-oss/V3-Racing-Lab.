'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const state=require('./site-state.js'),source=require('./cards/2026-11-21/research.json'),checkpoint=require('./cards/2026-11-21/independent-top15.json');
const going={CRANBOURNE:'Good 4','KEMBLA GRANGE':'Good 4',ASCOT:'Good 4','SUNSHINE COAST':'Soft 5'};
class Element{
 constructor(tag){this.tag=tag;this.children=[];this.childNodes=this.children;this.className='';this.textContent='';this.events={};this.style={};this.classList={add:()=>{}};}
 append(...ns){this.children.push(...ns);this.childNodes=this.children;}
 appendChild(n){this.append(n);return n;}
 replaceChildren(...ns){this.children=ns;this.childNodes=this.children;}
 addEventListener(n,fn){this.events[n]=fn;}
 setAttribute(){}
}
const textOf=e=>[e.textContent,...e.children.map(x=>x instanceof Element?textOf(x):String(x))].join(' ');
function setup(){
 const doc={head:new Element('head'),createElement:tag=>new Element(tag)};
 const win={RacingLabV5Card:{date:'2026-11-21'},RacingLabToday:{render:()=>{}}};
 vm.runInNewContext(fs.readFileSync('v5/today-20261121.js','utf8'),{window:win,document:doc,console});
 const c=state.create(source,{going,checkpoint});
 return {win,c,root:new Element('main'),doc};
}
test('21 Nov Home renders a complete lightweight summary without relying on the full daily model-screen UI',()=>{
 const a=setup();
 a.win.RacingLabToday.render(a.root,{page:'home',controller:a.c,navigate:()=>{}});
 const out=textOf(a.root);
 for(const m of Object.keys(going))assert.ok(out.includes(m),'Missing meeting: '+m);
 for(const h of checkpoint.entries.slice(0,5))assert.ok(out.includes(h.horse),'Missing independent top-five: '+h.horse);
 assert.match(out,/All 40 races/);
 assert.match(out,/Open all Top 15 and model screening/);
 assert.doesNotMatch(out,/Home summary partially unavailable/);
});
test('Missing home-only meeting metadata degrades gracefully; other sections are preserved',()=>{
 const a=setup(),bad=Object.create(a.c);
 Object.defineProperty(bad,'data',{value:{...a.c.data,meetings:a.c.data.meetings.filter(x=>x.meeting!=='ASCOT')}});
 a.win.RacingLabToday.render(a.root,{page:'home',controller:bad,navigate:()=>{}});
 assert.match(textOf(a.root),/Saved meeting summary unavailable/);
 a.win.RacingLabToday.render(a.root,{page:'daily',controller:a.c,navigate:()=>{}});
 assert.match(textOf(a.root),/Reviewed Top 10/);
 a.win.RacingLabToday.render(a.root,{page:'races',controller:a.c,navigate:()=>{}});
 assert.match(textOf(a.root),/Race-by-race form/);
});
test('Home action buttons remain functional',()=>{
 const a=setup(),pages=[];
 a.win.RacingLabToday.render(a.root,{page:'home',controller:a.c,navigate:p=>pages.push(p)});
 const walk=e=>[e,...e.children.filter(x=>x instanceof Element).flatMap(walk)];
 for(const label of ['All 40 races','Top 5 / 10 / 15','Simulator']){
  const b=walk(a.root).find(n=>n.tag==='button'&&n.textContent===label);assert.ok(b,label);b.events.click();
 }
 assert.deepEqual(pages,['races','daily','sim']);
});

test('21 November R3 official scratching and Soft5 recalculation are isolated and full-field probabilities sum to 100',()=>{
 const a=setup(),r=source.races.find(x=>x.meeting==='SUNSHINE COAST'&&x.race===3);
 assert.equal(a.c.going['SUNSHINE COAST'],'Soft 5');
 assert.match(source.runners.find(x=>x.race_id===r.id&&x.horse==='SCHEHERAZADE').status,/^SCRATCHED/);
 assert.equal(a.c.board.baseline.records.filter(x=>x.race_id===r.id).length,11);
 assert.equal(r.analyst_review.full_field_probabilities.reduce((s,x)=>s+x.independent_pct,0),100);
 assert.equal(r.analyst_review.working_leader,'DOMINANT DARCY');
 assert.equal(a.c.board.winFirst.byRace.find(x=>x.race_id===r.id).status,'NO_SELECTION');
});
