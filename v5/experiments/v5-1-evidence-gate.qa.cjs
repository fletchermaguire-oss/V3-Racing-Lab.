'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const M=require('../model.js');
const Q=require('./v5-1-evidence-gate.cjs');
const Rose=require('../cards/2026-11-07/rosehill-research.json');
const Ascot=require('../cards/2026-11-07/ascot-research.json');
const Official=require('../cards/2026-11-07/official-final.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const get=(x,race)=>x.screen.find(v=>v.race===race);
test('7 Nov reconciliation uses the saved official sheets, without changing original research',()=>{
 const original=JSON.stringify(Rose);
 const rose=Q.reconcileSnapshot(Rose,Official,'ROSEHILL');
 const asc=Q.reconcileSnapshot(Ascot,Official,'ASCOT');
 assert.equal(rose.provenance.activeCount,105);
 assert.equal(asc.provenance.activeCount,92);
 assert.equal(rose.provenance.removed.length,28);
 assert.equal(asc.provenance.removed.length,3);
 assert.equal(JSON.stringify(Rose),original);
 assert.equal(rose.data.publication.approved,false);
 assert.equal(rose.provenance.publication_approved,false);
 assert.equal(rose.provenance.starter_certification,'OFFICIAL_SNAPSHOT_ONLY_NOT_JUMP_TIME_CERTIFIED');
});
test('candidate does not rewrite a single V5 runner score or model chance',()=>{
 for(const [meeting,research] of [['ROSEHILL',Rose],['ASCOT',Ascot]]){
  const rec=Q.reconcileSnapshot(research,Official,meeting);
  const model=M.calculate(rec.data,{default:'Good 4'});
  const comparison=Q.evaluate(research,Official,meeting);
  assert.deepEqual(comparison.model.records.map(x=>[x.id,x.p_exact,x.rank]),
   model.records.map(x=>[x.id,x.p_exact,x.rank]));
  assert(comparison.model.races.every(x=>x.sum===100&&x.status==='MODELLED_PROVISIONAL'));
  assert.equal(comparison.baseline_model_unchanged,true);
  assert.equal(comparison.calibration_established,false);
  assert.equal(comparison.publication_approved,false);
 }
});
test('Cashout requires evidence review; winning first-ranked runners are not automatically penalised',()=>{
 const r=Q.evaluate(Rose,Official,'ROSEHILL'),a=Q.evaluate(Ascot,Official,'ASCOT');
 const cash=get(r,5);
 assert.equal(cash.horse,'CASHOUT');
 assert.equal(cash.model_pct,26.72);
 assert.equal(cash.screen_status,'EVIDENCE_REVIEW_REQUIRED');
 assert(cash.quality_issues.includes('THIN_PARSEABLE_RECENT_FORM'));
 assert(cash.quality_issues.includes('RECENT_FORM_DOMINATES_UNFAVOURABLE_CLASS_EVIDENCE'));
 for(const [x,race,horse] of [[r,3,'SAVVY SPY (NZ)'],[r,7,'LAZZURA'],
  [a,6,'BEATTY'],[a,9,'KING OF LIGHT']]){
  assert.equal(get(x,race).horse,horse);
  assert.equal(get(x,race).screen_status,'MODEL_LEADER_ELIGIBLE_FOR_REVIEW');
 }
 // A wide range is disclosed but not a hard rejection when the same horse leads all scenarios.
 const lazzura=get(r,7),beatty=get(a,6);
 assert.equal(lazzura.model_pct,49.85);
 assert.equal(lazzura.scenario_stability.leader_count,4);
 assert(lazzura.sensitivity_warnings.includes('WIDE_GOING_CLASS_PROBABILITY_SPREAD'));
 assert(beatty.sensitivity_warnings.includes('WIDE_GOING_CLASS_PROBABILITY_SPREAD'));
});
test('review gates cannot retrospectively promote the winning but lower-ranked outsiders',()=>{
 const r=Q.evaluate(Rose,Official,'ROSEHILL'),a=Q.evaluate(Ascot,Official,'ASCOT');
 assert.equal(get(r,10).horse,'LET’S GO AGAIN');
 assert.equal(get(a,7).horse,'SO SI GOD');
 assert.equal(get(r,10).model_pct,22.1);
 assert.equal(get(a,7).model_pct,29.75);
});
test('missing or conflicting official race information fails closed',()=>{
 const mismatch=clone(Official);
 mismatch.date='2026-11-08';
 assert.throws(()=>Q.reconcileSnapshot(Rose,mismatch,'ROSEHILL'),/dates differ/);
 const changed=clone(Official);
 changed.meetings.find(x=>x.meeting==='ROSEHILL').races.find(x=>x.race===5).active_runners[0].horse='WRONG HORSE';
 assert.throws(()=>Q.reconcileSnapshot(Rose,changed,'ROSEHILL'),/horse identity changed/);
 const removed=clone(Official);
 removed.meetings.find(x=>x.meeting==='ROSEHILL').races.pop();
 assert.throws(()=>Q.reconcileSnapshot(Rose,removed,'ROSEHILL'),/missing official race/);
});
test('post-race results and bookmaker odds cannot influence the overlay',()=>{
 const baseline=Q.evaluate(Ascot,Official,'ASCOT');
 const injected=clone(Ascot);
 injected.postrace_result='all winners differ';
 injected.runners.forEach(x=>{x.bookmaker_price=1.01;x.actual_winner=true;});
 const after=Q.evaluate(injected,Official,'ASCOT');
 assert.deepEqual(after.screen,baseline.screen);
 assert.deepEqual(after.model.records.map(x=>x.p_exact),baseline.model.records.map(x=>x.p_exact));
});

test('scenario diagnostics use four named variations without changing the baseline rating',()=>{
 const r=Q.evaluate(Rose,Official,'ROSEHILL'),a=Q.evaluate(Ascot,Official,'ASCOT');
 for(const x of r.screen.concat(a.screen)){
  assert.equal(x.scenario_stability.scenarios.length,4);
  assert(x.scenario_stability.leader_count>=0&&x.scenario_stability.leader_count<=4);
  assert(x.scenario_stability.probability_floor<=x.model_pct);
  assert(x.scenario_stability.probability_ceiling>=x.model_pct);
  assert.equal(x.scenario_stability.scenarios[0].pct,x.model_pct);
 }
 const lazzura=get(r,7);
 assert.equal(lazzura.scenario_stability.probability_floor,36.17);
 assert.equal(lazzura.scenario_stability.probability_ceiling,49.85);
});

test('pace warning uses field-normalized historical position, not absolute runner numbers',()=>{
 const r=Q.evaluate(Rose,Official,'ROSEHILL'),a=Q.evaluate(Ascot,Official,'ASCOT');
 const cash=get(r,5),so=get(a,7);
 assert.equal(cash.pace_context,'MULTIPLE_POTENTIAL_EARLY_LEADERS');
 assert.equal(cash.pace_diagnostics.potential_early_leaders,4);
 assert(cash.sensitivity_warnings.includes('POSSIBLE_PACE_CONTEST_FROM_HISTORICAL_SETTLING'));
 assert.equal(so.pace_context,'MULTIPLE_POTENTIAL_EARLY_LEADERS');
 assert.equal(so.pace_diagnostics.potential_early_leaders,5);
 assert(so.sensitivity_warnings.includes('POSSIBLE_PACE_CONTEST_FROM_HISTORICAL_SETTLING'));
 assert.equal(so.screen_status,'MODEL_LEADER_ELIGIBLE_FOR_REVIEW');
 assert.equal(cash.pace_verified,false);
});
test('Flemington straight-course history is not inferred from course-score sign',()=>{
 const field=[{settle_fraction:0.1,settle_800:1},{settle_fraction:0.5,settle_800:4}];
 const mkRow=course=>({
  id:'synthetic-id',horse:'SYNTHETIC RUNNER',race_id:'synthetic-race',
  meeting:'FLEMINGTON',rank:1,p:35,
  input_issues:[],completeness:1,form_audit:{accepted:5},days_since_last:14,
  features:{recency:0.6,class:0.2,course}
 });
 const race={gap:10,chaos:65,distance_m:1200};
 for(const course of [-0.8,0,0.8]){
  const x=Q.riskScreen(mkRow(course),race,field);
  assert(x.sensitivity_warnings.includes('STRAIGHT_CONFIGURATION_EVIDENCE_REQUIRES_EXTERNAL_VERIFICATION'));
  assert.equal(x.quality_issues.includes('STRAIGHT_COURSE_TRANSFER_NEEDS_REVIEW'),false);
  assert.equal(x.pace_verified,false);
 }
});
