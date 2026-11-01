/* Compile *user-approved* forward research to a pre-race publication proposal.
 * This does not publish, independently certify, bet, or attach GitHub proof.
 * Real forward history needs a later on-chain GitHub pre-jump commit and
 * independent verifier plus official post-jump result matching.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./field-gate.js'):root.RacingLabV5FieldGate);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RacingLabV5LockProposal=api;
})(typeof window!=='undefined'?window:globalThis,function(FieldGate){
'use strict';
const iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s)&&Number.isFinite(Date.parse(s));
const canonical=s=>String(s).normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
function prepare(data,checkpoint,attestation,approval,nowUtc){
 if(!FieldGate||typeof FieldGate.assess!=='function')throw Error('Final starter checker is unavailable');
 if(!data||!Array.isArray(data.runners)||!checkpoint||checkpoint.date!==data.date||
    !Array.isArray(checkpoint.entries)||!checkpoint.entries.length)
  throw Error('A date-matched, independently ordered research shortlist is required');
 if(!iso(nowUtc))throw Error('A verifiable current UTC timestamp is required');
 if(!approval||approval.explicit_user_approval!==true||!iso(approval.approved_at_utc)||
    Date.parse(approval.approved_at_utc)>Date.parse(nowUtc)||
    !Array.isArray(approval.ranks)||!approval.ranks.length||approval.ranks.length>15||
    new Set(approval.ranks).size!==approval.ranks.length)
  throw Error('Explicit timestamped pre-race approval with unique selection ranks required');
 const choose=checkpoint.entries.filter(x=>approval.ranks.includes(x.rank)).sort((a,b)=>a.rank-b.rank);
 if(choose.length!==approval.ranks.length||choose.some(x=>!x.horse||!Number.isInteger(x.rank)||x.rank<1||x.rank>15))
  throw Error('Approval refers to unrecognized original research ranks');
 const selections=choose.map(x=>{
  const race=data.races.find(r=>r.meeting===x.meeting&&r.race===x.race);
  if(!race)throw Error('Selected race missing from current card '+x.horse);
  const matches=data.runners.filter(h=>h.race_id===race.id&&canonical(h.horse)===canonical(x.horse));
  if(matches.length!==1)throw Error('Selected horse is not uniquely in current racecard: '+x.horse);
  return {id:matches[0].id,race_id:race.id,horse:x.horse,rank:x.rank,model_pct:x.model_pct};
 });
 if(new Set(selections.map(x=>x.race_id)).size!==selections.length)
  throw Error('Different approved horses in one race cannot both be counted as winning selections');
 const audit=FieldGate.assess(data,attestation,{selected:selections});
 const notReady=audit.selected.filter(x=>!x.release_eligible);
 if(notReady.length)throw Error('Cannot lock selection without full independently reviewed final starters: '+
  notReady.map(x=>x.horse+' ['+x.field_flags.join(',')+']').join('; '));
 const checks=new Map(attestation.races.map(x=>[x.race_id,x]));
 const out=selections.map(x=>{
  const cert=checks.get(x.race_id);
  const raceStart=Date.parse(cert.race_start_at);
  if(raceStart<=Date.parse(nowUtc)||raceStart<=Date.parse(approval.approved_at_utc))
   throw Error('Refusing post-jump lock for '+x.horse);
  if(!(Number.isFinite(x.model_pct)&&x.model_pct>0&&x.model_pct<=100))
   throw Error('Missing original model estimate for '+x.horse);
  return {rank:x.rank,race_id:x.race_id,runner_id:x.id,horse:x.horse,
   model_pct:x.model_pct,active_at_lock:true,
   locked_at_utc:nowUtc,race_at_utc:new Date(raceStart).toISOString(),
   race_start_source:cert.official_starters_url,
   final_field_check_at:cert.checked_at,final_field_reviewer:cert.reviewed_by};
 });
 return {schema:'racing-lab-forward-lock-proposal/v1',date:data.date,prepared_at_utc:nowUtc,
  status:'UNPUBLISHED_NOT_IN_FORWARD_RECORD',selected_count:out.length,
  independently_verified:false,github_commit_proof:null,
  original_ranks_preserved:true,selections:out,
  notice:'This is a lock PROPOSAL, not an independent prospective lock. Save immutably in a GitHub commit before each published race start, verify commit time and starter source independently, then record official outcomes; never backfill old races.'};
}
return Object.freeze({prepare});
});
