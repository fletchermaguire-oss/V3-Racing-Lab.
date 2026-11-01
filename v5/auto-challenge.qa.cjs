'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const Scanner=require('./auto-challenge.js'),Challenge=require('./challenge.js');
const Model=require('./model.js'),State=require('./site-state.js');
const D=require('./research.json'),O=require('./official-latest.json'),Q=require('./shortlists/current.json');
const data=State.applyOfficialOverlay(D,O);
const clone=x=>JSON.parse(JSON.stringify(x));
const runner=(race,horse)=>data.runners.find(x=>x.race_id===race&&x.horse===horse);
function check(race,horse){
 const id=runner(race,horse)?.id;
 assert.ok(id,'Selection horse must exist in saved race '+race+' '+horse);
 return Scanner.scan(data,{race_id:race,incumbent_id:id,reported_going:'Soft 5'});
}
test('automatic full-field scan would have flagged The Next Episode without needing its name',()=>{
 const race='2026-10-31_FLEMINGTON_R06';
 const x=check(race,'Satono Glow');
 assert.equal(x.schema,'racing-lab-v5-whole-field-challenges/v1');
 assert.equal(x.total_other_included_runners,13);
 assert.equal(x.review_count,2);
 assert.equal(x.priority_review_count,1);
 assert.equal(x.research_incumbent.horse,'Satono Glow');
 assert.equal(x.research_incumbent.good4_pct,22.21);
 const top=x.pending_reviews[0];
 assert.equal(top.horse,'The Next Episode');
 assert.equal(top.model_good4_pct,7.53);
 assert.equal(top.model_scenario_pct,12.75);
 assert.equal(top.model_good4_rank,5);
 assert.equal(top.model_scenario_rank,2);
 assert.equal(top.relative_scenario_uplift_pp,6.7);
 assert.equal(top.wet_form.wins,4);
 assert.equal(top.wet_form.starts,5);
 assert.equal(top.review_strength,'PRIORITY_REVIEW');
 const ordinary=x.pending_reviews.find(h=>h.horse==='Natural Fling');
 assert.equal(ordinary.review_strength,'SECONDARY_REVIEW');
 assert.equal(x.outcomes_used,false);
 assert.equal(x.model_modified,false);
 assert.equal(x.shortlist_modified,false);
});
test('second material challenge Unleeshing is surfaced but winner Lady Shenandoah is never replaced',()=>{
 const x=check('2026-10-31_FLEMINGTON_R08','Lady Shenandoah');
 const r=x.pending_reviews.find(x=>x.horse==='Unleeshing');
 assert.ok(r);
 assert.equal(r.review_strength,'PRIORITY_REVIEW');
 assert.equal(r.relative_scenario_uplift_pp,6.28);
 assert.equal(r.wet_form.wins,3);
 assert.equal(r.wet_form.starts,4);
 assert.equal(r.model_scenario_pct,10.98);
 assert.equal(x.research_incumbent.horse,'Lady Shenandoah');
 assert.equal(x.shortlist_modified,false);
});
test('same material flags as the existing human challenge for the named runners',()=>{
 for(const [race,base,target] of [
  ['2026-10-31_FLEMINGTON_R06','Satono Glow','The Next Episode'],
  ['2026-10-31_FLEMINGTON_R08','Lady Shenandoah','Unleeshing']
 ]){
  const a=Scanner.scan(data,{race_id:race,incumbent_id:runner(race,base).id,reported_going:'Soft 5'});
  const b=Challenge.compare(data,Model,{race_id:race,incumbent_id:runner(race,base).id,
   challenger_id:runner(race,target).id,reported_going:'Soft 5',source_type:'SCENARIO_ONLY'});
  const item=a.all_rivals.find(x=>x.horse===target);
  assert.deepEqual(item.flags,b.flags);
  assert.equal(item.relative_scenario_uplift_pp,b.relative_shift_pp);
  assert.equal(item.model_scenario_pct,b.challenger.scenario_pct);
  assert.equal(item.status,b.status);
 }
});
test('every available challenger is assessed once, no 3-runner shortcut and no same-race second selection',()=>{
 const x=check('2026-10-31_FLEMINGTON_R06','Satono Glow');
 const base=Model.calculate(data,{default:'Good 4'}).records.filter(x=>x.race_id===x?.race_id);
 const ids=x.all_rivals.map(h=>h.runner_id);
 assert.equal(new Set(ids).size,ids.length);
 assert.ok(!ids.includes(x.research_incumbent.runner_id));
 assert.equal(x.all_rivals.length,x.total_other_included_runners);
 const card=Scanner.scanCard(data,Q,{going:{RANDWICK:'Soft 5',FLEMINGTON:'Soft 5',ASCOT:'Soft 5'}});
 assert.equal(card.research_races,15);
 assert.equal(card.results.length,15);
 assert.equal(card.results.filter(r=>r.review_count!==null).length,15);
 assert.ok(card.results.some(r=>r.reviewed_horse==='Satono Glow'&&r.flagged_rivals.includes('The Next Episode')));
 assert.ok(card.results.some(r=>r.reviewed_horse==='Lady Shenandoah'&&r.flagged_rivals.includes('Unleeshing')));
 assert.equal(card.model_modified,false);
});
test('excluding a runner from original saved field automatically excludes them from challenge list',()=>{
 const temp=clone(data),race='2026-10-31_FLEMINGTON_R06';
 const rival=temp.runners.find(x=>x.race_id===race&&x.horse==='The Next Episode');
 rival.status='SCRATCHED — documented test';
 const id=runner(race,'Satono Glow').id;
 const r=Scanner.scan(temp,{race_id:race,incumbent_id:id,reported_going:'Soft 5'});
 assert.ok(!r.all_rivals.some(x=>x.horse==='The Next Episode'));
 assert.equal(r.total_other_included_runners,12);
 assert.throws(()=>Scanner.scan(temp,{race_id:race,incumbent_id:rival.id}),/absent or scratched/);
});
test('no post-race results, names of winners, prices or simulated markets enter the scanner',()=>{
 const temp=clone(data),race='2026-10-31_FLEMINGTON_R06';
 const original=Scanner.scan(temp,{race_id:race,incumbent_id:runner(race,'Satono Glow').id});
 temp.results=[{winner:'The Next Episode',rank:1,finish_position:1}];
 temp.runners.forEach(h=>{h.market_price=1.02;h.finish_position=1;h.win=true;});
 const current=Scanner.scan(temp,{race_id:race,incumbent_id:runner(race,'Satono Glow').id});
 assert.deepEqual(current,original);
 assert.equal(current.source_status,'SAVED_DOSSIER_SCENARIO_ONLY');
 assert.equal(current.final_starters_verified,false);
 const code=fs.readFileSync(__dirname+'/auto-challenge.js','utf8');
 assert.doesNotMatch(code,/require\(['"].*results|fetch\(['"].*results/);
});
test('unsupported going, absent incumbent, and no full race card fail closed',()=>{
 const race='2026-10-31_FLEMINGTON_R06';
 const id=runner(race,'Satono Glow').id;
 assert.throws(()=>Scanner.scan(data,{race_id:race,incumbent_id:id,reported_going:'Bog 12'}),/Unsupported/);
 assert.throws(()=>Scanner.scan(data,{race_id:'BAD',incumbent_id:id}),/Unknown race/);
 assert.throws(()=>Scanner.scan(null,{race_id:race}),/racecard/);
});
