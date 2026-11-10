'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const S=require('./venue-open-shadow.cjs'),Model=require('../model.js');
test('Open win at regional venue detected, not Group / BM / metropolitan',()=>{
 let a=S.exposure('27/9/2026 DUBBO 1100m (G), OPEN: 1/14, PDF margin 3.9L','2026-10-30');
 assert.equal(a.value,1);
 assert.equal(S.exposure('27/9/2026 ROSEHILL 1100m (G), OPEN: 1/14, PDF margin 3.9L','2026-10-30').value,0);
 assert.equal(S.exposure('27/9/2026 DUBBO 1100m (G), OPEN Group G2: 1/14, PDF margin 3.9L','2026-10-30').value,0);
 assert.equal(S.exposure('27/9/2026 DUBBO 1100m (G), BM82: 1/14, PDF margin 3.9L','2026-10-30').value,0);
});
test('same-day result and later result excluded, and duplicate historical starts not counted',()=>{
 const form='30/10/2026 DUBBO 1000m (G), OPEN: 1/9, PDF margin 2L\n'+
 '31/10/2026 DUBBO 1000m (G), OPEN: 1/9, PDF margin 2L\n'+
 '30/10/2026 DUBBO 1000m (G), OPEN: 1/9, PDF margin 2L';
 assert.equal(S.extractStarts(form,'2026-10-30').length,0);
 assert.equal(S.extractStarts(form,'2026-11-01').length,2);
});
test('zero adjustment reproduces L5 exact probabilities to machine precision',()=>{
 const ds=require('./rank-driver-shadow.cjs').loadDatasets();
 const d=ds.find(x=>x.date==='2026-10-31'),first=d.races[0];
 const meta=new Map(first.rows.map(r=>[r.id,{value:.4}]));
 const out=S.normalize(first.rows,meta,0);
 for(const x of out){
  const b=first.rows.find(y=>y.id===x.id);
  assert.ok(Math.abs(x.probability-b.p_exact/100)<1e-10);
 }
 assert.equal(Model.VERSION,'V5-L5-CANDIDATE-20261030');
});
test('evidence adjustment bounded and whole-field normalised',()=>{
 const rows=[{id:'a',horse:'A',p_exact:60},{id:'b',horse:'B',p_exact:40}];
 for(const a of S.ALPHAS){
  const r=S.normalize(rows,new Map([['a',{value:1}],['b',{value:0}]]),a);
  assert.ok(Math.abs(r.reduce((z,x)=>z+x.probability,0)-1)<1e-12);
  assert.ok(r.every(x=>x.probability>0&&x.probability<1));
 }
});
test('full retrospective dataset scored only to audit unmodified L5 comparison',()=>{
 const r=S.run();
 assert.deepEqual(r.scenarios.map(x=>x.races),[91,91,91]);
 assert.equal(r.scenarios[0].top1,27);
 assert.ok(r.scenarios.every(x=>x.affected_runners>=0&&x.unmatched_runners>=0));
 assert.equal(r.original_L5_unchanged,true);
});
