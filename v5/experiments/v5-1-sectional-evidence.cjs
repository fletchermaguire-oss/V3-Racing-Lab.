'use strict';
/*
 * V5.1 sectional evidence staging. Does not scrape or assume a provider's
 * raw CSV header layout. Input MUST be explicitly normalised, with an actual
 * source URL and capture time. No model probability is changed.
 */
const assert=require('node:assert/strict');
const norm=s=>String(s||'').normalize('NFKD').toUpperCase()
 .replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const day=s=>{
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;
 const t=Date.parse(s+'T00:00:00Z');
 return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===s;
};
const time=s=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(s)
 &&Number.isFinite(Date.parse(s));
const iso=(d,m,y)=>String(y)+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');
function datedStarts(h){
 const lines=String(h.form||'').split(/[\n|]/),found=[];
 for(const line of lines){
  const m=line.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(.+?)\s+(\d+)m\s+\(([GSH])\)/i);
  if(!m)continue;
  const at=iso(m[1],m[2],m[3]);
  if(!day(at))continue;
  found.push({date:at,venue:norm(m[4]),distance_m:+m[5]});
 }
 return found;
}
function inspect({research,bundles,asOfUtc}){
 assert(research&&day(research.date)&&Array.isArray(research.runners),'valid model research required');
 assert(time(asOfUtc),'explicit forecast data cutoff required');
 assert(Array.isArray(bundles),'source bundles array required');
 const seen=new Set(),indexed=new Map(),rejected=[],sources=[];
 for(const bundle of bundles){
  assert(bundle?.schema==='v5-1-normalized-thoroughbred-sectionals/v1','not an explicitly normalized thoroughbred source');
  const src=bundle.source||{};
  assert(src.provider==='RACING_QUEENSLAND_THOROUGHBRED'&&
   /^https:\/\/www\.racingqueensland\.com\.au(?:\/|$)/i.test(String(src.url||'')),
   'unsupported sectional provenance');
  assert(time(src.observed_at_utc),'source capture timestamp missing');
  assert(Array.isArray(bundle.rows),'missing sectionals');
  const before=Date.parse(src.observed_at_utc)<=Date.parse(asOfUtc);
  sources.push({provider:src.provider,url:src.url,observed_at_utc:src.observed_at_utc,
   captured_before_forecast:before,rows:bundle.rows.length});
  if(!before){rejected.push({source_url:src.url,reason:'SOURCE_NOT_OBSERVED_BEFORE_FORECAST',count:bundle.rows.length});continue}
  for(const r of bundle.rows){
   assert(r&&day(r.race_date)&&typeof r.venue==='string'&&r.venue.trim().length>0&&
    Number.isInteger(r.race_no)&&r.race_no>=1&&r.race_no<=20&&
    typeof r.horse==='string'&&r.horse.trim().length>0&&
    Number.isInteger(r.race_distance_m)&&r.race_distance_m>=600&&r.race_distance_m<=4500&&
    Number.isFinite(r.last_600_s)&&r.last_600_s>25&&r.last_600_s<65,
    'invalid sectionals field: missing race, horse, venue, distance or last600');
   if(r.position_800!==null&&r.position_800!==undefined)assert(Number.isInteger(r.position_800)&&r.position_800>=1&&r.position_800<=30,'invalid 800m position');
   if(r.finish_pos!==null&&r.finish_pos!==undefined)assert(Number.isInteger(r.finish_pos)&&r.finish_pos>=1&&r.finish_pos<=30,'invalid finish position');
   if(r.extra_distance_m!==null&&r.extra_distance_m!==undefined)assert(Number.isFinite(r.extra_distance_m)&&r.extra_distance_m>=0&&r.extra_distance_m<=200,'invalid GPS extra metres');
   const key=[r.race_date,norm(r.venue),r.race_no,norm(r.horse)].join('|');
   assert(!seen.has(key),'duplicate or conflicting prior runner sectional '+key);
   seen.add(key);
   if(r.race_date>=research.date){rejected.push({key,reason:'POST_TARGET_RACE_NOT_VALID_HISTORICAL_FORM'});continue}
   const race=[r.race_date,norm(r.venue),r.race_no].join('|');
   if(!indexed.has(race))indexed.set(race,[]);
   indexed.get(race).push({...r,venue_normalized:norm(r.venue),horse_normalized:norm(r.horse),
    source_url:src.url,source_observed_at_utc:src.observed_at_utc});
  }
 }
 const summaries=[];
 for(const [race,participants] of indexed){
  const sorted=participants.slice().sort((a,b)=>a.last_600_s-b.last_600_s);
  const median=sorted.length%2?sorted[Math.floor(sorted.length/2)].last_600_s:
   (sorted[sorted.length/2-1].last_600_s+sorted[sorted.length/2].last_600_s)/2;
  const enough=sorted.length>=3;
  for(const p of participants){
   summaries.push({...p,relative_last600_s:enough?Number((p.last_600_s-median).toFixed(3)):null,
    late_sectional_rank:enough?1+sorted.filter(x=>x.last_600_s<p.last_600_s).length:null,
    comparable_runners:participants.length,
    comparison_ready:enough,original_race_key:race});
  }
 }
 const candidate=[],unmatched=[];
 const byHorse=new Map();
 for(const observation of summaries){
  if(!byHorse.has(observation.horse_normalized))byHorse.set(observation.horse_normalized,[]);
  byHorse.get(observation.horse_normalized).push(observation);
 }
 for(const h of research.runners){
  const horseForm=datedStarts(h),sameName=byHorse.get(norm(h.horse))||[];
  const matched=[];
  for(const x of sameName){
   const found=horseForm.some(s=>s.date===x.race_date&&s.venue===x.venue_normalized&&s.distance_m===x.race_distance_m);
   if(!found){unmatched.push({runner_id:h.id,horse:h.horse,past_race_key:x.original_race_key,reason:'NOT_AN_EXACT_DATED_FORM_START'});continue}
   matched.push({
    race_date:x.race_date,race_key:x.original_race_key,venue:x.venue,source_url:x.source_url,
    last600_seconds:x.last_600_s,relative_last600_seconds:x.relative_last600_s,
    late_rank:x.late_sectional_rank,peer_count:x.comparable_runners,
    prior_800_position:x.position_800??null,prior_finish_pos:x.finish_pos??null,
    extra_ground_m:x.extra_distance_m??null
   });
  }
  if(matched.length)candidate.push({runner_id:h.id,horse:h.horse,
   dated_starts_eligible:horseForm.length,matched_history:matched.sort((a,b)=>b.race_date.localeCompare(a.race_date)).slice(0,5),
   formula_weight_applied:0,score_modified:false});
 }
 return {
  schema:'v5-1-sectional-evidence-audit/v1',
  date:research.date,as_of_utc:asOfUtc,model_probabilities_changed:false,
  data_verified_independently:false,
  source_bundles:sources,
  past_race_groups:indexed.size,observations:summaries.length,
  matched_current_runners:candidate.length,
  candidate_evidence:candidate,
  unmatched:unmatched,
  rejected,
  caution:'Manually normalized source records; source provenance and original file contents must be independently verified. Relative sectionals are descriptive, not forecast coefficients.'
 };
}
module.exports={datedStarts,inspect};
