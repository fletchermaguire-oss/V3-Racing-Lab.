'use strict';
/* Generic future-card integrity, market-blind and result-blind. No official-field claims. */
const goingRe=/^(Good [34]|Soft [567]|Heavy (?:8|9|10))$/;
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&
 Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(Date.parse(s+'T00:00:00Z')).toISOString().slice(0,10)===s;
function check({card,going}={}){
 if(!card||!validDate(card.date)||!Array.isArray(card.races)||!Array.isArray(card.runners))
  throw Error('A dated card and complete runner/race arrays are required');
 const issues=[],warnings=[],raceIds=new Set(),runnerIds=new Set(),names=new Set(),counts=new Map(),meetings=new Set();
 if(!card.races.length||!card.runners.length)issues.push('EMPTY_CARD');
 if(!card.expected_inventory||card.expected_inventory.races!==card.races.length||
    card.expected_inventory.runners!==card.runners.length)issues.push('EXPECTED_INVENTORY_MISMATCH');
 for(const r of card.races){
  if(!r||!r.id||!r.id.startsWith(card.date+'_')||raceIds.has(r.id)){issues.push('INVALID_DUPLICATE_RACE');continue;}
  raceIds.add(r.id);counts.set(r.id,0);meetings.add(r.meeting);
  if(!Number.isFinite(r.distance_m)||r.distance_m<400||r.distance_m>5000)issues.push('INVALID_RACE_DISTANCE');
 }
 for(const h of card.runners){
  if(!h||!raceIds.has(h.race_id)||!h.id||runnerIds.has(h.id)){issues.push('ORPHAN_DUPLICATE_RUNNER');continue;}
  runnerIds.add(h.id);counts.set(h.race_id,(counts.get(h.race_id)||0)+1);
  const k=h.race_id+'|'+String(h.horse||'').normalize('NFKD').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!h.horse||names.has(k))issues.push('DUPLICATE_HORSE');names.add(k);
  if(['winner','won','finish_position','result_status','starting_price'].some(k=>Object.hasOwn(h,k)))issues.push('POSTRACE_DATA_IN_SOURCE');
  if(/,\s*(?:OPEN|QLTY)\s*:/i.test(String(h.form||''))&&!h.historical_sector_verified)warnings.push('UNTIERED_OPEN_GRADE_CONTEXT');
 }
 for(const [id,n] of counts)if(n<2)issues.push('INCOMPLETE_RACE:'+id);
 const g=going&&typeof going==='object'&&!Array.isArray(going)?going:{};
 for(const m of meetings)if(!goingRe.test(String(g[m]||'')))issues.push('NO_VERIFIED_GOING:'+m);
 for(const m of Object.keys(g))if(!meetings.has(m))issues.push('GOING_FOR_MISSING_MEETING:'+m);
 if(card.publication?.approved!==false)issues.push('UNAPPROVED_RESEARCH_STATE_REQUIRED');
 if(card.saved_at&&String(card.saved_at).slice(0,10)>card.date)issues.push('POSTDATE_SOURCE_TIMESTAMP');
 return {date:card.date,ok:issues.length===0,issues:[...new Set(issues)],warnings:[...new Set(warnings)],
  race_count:card.races.length,listed_runners:card.runners.length,publication_approved:false,calibration_established:false};
}
module.exports={check};
