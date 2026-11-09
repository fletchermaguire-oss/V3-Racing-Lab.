'use strict';
/*
 * Post-race paired score of SAME archived runner field, SAME winning horse.
 * This evaluates a packet; it does NOT certify its independent pre-jump lock.
 * No coefficient, horse selection, market odds, or archive may be modified.
 */
const assert=require('node:assert/strict');
const Packet=require('./v5-1-prospective-packet.cjs');
const dateISO=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(s)&&Number.isFinite(Date.parse(s));
const average=(r,k)=>r.length?Number((r.reduce((s,x)=>s+x[k],0)/r.length).toFixed(6)):null;
function evaluate(packet,results){
 const status=Packet.verifyIntegrity(packet);
 assert(status.integrity_valid&&status.independent_pre_race_freeze_verified===false,'packet not independently audited');
 assert(results&&results.schema==='v5-1-official-outcomes/v1','invalid official result schema');
 assert(results.date===packet.date&&Array.isArray(results.races),'result/date mismatch');
 assert(results.races.length===new Set(results.races.map(x=>x.race_id)).size,'duplicate result race');
 const outcomeMap=new Map(results.races.map(x=>[x.race_id,x]));
 const scored=[],excluded=[],tierRows=[];
 for(const race of packet.fields){
  const result=outcomeMap.get(race.race_id);
  if(!result){excluded.push({race_id:race.race_id,reason:'MISSING_FINAL_RESULT'});continue;}
  assert(/^https:\/\//.test(result.official_source_url||''),'official source URL missing '+race.race_id);
  assert(dateISO(result.verified_at_utc),'missing result verification timestamp '+race.race_id);
  assert(typeof result.winner_runner_id==='string','winner runner ID missing '+race.race_id);
  assert(Array.isArray(result.final_starter_ids),'final starter inventory required '+race.race_id);
  assert(new Set(result.final_starter_ids).size===result.final_starter_ids.length,'duplicate final starter '+race.race_id);
  if(race.race_at_utc&&Date.parse(result.verified_at_utc)<=Date.parse(race.race_at_utc)){
   excluded.push({race_id:race.race_id,reason:'PRE_JUMP_RESULT_SOURCE'});continue;
  }
  const modelSet=race.runners.map(x=>x.runner_id).sort(),finalSet=result.final_starter_ids.slice().sort();
  if(JSON.stringify(modelSet)!==JSON.stringify(finalSet)){
   excluded.push({race_id:race.race_id,reason:'FINAL_STARTERS_CHANGED',missing_from_model:finalSet.filter(x=>!modelSet.includes(x)),not_in_final_field:modelSet.filter(x=>!finalSet.includes(x))});
   continue;
  }
  const winner=race.runners.find(x=>x.runner_id===result.winner_runner_id);
  assert(winner,'final-field result winner missing '+race.race_id);
  const baseScore=race.runners.map(x=>x.baseline_win_pct_exact/100);
  const candScore=race.runners.map(x=>x.candidate_win_pct_exact/100);
  const y=race.runners.map(x=>Number(x.runner_id===winner.runner_id));
  const scores=(ps,field)=>{
   const winP=ps.find((_,i)=>y[i]===1);
   const highest=ps.reduce((iMax,v,i,a)=>v>a[iMax]?i:iMax,0);
   return {
    top1_correct:Number(field[highest].runner_id===winner.runner_id),
    winner_probability_pct:Number((100*winP).toFixed(6)),
    multiclass_brier:Number(ps.reduce((s,p,i)=>s+(p-y[i])**2,0).toFixed(10)),
    log_loss:Number((-Math.log(Math.max(winP,1e-15))).toFixed(10))
   };
  };
  scored.push({race_id:race.race_id,meeting:race.meeting,
   winner_id:winner.runner_id,winner_name:winner.horse,
   baseline:scores(baseScore,race.runners),candidate:scores(candScore,race.runners),
   official_source_url:result.official_source_url,
   scorer_outcome_was_not_available_to_forecast:true});
 }
 const summaries={};
 for(const name of ['baseline','candidate']){
  const rows=scored.map(x=>x[name]);
  summaries[name]={
   races:scored.length,
   top1_wins:rows.reduce((s,x)=>s+x.top1_correct,0),
   mean_multiclass_brier:average(rows,'multiclass_brier'),
   mean_log_loss:average(rows,'log_loss')
  };
 }
 const finished=new Map(scored.map(x=>[x.race_id,x]));
 for(const n of [5,10,15]){
  const ids=packet.shortlist.tier_positions['top'+n],complete=ids.filter(x=>finished.has(x.race_id));
  const wins=complete.filter(x=>finished.get(x.race_id).winner_id===x.runner_id).length;
  tierRows.push({tier:n,saved:ids.length,completed:complete.length,wins,
   pending_or_excluded:ids.length-complete.length,win_rate_pct:complete.length?Number((100*wins/complete.length).toFixed(2)):null,
   method:'SAVED_CANDIDATE_RELIABILITY_SCREEN_NOT_THE_REVIEWED_HUMAN_BOARD'});
 }
 return {schema:'v5-1-paired-official-results-audit/v1',
  date:packet.date,status:'RETROSPECTIVE_OR_UNVERIFIED_FORECAST_SCORE_ONLY',
  source_packet_sha256:packet.packet_sha256,
  independent_pre_race_lock_proven:false,certified_forward_win_rate:false,
  field_matched_races:scored.length,excluded_races:excluded,
  baseline_model_version:packet.baseline_model_version,
  candidate_model_version:packet.candidate_model_version,
  paired_summary:summaries,tiers:tierRows,races:scored,
  caveat:'No independent GitHub commit proof is validated here. Retrospective or partial racecards must not be called proven live forecasts.'};
}
module.exports={evaluate};
