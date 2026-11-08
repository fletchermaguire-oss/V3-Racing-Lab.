'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Q=require('./v5-1-course-prep.cjs');
const E=require('./v5-1-pre-race-evidence-20261107.json');
const Picks=require('../cards/2026-11-07/race-selections.json');
const Official=require('../cards/2026-11-07/official-final.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const audit=(e=E,p=Picks,o=Official)=>Q.evaluateOne(e,p,o);
test('Tempted pre-race information flags first straight start, recent Everest target and rival strengths',()=>{
 const r=audit();
 assert.equal(r.scored_runners,1);
 const d=r.decisions[0];
 assert.equal(d.horse,'TEMPTED');
 assert.equal(d.analyst_working_win_pct,52.9);
 assert.equal(d.days_since_major_target,21);
 assert.equal(d.model_probability_available,false);
 assert.equal(d.model_probability_changed,false);
 assert.equal(d.after_race_medical_data_used,false);
 assert(d.cautions.includes('FIRST_RACE_DOWN_STRAIGHT_CONFIGURATION'));
 assert(d.cautions.includes('RECENT_MAJOR_TARGET_FITNESS_REVIEW'));
 assert(d.cautions.includes('PROVEN_SAME_CONFIGURATION_OPPONENT'));
 assert(d.cautions.includes('IMPROVING_GRADED_RIVAL_OMITTED_FROM_MAIN_DANGERS'));
 assert(d.supporting_pre_race_evidence.includes('PRE_RACE_TRAINER_REPORTED_HORSE_WELL'));
 assert.equal(r.publication_approved,false);
});
test('no post-race medical finding or hindsight result can enter source evidence',()=>{
 const e=clone(E);
 e.entries[0].post_race_evidence_used=true;
 assert.throws(()=>audit(e),/post-race data not admissible/);
});
test('pre-race timestamps must precede the jump and date-only sources must precede race day',()=>{
 const late=clone(E);
 late.sources.find(x=>x.key==='archived_picks').observed_at='2026-11-07T06:00:00Z';
 assert.throws(()=>audit(late),/source too late/);
 const report=clone(E);
 report.sources.find(x=>x.key==='racing_preview').published_date='2026-11-08';
 assert.throws(()=>audit(report),/not provably pre-race/);
 const pick=clone(Picks);
 pick.created_at='2026-11-07T06:00:00Z';
 assert.throws(()=>audit(E,pick),/authored after jump/);
});
test('identity or source mismatch fails closed; scratchings prevent phantom selections',()=>{
 const corrupted=clone(Official);
 corrupted.meetings.find(x=>x.meeting==='FLEMINGTON').races.find(x=>x.race===6).active_runners
  .find(x=>x.number==='6').horse='NOT SAME RUNNER';
 assert.throws(()=>audit(E,Picks,corrupted),/not an official active starter/);
 const mismatched=clone(E);
 mismatched.entries[0].runner.saddlecloth='2';
 assert.throws(()=>audit(mismatched),/selection identity changed/);
});
test('generic gate is not keyed to the name of any specific horse',()=>{
 const e=clone(E),p=clone(Picks),o=clone(Official);
 e.entries[0].runner.horse='SAMPLE RUNNER';
 p.races.find(x=>x.race_id===e.entries[0].race_id).first_pick.horse='SAMPLE RUNNER';
 o.meetings.find(x=>x.meeting==='FLEMINGTON').races.find(x=>x.race===6).active_runners
  .find(x=>x.number==='6').horse='SAMPLE RUNNER';
 const original=audit().decisions[0],synthetic=audit(e,p,o).decisions[0];
 assert.deepEqual(synthetic.cautions,original.cautions);
 assert.deepEqual(synthetic.supporting_pre_race_evidence,original.supporting_pre_race_evidence);
 assert.equal(synthetic.analyst_working_win_pct,original.analyst_working_win_pct);
});
test('confirmed prior straight runs remove only the course-first-start warning',()=>{
 const e=clone(E);
 e.entries[0].documented_configuration_starts=2;
 e.entries[0].documented_configuration_experience='CONFIRMED_PRIOR_RACE_START';
 const d=audit(e).decisions[0];
 assert.equal(d.cautions.includes('FIRST_RACE_DOWN_STRAIGHT_CONFIGURATION'),false);
 assert(d.cautions.includes('RECENT_MAJOR_TARGET_FITNESS_REVIEW'));
 assert(d.cautions.includes('IMPROVING_GRADED_RIVAL_OMITTED_FROM_MAIN_DANGERS'));
});
