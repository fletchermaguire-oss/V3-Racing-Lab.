/* V5 prospective record: strict forward-only separation from retrospective form results.
 * True independent freeze verification must occur outside this local parser (GitHub
 * commit timestamp audit and official result matching). Empty ledger = no win record.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RacingLabForward=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const SCHEMA='racing-lab-prospective-record/v1';
const idPattern=/^[0-9]{4}-[0-9]{2}-[0-9]{2}_(RANDWICK|FLEMINGTON|ASCOT)_R[0-9]{2}_[0-9]{2}$/;
function utc(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s))return null;const d=Date.parse(s);return Number.isFinite(d)?d:null;}
function check(d){
 if(!d||d.schema!==SCHEMA||!/^2026-10-31$/.test(d.meeting_date)||d.publication_approved!==false||
  !Array.isArray(d.locked_selections)||!Array.isArray(d.official_results)||
  !['AWAITING_VERIFIED_PRE_RACE_LOCK','PRE_RACE_LOCK_CLAIMED','VERIFIED_FORWARD_TRACKING'].includes(d.status))
  throw Error('Unrecognized prospective record; refuse to classify results');
 if(!d.independent_freeze_verified&&d.official_results.length)throw Error('No results allowed without independent pre-race freeze verification');
 if(!d.locked_selections.length){if(d.status!=='AWAITING_VERIFIED_PRE_RACE_LOCK'||d.independent_freeze_verified)throw Error('Inconsistent empty forward record');return d;}
 if(!d.freeze_proof||!/^https:\/\/github\.com\/[^/]+\/[^/]+\/commit\/[a-f0-9]{40}$/.test(d.freeze_proof.url||'')||
   !/^[a-f0-9]{40}$/.test(d.freeze_proof.sha||'')||!d.freeze_proof.url.endsWith('/'+d.freeze_proof.sha)||
   !utc(d.freeze_proof.committed_at_utc))throw Error('Missing GitHub commit proof for prospective lock');
 const seen=new Set(),races=new Set();
 d.locked_selections.forEach(x=>{
  if(!idPattern.test(x.runner_id)||!x.runner_id.startsWith(x.race_id+'_')||
   !x.race_id.startsWith(d.meeting_date+'_')||!Number.isSafeInteger(x.rank)||x.rank<1||x.rank>15||
   !utc(x.race_at_utc)||!utc(x.locked_at_utc)||utc(x.locked_at_utc)>=utc(x.race_at_utc)||
   utc(d.freeze_proof.committed_at_utc)>utc(x.locked_at_utc)||
   utc(d.freeze_proof.committed_at_utc)>=utc(x.race_at_utc)||
   seen.has(x.runner_id)||races.has(x.race_id)||
   x.active_at_lock!==true||!/^https:\/\//.test(x.race_start_source||''))
   throw Error('Invalid, duplicated, after-start or scratched locked selection');
  seen.add(x.runner_id);races.add(x.race_id);
 });
 const outcomes=new Set();
 d.official_results.forEach(x=>{
  if(!races.has(x.race_id)||outcomes.has(x.race_id)||x.status!=='OFFICIALLY_VERIFIED'||
   !/^https:\/\//.test(x.official_url||'')||!utc(x.verified_at_utc)||
   typeof x.winner_id!=='string'||!x.winner_id.startsWith(x.race_id+'_'))
   throw Error('Unmatched, duplicated or unverified official finish');
  outcomes.add(x.race_id);
 });
 return d;
}
function summarize(data){
 const d=check(data),eligible=d.independent_freeze_verified===true&&d.status==='VERIFIED_FORWARD_TRACKING';
 const outcomes=new Map(d.official_results.map(x=>[x.race_id,x]));
 const ranked=d.locked_selections.slice().sort((a,b)=>a.rank-b.rank);
 const groups=[5,10,15].map(k=>{
  const locked=eligible?ranked.filter(x=>x.rank<=k):[];
  const done=locked.filter(x=>outcomes.has(x.race_id));
  const wins=done.filter(x=>outcomes.get(x.race_id).winner_id===x.runner_id).length;
  return {tier:k,frozen:locked.length,completed:done.length,wins:wins,
   win_rate:done.length?+(wins*100/done.length).toFixed(2):null,
   pending:locked.length-done.length};
 });
 return {status:eligible?'INDEPENDENTLY_VERIFIED_FORWARD_ONLY':'NOT_YET_ELIGIBLE_FOR_FORWARD_STRIKE_RATE',
  freeze_verified:eligible,groups:groups,locked:eligible?ranked.length:0,completed:eligible?groups[2].completed:0,
  warning:eligible?'Only official runner-matched results and pre-race locked selections counted.':'No independently verified prospective lock; retrospective 17/49 cannot be used as forward V5 performance.'};
}
return {check:check,summarize:summarize};
});
