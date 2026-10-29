'use strict';
/* Paired audit of two retrospectively reconstructed meetings. The form
 * snapshots are NOT proven frozen before racing: this is neither a
 * prospective hit-rate result nor fitted probability calibration. */
const assert=require('node:assert/strict'),M=require('../model.js');
const cases=[
 {hist:require('./2026-10-17-retrospective.json'),base:require('./2026-10-17-L4-baseline.json')},
 {hist:require('./2026-10-24-retrospective.json'),base:require('./2026-10-24-L4-parser-matched-baseline.json')}
];
const mean=(a,fn)=>a.length?a.reduce((s,x)=>s+fn(x),0)/a.length:null;
function raceMetrics(rows,winner,prob){
 const p=rows.map(x=>({id:x.id,p:prob(x)}));
 const w=p.find(x=>x.id===winner),top=p.slice().sort((a,b)=>b.p-a.p||a.id.localeCompare(b.id))[0];
 assert.ok(w,'No winner probability available');assert.ok(Math.abs(p.reduce((s,x)=>s+x.p,0)-100)<0.00001,'Race probabilities must total 100');
 return {top1_won:top.id===winner,brier:p.reduce((s,x)=>s+(x.p/100-(x.id===winner?1:0))**2,0),
  log_loss:-Math.log(Math.max(1e-15,w.p/100)),leader:top.id};
}
function evaluateOne({hist,base}){
 assert.equal(hist.status,'RETROSPECTIVE_RESEARCH_DIAGNOSTIC_ONLY');
 assert.equal(hist.backtest_eligible,false);
 assert.equal(hist.date,base.date);
 const b=M.board(hist.input,{going:hist.going}),prior=new Map(base.records.map(x=>[x.id,x.p]));
 assert.equal(b.baseline.records.length,prior.size,'Baseline and candidate must use identical finishing fields');
 const win=new Map();
 hist.results.filter(r=>r.verified===true&&r.won===true).forEach(r=>{
  assert.ok(!win.has(r.race_id),'Duplicate race winner');
  assert.ok(/^https:\/\//.test(r.url),'Missing official results link');
  win.set(r.race_id,r.id);
 });
 const races=b.baseline.races.map(r=>{
  const rows=b.baseline.records.filter(x=>x.race_id===r.id),winner=win.get(r.id);
  assert.ok(rows.length>1&&winner&&rows.some(x=>x.id===winner)&&rows.every(x=>prior.has(x.id)),'Incomplete retrospective result '+r.id);
  const old=raceMetrics(rows,winner,x=>prior.get(x.id)),candidate=raceMetrics(rows,winner,x=>x.p_exact);
  return {race_id:r.id,date:hist.date,meeting:r.meeting,winner,old,candidate,uniform_brier:1-1/rows.length};
 });
 assert.equal(win.size,races.length,'Every sampled race needs a verified winner');
 return races;
}
function summary(rows){
 return {races:rows.length,old_top1:rows.filter(x=>x.old.top1_won).length,
  L5_top1:rows.filter(x=>x.candidate.top1_won).length,
  old_brier:mean(rows,x=>x.old.brier),L5_brier:mean(rows,x=>x.candidate.brier),
  old_log_loss:mean(rows,x=>x.old.log_loss),L5_log_loss:mean(rows,x=>x.candidate.log_loss),
  uniform_brier:mean(rows,x=>x.uniform_brier),
  improved_brier_pp:mean(rows,x=>x.old.brier-x.candidate.brier),
  leader_disagreements:rows.filter(x=>x.old.leader!==x.candidate.leader).length};
}
function compare(){
 const groups=cases.map(evaluateOne),all=groups.flat();
 const output={status:'RETROSPECTIVE_ONLY_NO_FITTED_CALIBRATION',model_version:M.VERSION,
  dates:groups.map(a=>({date:a[0].date,...summary(a)})),overall:summary(all),
  winners_verified:all.length,finishers_verified:cases.reduce((s,x)=>s+x.hist.results.filter(y=>y.verified).length,0),
  eligible_pre_race_frozen_dates:0,
  calibration_fitted:false,deploy_approved:false,
  note:'No formula coefficients were fitted to these results. Sources may have been amended post-race. Comparing two dates retrospectively cannot establish improvement in future win rate. Archived 24 Oct has 15 starters with no machine-readable recent form and lacks career totals for many others.',
  source_provenance:cases.map(x=>({date:x.hist.date,official_result_urls:x.hist.official_result_urls})),
  race_summaries:all.map(x=>({id:x.race_id,winner:x.winner,old_top1:x.old.top1_won,new_top1:x.candidate.top1_won}))};
 return output;
}
if(require.main===module)process.stdout.write(JSON.stringify(compare(),null,2)+'\n');
module.exports={compare};
