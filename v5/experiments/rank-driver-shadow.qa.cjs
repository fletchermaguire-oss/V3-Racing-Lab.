'use strict';
/* Test the integrity of a read-only postrace investigation, never its claimed accuracy. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const A=require('./rank-driver-shadow.cjs');
const M=require('../model.js');
const D=require('../cards/2026-11-03/analysis.json');

test('rank driver ablation uses all four dated cohorts, excludes 31 Oct mismatches and preserves original L5',()=>{
 const before={version:M.VERSION,config:JSON.stringify(M.CONFIG)};
 const a=A.run();
 assert.equal(a.schema,'racing-lab-v5-rank-driver-shadow/v1');
 assert.equal(a.status,'RESEARCH_ONLY_NOT_A_TRAINING_HOLDOUT');
 assert.equal(a.scored_races,91);
 assert.deepEqual(a.baseline_cohort_counts.map(x=>[x.date,x.races,x.top1]).filter(x=>x[0]!=='2026-10-31'),[
  ['2026-10-17',30,13],['2026-10-24',19,4],['2026-11-03',20,3]
 ]);
 assert.equal(a.assessments.find(x=>x.date==='2026-10-31').excluded_field_mismatches.length,7);
 assert.equal(a.trained,false);assert.equal(a.promoted_model,false);
 assert.equal(a.changed_production_files,false);assert.equal(a.results_enter_forecasting,false);
 assert.deepEqual(a.aggregate.map(x=>x.races),[91,91,91,91,91,91]);
 assert.equal(M.VERSION,before.version);assert.equal(JSON.stringify(M.CONFIG),before.config);
});
test('every ablation keeps each full race normalised and alpha 1 reconstructs saved exact probabilities',()=>{
 const rid='2026-11-03_FLEMINGTON_R01';
 const rows=D.records.filter(x=>x.race_id===rid);
 assert.equal(rows.length,9);
 for(const alpha of A.ALPHAS){
  const shifted=A.remap(rows,alpha);
  assert.equal(shifted.length,rows.length);
  assert.ok(Math.abs(shifted.reduce((s,x)=>s+x.p,0)-1)<1e-10);
  assert.ok(shifted.every(x=>x.p>0&&x.p<1));
  if(alpha===1)for(const x of shifted){
   const original=rows.find(y=>y.id===x.id);
   assert.ok(Math.abs(x.p-original.p_exact/100)<1e-11);
  }
 }
});
test('result labels are post-race-only and all November winner rows have official sources',()=>{
 const w=require('./2026-11-03-verified-winners.json');
 assert.equal(w.results.length,20);assert.equal(w.status,'POST_RACE_RESULTS_ONLY_NOT_A_PRE_RACE_FEATURE');
 assert.equal(new Set(w.results.map(x=>x.race_id)).size,20);
 assert.ok(w.results.every(x=>w.source_urls[x.source].startsWith('https://www.tabtouch.com.au/racing/2026-11-03/')));
 assert.equal(D.publication_approved,false);
});
