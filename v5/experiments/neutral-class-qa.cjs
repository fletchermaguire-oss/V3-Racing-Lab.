'use strict';
/* Mathematical QA only. Fixture data are not real racing or evidence of improved hit rate. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const Live=require('../model.js'),Candidate=require('./model-neutral-class.cjs');
function fixture(forms){
 const date='2027-03-13',race_id=date+'_TEST_R01';
 return {date,saved_at:'2027-03-12',
  races:[{id:race_id,meeting:'TEST',race:1,distance_m:1200}],
  runners:forms.map((form,i)=>({
   id:race_id+'_'+String(i+1).padStart(2,'0'),race_id,horse:'Test '+i,
   status:'Declared',weight_kg:56,barrier:i+1,
   statistics:'Career 2-2-8; course 1-1-4; distance 1-1-4; Good 2-2-8',
   form,risks:'Synthetic test only'
  }))};
}
const graded=[
 '28/2/2027 TEST 1200m (G), OPEN Group G1: 2/12, PDF margin 0.2L',
 '28/2/2027 TEST 1200m (G), BM72: 1/10, PDF margin 1.0L',
 '28/2/2027 TEST 1200m (G), MDN: 2/10, PDF margin 0.4L'
];
const unknown='28/2/2027 TEST 1200m (G), HCP: 2/8, PDF margin 0.2L';
function byId(b,id){return b.records.find(x=>x.id===id);}
function exactSum(b){assert.equal(b.races.length,1);assert.ok(Math.abs(b.records.reduce((s,x)=>s+x.p_exact,0)-100)<1e-9);}
test('isolated candidate does not replace the production model or mutate source',()=>{
 assert.notEqual(Candidate.VERSION,Live.VERSION);
 assert.equal(globalThis.RacingLabV5Model,Live);
 const d=fixture(graded),before=structuredClone(d);
 Candidate.calculate(d,'Good 4');assert.deepEqual(d,before);
});
test('known graded form is unchanged in every runner, including class contributions',()=>{
 const d=fixture(graded),a=Live.calculate(d,'Good 4'),b=Candidate.calculate(d,'Good 4');
 exactSum(a);exactSum(b);
 for(const x of a.records){
  const y=byId(b,x.id);
  assert.ok(Math.abs(x.p_exact-y.p_exact)<1e-12,x.id);
  assert.ok(Math.abs(x.features.class-y.features.class)<1e-12,x.id);
  assert.equal(x.grade_quality,y.grade_quality);
 }
});
test('unknown class stays an explicit missing value, not a numeric poor-class rating',()=>{
 const d=fixture([graded[0],graded[1],unknown]);
 const base=Live.calculate(d,'Good 4'),alternative=Candidate.calculate(d,'Good 4');
 const id=d.runners[2].id,old=byId(base,id),fresh=byId(alternative,id);
 exactSum(base);exactSum(alternative);
 assert.equal(Live.classQuality([]),0);
 assert.equal(Candidate.classQuality([]),null);
 assert.ok(old.features.class<0,'existing model treats missing grade as inferior');
 assert.equal(fresh.grade_quality,null);
 assert.equal(fresh.features.class,0);
 assert.equal(fresh.opposition_class_edge,null);
 assert.ok(Math.abs(old.p_exact-fresh.p_exact)>1e-6,'experiment actually changes a rating');
});
test('no known class in race stays finite and probabilistically neutral',()=>{
 const d=fixture([unknown,unknown,unknown]);
 const b=Candidate.calculate(d,'Good 4');exactSum(b);
 assert.equal(b.races[0].field_quality,null);
 assert.ok(b.records.every(x=>x.grade_quality===null&&x.features.class===0));
 assert.ok(b.records.every(x=>Number.isFinite(x.p_exact)));
});
test('one rated horse with no rated peers cannot receive invented class superiority',()=>{
 const b=Candidate.calculate(fixture([graded[0],unknown,unknown]),'Good 4');
 exactSum(b);
 assert.ok(b.records.every(x=>x.features.class===0));
 assert.equal(b.records.find(x=>x.grade_quality!==null).opposition_class_anchor,null);
 assert.ok(b.records.filter(x=>x.grade_quality===null).every(x=>x.opposition_class_edge===null));
});
test('runner ordering does not change any probability or class evidence',()=>{
 const d=fixture([graded[0],unknown,graded[1]]);
 const a=Candidate.calculate(d,'Soft 5');
 d.runners.reverse();
 const b=Candidate.calculate(d,'Soft 5');
 assert.deepEqual(a.records.map(x=>[x.id,x.p_exact,x.features.class]).sort(),
  b.records.map(x=>[x.id,x.p_exact,x.features.class]).sort());
});
test('real source snapshot remains a fully provisional, whole-field, market-blind experiment',()=>{
 const d=require('../research.json'),b=Candidate.board(d);
 assert.equal(b.raceCount,d.races.length);
 assert.equal(b.sourceCount,d.runners.length);
 assert.equal(b.publication_blocked,true);
 assert.equal(b.calibration_status,'NOT_ESTABLISHED');
 assert.ok(b.baseline.races.every(r=>r.status==='MODELLED_PROVISIONAL'&&r.sum===100));
 assert.ok(b.baseline.records.some(x=>x.grade_quality===null));
});
