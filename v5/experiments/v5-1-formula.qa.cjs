'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Base=require('../model.js');
const Candidate=require('./model-v5-1.cjs');
const Q=require('./v5-1-evidence-gate.cjs');
const Rose=require('../cards/2026-11-07/rosehill-research.json');
const Ascot=require('../cards/2026-11-07/ascot-research.json');
const Official=require('../cards/2026-11-07/official-final.json');
const Compare=require('./compare-v5-1-formula.cjs');
const clone=x=>JSON.parse(JSON.stringify(x));
const canon=s=>String(s||'').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const row=(calculated,race,horse)=>calculated.records.find(x=>x.race===race&&canon(x.horse)===canon(horse));
const checkWholeFields=out=>{
 assert.equal(out.races.length>0,true);
 for(const race of out.races){
  const subset=out.records.filter(x=>x.race_id===race.id);
  assert.equal(subset.length,race.field);
  assert.equal(new Set(subset.map(x=>x.id)).size,subset.length);
  assert(Math.abs(subset.reduce((s,x)=>s+x.p_exact,0)-100)<1e-9);
  assert.equal(subset.filter(x=>x.rank===1).length,1);
  assert(subset.every(x=>Number.isFinite(x.p_exact)&&x.p_exact>0));
 }
};
test('experimental candidate is isolated, versioned, and preserves global probability settings',()=>{
 assert.notEqual(Candidate.VERSION,Base.VERSION);
 assert.equal(Candidate.CONFIG.temperature,Base.CONFIG.temperature);
 assert.equal(Candidate.CONFIG.uniformReserve,Base.CONFIG.uniformReserve);
 assert.deepEqual(Candidate.CONFIG.weights,Base.CONFIG.weights);
});
test('same active fields and normalized 100-percent distributions on both meetings',()=>{
 for(const [meeting,source] of [['ROSEHILL',Rose],['ASCOT',Ascot]]){
  const research=Q.reconcileSnapshot(source,Official,meeting).data;
  const old=Base.calculate(research,{default:'Good 4'});
  const revised=Candidate.calculate(research,{default:'Good 4'});
  checkWholeFields(old);checkWholeFields(revised);
  assert.deepEqual(old.records.map(x=>x.id).sort(),revised.records.map(x=>x.id).sort());
  assert(revised.records.every(x=>Object.hasOwn(x.features,'recent_evidence_adjustment')));
  assert.equal(revised.publication_approved,false);
  assert.equal(revised.calibration_status,'NOT_ESTABLISHED');
 }
});
test('candidate discounts Cashout thin-form recency uniformly without deleting his ranking',()=>{
 const d=Q.reconcileSnapshot(Rose,Official,'ROSEHILL').data;
 const baseline=Base.calculate(d,{default:'Good 4'});
 const revised=Candidate.calculate(d,{default:'Good 4'});
 const old=row(baseline,5,'CASHOUT'),newer=row(revised,5,'CASHOUT');
 assert.equal(old.form_audit.accepted,3);
 assert(old.features.class<0);
 assert(newer.features.recent_evidence_adjustment<0);
 assert.equal(Number(newer.features.recent_evidence_adjustment.toFixed(5)),-0.17517);
 assert.equal(old.p,26.72);
 assert.equal(newer.p,23.09);
 assert.equal(old.rank,1);assert.equal(newer.rank,1);
 const winnerOld=row(baseline,5,'PROBABILITY THEORY');
 const winnerNew=row(revised,5,'PROBABILITY THEORY');
 assert.equal(winnerOld.p,12.05);
 assert.equal(winnerNew.p,12.75);
});
test('complete positive-class runners retain their original recency feature contribution',()=>{
 const a=Q.reconcileSnapshot(Rose,Official,'ROSEHILL').data;
 const b=Q.reconcileSnapshot(Ascot,Official,'ASCOT').data;
 for(const [d,race,horse] of [[a,7,'LAZZURA'],[a,3,'SAVVY SPY'],
  [b,6,'BEATTY'],[b,9,'KING OF LIGHT']]){
  const old=row(Base.calculate(d,{default:'Good 4'}),race,horse);
  const now=row(Candidate.calculate(d,{default:'Good 4'}),race,horse);
  assert.equal(old.form_audit.accepted,5);
  assert.equal(now.features.recent_evidence_adjustment,0);
  assert.equal(now.features.recency,old.features.recency);
  assert.equal(now.rank,1);
 }
});
test('source runner order, market odds, and postrace claims cannot alter model output',()=>{
 const d=Q.reconcileSnapshot(Rose,Official,'ROSEHILL').data;
 const before=Candidate.calculate(d,{default:'Good 4'});
 const modified=clone(d);
 modified.runners.reverse();modified.races.reverse();
 modified.runners.forEach(x=>{x.bookmaker_price=1.01;x.actual_result='WIN';
   x.posterior_winner=true;x.assistant_previous_pick='NOT RANKED';});
 const after=Candidate.calculate(modified,{default:'Good 4'});
 const pairs=out=>out.records.map(x=>[x.id,x.p_exact]).sort((a,b)=>a[0].localeCompare(b[0]));
 assert.deepEqual(pairs(before),pairs(after));
});
test('whole-field sums remain 100 and evidence deltas never increase raw recent-form score',()=>{
 for(const [meeting,source] of [['ROSEHILL',Rose],['ASCOT',Ascot]]){
  const d=Q.reconcileSnapshot(source,Official,meeting).data;
  for(const going of ['Good 4','Soft 5']){
   const out=Candidate.calculate(d,{default:going});
   checkWholeFields(out);
   for(const row of out.records){
    assert(row.features.recent_evidence_adjustment<=0);
    assert(Math.abs(row.features.recent_evidence_adjustment)<
     Math.max(1e-9,Math.max(0,row.features.recency))*0.63);
   }
  }
 }
});
test('comparison reports identical race coverage, not automatically published improved odds',()=>{
 const result=Compare.run();
 assert.equal(result.run_kind,'RETROSPECTIVE_DIAGNOSTIC_ONLY');
 assert.equal(result.formula_approved,false);
 assert.equal(result.prospective_frozen_forecasts,0);
 assert.equal(result.groups.length,7);
 assert.equal(result.historical_totals.baseline.races,71);
 assert.equal(result.historical_totals.candidate.races,71);
 assert.equal(result.groups[3].baseline.races+result.groups[4].baseline.races,7);
 assert.equal(result.groups[5].baseline.races+result.groups[6].baseline.races,20);
 for(const group of result.groups){
  assert.equal(group.candidate.races,group.baseline.races);
  assert(group.candidate.mean_multiclass_brier>0);
  assert(group.candidate.mean_log_loss>0);
 }

});
