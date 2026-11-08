'use strict';
/*
 * V5.1 experimental PRE-RACE selection-quality overlay.
 * - Reconcile model inputs against an independently saved official starter sheet.
 * - Keep original V5 scoring and whole-field probabilities exactly unchanged.
 * - Label evidence/pace uncertainty instead of retrospectively adjusting win odds.
 * - Never read results, bookmaker prices, winning names or post-race explanations.
 * - No automatic publication approval or model calibration.
 */
const Model=require('../model.js');
const clean=s=>String(s||'').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const clone=x=>JSON.parse(JSON.stringify(x));
function assert(ok,message){if(!ok)throw Error('V5.1 fail-closed: '+message);}
function reconcileSnapshot(research,official,meeting){
 assert(research&&official&&research.date===official.date,'research/official dates differ');
 assert(typeof meeting==='string'&&meeting.length>0,'missing meeting');
 assert(Array.isArray(research.races)&&Array.isArray(research.runners),'incomplete research source');
 const officialMeeting=official.meetings.find(x=>x.meeting===meeting);
 assert(officialMeeting&&research.races.every(x=>x.meeting===meeting),'meeting mismatch');
 const next=clone(research),removed=[];
 let activeCount=0;
 for(const race of next.races){
  const sheet=officialMeeting.races.find(x=>x.race===race.race);
  assert(sheet&&Array.isArray(sheet.active_runners)&&Number.isInteger(sheet.active),'missing official race '+race.race);
  assert(sheet.active_runners.length===sheet.active,'official race inventory incomplete R'+race.race);
  const field=next.runners.filter(x=>x.race_id===race.id);
  const numbers=new Set(),activeNumbers=new Map();
  for(const x of sheet.active_runners){
   const no=String(x.number);
   assert(!activeNumbers.has(no),'duplicate official number '+race.id+' '+no);
   activeNumbers.set(no,x);
  }
  for(const horse of field){
   const no=String(horse.tab);
   assert(!numbers.has(no),'duplicate research number '+race.id+' '+no);
   numbers.add(no);
   const officialHorse=activeNumbers.get(no);
   if(officialHorse){
    assert(clean(officialHorse.horse)===clean(horse.horse),'official horse identity changed '+race.id+' '+no);
    horse.status='ACTIVE_VERIFIED';
    activeCount++;
   }else{
    horse.status='SCRATCHED';
    removed.push({race_id:race.id,horse:horse.horse,tab:no});
   }
  }
  assert([...activeNumbers.keys()].every(no=>numbers.has(no)),'official active runner missing in research '+race.id);
  assert(field.filter(x=>x.status==='ACTIVE_VERIFIED').length===sheet.active,'starter count inconsistent '+race.id);
  race.field_count=sheet.active;
  // Morning acceptance checks do not certify actual race-time starter inventory.
  race.field_verified=false;
 }
 return {data:next,provenance:{
  date:research.date,meeting:meeting,original_source_date:research.saved_at,
  official_checked_at:official.checked_at,activeCount:activeCount,
  removed:removed,publication_approved:false,
  starter_certification:'OFFICIAL_SNAPSHOT_ONLY_NOT_JUMP_TIME_CERTIFIED'}};
}
function riskScreen(row,race,field,stability=null){
 const gap=Number(race.gap),issues=Array.isArray(row.input_issues)?row.input_issues:[];
 const problems=[],warnings=[];
 if(row.form_audit.accepted<4)problems.push('THIN_PARSEABLE_RECENT_FORM');
 if(row.completeness<0.85)problems.push('LOW_DOCUMENTED_COMPLETENESS');
 if(issues.length)problems.push('SOURCE_INPUT_WARNINGS');
 if(row.features.recency>=0.6&&row.features.class<0&&row.form_audit.accepted<4)
  problems.push('RECENT_FORM_DOMINATES_UNFAVOURABLE_CLASS_EVIDENCE');
 if(Number.isFinite(gap)&&gap<4)problems.push('SMALL_MODEL_FIELD_GAP');
 if(race.chaos>89)problems.push('CROWDED_FIELD');
 if(row.days_since_last!==null&&row.days_since_last>70)problems.push('LAYOFF_RISK');
 if(stability&&stability.leader_count!==4)problems.push('LEADER_CHANGES_WITH_GOING_OR_CLASS_SCENARIO');
 if(stability&&stability.probability_spread_pp>12)warnings.push('WIDE_GOING_CLASS_PROBABILITY_SPREAD');
 const straight=row.meeting==='FLEMINGTON'&&race.distance_m<=1200;
 if(straight&&row.features.course<=0)problems.push('STRAIGHT_COURSE_TRANSFER_NEEDS_REVIEW');
 const settled=field.filter(x=>Number.isFinite(x.settle_800)),likelyLeaders=settled.filter(x=>x.settle_800<=2);
 const paceNote=settled.length<Math.ceil(field.length/2)?
  'PACE_EVIDENCE_INSUFFICIENT':
  likelyLeaders.length===1?'POSSIBLE_UNCONTESTED_EARLY_SPEED_NEEDS_REPLAY':
  likelyLeaders.length>=3?'POSSIBLE_EARLY_SPEED_PRESSURE_NEEDS_REPLAY':
  'PACE_NOT_ESTABLISHED_FROM_SETTLING_ALONE';
 return {runner_id:row.id,horse:row.horse,race_id:row.race_id,model_rank:row.rank,
  model_pct:row.p,model_gap:race.gap,quality_issues:problems,sensitivity_warnings:warnings,pace_context:paceNote,
  scenario_stability:stability,
  pace_verified:false,sectionals_verified:false,
  screen_status:problems.length?'EVIDENCE_REVIEW_REQUIRED':'MODEL_LEADER_ELIGIBLE_FOR_REVIEW',
  calibrated:false,published:false};
}
function evaluate(research,official,meeting,going='Good 4'){
 const rec=reconcileSnapshot(research,official,meeting);
 const model=Model.calculate(rec.data,{default:going});
 assert(model.races.length===rec.data.races.length,'model race count mismatch');
 const variantSpecs=[['good_base','Good 4',Model.CONFIG.weights.class],
  ['soft_base','Soft 5',Model.CONFIG.weights.class],
  ['good_conservative_class','Good 4',Model.CONFIG.conservativeClass],
  ['soft_conservative_class','Soft 5',Model.CONFIG.conservativeClass]];
 const variants=variantSpecs.map(([name,surface,weight])=>({
  name:name,calculated:Model.calculate(rec.data,{default:surface},weight)
 }));
 const items=model.races.map(r=>{
  const field=model.records.filter(x=>x.race_id===r.id).sort((a,b)=>a.rank-b.rank);
  const selected=field[0];
  assert(selected&&field.length===r.field,'model field mismatch '+r.id);
  const estimates=variants.map(v=>{
   const contender=v.calculated.records.find(x=>x.id===selected.id);
   const lead=v.calculated.records.find(x=>x.race_id===r.id&&x.rank===1);
   assert(contender&&lead,'scenario loses active model runner '+r.id);
   return {scenario:v.name,pct:contender.p,rank:contender.rank,leader:lead.horse};
  });
  const percentageValues=estimates.map(x=>x.pct);
  const stability={leader_count:estimates.filter(x=>x.rank===1).length,
   probability_floor:Math.min(...percentageValues),
   probability_ceiling:Math.max(...percentageValues),
   probability_spread_pp:Number((Math.max(...percentageValues)-Math.min(...percentageValues)).toFixed(2)),
   scenarios:estimates};
  const row=riskScreen(selected,{...r,distance_m:rec.data.races.find(x=>x.id===r.id).distance_m},field,stability);
  return {...row,meeting:meeting,race:r.race,model_runner_count:r.field};
 });
 return {schema:'v5-1-evidence-overlay/v1',date:research.date,meeting:meeting,going:going,
  status:'EXPERIMENTAL_RESEARCH_ONLY',model_version:model.version,
  baseline_model_unchanged:true,calibration_established:false,publication_approved:false,
  reconciliation:rec.provenance,screen:items,model:model};
}
module.exports={reconcileSnapshot,riskScreen,evaluate};
