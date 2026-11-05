'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('./release-gate.js'),c=require('./cards/2026-11-07/readiness.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const proposal=()=>{
 const id='2026-11-07_FLEMINGTON_R01',starters=[id+'_01',id+'_02',id+'_03'];
 return {schema:G.SCHEMA,date:'2026-11-07',phase:'FINAL_REVIEWED',
  created_at:'2026-11-07T00:00:00Z',explicit_review_approved:true,
  independent_calibration_established:true,
  races:[{id,model_version:'V5L5_SHADOW',field_revision:'field-v3',
   start_at:'2026-11-07T01:40:00Z',fields_published_at:'2026-11-07T00:01:00Z',
   going_published_at:'2026-11-07T00:05:00Z',checked_at:'2026-11-07T00:15:00Z',
   reviewed_at:'2026-11-07T00:20:00Z',
   final_starters_verified:true,emergencies_reconciled:true,
   official_fields_url:'https://example.org/final-fields',going_source_url:'https://example.org/going',
   official_going:'Good 4',model_going:'Good 4',starters,
   probabilities:[{runner_id:starters[0],pct:50},{runner_id:starters[1],pct:30},{runner_id:starters[2],pct:20}],
   probability_method:'SAME_VERSION_V5_FULL_FIELD',
   original_pick:starters[0],final_pick:starters[0],
   pace_reason:'Expected leader and reliable closing pace',pace_source:'https://example.org/pace',
   dangers:starters.slice(1).map(runner_id=>({runner_id,source:'https://example.org/form',reason:'Serious opposition on genuine race form'}))}],
  top10:[{rank:1,race_id:id,runner_id:starters[0]}],qualifiers:[]};
};
const run=x=>G.assess(x,'2026-11-07T00:25:00Z');
test('Saturday has 29 accepted races but no claimed final selections',()=>{
 assert.equal(c.total_races,29);
 assert.deepEqual(c.meetings.map(m=>m.races),[9,10,10]);
 assert.deepEqual(c.meetings.map(m=>m.going),[null,'Soft 6','Soft 5']);
 assert.deepEqual(c.meetings.map(m=>m.scratchings),[3,6,0]);
 assert(c.meetings.every(m=>m.program.length===m.races));
 assert.equal(c.final_starters_verified,false);
});
test('whole-field source verified with zero forced high conviction can pass research release',()=>{
 const r=run(proposal());assert.equal(r.certified_final_release,true);
 assert.equal(r.high_conviction,0);assert.equal(r.races[0].ready,true);
});
test('no arbitrary 46 percent, incomplete field or informal percent source',()=>{
 let x=proposal();x.races[0].probabilities[0].pct=46;assert(run(x).blockers.includes('NONNORMALIZED_OR_MISSING_WHOLE_FIELD_PROBABILITIES'));
 x=proposal();x.races[0].probability_method='MANUAL';assert(run(x).blockers.includes('MANUAL_PERCENTAGES_OR_UNVERSIONED_MODEL'));
 x=proposal();x.races[0].starters.push(x.races[0].id+'_04');assert.equal(run(x).certified_final_release,false);
});
test('unverified going, scratchings, after-race claims cannot pass',()=>{
 let x=proposal();x.races[0].official_going='Soft 5';assert(run(x).blockers.includes('GOING_NOT_MATCHED_TO_MODEL_SCENARIO'));
 x=proposal();x.races[0].final_starters_verified=false;assert(run(x).blockers.includes('NO_VERIFIED_COMPLETE_STARTERS'));
 x=proposal();assert.equal(G.assess(x,'2026-11-07T01:40:00Z').certified_final_release,false);
});
test('unrecorded switch blocked, properly audited switch with review permitted',()=>{
 const x=proposal(),r=x.races[0];r.final_pick=r.starters[1];
 assert(run(x).blockers.includes('UNRECORDED_OR_LATE_OVERRIDE'));
 r.override={from:r.starters[0],to:r.starters[1],source:'https://example.org/late-mail',
  reason:'Verified major improvement in runner position, track and recovery',timestamp:'2026-11-07T00:21:00Z',field_revision:r.field_revision};
 r.dangers=[{runner_id:r.starters[0],source:'https://example.org/form',reason:'Original lead horse remains credible'},
 {runner_id:r.starters[2],source:'https://example.org/form',reason:'Third horse can still win at the trip'}];
 assert.equal(run(x).certified_final_release,true);
 r.override.timestamp='2026-11-07T01:41:00Z';
 assert(run(x).blockers.includes('UNRECORDED_OR_LATE_OVERRIDE'));
});
test('top 10 contenders can include a danger in same race but the one pick remains unique',()=>{
 const x=proposal(),r=x.races[0];
 x.top10.push({rank:2,race_id:r.id,runner_id:r.starters[1]});
 assert.equal(run(x).certified_final_release,true);
 x.qualifiers=[{race_id:r.id,runner_id:r.starters[1],
  reason:'Invalid non-leading qualifier from alternative contender',risk:'Still may lose to favourite'}];
 assert(run(x).blockers.includes('QUALIFIER_NOT_SUPPORTED'));
});
test('unverified calibration cannot be certified; research status may remain readable',()=>{
 const x=proposal();x.independent_calibration_established=false;
 assert(run(x).blockers.includes('UNCALIBRATED_ESTIMATES_NOT_CERTIFIED'));
 x.phase='RESEARCH_ONLY';assert(run(x).blockers.includes('RESEARCH_ONLY_NOT_FINAL'));
});
