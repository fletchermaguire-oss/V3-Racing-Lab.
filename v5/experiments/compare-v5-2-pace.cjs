'use strict';
/*
 * Paired historical evaluation of the unverified race-shape hypothesis.
 * Outcomes are imported by Study solely for scoring AFTER model calculation.
 */
const assert=require('node:assert/strict');
const Study=require('./compare-v5-1-formula.cjs');
const Current=require('./model-v5-1.cjs');
const Pace=require('./model-v5-2-pace.cjs');
const round=x=>Number(x.toFixed(6));
const mean=(rows,key)=>round(rows.reduce((s,x)=>s+x[key],0)/rows.length);
function compare(){
 const groups=Study.groups().filter(g=>g.type!=='SEVEN_CHOSEN_REVIEWED_RACES_ONLY');
 const reports=groups.map(g=>{
  const a=Study.scores(Current,g.data,g.going,g.winners,g.exclude);
  const b=Study.scores(Pace,g.data,g.going,g.winners,g.exclude);
  assert.equal(a.length,b.length);
  a.forEach((x,i)=>{
   assert.equal(x.raceId,b[i].raceId);
   assert.equal(x.winner,b[i].winner);
   assert.deepEqual(x.field,b[i].field);
  });
  const summary=rows=>({races:rows.length,leader_wins:rows.reduce((s,x)=>s+x.hit,0),
   multiclass_brier:mean(rows,'brier'),logloss:mean(rows,'logloss')});
  return {date:g.label,source_type:g.type,baseline:summary(a),pace_candidate:summary(b),
    leader_changes:b.filter((x,i)=>x.leader!==a[i].leader).length,
    brier_improved_races:b.filter((x,i)=>x.brier<a[i].brier).length,
    brier_worsened_races:b.filter((x,i)=>x.brier>a[i].brier).length,
    logloss_improved_races:b.filter((x,i)=>x.logloss<a[i].logloss).length,
    logloss_worsened_races:b.filter((x,i)=>x.logloss>a[i].logloss).length};
 });
 const historic=reports.filter(x=>['2026-10-17','2026-10-24','2026-10-31'].includes(x.date));
 const nov=reports.filter(x=>x.date.includes('/FULL'));
 assert.equal(historic.length,3);
 assert.equal(nov.length,2);
 const aggregate=group=>{
  const n=group.reduce((s,x)=>s+x.baseline.races,0);
  return {
   races:n,
   base_top1:group.reduce((s,x)=>s+x.baseline.leader_wins,0),
   pace_top1:group.reduce((s,x)=>s+x.pace_candidate.leader_wins,0),
   base_brier:round(group.reduce((s,x)=>s+x.baseline.multiclass_brier*x.baseline.races,0)/n),
   pace_brier:round(group.reduce((s,x)=>s+x.pace_candidate.multiclass_brier*x.pace_candidate.races,0)/n),
   base_logloss:round(group.reduce((s,x)=>s+x.baseline.logloss*x.baseline.races,0)/n),
   pace_logloss:round(group.reduce((s,x)=>s+x.pace_candidate.logloss*x.pace_candidate.races,0)/n),
   leader_changes:group.reduce((s,x)=>s+x.leader_changes,0)
  };
 };
 return {schema:'v5-2-fixed-pace-hypothesis-audit/v1',
  status:'RESEARCH_ONLY_NOT_APPROVED',baseline_model:Current.VERSION,
  test_model:Pace.VERSION,training_performed:false,prospective_validation:false,
  history:aggregate(historic),november_seventh:aggregate(nov),
  groups:reports,release_decision:'REJECT_NOT_ENOUGH_WIN_RATE_GAIN',
  caveat:'Any improvement is retrospective and numerically slight; do not deploy or claim verified improvement. Historical settling is not a race-day pace map.'};
}
if(require.main===module)process.stdout.write(JSON.stringify(compare(),null,2)+'\n');
module.exports={compare};
