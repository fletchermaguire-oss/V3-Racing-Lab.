'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Packet=require('./v5-1-prospective-packet.cjs');
const Rose=require('../cards/2026-11-07/rosehill-research.json');
const Ascot=require('../cards/2026-11-07/ascot-research.json');
const Official=require('../cards/2026-11-07/official-final.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const cards=()=>[{meeting:'ROSEHILL',research:Rose,going:'Good 4'},
 {meeting:'ASCOT',research:Ascot,going:'Good 4'}];
const make=()=>Packet.run({cards:cards(),official:Official,
 mode:'HISTORICAL_REPLAY',createdAtUtc:'2026-11-07T00:45:00Z'});
test('full 20-race baseline/candidate forecast packets are non-certifying historical replays',()=>{
 const packet=make();
 assert.equal(packet.mode,'HISTORICAL_REPLAY');
 assert.equal(packet.status,'HISTORICAL_REPLAY_ONLY');
 assert.equal(packet.race_count,20);
 assert.equal(packet.fields.reduce((s,x)=>s+x.runners.length,0),197);
 assert.equal(packet.meetings.reduce((s,x)=>s+x.active_runners,0),197);
 assert.equal(packet.shortlist.tier_positions.top5.length,5);
 assert.equal(packet.shortlist.tier_positions.top10.length,10);
 assert.equal(packet.shortlist.tier_positions.top15.length,10);
 assert.equal(packet.shortlist.unfilled.top15,5);
 assert.equal(packet.pre_release_source_gates_met,false);
 assert(packet.blockers.includes('HISTORICAL_REPLAY_NOT_A_PROSPECTIVE_LOCK'));
 assert(packet.blockers.includes('INCOMPLETE_MEETING_COVERAGE'));
 assert(packet.blockers.includes('INDEPENDENT_GITHUB_COMMIT_PROOF_NOT_VERIFIED'));
 assert.equal(packet.publication_approved,false);
 assert.equal(packet.independently_frozen,false);
 const validation=Packet.verifyIntegrity(packet);
 assert.equal(validation.integrity_valid,true);
 assert.equal(validation.independent_pre_race_freeze_verified,false);
});
test('full-field chances sum to 100 and model/identity paired rows are stored for every race',()=>{
 const packet=make();
 for(const race of packet.fields){
  assert.equal(new Set(race.runners.map(x=>x.runner_id)).size,race.runners.length);
  assert.equal(race.runners.filter(x=>x.model_rank===1).length,1);
  assert(race.runners.some(x=>x.runner_id===race.model_leader_id));
  assert(Math.abs(race.runners.reduce((s,x)=>s+x.candidate_win_pct_exact,0)-100)<0.00001);
  assert(Math.abs(race.runners.reduce((s,x)=>s+x.baseline_win_pct_exact,0)-100)<0.00001);
  assert.equal(race.actual_result_included,false);
 }
});
test('packet and field digests detect post-hoc chance and rank changes',()=>{
 const packet=make();
 const tampered=clone(packet);
 tampered.fields[0].runners[0].candidate_win_pct_exact+=1;
 assert.throws(()=>Packet.verifyIntegrity(tampered),/packet mutated/);
 const another=clone(packet);
 another.blockers.pop();
 assert.throws(()=>Packet.verifyIntegrity(another),/packet mutated/);
 assert.equal(Packet.verifyIntegrity(packet).integrity_valid,true);
});
test('reordering independent card inputs preserves deterministic snapshot hash',()=>{
 const original=make();
 const flipped=Packet.run({cards:cards().reverse(),official:Official,
  mode:'HISTORICAL_REPLAY',createdAtUtc:'2026-11-07T00:45:00Z'});
 assert.deepEqual(original.fields,flipped.fields);
 assert.deepEqual(original.meetings,flipped.meetings);
 assert.deepEqual(original.shortlist,flipped.shortlist);
 assert.equal(original.packet_sha256,flipped.packet_sha256);
});
test('missing verified race times cannot be presented as a pre-race draft',()=>{
 assert.throws(()=>Packet.run({cards:cards(),official:Official,
  mode:'PRE_RACE_DRAFT',createdAtUtc:new Date().toISOString()}),/missing pre-race start source/);
});
test('stored results and odds cannot be injected as forecast source data',()=>{
 const copied=clone(Rose);
 copied.runners[0].actual_winner=true;
 assert.throws(()=>Packet.run({cards:[{meeting:'ROSEHILL',research:copied}],official:Official,
  mode:'HISTORICAL_REPLAY',createdAtUtc:'2026-11-07T00:45:00Z'}),/outcome field present/);
 const permitted=clone(Rose);
 permitted.runners[0].bookmaker_price=1.02;
 const allowed=Packet.run({cards:[{meeting:'ROSEHILL',research:permitted}],official:Official,
  mode:'HISTORICAL_REPLAY',createdAtUtc:'2026-11-07T00:45:00Z'});
 const original=Packet.run({cards:[{meeting:'ROSEHILL',research:Rose}],official:Official,
  mode:'HISTORICAL_REPLAY',createdAtUtc:'2026-11-07T00:45:00Z'});
 assert.deepEqual(allowed.fields,original.fields);
});
test('official fields, dates and externally checked timestamps must agree',()=>{
 const wrongDate=clone(Official);wrongDate.date='2026-11-08';
 assert.throws(()=>Packet.run({cards:cards(),official:wrongDate,
  mode:'HISTORICAL_REPLAY',createdAtUtc:'2026-11-07T00:45:00Z'}),/research date mismatch/);
 const late=clone(Official);late.checked_at='2026-11-07T00:46:00Z';
 assert.throws(()=>Packet.run({cards:cards(),official:late,
  mode:'HISTORICAL_REPLAY',createdAtUtc:'2026-11-07T00:45:00Z'}),/official declarations newer/);
});
