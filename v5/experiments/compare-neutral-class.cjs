'use strict';
/* Only retrospective diagnostic comparisons; inputs not proven frozen pre-race.
 * NEITHER version's superior historical metric validates prospective deployment.
 */
const assert=require('node:assert/strict');
const Live=require('../model.js'),Candidate=require('./model-neutral-class.cjs');
const cases=[
 require('../backtests/2026-10-17-retrospective.json'),
 require('../backtests/2026-10-24-retrospective.json')
];
const mean=(rows,k)=>rows.reduce((s,x)=>s+x[k],0)/rows.length;
function score(group){
 const base=Live.board(group.input,{going:group.going}).baseline;
 const alt=Candidate.board(group.input,{going:group.going}).baseline;
 const results=group.results.filter(x=>x.verified===true&&x.won===true);
 const winners=new Map();
 for(const x of results){assert.ok(!winners.has(x.race_id));winners.set(x.race_id,x.id);}
 assert.equal(winners.size,group.input.races.length,'Every included race requires a unique official winner');
 const comparisons=base.races.map(r=>{
  const b=base.records.filter(x=>x.race_id===r.id),a=alt.records.filter(x=>x.race_id===r.id);
  const winner=winners.get(r.id);
  assert.ok(winner&&b.length>=2&&a.length===b.length);
  assert.deepEqual(a.map(x=>x.id).sort(),b.map(x=>x.id).sort(),'Compare identical active runners only');
  const evaluate=rows=>{
   const w=rows.find(x=>x.id===winner);assert.ok(w);
   assert.ok(Math.abs(rows.reduce((s,x)=>s+x.p_exact,0)-100)<1e-8);
   const p=w.p_exact/100;
   return {top1:Number(rows[0].id===winner),brier:rows.reduce((s,x)=>s+(x.p_exact/100-(x.id===winner?1:0))**2,0),log_loss:-Math.log(p)};
  };
  const before=evaluate(b),after=evaluate(a);
  return {id:r.id,winner,missing_class:b.filter(x=>x.grade_quality===0).length,
   missing_experimental:a.filter(x=>x.grade_quality===null).length,
   changed_leader:b[0].id!==a[0].id,before,after,
   baseline_leader:b[0].horse,candidate_leader:a[0].horse};
 });
 const rollup=rows=>({
  races:rows.length,top1_wins:rows.reduce((s,x)=>s+x.top1,0),hit_rate:+(rows.reduce((s,x)=>s+x.top1,0)/rows.length).toFixed(4),
  brier:+mean(rows,'brier').toFixed(6),log_loss:+mean(rows,'log_loss').toFixed(6)
 });
 const changed=comparisons.filter(x=>x.changed_leader);
 return {date:group.date,races:comparisons.length,missing_class_dossiers:comparisons.reduce((s,x)=>s+x.missing_experimental,0),
  races_with_missing_class:comparisons.filter(x=>x.missing_experimental).length,changed_top1_races:changed.length,
  baseline:rollup(comparisons.map(x=>x.before)),candidate:rollup(comparisons.map(x=>x.after)),
  changed_leaders:changed.map(x=>({race_id:x.id,baseline:x.baseline_leader,candidate:x.candidate_leader,actual_winner_runner_id:x.winner})),
  rows:comparisons};
}
function run(){
 const dates=cases.map(score),rows=dates.flatMap(d=>d.rows);
 const rollup=kind=>({
  races:rows.length,
  wins:rows.filter(x=>x[kind].top1===1).length,
  hit_rate:+(rows.filter(x=>x[kind].top1===1).length/rows.length).toFixed(4),
  brier:+mean(rows.map(x=>x[kind]),'brier').toFixed(6),
  log_loss:+mean(rows.map(x=>x[kind]),'log_loss').toFixed(6)
 });
 const output={
  status:'RETROSPECTIVE_ONLY_NEVER_AUTODEPLOY',
  production_version:Live.VERSION,experimental_version:Candidate.VERSION,
  source_dates:dates.map(({rows,...x})=>x),
  overall:{races:rows.length,baseline:rollup('before'),candidate:rollup('after'),
   changed_top1_races:rows.filter(x=>x.changed_leader).length,
   missing_class_dossiers:rows.reduce((s,x)=>s+x.missing_experimental,0)},
  prospective_frozen_races:0,
  caution:'No reliable demonstration of a higher future win rate. Pre-race freeze, source provenance and independent later dates are necessary. Experimental scoring is not live.'
 };
 assert.equal(output.overall.races,49,'The paired sample must not change without explicit review');
 return output;
}
if(require.main===module)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
module.exports={run};
