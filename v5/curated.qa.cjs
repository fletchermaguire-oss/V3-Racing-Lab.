'use strict';
/* These QA fixtures are synthetic. No tests certify race-day starters or calibrate chances. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const Model=require('./model.js'),State=require('./site-state.js'),Curated=require('./curated.js');
const Data=require('./research.json'),Official=require('./official-snapshot-20261030.json');
const Checkpoint=require('./shortlists/2026-10-30-independent-top10.json');
const copy=x=>JSON.parse(JSON.stringify(x));
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
const controller=opt=>State.create(State.applyOfficialOverlay(Data,Official),
 Object.assign({checkpoint:Checkpoint,going:Official.going,storage:storage()},opt));
test('curated independent form ranks are complete, distinct, reproducible and preserve original A-tier horses',()=>{
 const C=controller(),x=C.curated;
 assert.equal(x.count,10);assert.equal(x.active_count,10);assert.equal(x.status,'ARCHIVED_HUMAN_RANKING_WITH_LIVE_FIELD_CHECKS_NOT_CALIBRATED');
 assert.deepEqual(x.entries.map(y=>y.rank),[1,2,3,4,5,6,7,8,9,10]);
 assert.deepEqual(x.aTier.map(y=>y.horse),['Sheza Alibi','Regal Ambition','Hot And High']);
 assert.equal(x.aTier.find(y=>y.horse==='Hot And High').form_tier,'A');
 assert.deepEqual(x.top5.map(y=>y.id),x.top10.slice(0,5).map(y=>y.id));
 assert.equal(C.curatedGradeOptions.includes('A+'),true);
 assert.equal(x.entries.find(y=>y.horse==='Sheza Alibi').model_pct,31.69);
 assert.ok(x.entries.every(y=>y.eligible&&y.original_rank===Checkpoint.entries.find(z=>z.horse===y.horse).rank));
 assert.equal(x.entries.find(y=>y.horse==='Sheza Alibi').screen_status,'REVIEW_ONLY');
});
test('track going changes current assessments, NEVER original form ranks or tier',()=>{
 const C=controller(),old=C.curated.entries.map(y=>[y.id,y.rank,y.form_tier]);
 C.setGoing('ASCOT','Good 4');
 assert.deepEqual(C.curated.entries.map(y=>[y.id,y.rank,y.form_tier]),old);
 const hot=C.curated.entries.find(y=>y.horse==='Hot And High');
 assert.ok(hot.notes.includes('TRACK_GOING_CHANGED'));
 assert.equal(hot.form_tier,'A');
 assert.ok(C.researchHistory.some(e=>e.reason==='TRACK_GOING_ASCOT'));
});
test('a scratched researched runner leaves an unfilled ranked position; no automatic replacement',()=>{
 const C=controller(),first=C.curated.entries[0],before=C.curated.entries.map(y=>y.horse);
 C.setLocalScratch(first.id,true);
 assert.equal(C.curated.entries[0].eligible,false);
 assert.equal(C.curated.entries[0].model_pct,null);
 assert.equal(C.curated.entries[0].rank,1);
 assert.deepEqual(C.curated.entries.map(y=>y.horse),before);
 assert.equal(C.curated.active_count,9);
 assert.ok(C.researchHistory.some(x=>x.reason==='LOCAL_SCRATCHING'&&x.changes.some(y=>y.horse===first.horse)));
 C.setLocalScratch(first.id,false);
 assert.equal(C.curated.active_count,10);
 assert.equal(C.curated.entries[0].model_pct,31.69);
});
test('manual grade and rank edits reorder all 10 without duplicate ranks, with a reason and persisted audit',()=>{
 const mem=storage(),C=controller({storage:mem}),hot=C.curated.entries.find(x=>x.horse==='Hot And High');
 assert.throws(()=>C.setResearchOverride(hot.id,{tier:'A+',rank:1,reason:'short'}),/explanation/);
 C.setResearchOverride(hot.id,{tier:'A',rank:3,reason:'Evaluate wet conditions, draw and trainer before Saturday'});
 assert.equal(C.curated.entries[2].horse,'Hot And High');
 assert.deepEqual(C.curated.entries.map(x=>x.rank),[1,2,3,4,5,6,7,8,9,10]);
 C.setResearchOverride(hot.id,{tier:'A-',rank:1,reason:'Verified substantive form reassessment and changed draw'});
 assert.equal(C.curated.entries[0].horse,'Hot And High');
 assert.equal(C.curated.entries[0].form_tier,'A-');
 assert.deepEqual(C.curated.entries.map(x=>x.rank),[1,2,3,4,5,6,7,8,9,10]);
 assert.ok(C.researchHistory.length>=2);
 const again=controller({storage:mem});
 assert.equal(again.curated.entries[0].horse,'Hot And High');
 assert.equal(again.curated.entries[0].form_tier,'A-');
 assert.equal(again.researchHistory.length,C.researchHistory.length);
 assert.equal(again.curated.entries.find(x=>x.horse==='Regal Ambition').archived_form_tier,'A');
});
test('source-date and inventory mismatches reject research checkpoint before publishing',()=>{
 const d=copy(Checkpoint);d.date='2026-11-07';
 assert.throws(()=>Curated.validate(d,Data),/stale/);
 d.date=Data.date;d.entries[0].horse='UNLISTED';
 assert.throws(()=>Curated.validate(d,Data),/not found/);
 const modified=copy(Checkpoint);modified.entries[1].rank=1;
 assert.throws(()=>Curated.validate(modified,Data),/Invalid archived/);
});
test('research archive never sets model probabilities, final fields or calibration status',()=>{
 const C=controller(),before=C.board.baseline.records.map(x=>[x.id,x.p]);
 C.setResearchOverride(C.curated.entries[0].id,{tier:'WATCH',rank:5,
  reason:'Manual research grade check without touching modelling'});
 assert.deepEqual(C.board.baseline.records.map(x=>[x.id,x.p]),before);
 assert.equal(C.board.calibration_status,'NOT_ESTABLISHED');
 assert.equal(C.board.publication_blocked,true);
 assert.equal(C.curated.warnings.length,3);
});
