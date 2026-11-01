/* Model-blind, whole-field evidence challenge scanner.
 * Applies PRE-EXISTING v5/challenge.js screening thresholds across ALL eligible
 * opponents. It proposes reviews, not revised selection percentages or picks.
 * No results, odds, winner labels, or post-race statistics are read.
 */
(function(root,factory){
 const api=factory(
  typeof module==='object'&&module.exports?require('./model.js'):root.RacingLabV5Model,
  typeof module==='object'&&module.exports?require('./challenge.js'):root.RacingLabV5Challenge
 );
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RacingLabV5AutoChallenge=api;
})(typeof window!=='undefined'?window:globalThis,function(Model,Challenge){
'use strict';
const VERSION='racing-lab-v5-whole-field-challenges/v1';
const round=x=>Number(x.toFixed(2));
function valid(data){
 if(!Model||typeof Model.calculate!=='function'||!Challenge||typeof Challenge.wetHistory!=='function')throw Error('Original V5 model and evidence rules required');
 if(!data||!Array.isArray(data.runners)||!Array.isArray(data.races)||!data.date)throw Error('Dated saved original racecard required');
}
function scan(data,options){
 valid(data);
 const o=options||{},raceId=o.race_id,going=o.reported_going||'Soft 5';
 const r=data.races.find(r=>r.id===raceId);
 if(!r)throw Error('Unknown race');
 if(!['Good 4','Soft 5','Soft 6','Soft 7','Heavy 8','Heavy 9','Heavy 10'].includes(going))throw Error('Unsupported scenario');
 const first=Model.calculate(data,{default:'Good 4'});
 const scenario=going==='Good 4'?first:Model.calculate(data,{default:going});
 const base=first.records.filter(x=>x.race_id===raceId).sort((a,b)=>a.rank-b.rank);
 const scenarioRows=scenario.records.filter(x=>x.race_id===raceId);
 const lookup=new Map(scenarioRows.map(x=>[x.id,x]));
 const byId=new Map(data.runners.filter(h=>h.race_id===raceId).map(h=>[h.id,h]));
 const leader=base.find(x=>x.id===o.incumbent_id)||(o.incumbent_id?null:base[0]);
 if(!leader)throw Error('Selected horse absent or scratched; cannot challenge');
 if(base.length<2)throw Error('At least two included runners required');
 const original=lookup.get(leader.id),wetA=Challenge.wetHistory(byId.get(leader.id));
 const wetRatio=x=>x.starts>=3?x.wins/x.starts:null;
 const aRate=wetRatio(wetA);
 const challengers=base.filter(x=>x.id!==leader.id).map(b=>{
  const alt=lookup.get(b.id),history=Challenge.wetHistory(byId.get(b.id));
  const bRate=wetRatio(history),relative=round((alt.p-b.p)-(original.p-leader.p));
  const flags=[];
  // Precisely the same review triggers as v5/challenge.js, without
  // running a full-card model twice per rival.
  if(bRate!==null&&bRate>=.6&&(aRate===null||bRate-aRate>=.25))
   flags.push('CHALLENGER_HAS_MATERIAL_WET_FORM_EVIDENCE');
  if(relative>=3)flags.push('CHALLENGER_RELATIVE_SCENARIO_UPLIFT');
  if(b.rank>leader.rank&&alt.rank<b.rank)
   flags.push('CHALLENGER_RANK_IMPROVES_ON_SCENARIO');
  if(alt.p>=original.p)flags.push('CHALLENGER_NOW_MODELS_LEVEL_OR_AHEAD');
  if(original.p-alt.p<2&&leader.p-b.p>=4)
   flags.push('LEAD_COLLAPSES_ON_SCENARIO');
  if(!history.known||!wetA.known)flags.push('WET_HISTORY_INCOMPLETE');
  if(going.startsWith('Soft ')&&going!=='Soft 5')
   flags.push('SOFT_GRADES_SHARE_AN_UNCALIBRATED_SURFACE_BUCKET');
  const review=flags.some(f=>/CHALLENGER_HAS|RELATIVE_SCENARIO|LEAD_COLLAPSES|NOW_MODELS/.test(f));
  // Rank changes on scenarios alone do not automatically replace the
  // independent original research candidate.
  return {runner_id:b.id,horse:b.horse,model_good4_rank:b.rank,model_scenario_rank:alt.rank,
   model_good4_pct:b.p,model_scenario_pct:alt.p,scenario_gap_to_incumbent_pp:round(original.p-alt.p),
   relative_scenario_uplift_pp:relative,wet_form:{starts:history.starts,wins:history.wins,known:history.known},
   flags,status:review?'REASSESSMENT_REQUIRED':'NO_MATERIAL_REVIEW_TRIGGER',review_required:review};
 });
 challengers.sort((a,b)=>Number(b.review_required)-Number(a.review_required)||
    b.flags.filter(f=>f!=='WET_HISTORY_INCOMPLETE').length-a.flags.filter(f=>f!=='WET_HISTORY_INCOMPLETE').length||
    b.model_scenario_pct-a.model_scenario_pct||a.runner_id.localeCompare(b.runner_id));
 return {schema:VERSION,race_date:data.date,race_id:raceId,meeting:r.meeting,scenario:going,comparison:'Good 4',
  research_incumbent:{runner_id:leader.id,horse:leader.horse,good4_pct:leader.p,scenario_pct:original.p,
   wet_form:wetA,model_rank:leader.rank},
  total_other_included_runners:challengers.length,review_count:challengers.filter(x=>x.review_required).length,
  pending_reviews:challengers.filter(x=>x.review_required),all_rivals:challengers,
  source_status:'SAVED_DOSSIER_SCENARIO_ONLY',final_starters_verified:false,
  outcomes_used:false,model_modified:false,shortlist_modified:false,
  warning:'This all-rival screen flags historical evidence requiring human review; it does not know future conditions, verify late starters, certify source integrity, calculate calibrated win chances or silently replace saved picks.'};
}
function scanCard(data,shortlist,options){
 valid(data);
 const indexed=new Map((shortlist&&Array.isArray(shortlist.entries)?shortlist.entries:[]).filter(e=>e.eligible!==false)
  .map(e=>[e.meeting+'|'+e.race,e]));
 const out=[];
 for(const race of data.races){
  const entry=indexed.get(race.meeting+'|'+race.race);
  if(!entry)continue;
  const selected=data.runners.filter(h=>h.race_id===race.id&&h.horse.toUpperCase()===entry.horse.toUpperCase());
  if(selected.length!==1||!Model.isEligible(selected[0])){out.push({race_id:race.id,
   reviewed_horse:entry.horse,status:'ORIGINAL_HORSE_OUT_OF_FIELD',review_count:null});continue;}
  const report=scan(data,{race_id:race.id,incumbent_id:selected[0].id,reported_going:(options&&options.going&&options.going[race.meeting])||'Soft 5'});
  out.push({race_id:race.id,reviewed_horse:entry.horse,rank:entry.rank,
   status:report.review_count?'CHALLENGER_REVIEW_REQUIRED':'NO_MATERIAL_CHALLENGER',
   review_count:report.review_count,flagged_rivals:report.pending_reviews.map(x=>x.horse)});
 }
 return {schema:VERSION,race_date:data.date,research_races:out.length,
  challenged_races:out.filter(x=>x.status==='CHALLENGER_REVIEW_REQUIRED').length,
  results:out,model_modified:false,shortlist_modified:false,
  purpose:'Advance pre-race QA on all reviewed picks, not retroactive selection changes or selection win accounting.'};
}
return Object.freeze({VERSION,scan,scanCard});
});