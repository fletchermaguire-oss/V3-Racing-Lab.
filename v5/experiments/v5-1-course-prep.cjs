'use strict';
/*
 * Evidence-only course / preparation / rival suitability screen.
 * This is NOT a V5 probability model. Its evidence is retrospectively assembled
 * from dated pre-race sources, and is NOT treated as a frozen pre-race forecast.
 * No post-race health finding, result, price or horse-name rule influences flags.
 */
const norm=s=>String(s||'').toUpperCase().replace(/\\([^)]*\\)/g,'').replace(/[^A-Z0-9]/g,'');
const assert=(ok,msg)=>{if(!ok)throw Error('V5.1 source gate: '+msg);};
const date=s=>{assert(/^\\d{4}-\\d{2}-\\d{2}$/.test(String(s)),'invalid date');const t=Date.parse(s+'T00:00:00Z');assert(Number.isFinite(t),'invalid date');return t;};
const instant=s=>{const t=Date.parse(s);assert(typeof s==='string'&&Number.isFinite(t)&&/T.*(?:Z|[+-]\\d\\d:\\d\\d)$/.test(s),'missing timezone-aware timestamp');return t;};
function evaluateOne(evidence,board,official){
 assert(evidence&&evidence.schema==='v5-1-pre-race-configuration-evidence/v1','unsupported schema');
 assert(evidence.post_race_evidence_used===undefined,'post-race switch must only exist on entries');
 assert(board&&board.status==='RESEARCH_ONLY_NOT_CERTIFIED_MODEL','unsupported archived board type');
 assert(Array.isArray(evidence.entries)&&Array.isArray(evidence.sources),'missing evidence');
 const lookup=new Map(evidence.sources.map(s=>[s.key,s]));
 assert(lookup.size===evidence.sources.length,'duplicate evidence source id');
 const fm=official.meetings.find(m=>m.meeting==='FLEMINGTON');
 assert(fm&&evidence.race_date===official.date,'race date or official meeting mismatch');
 const decisions=[];
 for(const input of evidence.entries){
  assert(input.post_race_evidence_used===false,'post-race data not admissible');
  assert(input.race_id.startsWith(evidence.race_date+'_'),'wrong race date');
  const original=board.races.find(x=>x.race_id===input.race_id);
  assert(original&&original.source_basis==='PRIOR_REVIEWED_TOP10','no saved reviewed pre-race selection');
  const jump=instant(original.start_at);
  assert(instant(board.created_at)<jump,'archived picks authored after jump');
  assert(norm(original.first_pick.horse)===norm(input.runner.horse)&&
    String(original.first_pick.saddlecloth)===String(input.runner.saddlecloth),'selection identity changed');
  const currentRace=fm.races.find(x=>x.race===original.race);
  assert(currentRace&&currentRace.active_runners.some(x=>
    String(x.number)===String(input.runner.saddlecloth)&&norm(x.horse)===norm(input.runner.horse)),'not an official active starter');
  const referenced=new Set([
   ...(input.sources||[]),...(input.previous_major_target?.sources||[]),
   ...(input.trainer_latest_comment?.sources||[]),
   ...(input.credible_rivals||[]).flatMap(r=>r.sources||[])
  ]);
  assert(referenced.size>0,'no pre-race sources');
  for(const key of referenced){
   const source=lookup.get(key);
   assert(source,'missing source '+key);
   assert(/^https:\\/\\//.test(source.url),'source url required');
   if(source.kind==='PRE_RACE_ARCHIVE') assert(instant(source.observed_at)<jump,'archived source too late');
   else if(source.kind==='DATED_PRE_RACE_REPORT')assert(date(source.published_date)<date(evidence.race_date),'date-only source not provably pre-race');
   else throw Error('unsupported source type: '+source.kind);
  }
  const cautions=[],supports=[],checks=[];
  if(input.course_configuration==='STRAIGHT'){
   assert(input.documented_configuration_experience==='CONFIRMED_NO_RACE_START'||
     input.documented_configuration_experience==='CONFIRMED_PRIOR_RACE_START'||
     input.documented_configuration_experience==='UNVERIFIED','invalid course configuration evidence');
   if(input.documented_configuration_experience==='CONFIRMED_NO_RACE_START'){
    assert(input.documented_configuration_starts===0,'contradictory straight starts');
    cautions.push('FIRST_RACE_DOWN_STRAIGHT_CONFIGURATION');
   }else if(input.documented_configuration_experience==='UNVERIFIED'){
    cautions.push('STRAIGHT_CONFIGURATION_EXPERIENCE_UNVERIFIED');
   }else{
    assert(Number.isInteger(input.documented_configuration_starts)&&input.documented_configuration_starts>0,'invalid prior runs');
   }
  }
  const peak=input.previous_major_target;
  let peakGapDays=null;
  if(peak){
   const days=(date(evidence.race_date)-date(peak.date))/86400000;
   assert(Number.isInteger(days)&&days>0,'target is not a preceding start');
   assert(['G1','G2','G3'].includes(peak.level),'uncertified major target level');
   peakGapDays=days;
   if(days<=28){
    cautions.push('RECENT_MAJOR_TARGET_FITNESS_REVIEW');
    checks.push('PRE_RACE_INTENSITY_NOT_DIAGNOSED_FATIGUE');
   }
  }
  if(input.trainer_latest_comment?.kind==='POSITIVE_PRE_RACE'){
   supports.push('PRE_RACE_TRAINER_REPORTED_HORSE_WELL');
   checks.push('CONTRARY_POSITIVE_TRAINER_EVIDENCE_MUST_BE_PRESERVED');
  }
  const activeNames=new Set(currentRace.active_runners.map(x=>norm(x.horse)));
  const rivals=[];
  for(const rival of input.credible_rivals||[]){
   assert(activeNames.has(norm(rival.horse)),'cited rival is not active');
   if(rival.type==='COURSE_CONFIGURATION_PROVEN'){
    assert(rival.documented_same_configuration_starts>=1&&rival.documented_same_configuration_wins>0&&
       rival.documented_same_configuration_wins<=rival.documented_same_configuration_starts,'invalid rival straight record');
   }else if(rival.type==='RECENT_GRADED_PROGRESS'){
    assert(Number.isInteger(rival.documented_consecutive_graded_wins)&&rival.documented_consecutive_graded_wins>=2,'unsupported rival progression');
   }else throw Error('unsupported rival factor '+rival.type);
   rivals.push({type:rival.type,
    documented_in_archived_dangers:original.dangers.some(d=>norm(d.horse)===norm(rival.horse)),
    evidence_sources:rival.sources.slice()});
  }
  if(rivals.some(r=>r.type==='COURSE_CONFIGURATION_PROVEN'))cautions.push('PROVEN_SAME_CONFIGURATION_OPPONENT');
  if(rivals.some(r=>r.type==='RECENT_GRADED_PROGRESS'&&!r.documented_in_archived_dangers))
    cautions.push('IMPROVING_GRADED_RIVAL_OMITTED_FROM_MAIN_DANGERS');
  return decisions.push({
   race_id:input.race_id,horse:input.runner.horse,analyst_working_win_pct:original.working_win_pct,
   screening:'PRE_RACE_EVIDENCE_REVIEW_REQUIRED',cautions,supporting_pre_race_evidence:supports,checks,
   days_since_major_target:peakGapDays,rival_comparisons:rivals,
   source_status:'RETROSPECTIVE_RECONSTRUCTION_OF_PRE_RACE_EVIDENCE_NOT_FROZEN',
   model_probability_available:false,model_probability_changed:false,
   after_race_medical_data_used:false,proven_improvement:false
  });
 }
 return {schema:'v5-1-course-prep-screen/v1',date:evidence.race_date,status:'EXPERIMENTAL_DIAGNOSTIC_NOT_PRODUCTION',
         scored_runners:decisions.length,decisions,publication_approved:false};
}
module.exports={evaluateOne};
