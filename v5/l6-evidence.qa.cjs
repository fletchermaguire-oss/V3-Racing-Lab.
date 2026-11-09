'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Gate=require('./l6-evidence-gate.cjs');
const date='2026-11-14',raceId=date+'_TEST_R01';
const sourceAt='2026-11-10T03:00:00Z';
function card(){return {date,races:[{id:raceId,meeting:'TEST',race:1,distance_m:1200}],
 runners:[{id:raceId+'_01',race_id:raceId,horse:'Rival One',status:'Declared'},
 {id:raceId+'_02',race_id:raceId,horse:'Rival Two',status:'Declared'}]};}
function row(kind='INDIVIDUAL_LAST_600'){
 return {runner_id:raceId+'_01',horse:'Rival One',kind,historical_race_date:'2026-11-07',
 historical_race_id:'2026-11-07_ROSEHILL_R03',source_url:'https://example.org/historical/sectionals',
 publisher:'Official historical results',source_published_at_utc:'2026-11-08T00:20:00Z',
 captured_at_utc:'2026-11-10T02:00:00Z',horse_specific:true,
 measurement_kind:'INDIVIDUAL_HORSE_SECTIONAL',raw_seconds:34.2,
 quality_rating:60.3,historical_opponent_ids:['historic1','historic2'],
 adjustment_method:'REGRESSION_V1',adjustment_method_sha:'a'.repeat(40)};
}
function manifest(rows){return {schema:Gate.SCHEMA,race_date:date,records:rows};}
test('absence of sectionals never invents a horse speed',()=>{
 const r=Gate.check(card(),null,sourceAt);
 assert.equal(r.status,'NO_L6_SOURCE_EVIDENCE');assert.equal(r.can_adjust_probabilities,false);
});
test('horse-specific historical split can be inventoried but does not certify ability',()=>{
 const out=Gate.check(card(),manifest([row()]),sourceAt);
 assert.equal(out.accepted_records,1);assert.equal(out.independent_source_verified,false);
 assert.equal(out.per_race[0].individual_600_coverage,0.5);
 assert.equal(out.per_race[0].complete_for_comparison,false);
 assert.equal(out.can_adjust_probabilities,false);
});
test('race-level last 600 cannot become a horse-specific feature',()=>{
 const s=row();s.horse_specific=false;s.measurement_kind='RACE_LAST_600';
 const out=Gate.check(card(),manifest([s]),sourceAt);
 assert.equal(out.accepted_records,0);
 assert(out.excluded[0].reasons.includes('RACE_LEVEL_SPLIT_NOT_HORSE_SPEED'));
});
test('same-day race result cannot leak into future predictions',()=>{
 const s=row();s.historical_race_date=date;s.historical_race_id=raceId;
 assert(Gate.check(card(),manifest([s]),sourceAt).excluded[0].reasons.includes('NOT_HISTORICAL'));
});
test('future and duplicate source observations cannot enter shadow evidence',()=>{
 const s=row(),later=row();later.captured_at_utc='2026-11-11T00:00:00Z';
 const out=Gate.check(card(),manifest([s,later]),sourceAt);
 assert.equal(out.accepted_records,1);
 assert(out.excluded[0].reasons.includes('DUPLICATE_EVIDENCE'));
 assert(out.excluded[0].reasons.includes('AFTER_CUTOFF_OR_INVALID_SOURCE_TIME'));
});
test('source runner IDs and horse names must match exact current card',()=>{
 const s=row();s.horse='Another Runner';
 assert(Gate.check(card(),manifest([s]),sourceAt).excluded[0].reasons.includes('RUNNER_IDENTITY_MISMATCH'));
});
test('opponent grade measurement demands opponent identities and method proof',()=>{
 const s=row('OPPOSITION_QUALITY');s.historical_opponent_ids=[];
 assert(Gate.check(card(),manifest([s]),sourceAt).excluded[0].reasons.includes('INCOMPLETE_OPPOSITION_MEASUREMENT'));
 const t=row('OPPOSITION_QUALITY');t.adjustment_method_sha='bad';
 assert(Gate.check(card(),manifest([t]),sourceAt).excluded[0].reasons.includes('UNVERIFIED_ADJUSTMENT_METHOD'));
});
test('invalid clock value cannot be used to claim data is pre-race',()=>{
 assert.equal(Gate.stamp('2026-11-40T20:20:20Z'),null);
 assert.throws(()=>Gate.check(card(),manifest([]),'2026-11-10T99:00:00Z'));
});
