/* V5 form-first research checkpoint: deterministic, race-day-aware presentation.
 * The archived top-ten is an independent human research ranking. Model percentages
 * are displayed as provisional diagnostics; this module NEVER rescores a horse or
 * invents a replacement selection. Manual changes are local and auditable.
 */
(function(root,factory){
 var api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.RacingLabV5Curated=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const VERSION='V5-CURATED-RESEARCH-v1';
const GRADES=['A+','A','A-','B+','B','B-','C+','C','WATCH','NO_SELECTION'];
const clean=s=>String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
function validate(checkpoint,data){
 if(!checkpoint||checkpoint.date!==data.date||checkpoint.publication_approved!==false||
   !Array.isArray(checkpoint.entries)||!checkpoint.entries.length)throw Error('Missing or stale frozen research checkpoint');
 const ranks=new Set(),identity=new Set(),races=new Set(data.races.map(x=>x.id));
 checkpoint.entries.forEach(x=>{
  const raceId=data.date+'_'+x.meeting+'_R'+String(x.race).padStart(2,'0');
  if(!races.has(raceId)||!Number.isSafeInteger(x.rank)||x.rank<1||ranks.has(x.rank)||
    !GRADES.includes(x.tier)||!String(x.horse||'').trim())throw Error('Invalid archived research entry');
  const id=raceId+'|'+clean(x.horse);
  if(identity.has(id))throw Error('Duplicate archived research horse');
  if(!data.runners.some(h=>h.race_id===raceId&&clean(h.horse)===clean(x.horse)))
    throw Error('Archived research runner not found in source '+id);
  ranks.add(x.rank);identity.add(id);
 });
 if(!checkpoint.entries.every(x=>x.rank<=checkpoint.entries.length))throw Error('Research ranks must be continuous');
 return true;
}
function assemble(checkpoint,data,board,going,overrides){
 validate(checkpoint,data);
 const edits=overrides&&typeof overrides==='object'?overrides:{};
 const listed=new Map(data.runners.map(h=>[h.race_id+'|'+clean(h.horse),h]));
 const included=new Map(board.baseline.records.map(r=>[r.id,r]));
 const result=checkpoint.entries.map(x=>{
  const raceId=data.date+'_'+x.meeting+'_R'+String(x.race).padStart(2,'0');
  const h=listed.get(raceId+'|'+clean(x.horse));
  const current=included.get(h.id),change=edits[h.id]||{},notes=[];
  if(!current)notes.push('NOT_IN_CURRENT_FIELD');
  if(data.emergencies_certified!==true&&(data.emergency_review_races||[]).includes(raceId))notes.push('PROVISIONAL_EMERGENCY_ACTIVATIONS');
  const baseGoing=checkpoint.track_assumptions&&checkpoint.track_assumptions[x.meeting]||null;
  if(baseGoing&&going[x.meeting]!==baseGoing)notes.push('TRACK_GOING_CHANGED');
  if(current&&current.quality_flags.length)notes.push(...current.quality_flags);
  if(current&&current.days_since_last!==null&&current.days_since_last<=7)notes.push('SHORT_BACKUP');
  const screening=board.winFirst.byRace.find(y=>y.race_id===raceId);
  if(screening&&screening.status!=='PRIORITY_RESEARCH')notes.push('STRICT_SCREEN_NOT_QUALIFIED');
  const formTier=String(x.original_form_tier||x.tier);
  const grade=GRADES.includes(change.tier)?change.tier:formTier;
  const rank=Number.isSafeInteger(change.rank)&&change.rank>=1&&change.rank<=checkpoint.entries.length?change.rank:x.rank;
  return {id:h.id,horse:h.horse,race_id:raceId,meeting:x.meeting,race:x.race,
   rank:rank,original_rank:x.rank,form_tier:grade,archived_form_tier:formTier,
   archived_race_day_grade:x.tier,research_lane:x.research_status==='CONDITIONAL_REVIEW'?'CONDITIONAL_REVIEW':'TOP10_RESEARCH',
   race_day_assessment:current?(notes.length?'CONDITIONAL_REVIEW':'CURRENT_FIELD_INCLUDED'):'SCRATCHED_OR_NOT_CONFIRMED',
   eligible:!!current,model_pct:current?current.p:null,original_model_pct:x.model_pct,
   model_range:current?current.model_range:null,model_version:board.version,
   reason:x.reason||'',risk:x.risk||'',notes:Array.from(new Set(notes)),
   override_reason:change.reason||null,override_at:change.at||null,
   track_baseline:baseGoing,track_current:going[x.meeting],screen_status:screening?screening.status:'UNASSESSED'};
 }).sort((a,b)=>a.rank-b.rank||a.original_rank-b.original_rank);
 return {version:VERSION,status:'ARCHIVED_HUMAN_RANKING_WITH_LIVE_FIELD_CHECKS_NOT_CALIBRATED',
  date:data.date,checkpoint_at:checkpoint.as_of||null,baseline_model:checkpoint.model||null,
  count:result.length,active_count:result.filter(x=>x.eligible).length,
  priority_research_count:result.filter(x=>x.research_lane==='TOP10_RESEARCH').length,
  additional_review_count:result.filter(x=>x.research_lane==='CONDITIONAL_REVIEW').length,
  entries:result,top5:result.slice(0,5),top10:result.slice(0,10),top15:result.slice(0,15),
  aTier:result.filter(x=>/^A[+-]?$/.test(x.archived_form_tier)),
  warnings:['No automatic replacement: an excluded runner leaves a vacant researched position.',
   'An A-grade form profile does not mean an A-grade race-day win probability.',
   'This list is a frozen qualitative checkpoint; recalculations affect displayed model probabilities, not independent research rank.']};
}
function edit(archive,runnerId,change){
 if(!archive.entries.some(x=>x.id===runnerId))throw Error('Runner is not on the saved research shortlist');
 if(!change||!GRADES.includes(change.tier)||!Number.isSafeInteger(change.rank)||change.rank<1||change.rank>archive.entries.length)
   throw Error('Invalid requested research rank or grade');
 if(typeof change.reason!=='string'||change.reason.trim().length<15)throw Error('An explanation of at least 15 characters is required');
 return {tier:change.tier,rank:change.rank,reason:change.reason.trim().slice(0,500),at:new Date().toISOString()};
}
return Object.freeze({VERSION:VERSION,GRADES:GRADES,validate:validate,assemble:assemble,edit:edit});
});
