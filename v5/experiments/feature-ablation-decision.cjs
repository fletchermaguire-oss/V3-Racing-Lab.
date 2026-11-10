'use strict';
/* Conservative retrospective triage. Even a pass would require genuine
 * prospective verification before any weight could change.
 */
const A=require('./feature-ablation-shadow.cjs');
function assess(run,baseline){
 const winningDates=run.dates.filter(d=>d.gains>d.harms).map(d=>d.date);
 const losingDates=run.dates.filter(d=>d.harms>d.gains).map(d=>d.date);
 const winsBetter=run.top1>baseline.top1;
 const brierBetter=run.brier<baseline.brier;
 const logBetter=run.log_loss<baseline.log_loss;
 const stable=winningDates.length>=2&&losingDates.length===0;
 const supported=!!(winsBetter&&brierBetter&&logBetter&&stable);
 return {feature:run.feature,scale:run.scale,top1:run.top1,delta_winners:run.top1-baseline.top1,
  brier:run.brier,delta_brier:+(run.brier-baseline.brier).toFixed(6),
  log_loss:run.log_loss,delta_log_loss:+(run.log_loss-baseline.log_loss).toFixed(6),
  gains:run.gains,harms:run.harms,flips:run.flips,
  winning_dates:winningDates,losing_dates:losingDates,
  retrospective_multimetric_signal:supported,
  production_change_allowed:false,
  decision:supported?'FORWARD_SHADOW_ONLY_NEVER_AUTOPROMOTE':!winsBetter?'NO_WINNER_GAIN':!brierBetter||!logBetter?'PROBABILITY_SCORE_WORSENED':'ONE_DATE_ONLY_UNSTABLE'};
}
function run(){
 const output=A.evaluate(),proposals=output.runs.map(r=>assess(r,output.baseline));
 return {schema:'racing-lab-l5-ablation-decision/v1',
  status:'RESEARCH_DECISION_NOT_MODEL_UPDATE',unchanged_l5:output.baseline,
  candidates_evaluated:proposals.length,
  candidates_meeting_retrospective_multimetric_gate:proposals.filter(x=>x.retrospective_multimetric_signal).length,
  production_weight_changes:0,
  candidates:proposals,
  warning:'The gate is conservative and posthoc. Even passing it cannot prove a future advantage; independent prospective validation is mandatory.'};
}
if(require.main===module)console.log(JSON.stringify(run(),null,2));
module.exports={assess,run};
