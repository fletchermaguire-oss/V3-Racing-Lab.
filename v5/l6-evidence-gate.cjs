'use strict';
/* L6 result-blind source adapter. It validates historical individual horse
 * sectionals/opposition evidence, NEVER produces speed ratings or changes
 * the existing L5 winner distribution. All source claims require independent QA.
 */
const {createHash}=require('node:crypto');
const Model=require('./model.js');
const SCHEMA='racing-lab-l6-historical-evidence/v1';
const iso=/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?Z$/;
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&
 Number.isFinite(Date.parse(x+'T00:00:00Z'))&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
function stamp(s){
 if(typeof s!=='string')return null;
 const m=iso.exec(s);if(!m||+m[2]>23||+m[3]>59||+m[4]>59)return null;
 const t=Date.parse(s);if(!Number.isFinite(t)||new Date(t).toISOString().slice(0,19)!==m[1]+'T'+m[2]+':'+m[3]+':'+m[4])return null;
 return t;
}
const canon=s=>String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const url=s=>typeof s==='string'&&/^https:\/\/[^/\s]+\/\S+/.test(s);
const sha=s=>typeof s==='string'&&/^[a-f0-9]{40}$/.test(s);
function check(card,manifest,asOfUtc){
 if(!card||!date(card.date)||!Array.isArray(card.races)||!Array.isArray(card.runners))throw Error('Full dated card is required');
 const asOf=stamp(asOfUtc);
 if(asOf===null)throw Error('UTC evidence cutoff required');
 const active=card.runners.filter(h=>Model.isEligible(h));
 const raceIds=new Set(card.races.map(r=>r.id));
 const runnerById=new Map(active.map(h=>[h.id,h]));
 if(runnerById.size!==active.length)throw Error('Duplicate active runner IDs');
 if(!manifest)return {schema:SCHEMA,status:'NO_L6_SOURCE_EVIDENCE',
  active_runner_count:active.length,accepted_records:0,excluded_records:0,
  per_race:card.races.map(r=>({race_id:r.id,individual_600_coverage:0,opposition_coverage:0})),
  independent_source_verified:false,can_adjust_probabilities:false};
 if(manifest.schema!==SCHEMA||!Array.isArray(manifest.records))
  throw Error('Unrecognised L6 evidence manifest');
 if(manifest.race_date!==card.date)throw Error('L6 evidence date does not match racecard');
 const reasons=[],accepted=[],seen=new Set();
 for(const [idx,row] of manifest.records.entries()){
  const issues=[],key=String(row?.runner_id||'')+'|'+String(row?.kind||'')+'|'+String(row?.historical_race_id||'');
  if(seen.has(key))issues.push('DUPLICATE_EVIDENCE');seen.add(key);
  const runner=runnerById.get(row?.runner_id);
  if(!runner||!raceIds.has(runner.race_id)||canon(row.horse)!==canon(runner.horse))issues.push('RUNNER_IDENTITY_MISMATCH');
  if(!date(row?.historical_race_date)||row.historical_race_date>=card.date)issues.push('NOT_HISTORICAL');
  if(typeof row?.historical_race_id!=='string'||!row.historical_race_id.startsWith(row.historical_race_date+'_'))
   issues.push('HISTORICAL_RACE_ID_MISMATCH');
  const published=stamp(row?.source_published_at_utc),captured=stamp(row?.captured_at_utc);
  if(!url(row?.source_url)||!String(row?.publisher||'').trim())issues.push('MISSING_SOURCE');
  if(published===null||captured===null||published>captured||captured>asOf)
   issues.push('AFTER_CUTOFF_OR_INVALID_SOURCE_TIME');
  if(row?.kind==='INDIVIDUAL_LAST_600'){
   if(row.horse_specific!==true||row.measurement_kind!=='INDIVIDUAL_HORSE_SECTIONAL')
    issues.push('RACE_LEVEL_SPLIT_NOT_HORSE_SPEED');
   if(!(Number.isFinite(row.raw_seconds)&&row.raw_seconds>15&&row.raw_seconds<90))
    issues.push('INVALID_SPLIT_TIME');
  }else if(row?.kind==='OPPOSITION_QUALITY'){
   if(!Number.isFinite(row.quality_rating)||row.quality_rating<0||
      !Array.isArray(row.historical_opponent_ids)||row.historical_opponent_ids.length<2)
    issues.push('INCOMPLETE_OPPOSITION_MEASUREMENT');
  }else issues.push('UNSUPPORTED_EVIDENCE_KIND');
  if(!sha(row?.adjustment_method_sha)||typeof row?.adjustment_method!=='string'||!row.adjustment_method.trim())
   issues.push('UNVERIFIED_ADJUSTMENT_METHOD');
  if(issues.length)reasons.push({index:idx,runner_id:row?.runner_id||null,kind:row?.kind||null,reasons:issues});
  else accepted.push(row);
 }
 const perRace=card.races.map(r=>{
  const ids=new Set(active.filter(h=>h.race_id===r.id).map(h=>h.id));
  const count=kind=>new Set(accepted.filter(e=>ids.has(e.runner_id)&&e.kind===kind).map(e=>e.runner_id)).size;
  const a=count('INDIVIDUAL_LAST_600'),b=count('OPPOSITION_QUALITY'),n=ids.size;
  return {race_id:r.id,active_starters:n,individual_600_coverage:n?a/n:0,opposition_coverage:n?b/n:0,
   complete_for_comparison:n>=2&&a===n&&b===n};
 });
 const sha256=createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
 return {schema:SCHEMA,status:'EVIDENCE_RESEARCH_ONLY_NOT_CERTIFIED',manifest_sha256:sha256,
  accepted_records:accepted.length,excluded_records:reasons.length,excluded:reasons,
  active_runner_count:active.length,per_race:perRace,
  independent_source_verified:false,prejump_frozen:false,can_adjust_probabilities:false,
  caution:'URLs, method hashes and claimed timestamps are syntactic checks; independent source, actual starters, adjustment quality and pre-jump commit must be verified before any L6 ranking.'};
}
module.exports={SCHEMA,check,stamp,canon};
