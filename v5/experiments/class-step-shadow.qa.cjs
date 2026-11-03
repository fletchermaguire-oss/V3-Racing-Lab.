'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('./class-step-shadow.cjs');
const Rank=require('./rank-driver-shadow.cjs');
const M=require('../model.js');
const November=require('../cards/2026-11-03/research.json');

test('class-step challenger keeps source runner class and metadata separate from results',()=>{
 const old=JSON.stringify(M.CONFIG);
 const out=C.run();
 assert.equal(out.schema,'racing-lab-class-step-shadow/v1');
 assert.equal(out.source_fields_only,true);
 assert.equal(out.no_result_feature_leakage,true);
 assert.equal(out.no_horse_specific_sectionals_invented,true);
 assert.equal(out.coefficient_changes_live,false);
 assert.equal(out.status,'RETROSPECTIVE_RESEARCH_ONLY_NOT_DEPLOYABLE');
 assert.equal(out.totals.length,3);
 assert.ok(out.totals.every(x=>x.races===91));
 assert.equal(out.dates.length,4);
 assert.deepEqual(out.dates.map(x=>[x.date,x.scenarios[0].races,x.scenarios[0].top1]),[
  ['2026-10-17',30,13],['2026-10-24',19,4],['2026-10-31',22,7],['2026-11-03',20,3]
 ]);
 assert.equal(JSON.stringify(M.CONFIG),old);
});
test('target class and competitive historical form are extracted from actual PDF evidence',()=>{
 const r=November.races.find(x=>x.id==='2026-11-03_RANDWICK_R04');
 assert.ok(r.race_class.includes('BM88'));
 assert.equal(M.historicalRaceLevel(r.race_class),M.historicalRaceLevel('BM88'));
 const h=November.runners.find(x=>x.horse==='All Star');
 const e=C.evidence(h,November.saved_at);
 assert.ok(e.known>=3);
 assert.ok(e.best_competitive!==null);
 const c=C.history(h,November.saved_at);
 assert.ok(c.every(x=>x.date<November.saved_at));
 assert.ok(c.every(x=>Number.isFinite(x.grade)&&x.pos>=1&&x.pos<=x.field));
});
test('no horse-specific speed exists: race-time last splits cannot be assigned to an individual horse',()=>{
 assert.equal(November.runners.length,333);
 assert.ok(November.runners.some(x=>x.sectional_evidence.length>0));
 assert.equal(November.runners.filter(h=>h.sectional_evidence.some(x=>x.horse_specific===true)).length,0);
 const untried=November.runners.find(x=>x.horse==='Jetsetter');
 assert.ok(untried.trials.some(x=>x.used_in_model===false));
 assert.equal(C.evidence(untried,November.saved_at).known,0);
});
test('candidate rating is source-only and alpha zero exactly replicates old model probabilities',()=>{
 const d=Rank.loadDatasets().find(x=>x.date==='2026-11-03');
 const c=d.races.find(x=>x.id==='2026-11-03_FLEMINGTON_R01');
 const ctx={card:November,races:new Map(November.races.map(x=>[x.id,x])),runners:new Map(November.runners.map(x=>[x.id,x]))};
 for(const a of C.ALPHAS){
  const r=C.field(c,ctx,a);
  assert.ok(Math.abs(r.rows.reduce((s,x)=>s+x.p,0)-1)<1e-10);
  if(a===0)r.rows.forEach(x=>assert.ok(Math.abs(x.p-x.baseline)<1e-11));
  assert.ok(r.rows.every(x=>x.evidence.known>=0));
 }
});
