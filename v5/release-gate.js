/* V5 independent release gate: prevents missing-field, stale-going and
 * unrecorded human-override selections being certified as final.
 * No coefficients, horse preferences, or prices enter this audit.
 */
(function(root,factory){const out=factory();if(typeof module==='object'&&module.exports)module.exports=out;else root.RacingLabReleaseGate=out;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const SCHEMA='racing-lab-v5-proposal/v1';
const stamp=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(s)&&Number.isFinite(Date.parse(s))?Date.parse(s):null;
const url=s=>typeof s==='string'&&/^https:\/\/[^/\s]+/.test(s);
const going=s=>/^(?:Good [34]|Soft [567]|Heavy (?:8|9|10))$/.test(String(s));
const unique=xs=>new Set(xs).size===xs.length;
function assess(d,asOf){
 if(!d||d.schema!==SCHEMA||!Array.isArray(d.races)||!Array.isArray(d.top10)||!Array.isArray(d.qualifiers))throw Error('Invalid V5 proposal');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||stamp(asOf)===null||stamp(d.created_at)===null)throw Error('Invalid dated proposal');
 const flags=[],out=[],ids=new Set(),selected=new Map();
 if(d.phase!=='FINAL_REVIEWED')flags.push('RESEARCH_ONLY_NOT_FINAL');
 if(d.explicit_review_approved!==true)flags.push('NO_FINAL_APPROVAL');
 if(d.independent_calibration_established!==true)flags.push('UNCALIBRATED_ESTIMATES_NOT_CERTIFIED');
 for(const r of d.races){
  if(!r||typeof r.id!=='string'||!r.id.startsWith(d.date+'_')||ids.has(r.id)){flags.push('INVALID_OR_DUPLICATE_RACE');continue;}
  ids.add(r.id);const bad=[],now=stamp(asOf),start=stamp(r.start_at),checked=stamp(r.checked_at);
  const published=stamp(r.fields_published_at),trackTime=stamp(r.going_published_at),reviewed=stamp(r.reviewed_at);
  if([start,checked,published,trackTime,reviewed].some(x=>x===null)||now>=start||
    stamp(d.created_at)>=start||published>checked||trackTime>checked||checked>reviewed||reviewed>=start)
   bad.push('UNVERIFIED_OR_POSTJUMP_TIMING');
  if(!r.final_starters_verified||!r.emergencies_reconciled||!url(r.official_fields_url)||!url(r.going_source_url))
   bad.push('NO_VERIFIED_COMPLETE_STARTERS');
  if(!going(r.official_going)||r.official_going!==r.model_going)
   bad.push('GOING_NOT_MATCHED_TO_MODEL_SCENARIO');
  const active=Array.isArray(r.starters)?r.starters:[],prob=Array.isArray(r.probabilities)?r.probabilities:[];
  if(active.length<2||!unique(active)||active.some(id=>typeof id!=='string'||!id.startsWith(r.id+'_')))
   bad.push('INVALID_FINAL_FIELD');
  if(prob.length!==active.length||!unique(prob.map(x=>x&&x.runner_id))||
   prob.some(x=>!x||!active.includes(x.runner_id)||!Number.isFinite(x.pct)||x.pct<=0||x.pct>=100)||
   Math.abs(prob.reduce((s,x)=>s+(x&&Number.isFinite(x.pct)?x.pct:0),0)-100)>.011)
   bad.push('NONNORMALIZED_OR_MISSING_WHOLE_FIELD_PROBABILITIES');
  if(r.probability_method!=='SAME_VERSION_V5_FULL_FIELD'||typeof r.model_version!=='string'||r.model_version.length<3||
      typeof r.field_revision!=='string'||r.field_revision.length<3)
   bad.push('MANUAL_PERCENTAGES_OR_UNVERSIONED_MODEL');
  if(!active.includes(r.original_pick)||!active.includes(r.final_pick))
   bad.push('PICK_NOT_IN_ACTIVE_FIELD');
  if(typeof r.pace_reason!=='string'||r.pace_reason.trim().length<15||!url(r.pace_source))
   bad.push('PACE_NOT_REVIEWED');
  const dangers=Array.isArray(r.dangers)?r.dangers:[];
  if(dangers.length<Math.min(2,active.length-1)||dangers.some(x=>!x||x.runner_id===r.final_pick||
    !active.includes(x.runner_id)||!url(x.source)||typeof x.reason!=='string'||x.reason.trim().length<15))
   bad.push('TOP_RIVALS_NOT_REVIEWED');
  if(r.final_pick!==r.original_pick){
   const o=r.override;
   if(!o||o.from!==r.original_pick||o.to!==r.final_pick||
      !url(o.source)||typeof o.reason!=='string'||o.reason.trim().length<25||
      stamp(o.timestamp)===null||stamp(o.timestamp)<checked||stamp(o.timestamp)>=start||
      o.field_revision!==r.field_revision)
    bad.push('UNRECORDED_OR_LATE_OVERRIDE');
  }else if(r.override)bad.push('AMBIGUOUS_OVERRIDE');
  selected.set(r.id,r.final_pick);
  out.push({race_id:r.id,ready:bad.length===0,blockers:bad,selected_runner_id:r.final_pick});
  flags.push(...bad);
 }
 if(!d.races.length)flags.push('NO_RACE_PROBABILITIES');
 if(d.top10.length>15||!unique(d.top10.map(x=>x.rank))||!unique(d.top10.map(x=>x.runner_id))||
   d.top10.some(x=>!Number.isSafeInteger(x.rank)||x.rank<1||x.rank>15||!ids.has(x.race_id)||
     !d.races.find(r=>r.id===x.race_id).starters.includes(x.runner_id)))
  flags.push('TOP10_RANK_OR_FIELD_MISMATCH');
 if(d.phase==='FINAL_REVIEWED'&&!d.top10.length)flags.push('NO_RESEARCH_RANKS');
 if(d.qualifiers.length>3||!unique(d.qualifiers.map(x=>x.race_id))||
   d.qualifiers.some(x=>!selected.has(x.race_id)||selected.get(x.race_id)!==x.runner_id||
    typeof x.reason!=='string'||x.reason.trim().length<20||
    typeof x.risk!=='string'||x.risk.trim().length<12))
  flags.push('QUALIFIER_NOT_SUPPORTED');
 const blockers=[...new Set(flags)];
 return {schema:'racing-lab-v5-release-gate-report/v1',date:d.date,
  certified_final_release:blockers.length===0,
  model_calibration_established:d.independent_calibration_established===true,
  contenders:d.top10.length,high_conviction:d.qualifiers.length,
  abstention_permitted:true,races:out,blockers,
  notice:'Quality release gate only; no claim of improved hit rate. Sources require independent verification. Research may be displayed as explicitly uncalibrated.'};
}
return Object.freeze({SCHEMA,assess});
});
