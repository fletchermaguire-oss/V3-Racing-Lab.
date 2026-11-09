'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('./v5-1-sectional-evidence.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const research={
 date:'2026-11-07',
 runners:[
  {id:'2026-11-07_ROSEHILL_R01_01',horse:'DOLPHIN STAR',
   form:'31/10/2026 Doomben 1200m (G), BM78: 2/11, PDF margin 0.2L\n17/10/2026 Doomben 1200m (G), BM70: 1/10, PDF margin 0.7L'},
  {id:'2026-11-07_ROSEHILL_R01_02',horse:'MOUNTAIN RAIN',
   form:'31/10/2026 Gold Coast 1200m (G), BM78: 3/11, PDF margin 0.2L'},
  {id:'2026-11-07_ROSEHILL_R01_03',horse:'UNKNOWN RUNNER',form:''}
 ]
};
const bundle={
 schema:'v5-1-normalized-thoroughbred-sectionals/v1',
 source:{provider:'RACING_QUEENSLAND_THOROUGHBRED',
  url:'https://www.racingqueensland.com.au/RacingFile.ashx?path=TEST_FIXTURE',
  observed_at_utc:'2026-11-05T04:00:00Z'},
 rows:[
  {race_date:'2026-10-31',venue:'Doomben',race_no:4,horse:'DOLPHIN STAR',
   race_distance_m:1200,last_600_s:34.3,position_800:7,finish_pos:2,extra_distance_m:15},
  {race_date:'2026-10-31',venue:'Doomben',race_no:4,horse:'RIVER WALK',
   race_distance_m:1200,last_600_s:34.8,position_800:4,finish_pos:1,extra_distance_m:3},
  {race_date:'2026-10-31',venue:'Doomben',race_no:4,horse:'TRAVELLER',
   race_distance_m:1200,last_600_s:35.0,position_800:5,finish_pos:5,extra_distance_m:7}
 ]
};
const run=(r=research,b=[bundle],as='2026-11-06T00:00:00Z')=>S.inspect({research:r,bundles:b,asOfUtc:as});
test('3 prior participants give date/venue/distance-matched relative sectional evidence',()=>{
 const a=run();
 assert.equal(a.model_probabilities_changed,false);
 assert.equal(a.data_verified_independently,false);
 assert.equal(a.past_race_groups,1);
 assert.equal(a.observations,3);
 assert.equal(a.matched_current_runners,1);
 assert.equal(a.candidate_evidence[0].horse,'DOLPHIN STAR');
 const recent=a.candidate_evidence[0].matched_history[0];
 assert.equal(recent.late_rank,1);
 assert.equal(recent.relative_last600_seconds,-0.5);
 assert.equal(recent.prior_800_position,7);
 assert.equal(recent.extra_ground_m,15);
 assert.equal(a.candidate_evidence[0].formula_weight_applied,0);
});
test('real historical start is required; matching horse name by itself is never enough',()=>{
 const r=clone(research);
 r.runners[0].form='31/10/2026 Gold Coast 1200m (G), BM78: 2/11, PDF margin 0.2L';
 const x=run(r);
 assert.equal(x.matched_current_runners,0);
 assert(x.unmatched.some(z=>z.reason==='NOT_AN_EXACT_DATED_FORM_START'));
});
test('sectional sources first observed after the forecast cannot enter',()=>{
 const b=clone(bundle);b.source.observed_at_utc='2026-11-08T04:00:00Z';
 const x=run(research,[b]);
 assert.equal(x.matched_current_runners,0);
 assert.equal(x.observations,0);
 assert(x.rejected.some(z=>z.reason==='SOURCE_NOT_OBSERVED_BEFORE_FORECAST'));
});
test('same-day or future performances are not included as historical form',()=>{
 const b=clone(bundle);for(const row of b.rows)row.race_date='2026-11-07';
 const x=run(research,[b]);
 assert.equal(x.matched_current_runners,0);
 assert.equal(x.observations,0);
 assert.equal(x.rejected.length,3);
});
test('duplicate, impossible and inappropriate-sport source data fails closed',()=>{
 const double=clone(bundle);double.rows.push(clone(double.rows[0]));
 assert.throws(()=>run(research,[double]),/duplicate or conflicting/);
 const impossible=clone(bundle);impossible.rows[0].last_600_s=-10;
 assert.throws(()=>run(research,[impossible]),/invalid sectionals field/);
 const wrong=clone(bundle);wrong.source.provider='RACING_QUEENSLAND_GREYHOUND';
 assert.throws(()=>run(research,[wrong]),/unsupported sectional provenance/);
 const fake=clone(bundle);fake.source.url='https://www.malicious.example/sectionals.csv';
 assert.throws(()=>run(research,[fake]),/unsupported sectional provenance/);
});
test('insufficient historical peers prevent false high-confidence late-speed rankings',()=>{
 const b=clone(bundle);b.rows=[b.rows[0],b.rows[1]];
 const x=run(research,[b]);
 assert.equal(x.candidate_evidence[0].matched_history[0].late_rank,null);
 assert.equal(x.candidate_evidence[0].matched_history[0].relative_last600_seconds,null);
 assert.equal(x.candidate_evidence[0].matched_history[0].peer_count,2);
});

test('nonexistent calendar dates cannot be rolled into subsequent months',()=>{
 const b=clone(bundle);b.rows[0].race_date='2026-02-31';
 assert.throws(()=>run(research,[b]),/invalid sectionals field/);
 const r=clone(research);r.date='2026-02-31';
 assert.throws(()=>run(r),/valid model research required/);
});
