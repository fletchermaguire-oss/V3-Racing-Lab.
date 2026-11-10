'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('./feature-ablation-decision.cjs');
test('No existing L5 factor can be promoted on these historical outcomes',()=>{
 const x=D.run();
 assert.equal(x.candidates_evaluated,18);
 assert.equal(x.candidates_meeting_retrospective_multimetric_gate,0);
 assert.equal(x.production_weight_changes,0);
 assert.equal(x.unchanged_l5.top1,27);
 assert.ok(x.candidates.every(c=>c.production_change_allowed===false));
});
test('A single extra historic winner with worse scoring is rejected',()=>{
 const x=D.run(),course=x.candidates.find(c=>c.feature==='course'&&c.scale===0);
 assert.equal(course.delta_winners,1);
 assert.equal(course.decision,'PROBABILITY_SCORE_WORSENED');
 assert.ok(course.delta_brier>0);
});
test('The strongest recency factor cannot be removed without losing historical winners',()=>{
 const x=D.run(),recency=x.candidates.find(c=>c.feature==='recency'&&c.scale===0);
 assert.equal(recency.delta_winners,-6);
 assert.ok(recency.delta_brier>0);
});
