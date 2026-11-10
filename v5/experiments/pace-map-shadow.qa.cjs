'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Pace=require('./pace-map-shadow.cjs'),Rank=require('./rank-driver-shadow.cjs');
const Model=require('../model.js');
const Research=require('../cards/2026-11-03/research.json');

const fake=(xs)=>xs.map((fraction,i)=>({id:'H'+i,horse:'Horse '+i,settle_fraction:fraction,p_exact:100/xs.length}));
test('fixed historical-settling rule flags a multi-leader contest and conservative slow pace',()=>{
 const fast=Pace.scenario(fake([.04,.15,.2,.3,.5,.7,.8,.9,.5,.6]));
 assert.equal(fast.direction,1);assert.equal(fast.status,'MULTIPLE_POTENTIAL_EARLY_LEADERS');
 const slow=Pace.scenario(fake([.1,.55,.6,.7,.8,.9,.4,.5]));
 assert.equal(slow.direction,-1);
 assert.equal(Pace.scenario(fake([.1,null,null,.7,.8,null,.4,.5])).direction,0);
 assert.equal(Pace.scenario(fake([.1,.2,.5,.7,.8,.9,.4,.5])).direction,0);
});
test('each pace variant preserves full-field accounting, and zero strength equals old model',()=>{
 const sample=Rank.loadDatasets().find(x=>x.date==='2026-11-03').races.find(x=>x.id==='2026-11-03_FLEMINGTON_R01');
 for(const a of Pace.STRENGTHS){
  const r=Pace.predict(sample.rows,a);
  assert.ok(Math.abs(r.rows.reduce((s,x)=>s+x.probability,0)-1)<1e-10);
  if(a===0)for(const row of r.rows)
   assert.ok(Math.abs(row.probability-sample.rows.find(x=>x.id===row.id).p_exact/100)<1e-11);
 }
});
test('pace comparison never claims independent calibration or uses postrace winner as a feature',()=>{
 const prev=JSON.stringify(Model.CONFIG),a=Pace.run();
 assert.equal(a.schema,'racing-lab-historical-pace-shadow/v1');
 assert.equal(a.results_used_only_to_score,true);
 assert.equal(a.live_formula_unchanged,true);
 assert.equal(a.horse_sectional_speeds_fabricated,false);
 assert.equal(a.status,'RETROSPECTIVE_RESEARCH_NOT_DEPLOYABLE');
 assert.deepEqual(a.dates.map(x=>[x.date,x.scenarios[0].races,x.scenarios[0].top1]),[
  ['2026-10-17',30,13],['2026-10-24',19,4],['2026-10-31',22,7],['2026-11-03',20,3]]);
 assert.ok(a.totals.every(x=>x.races===91));
 assert.equal(JSON.stringify(Model.CONFIG),prev);
 assert.ok(Research.runners.every(h=>h.sectional_evidence.every(x=>x.horse_specific!==true)));
});
