'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('./prospective-calibration.cjs');
test('unfrozen retrospective records cannot create production calibration',()=>{
 const r=C.fitFrozen([],[]);
 assert.equal(r.status,'INSUFFICIENT_FROZEN_HISTORY');
 assert.equal(r.calibration_fitted,false);
 assert.equal(r.automatic_publication,false);
 assert.equal(r.eligible_dates,0);
});
test('temperature scaling preserves total probability and same winning rank',()=>{
 const q=[{id:'a',p:70},{id:'b',p:20},{id:'c',p:10}];
 const warmer=C.calibrateRows(q,2);
 assert.ok(Math.abs(warmer.reduce((a,b)=>a+b.p,0)-100)<1e-10);
 assert.ok(warmer[0].p<70&&warmer[2].p>10);
 assert.equal(warmer[0].id,'a');
 const same=C.calibrateRows(q,1);
 for(let i=0;i<q.length;i++)assert.ok(Math.abs(same[i].p-q[i].p)<1e-10);
 assert.throws(()=>C.calibrateRows(q,0));
});
function records(breakHoldout=false){
 const f=[],results=[];
 for(let d=1;d<=8;d++){
  for(let n=1;n<=20;n++){
   const day='2027-03-'+String(d).padStart(2,'0'),
    race_id=day+'_TEST_R'+String(n).padStart(2,'0'),
    winner=breakHoldout&&d>=7?'a':n%5===0?'c':n%2===0?'b':'a',
    rows=[{id:'a',race_id,p:70},{id:'b',race_id,p:20},{id:'c',race_id,p:10}];
   f.push({race_id,model_version:'SYNTHETIC_QA_ONLY',field_revision:'r1',publication_frozen:true,
    publication_approved:true,snapshot_at_utc:day+'T01:00:00Z',frozen_at_utc:day+'T01:15:00Z',
    race_at_utc:day+'T02:00:00Z',freeze_proof_url:'https://example.test/snapshot/'+race_id,rows});
   results.push({race_id,verified:true,official_url:'https://example.test/results/'+race_id,field_revision:'r1',
    active_runner_ids:['a','b','c'],winner_runner_id:winner});
  }
 }
 return {f,results};
}
test('only multiple independently frozen dates enable a research temperature candidate',()=>{
 const {f,results}=records();
 const r=C.fitFrozen(f,results);
 assert.equal(r.accepted_races,160);
 assert.equal(r.train_dates.length,6);
 assert.equal(r.test_dates.length,2);
 assert.equal(r.training.baseline.n,120);
 assert.equal(r.heldout.baseline.n,40);
 assert.ok(r.fitted_temperature_research_only>1);
 assert.equal(r.calibration_fitted,false);
 assert.equal(r.automatic_publication,false);
 assert.equal(r.improved_both_holdout_losses,true);
 assert.equal(r.status,'RESEARCH_CANDIDATE_REQUIRES_INDEPENDENT_REVIEW');
});
test('held-out rejection blocks apparently improving training likelihood',()=>{
 const {f,results}=records(true);
 const r=C.fitFrozen(f,results);
 assert.equal(r.improved_both_holdout_losses,false);
 assert.equal(r.status,'VALIDATION_FAILED_NO_CALIBRATION');
 assert.equal(r.calibration_fitted,false);
});
test('a post-race snapshot or missing field proof is excluded from sample size',()=>{
 const {f,results}=records();
 for(let i=0;i<30;i++)f[i].publication_approved=false;
 const r=C.fitFrozen(f,results);
 assert.equal(r.status,'INSUFFICIENT_FROZEN_HISTORY');
 assert.equal(r.calibration_fitted,false);
 assert.ok(r.exclusions>=30);
});
test('retrospective two-date comparator emits separate results and never fits or publishes',()=>{
 const r=require('./backtests/compare-retrospective.cjs').compare();
 assert.equal(r.status,'RETROSPECTIVE_ONLY_NO_FITTED_CALIBRATION');
 assert.equal(r.dates.length,2);
 assert.equal(r.overall.races,49);
 assert.equal(r.finishers_verified,507);
 assert.equal(r.calibration_fitted,false);
 assert.equal(r.deploy_approved,false);
 assert.equal(r.eligible_pre_race_frozen_dates,0);
});
