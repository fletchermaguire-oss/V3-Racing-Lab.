'use strict';
/*
 * V5.1 selective recommendation audit, AFTER racing and for DIAGNOSTICS ONLY.
 * Never used by forecast model; outcomes used only after original chance screen.
 */
const assert=require('node:assert/strict');
const Study=require('./compare-v5-1-formula.cjs');
const Model=require('./model-v5-1.cjs');
const Quality=require('./v5-1-evidence-gate.cjs');
const canonical=s=>String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const selectedTypes=new Set(['ARCHIVED_MISMATCH_FILTERED','ALL_TEN_RACES_UNFROZEN_MODELS_POSTRACE_OUTCOMES']);
function audit(){
 const cohorts=Study.groups(),summaries=[],excluded=[];
 for(const g of cohorts){
  if(!selectedTypes.has(g.type)){
   excluded.push({date:g.label,type:g.type,reason:'Historic reconstruction source format differs from later parsed form, or duplicated 7 Nov analyst-selected subset'});
   continue;
  }
  const out=Model.calculate(g.data,g.going);
  const raceMeta=new Map(g.data.races.map(r=>[r.id,r]));
  const qualified=[];
  for(const [raceId,winnerRef] of g.winners){
   if(g.exclude.has(raceId))continue;
   const rows=out.records.filter(r=>r.race_id===raceId);
   const race=out.races.find(r=>r.id===raceId);
   const archived=raceMeta.get(raceId);
   assert(race&&archived&&rows.length===race.field,'race mismatch '+raceId);
   const leader=rows.find(x=>x.rank===1);
   const winner=rows.find(x=>x.id===winnerRef||canonical(x.horse)===canonical(winnerRef));
   assert(leader&&winner,'winner not saved in race '+raceId);
   const sourceOnly=Quality.riskScreen(leader,{...race,distance_m:archived.distance_m},rows,null);
   assert.equal(sourceOnly.model_pct,leader.p);
   qualified.push({
    race_id:raceId,meeting:race.meeting,winner:winner.horse,model_leader:leader.horse,
    model_leader_win:leader.id===winner.id,model_win_pct:leader.p,
    screen_status:sourceOnly.screen_status,
    data_readiness:sourceOnly.data_readiness,
    quality_issues:sourceOnly.quality_issues,
    source_data_issues:sourceOnly.source_data_issues,
    racing_uncertainty_issues:sourceOnly.racing_uncertainty_issues,
    pace_warning:sourceOnly.pace_context
   });
  }
  const metric=rs=>({races:rs.length,wins:rs.filter(x=>x.model_leader_win).length,
   hit_rate_pct:rs.length?Number((100*rs.filter(x=>x.model_leader_win).length/rs.length).toFixed(2)):null});
  const eligible=qualified.filter(r=>r.screen_status==='MODEL_LEADER_ELIGIBLE_FOR_REVIEW');
  const flagged=qualified.filter(r=>r.screen_status==='EVIDENCE_REVIEW_REQUIRED');
  summaries.push({
   date:g.label,provenance:g.type,
   total:metric(qualified),eligible:metric(eligible),flagged:metric(flagged),
   input_quality_flags:qualified.filter(r=>r.source_data_issues.length).length,
   racing_uncertainty_flags:qualified.filter(r=>r.racing_uncertainty_issues.length).length,
   records:qualified
  });
 }
 assert.equal(summaries.length,3,'Expected one 31 Oct source and two full 7 Nov meeting sources');
 const aggregate=(key)=>{const rows=summaries.flatMap(x=>x.records).filter(r=>key==='all'||(key==='eligible'?
  r.screen_status==='MODEL_LEADER_ELIGIBLE_FOR_REVIEW':
  r.screen_status==='EVIDENCE_REVIEW_REQUIRED'));
  return {races:rows.length,wins:rows.filter(x=>x.model_leader_win).length,
   strike_rate_pct:rows.length?Number((100*rows.filter(x=>x.model_leader_win).length/rows.length).toFixed(2)):null};
 };
 const findByDate=summaries.filter(s=>s.date.includes('11-07'));
 assert.equal(findByDate.length,2);
 return {schema:'v5-1-retrospective-selection-screen-audit/v1',
  status:'RETROSPECTIVE_AND_POST_OUTCOME_HYPOTHESIS_NOT_PROSPECTIVE',
  evaluator_model:Model.VERSION,
  screen_requires_results:false,results_used_for_scores_only:true,
  comparison:{all:aggregate('all'),eligible:aggregate('eligible'),flagged:aggregate('flagged')},
  date_groups:summaries.map(({records,...head})=>head),
  reasons:Object.entries(summaries.flatMap(x=>x.records).flatMap(x=>x.quality_issues)
   .reduce((d,key)=>(d[key]=(d[key]||0)+1,d),{})).sort((a,b)=>b[1]-a[1]),
  excluded_archives:excluded,
  limitations:[
   'Screen designed after observing 7 Nov results, then evaluated retrospectively on same small set.',
   '31 Oct seven model-vs-result field mismatches excluded; 17/24 Oct reconstructed dossiers have very different parsed form and must not be combined into one screen hit rate.',
   'Only 31 Oct and 7 Nov Rosehill/Ascot evaluated; there is no independently validated prospective hit rate.',
   'Eligible means fit for analyst review, not guaranteed to win, place or be suitable for multis.',
   'The screen does not change full-field percentages; some actual winners are flagged and some actual losses pass.',
   'Selection coverage, per-race outcomes and proper probability calibration must be scored alongside hit rate.'
  ]};
}
if(require.main===module)process.stdout.write(JSON.stringify(audit(),null,2)+'\n');
module.exports={audit};
