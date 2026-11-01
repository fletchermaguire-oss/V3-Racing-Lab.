/* V5 final-starter quality gate, source independent and result-blind.
 * A scratchings sheet alone does not prove the actual runner list.
 * This module NEVER infers a confirmed starter from a projected emergency,
 * saved "active" label, model result, or a previous day's field.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.RacingLabV5FieldGate=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const SCHEMA='racing-lab-final-starter-attestation/v1';
const iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(s)&&Number.isFinite(Date.parse(s));
const url=s=>typeof s==='string'&&/^https:\/\/[^/\s]+(?:\/[^\s]*)?$/.test(s);
const canonical=s=>String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
function eligible(h){
 const s=String(h.status||'');
 return !/^(?:SCRATCHED|WITHDRAWN|WITHDRAW|EXCLUDED)\b/i.test(s) &&
   (!/^(?:EMERGENCY|RESERVE)\b/i.test(s)||h.emergency_activated===true);
}
function unique(items){return new Set(items).size===items.length;}
function assess(data,attestation,options){
 if(!data||typeof data.date!=='string'||!Array.isArray(data.races)||!Array.isArray(data.runners))
  throw Error('A complete saved racecard is required');
 const byId=new Map(data.runners.map(h=>[h.id,h])),raceIds=new Set(data.races.map(r=>r.id));
 if(byId.size!==data.runners.length||!unique([...raceIds]))throw Error('Duplicate saved runner/race ID');
 const selected=options&&options.selected||[];
 if(!Array.isArray(selected))throw Error('Selection set must be an array');
 // No attestation is a very normal, SAFE state: keep the research visible
 // but allow NO pre-race certified releases/multis.
 const schemaValid=attestation&&attestation.schema===SCHEMA&&attestation.race_date===data.date&&
   Array.isArray(attestation.races)&&unique(attestation.races.map(r=>r.race_id));
 const certs=new Map(schemaValid?attestation.races.map(r=>[r.race_id,r]):[]);
 const results=data.races.map(r=>{
  const saved=data.runners.filter(h=>h.race_id===r.id);
  const active=saved.filter(eligible),excluded=saved.filter(h=>!eligible(h));
  const cert=certs.get(r.id),flags=[];
  let unknown=[],missing=[],unexpected=[],status='NO_FINAL_STARTER_ATTESTATION';
  let matched=false,releaseEligible=false;
  if(!schemaValid)flags.push(attestation?'ATTESTATION_SCHEMA_OR_DATE_INVALID':'NO_FULL_STARTER_SOURCE');
  else if(!cert)flags.push('RACE_NOT_COVERED_BY_ATTESTATION');
  else{
   // These declarations are assertions linked to sources, never the
   // application's opinion about what was actually published.
   const valid=Array.isArray(cert.active_runner_ids)&&cert.active_runner_ids.length>=2&&
    unique(cert.active_runner_ids)&&cert.active_runner_ids.every(id=>typeof id==='string')&&
    url(cert.official_starters_url)&&iso(cert.source_published_at)&&iso(cert.checked_at)&&
    iso(cert.race_start_at)&&cert.source_type==='OFFICIAL_COMPLETE_STARTER_LIST'&&
    cert.human_reviewed===true&&iso(cert.human_reviewed_at)&&
    cert.reviewed_by&&typeof cert.reviewed_by==='string'&&
    Date.parse(cert.source_published_at)<=Date.parse(cert.checked_at)&&
    Date.parse(cert.human_reviewed_at)>=Date.parse(cert.checked_at)&&
    Date.parse(cert.human_reviewed_at)<Date.parse(cert.race_start_at)&&
    Date.parse(cert.checked_at)<Date.parse(cert.race_start_at)&&
    Date.parse(cert.source_published_at)<Date.parse(cert.race_start_at)&&
    Date.parse(cert.checked_at)<Date.parse(cert.race_start_at);
   if(!valid){flags.push('INVALID_SOURCE_TIMING_OR_HUMAN_REVIEW');status='INVALID_FINAL_STARTER_ATTESTATION';}
   else{
    const declared=new Set(cert.active_runner_ids),savedIds=new Set(saved.map(h=>h.id));
    const included=new Set(active.map(h=>h.id));
    unknown=cert.active_runner_ids.filter(id=>!savedIds.has(id));
    missing=active.filter(h=>!declared.has(h.id)).map(h=>h.horse);
    unexpected=excluded.filter(h=>declared.has(h.id)).map(h=>h.horse);
    if(unknown.length)flags.push('OFFICIAL_STARTER_NOT_IN_SAVED_DOSSIERS');
    if(missing.length)flags.push('SAVED_MODEL_RUNNER_NOT_IN_FINAL_FIELD');
    if(unexpected.length)flags.push('SAVED_EXCLUSION_ACTUALLY_STARTING');
    if(!unknown.length&&!missing.length&&!unexpected.length&&declared.size===included.size){
     matched=true;releaseEligible=true;status='DOCUMENTED_FIELD_MATCH_AND_REVIEW';
    }else status='FINAL_FIELD_MISMATCH';
   }
  }
  return {race_id:r.id,meeting:r.meeting,race:r.race,model_included:active.length,
   model_excluded:excluded.length,official_declared_count:cert&&Array.isArray(cert.active_runner_ids)?cert.active_runner_ids.length:null,
   status,release_eligible:releaseEligible,source_url:cert&&url(cert.official_starters_url)?cert.official_starters_url:null,
   flags,missing_from_official:missing,starting_but_saved_excluded:unexpected,starter_without_dossier_ids:unknown,
   reason:matched?'Source-attested starter field matches saved model AND has a pre-jump human-review time.':'Selection withheld from final publication until complete official starters, emergencies and review match.'};
 });
 const byRace=new Map(results.map(r=>[r.race_id,r]));
 const picks=selected.map(s=>{
  const r=byRace.get(s.race_id),h=byId.get(s.id||s.runner_id);
  if(!r||!h||h.race_id!==s.race_id)throw Error('Selection does not identify a runner in the saved card');
  return {race_id:s.race_id,runner_id:h.id,horse:h.horse,
   status:r.release_eligible&&eligible(h)?'FIELD_CHECK_PASSED':'WITHHELD_FIELD_UNCERTAINTY',
   release_eligible:r.release_eligible&&eligible(h),
   field_flags:r.flags.slice()};
 });
 return {schema:'racing-lab-field-gate-report/v1',race_date:data.date,attestation_schema:SCHEMA,
  attestation_present:!!attestation,final_fields_approved:results.length>0&&results.every(r=>r.release_eligible),
  races:results,selected:picks,release_eligible_races:results.filter(r=>r.release_eligible).length,
  withheld_races:results.filter(r=>!r.release_eligible).length,
  warnings:['An official scratching sheet or emergency projection is not a full starter list.',
   'Supplied source URLs and human-review claims must be independently checked; this code cannot establish authenticity or guarantee racing accuracy.',
   'A documented field match is only one pre-race quality check; probabilities remain uncalibrated and shortlist changes require separate approval.']};
}
return Object.freeze({SCHEMA,assess,eligible});
});
