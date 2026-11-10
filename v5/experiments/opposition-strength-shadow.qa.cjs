'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('./opposition-strength-shadow.cjs');
const race='2026-11-14_TEST_R01',cutoff='2026-11-10T03:00:00Z',start='2026-11-14T03:30:00Z';
const form='1/11/2026 TESTTRACK 1200m (G), BM72: 1/5, PDF margin 1L.\n'+
 '7/11/2026 TESTTRACK 1200m (G), BM72: 2/5, PDF margin 0.5L.';
function card(){
 return {date:'2026-11-14',saved_at:'2026-11-10',races:[{id:race,meeting:'TEST',race:1,distance_m:1200}],
  runners:['Runner A','Runner B','Runner C'].map((horse,i)=>({id:'T'+i,race_id:race,horse,form,status:'Declared'}))};
}
function baseline(){
 return {records:[{id:'T0',horse:'Runner A',race_id:race,rank:1,p_exact:40,grade_quality:1.4},
  {id:'T1',horse:'Runner B',race_id:race,rank:2,p_exact:35,grade_quality:1.2},
  {id:'T2',horse:'Runner C',race_id:race,rank:3,p_exact:25,grade_quality:.9}]};
}
function past(i,difficulty,runnerIndex){
 const day=i?'2026-11-07':'2026-11-01';
 const t=i?'2026-11-07T03:00:00Z':'2026-11-01T03:00:00Z';
 const asof=i?'2026-11-06T14:00:00Z':'2026-10-31T14:00:00Z';
 return {historical_race_id:day+'_TESTTRACK_R0'+(runnerIndex+1),historical_race_date:day,
  historical_race_start_utc:t,venue:'TESTTRACK',finish:i?2:1,field_size:5,
  rating_scale:'TEST_SINGLE_RATING_SCALE_2026',
  source_url:'https://example.org/racing/historical/'+day,
  source_sha256:'a'.repeat(64),source_published_at_utc:'2026-11-08T00:00:00Z',
  source_captured_at_utc:'2026-11-09T02:00:00Z',
  opponents:[0,1,2].map(j=>({id:'peer'+i+'_'+j,rating:difficulty-3+j*3,rating_asof_utc:asof}))};
}
function manifest(){
 return {schema:S.SCHEMA,target_date:'2026-11-14',method:S.METHOD,
  rating_scale:'TEST_SINGLE_RATING_SCALE_2026',race_starts_utc:{[race]:start},
  runner_evidence:[65,93,66].map((q,i)=>({runner_id:'T'+i,horse:'Runner '+['A','B','C'][i],
   historical_races:[past(0,q,i),past(1,q,i)]}))};
}
test('No opponent evidence: unchanged L5 and explicit abstention',()=>{
 const r=S.evaluate(card(),baseline(),null,cutoff);
 assert.equal(r.status,'NO_COMPARABLE_SOURCE_DATA');
 assert.equal(r.results[0].status,'L5_UNCHANGED_MISSING_OPPONENT_DATA');
});
test('Exact linked opponents become research-only, with no claim of verification',()=>{
 const r=S.evaluate(card(),baseline(),manifest(),cutoff);
 assert.equal(r.status,'SHADOW_FORECAST_REQUIRES_SOURCE_ATTESTATION');
 assert.equal(r.comparable_races,1);assert.equal(r.results[0].field_size,3);
 assert.equal(r.promotion_approved,false);
 assert.equal(r.source_authenticity_independently_verified,false);
 assert.equal(r.results[0].forecast.length,3);
 assert.ok(Math.abs(r.results[0].forecast.reduce((sum,x)=>sum+x.shadow_pct,0)-100)<1e-9);
});
test('One missing or duplicate runner prevents any adjustment of this race',()=>{
 let x=manifest();x.runner_evidence.pop();
 let result=S.evaluate(card(),baseline(),x,cutoff);
 assert.equal(result.comparable_races,0);
 assert(result.results[0].reason_codes.includes('MISSING_OR_DUPLICATE_RUNNER_EVIDENCE'));
 x=manifest();x.runner_evidence.push(x.runner_evidence[0]);
 result=S.evaluate(card(),baseline(),x,cutoff);
 assert.equal(result.comparable_races,0);
});
test('No future or same-day rating snapshots can backfill historical opponents',()=>{
 const x=manifest();
 x.runner_evidence[0].historical_races[1].opponents[0].rating_asof_utc='2026-11-08T03:00:00Z';
 const r=S.evaluate(card(),baseline(),x,cutoff);
 assert.equal(r.comparable_races,0);
 assert(r.results[0].reason_codes.includes('INVALID_HISTORICAL_PEER'));
});
test('Historical source must match dated source form finish and venue',()=>{
 const x=manifest();x.runner_evidence[0].historical_races[0].finish=4;
 const r=S.evaluate(card(),baseline(),x,cutoff);
 assert.equal(r.comparable_races,0);
 assert(r.results[0].reason_codes.includes('HISTORICAL_FIELD_NOT_IN_SAVED_FORM'));
});
test('Ratings from incomparable scales produce no challenger',()=>{
 const x=manifest();x.runner_evidence[1].historical_races[0].rating_scale='OTHER_JURISDICTION_SCALE';
 const r=S.evaluate(card(),baseline(),x,cutoff);
 assert.equal(r.comparable_races,0);
 assert(r.results[0].reason_codes.includes('UNCOMPARABLE_RATING_SCALE'));
});
test('Late capture or race jump time prevents a forecast',()=>{
 const x=manifest();x.runner_evidence[0].historical_races[0].source_captured_at_utc='2026-11-12T00:00:00Z';
 let r=S.evaluate(card(),baseline(),x,cutoff);assert.equal(r.comparable_races,0);
 assert(r.results[0].reason_codes.includes('NO_TIMESTAMPED_SOURCE_PROOF'));
 x.runner_evidence[0].historical_races[0].source_captured_at_utc='2026-11-09T02:00:00Z';
 r=S.evaluate(card(),baseline(),x,'2026-11-15T00:00:00Z');
 assert(r.results[0].reason_codes.includes('BAD_OR_ALREADY_STARTED_RACE'));
});
test('Original L5 reproduces exactly at zero adjustment strength',()=>{
 const r=S.evaluate(card(),baseline(),manifest(),cutoff);
 const f=r.results[0].forecast,match=f.map(x=>({id:x.id,difficulty:x.opponent_difficulty}));
 const out=S.applyToField(baseline().records,match,{strength:0});
 for(const x of out)assert.ok(Math.abs(x.shadow_pct-x.baseline_pct)<1e-8);
});
test('Perfectly class-correlated opponent ratings create zero residual signal',()=>{
 const rows=baseline().records,classes=rows.map(x=>x.grade_quality);
 const ev=classes.map((c,i)=>({id:rows[i].id,difficulty:50+12*c}));
 const out=S.applyToField(rows,ev);
 assert.ok(out.every(x=>Math.abs(x.shadow_pct-x.baseline_pct)<1e-7));
});
test('Bounded independent residual never creates impossible probabilities',()=>{
 const r=S.evaluate(card(),baseline(),manifest(),cutoff),f=r.results[0].forecast;
 assert.ok(f.every(x=>x.shadow_pct>0&&x.shadow_pct<100&&Math.abs(x.delta_logit)<=S.STRENGTH));
 assert.ok(f.some(x=>Math.abs(x.shadow_pct-x.baseline_pct)>0.01));
 assert.throws(()=>S.applyToField(baseline().records,[{difficulty:1},{difficulty:2}],{strength:.5}));
});

test('Contradictory shared historical fields prevent the full-field shadow',()=>{
 const x=manifest(),shared=x.runner_evidence[0].historical_races[0].historical_race_id;
 x.runner_evidence[1].historical_races[0].historical_race_id=shared;
 // Both contestants claim 1st in same past race, without dead-heat proof.
 assert(S.crossFieldConflicts(x.runner_evidence).has('T0'));
 const r=S.evaluate(card(),baseline(),x,cutoff);
 assert.equal(r.comparable_races,0);
 assert(r.results[0].reason_codes.includes('CONTRADICTORY_SHARED_HISTORICAL_RACE'));
});
test('Same historical field can contain distinct finishing positions and consistent peer ratings',()=>{
 const x=manifest(),first=x.runner_evidence[0].historical_races[0],other=x.runner_evidence[1].historical_races[0];
 other.historical_race_id=first.historical_race_id;
 other.finish=2;
 other.opponents=first.opponents.map(p=>({...p}));
 // This is a legitimate shared race only for consistent field sizes, venues and ratings.
 assert.equal(S.crossFieldConflicts(x.runner_evidence).has('T0'),false);
});
