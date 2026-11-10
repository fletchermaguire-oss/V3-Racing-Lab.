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
