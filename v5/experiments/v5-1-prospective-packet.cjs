'use strict';
/*
 * V5.1 experimental paired forecast packet. Research artifact only.
 *
 * A draft is not a certified pre-race lock. Its SOURCE and race-time evidence
 * must be proven by external GitHub commit metadata before any result scoring.
 * Does not import racing results, odds or final outcomes.
 */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const Baseline=require('../model.js');
const Candidate=require('./model-v5-1.cjs');
const Select=require('./v5-1-reliability-shortlist.cjs');
const Reconcile=require('./v5-1-evidence-gate.cjs');
const iso=x=>typeof x==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(x)&&Number.isFinite(Date.parse(x));
const sha=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const amount=x=>Number(x.toFixed(8));
const canonical=s=>String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const ignored=new Set(['actual_winner','actual_result','post_race','winner','finish_position','posterior_winner','results']);
function rejectLeakedFields(value,path='input',level=0){
 if(value===null||typeof value!=='object'||level>12)return;
 for(const [key,v] of Object.entries(value)){
  assert(!ignored.has(key.toLowerCase()),'outcome field present in pre-race source: '+path+'.'+key);
  if(typeof v==='object')rejectLeakedFields(v,path+'.'+key,level+1);
 }
}
function run({cards,official,raceStartSources=[],mode='HISTORICAL_REPLAY',createdAtUtc}){
 assert(['HISTORICAL_REPLAY','PRE_RACE_DRAFT'].includes(mode),'unknown mode');
 assert(Array.isArray(cards)&&cards.length,'no meeting research supplied');
 assert(official&&/^\d{4}-\d\d-\d\d$/.test(official.date),'missing official date');
 assert(typeof createdAtUtc==='string'&&iso(createdAtUtc),'creator timestamp required (ISO UTC or offset)');
 assert(iso(official.checked_at),'official evidence must carry a timezone-aware timestamp');
 assert(Date.parse(official.checked_at)<=Date.parse(createdAtUtc),'official declarations newer than claimed snapshot');
 // The timestamp is a model claim, NOT cryptographic evidence of when GitHub
 // received the commit. That proof is reviewed separately for every race.
 assert(Array.isArray(raceStartSources),'raceStartSources array required');
 const schedule=new Map();
 for(const row of raceStartSources){
  assert(row&&typeof row.race_id==='string'&&!schedule.has(row.race_id),'duplicate race start');
  assert(iso(row.race_at_utc)&&/^https:\/\//.test(row.source_url||'')&&iso(row.observed_at_utc),'race start requires source and observed time');
  assert(Date.parse(row.observed_at_utc)<=Date.parse(createdAtUtc),'post-dated start-time evidence');
  schedule.set(row.race_id,row);
 }
 if(mode==='PRE_RACE_DRAFT'){
  assert(Date.parse(createdAtUtc)<=Date.now()+60000,'cannot predate from the future');
  assert(Date.parse(createdAtUtc)>=Date.now()-300000,'cannot author stale pre-race timestamp');
 }
 const seen=new Set(),cardResults=[],overview=[];
 for(const card of cards){
  assert(card&&typeof card.meeting==='string'&&!seen.has(card.meeting),'duplicate/invalid meeting');
  seen.add(card.meeting);
  assert(card.research&&card.research.date===official.date,'research date mismatch');
  rejectLeakedFields(card.research,'research');
  const rec=Reconcile.reconcileSnapshot(card.research,official,card.meeting);
  const going=card.going||'Good 4';
  const base=Baseline.calculate(rec.data,{default:going});
  const experimental=Candidate.calculate(rec.data,{default:going});
  assert.equal(base.races.length,experimental.races.length);
  for(const r of experimental.races){
   const fieldBase=base.records.filter(x=>x.race_id===r.id).sort((a,b)=>a.id.localeCompare(b.id));
   const fieldCandidate=experimental.records.filter(x=>x.race_id===r.id).sort((a,b)=>a.id.localeCompare(b.id));
   assert.deepEqual(fieldCandidate.map(x=>x.id),fieldBase.map(x=>x.id),'models disagree on actual field '+r.id);
   assert(fieldCandidate.length===r.field&&r.field>=2,'invalid modeled field '+r.id);
   for(const rows of [fieldBase,fieldCandidate])assert(Math.abs(rows.reduce((s,x)=>s+x.p_exact,0)-100)<1e-8,'whole-field probability sum is not 100');
   const normalized=fieldCandidate.map((x,i)=>({
    runner_id:x.id,horse:x.horse,model_rank:x.rank,
    candidate_win_pct_exact:amount(x.p_exact),
    baseline_win_pct_exact:amount(fieldBase[i].p_exact)
   }));
   const start=schedule.get(r.id),leader=experimental.records.find(x=>x.race_id===r.id&&x.rank===1);
   assert(leader&&start?.race_id!==undefined||leader&&mode==='HISTORICAL_REPLAY','missing pre-race start source for '+r.id);
   if(mode==='PRE_RACE_DRAFT')assert(Date.parse(start.race_at_utc)>Date.parse(createdAtUtc),'race already started: '+r.id);
   cardResults.push({
    race_id:r.id,meeting:r.meeting,race:r.race,model_going:r.going,
    model_leader_id:leader.id,leader_name:leader.horse,
    field_revision_sha256:sha(normalized.map(x=>[x.runner_id,x.horse])),
    paired_probabilities_sha256:sha(normalized),runners:normalized,
    complete_field:fieldCandidate.length===r.field,
    race_at_utc:start?.race_at_utc||null,race_time_evidence_url:start?.source_url||null,
    schedule_observed_at_utc:start?.observed_at_utc||null,
    actual_result_included:false
   });
  }
  overview.push({meeting:card.meeting,
   research_date:card.research.date,
   research_saved_at:card.research.saved_at||null,
   research_sha256:sha(card.research),
   going:going,
   official_checked_at:rec.provenance.official_checked_at,
   active_runners:rec.provenance.activeCount,
   removed:rec.provenance.removed.length});
 }
 const shortlist=Select.build(cards,official);
 assert.equal(shortlist.total_races,cardResults.length);
 const eligible=mode==='PRE_RACE_DRAFT'&&shortlist.full_official_meeting_coverage&&
  overview.every(x=>iso(x.research_saved_at||''))&&
  cardResults.every(x=>!!x.race_at_utc);
 const blockers=[];
 if(!shortlist.full_official_meeting_coverage)blockers.push('INCOMPLETE_MEETING_COVERAGE');
 if(!overview.every(x=>iso(x.research_saved_at||'')))blockers.push('RESEARCH_SOURCE_HAS_NO_VERIFIABLE_TIMESTAMP');
 if(!cardResults.every(x=>!!x.race_at_utc))blockers.push('MISSING_VERIFIED_RACE_START_SOURCE');
 if(mode!=='PRE_RACE_DRAFT')blockers.push('HISTORICAL_REPLAY_NOT_A_PROSPECTIVE_LOCK');
 blockers.push('INDEPENDENT_GITHUB_COMMIT_PROOF_NOT_VERIFIED');
 const manifest={
  schema:'v5-1-paired-forecast-draft/v1',date:official.date,
  mode,created_at_utc:createdAtUtc,
  baseline_model_version:Baseline.VERSION,candidate_model_version:Candidate.VERSION,
  official_source_sha256:sha(official),
  official_checked_at:official.checked_at,
  meetings:overview,
  race_count:cardResults.length,
  fields:cardResults,
  shortlist:{
   status:shortlist.status,
   tier_positions:Object.fromEntries([5,10,15].map(k=>['top'+k,shortlist.tiers['top'+k].selected.map(x=>({race_id:x.race_id,runner_id:x.horse_id,horse:x.horse,model_pct:x.model_pct,quality_issues:x.quality_issues}))])),
   unfilled:Object.fromEntries([5,10,15].map(k=>['top'+k,shortlist.tiers['top'+k].unfilled])),
   flagged_for_review:shortlist.flagged_for_review.map(x=>({race_id:x.race_id,runner_id:x.horse_id,quality_issues:x.quality_issues}))
  },
  status:'UNVERIFIED_PROSPECTIVE_DRAFT',
  publication_approved:false,independently_frozen:false,
  eligible_for_release:false,
  pre_release_source_gates_met:eligible,
  blockers,
  note:'This file can support later independent GitHub commit verification but does not prove pre-race timing or validate model probabilities. A past-date replay stays historical.'
 };
 const packet_sha256=sha(manifest);
 return {...manifest,packet_sha256};
}
module.exports={run};
