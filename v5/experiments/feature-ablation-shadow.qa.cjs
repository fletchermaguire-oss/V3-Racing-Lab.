'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('./feature-ablation-shadow.cjs');
const Model=require('../model.js');
test('removing or halving one feature preserves whole-field probability accounting',()=>{
 const field=[{id:'a',horse:'A',p_exact:60,features:{recency:1,class:0}},
  {id:'b',horse:'B',p_exact:40,features:{recency:-1,class:0}}];
 for(const scale of A.SCALES){
  const out=A.field(field,'recency',scale);
  assert.ok(Math.abs(out.reduce((s,x)=>s+x.probability,0)-1)<1e-10);
  assert.ok(out.every(x=>x.probability>0&&x.probability<1));
 }
});
test('zero feature magnitude causes NO changes to original rank or probabilities',()=>{
 const field=[{id:'a',horse:'A',p_exact:60,features:{class:0}},
  {id:'b',horse:'B',p_exact:40,features:{class:0}}];
 for(const scale of A.SCALES)for(const x of A.field(field,'class',scale)){
  assert.ok(Math.abs(x.original-x.probability)<1e-10);
 }
});
test('nonfinite/missing feature is rejected, never interpreted as zero',()=>{
 const field=[{id:'a',p_exact:60,features:{}},{id:'b',p_exact:40,features:{class:0}}];
 assert.throws(()=>A.field(field,'class',0));
});
test('all archived races match original 27/91 baseline and each flip is accounted for',()=>{
 const out=A.evaluate();
 assert.equal(out.baseline.top1,27);
 assert.equal(out.baseline.races,91);
 assert.equal(out.runs.length,A.FEATURES.length*A.SCALES.length);
 assert.ok(out.runs.every(x=>x.flips===x.gains+x.harms+x.both_wrong));
 assert.ok(out.runs.every(x=>x.top1===27+x.gains-x.harms));
 assert.equal(out.production_l5_unchanged,true);
 assert.equal(Model.VERSION,'V5-L5-CANDIDATE-20261030');
});
