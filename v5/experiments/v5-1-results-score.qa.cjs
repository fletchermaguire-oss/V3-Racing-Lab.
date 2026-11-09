'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Packet=require('./v5-1-prospective-packet.cjs');
const Score=require('./v5-1-results-score.cjs');
const Rose=require('../cards/2026-11-07/rosehill-research.json');
const Ascot=require('../cards/2026-11-07/ascot-research.json');
const Official=require('../cards/2026-11-07/official-final.json');
const Historical=require('./results-2026-11-07-complete.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const canon=s=>String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const packet=()=>Packet.run({cards:[{meeting:'ROSEHILL',research:Rose},{meeting:'ASCOT',research:Ascot}],
 official:Official,mode:'HISTORICAL_REPLAY',createdAtUtc:'2026-11-07T00:45:00Z'});
// TEST FIXTURE ONLY: this synthetic verification timestamp and source location do
// not attest to the original publication date of the public 7 Nov winners.
const results=p=>({
 schema:'v5-1-official-outcomes/v1',date:p.date,
 races:Historical.meetings.flatMap(m=>m.races.map(r=>{
  const field=p.fields.find(x=>x.meeting===m.meeting&&x.race===r.race);
  assert(field);
  const winner=field.runners.find(x=>canon(x.horse)===canon(r.winner));
  assert(winner);
  return {
   race_id:field.race_id,winner_runner_id:winner.runner_id,
   final_starter_ids:field.runners.map(x=>x.runner_id),
   official_source_url:'https://example.org/mock-official-result',
   verified_at_utc:'2026-11-09T00:00:00Z'
  };
 }))
});
test('paired result scorer checks all 20 races, matching winner IDs and exact model field coverage',()=>{
 const a=Score.evaluate(packet(),results(packet()));
 assert.equal(a.status,'RETROSPECTIVE_OR_UNVERIFIED_FORECAST_SCORE_ONLY');
 assert.equal(a.certified_forward_win_rate,false);
 assert.equal(a.independent_pre_race_lock_proven,false);
 assert.equal(a.field_matched_races,20);
 assert.equal(a.excluded_races.length,0);
 assert.equal(a.paired_summary.baseline.top1_wins,6);
 assert.equal(a.paired_summary.candidate.top1_wins,6);
 assert(a.paired_summary.candidate.mean_multiclass_brier<a.paired_summary.baseline.mean_multiclass_brier);
 assert(a.paired_summary.candidate.mean_log_loss<a.paired_summary.baseline.mean_log_loss);
});
test('stored candidate Top 15 remains only ten qualified picks, never backfilled with winners',()=>{
 const p=packet(),a=Score.evaluate(p,results(p));
 assert.deepEqual(a.tiers.map(x=>x.saved),[5,10,10]);
 assert(a.tiers.every(x=>x.method==='SAVED_CANDIDATE_RELIABILITY_SCREEN_NOT_THE_REVIEWED_HUMAN_BOARD'));
 assert.equal(a.tiers[2].wins,6);
 assert.equal(a.paired_summary.candidate.races,20);
});
test('race-time scratches or missing final starter exclude that race from paired scores',()=>{
 const p=packet(),out=results(p),first=out.races[0];
 first.final_starter_ids.pop();
 const score=Score.evaluate(p,out);
 assert.equal(score.field_matched_races,19);
 assert(score.excluded_races.some(x=>x.race_id===first.race_id&&x.reason==='FINAL_STARTERS_CHANGED'));
 assert.equal(score.paired_summary.candidate.races,19);
});
test('source integrity and invalid winner or duplicate outcome fail closed',()=>{
 const p=packet(),out=results(p);
 const changed=clone(p);changed.fields[0].runners[0].baseline_win_pct_exact+=3;
 assert.throws(()=>Score.evaluate(changed,out),/packet mutated/);
 const fake=clone(out);fake.races[0].winner_runner_id='UNKNOWN_RUNNER';
 assert.throws(()=>Score.evaluate(p,fake),/winner missing/);
 const dup=clone(out);dup.races.push(dup.races[0]);
 assert.throws(()=>Score.evaluate(p,dup),/duplicate result race/);
});
test('missing one result is explicitly reported instead of retroactively changing selections',()=>{
 const p=packet(),out=results(p);
 const miss=out.races.pop();
 const a=Score.evaluate(p,out);
 assert.equal(a.field_matched_races,19);
 assert(a.excluded_races.some(x=>x.race_id===miss.race_id&&x.reason==='MISSING_FINAL_RESULT'));
 assert.equal(a.tiers[0].saved,5);
});
