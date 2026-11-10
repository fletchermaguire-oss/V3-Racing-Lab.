'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const E=require('./leader-reliability-shadow.cjs');
function race(){
 return {id:'2026-11-14_TEST_R01',rows:[
  {id:'a',horse:'A',p_exact:27,grade_quality:1.5,completeness:.9,form_audit:{accepted:5},input_issues:[]},
  {id:'b',horse:'B',p_exact:23,grade_quality:1.5,completeness:.9,form_audit:{accepted:5},input_issues:[]}
 ]};
}
test('No postrace outcome is needed to screen a leader',()=>{
 const r=race(),x=E.selectionFromRace(r);
 assert.equal(x.leader_id,'a');
 assert.equal(x.screens.separation_5pp_and_20pct,false);
 assert.equal(x.screens.strict_winfirst,false);
 assert.equal(x.quality_ranking_score,27);
});
test('Missing graded form, shallow sample and big field reduce quality rank without moving probabilities',()=>{
 const r=race();
 r.rows[0].grade_quality=0;r.rows[0].completeness=.5;r.rows[0].form_audit.accepted=1;
 r.rows[0].input_issues=['INVALID_FORM'];
 for(let i=2;i<15;i++)r.rows.push({id:'z'+i,horse:'Z'+i,p_exact:1,grade_quality:1,completeness:1,form_audit:{accepted:5},input_issues:[]});
 const x=E.selectionFromRace(r);
 assert.equal(x.p,27);
 assert.equal(x.quality_ranking_score,11);
 assert.equal(x.screens.strict_winfirst,false);
});
test('Known full-field datasets: consistent counts and distinct date boards',()=>{
 const out=E.evaluate();
 assert.equal(out.dates.length,4);assert.equal(out.totals.baseline.picks,91);
 assert.equal(out.totals.baseline.wins,27);
 assert.deepEqual(out.dates.map(d=>d.races),[30,19,22,20]);
 assert.equal(out.totals.leaderboard.top5.baseline.picks,20);
 assert.equal(out.totals.leaderboard.top10.quality.picks,40);
 assert.equal(out.totals.leaderboard.top15.quality.picks,60);
});
test('Quality screen is completely separate from prediction and reports uncertainty',()=>{
 const out=E.evaluate();
 assert.equal(out.original_l5_unchanged,true);
 assert.equal(out.probabilities_calibrated,false);
 assert.ok(out.totals.screens.strict_winfirst.picks<=91);
 assert.ok(out.dates.every(d=>d.cases.length===d.races));
 assert.ok(out.totals.baseline.wilson95[0]<out.totals.baseline.hit_rate);
});

test('Quality board changes are counted as winners added AND removed',()=>{
 const x=E.evaluate();
 for(const [tier,s] of Object.entries(x.totals.leaderboard)){
  assert.equal(s.quality.wins-s.baseline.wins,s.swaps.reduce((n,a)=>n+a.net_wins,0),tier);
  assert.equal(s.baseline.picks,s.quality.picks);
  assert.ok(s.swaps.every(d=>d.changes===d.added.length&&d.changes===d.removed.length));
 }
});
test('Strict screen reports full coverage and expected win count without guaranteeing accuracy',()=>{
 const x=E.evaluate(),p=x.totals.screens.strict_winfirst;
 assert.equal(p.picks,10);assert.equal(p.wins,7);
 assert.ok(p.model_expected_winners>0&&p.model_expected_winners<10);
 assert.deepEqual(x.dates.map(d=>d.screens.strict_winfirst.picks),[3,0,7,0]);
});

test('14 Nov prospective screen is fixed, source-gated and cannot edit L5',()=>{
 const p=require('./2026-11-14-selection-rule-preregistration.json');
 assert.equal(p.strict_screen.model_p_at_least_pct,20);
 assert.equal(p.strict_screen.lead_gap_at_least_pp,5);
 assert.equal(p.strict_screen.min_dated_form_starts,3);
 assert.equal(p.strict_screen.max_field_size,14);
 assert.equal(p.fields_available,false);
 assert.equal(p.pre_jump_forecasts_frozen,false);
 assert.equal(p.production_formula_modified,false);
});
