'use strict';
/* Historical calibration audit. This NEVER changes model weights or site odds.
 * Both samples are retrospective reconstructed dossiers, NOT certified
 * pre-race frozen predictions; they must not enter production fitting.
 */
const assert=require('node:assert/strict');
const M=require('../model.js');
const F=require('../prospective-calibration.cjs');
const saved=require('./2026-11-02-49-race-temporal-study.json');
const histories=[
 require('../backtests/2026-10-17-retrospective.json'),
 require('../backtests/2026-10-24-retrospective.json')
];
function rows(h){
 assert.equal(h.status,'RETROSPECTIVE_RESEARCH_DIAGNOSTIC_ONLY');
 assert.equal(h.backtest_eligible,false,'Retrospective source incorrectly marked freeze eligible');
 const b=M.board(h.input,{going:h.going});
 const winners=new Map();
 for(const w of h.results){
  if(w.won!==true||w.verified!==true)continue;
  assert(/^https:\/\//.test(w.url),'A winner needs a verified results URL');
  assert(!winners.has(w.race_id),'Duplicate race winner '+w.race_id);
  winners.set(w.race_id,w.id);
 }
 const r=b.baseline.races.map(race=>{
  assert.equal(race.sum,100);
  const field=b.baseline.records.filter(x=>x.race_id===race.id).map(x=>({id:x.id,p:x.p_exact}));
  assert(field.length>1&&field.some(x=>x.id===winners.get(race.id)));
  return {race_id:race.id,date:h.date,field,winner:winners.get(race.id)};
 });
 assert.equal(winners.size,r.length);
 return r;
}
function quality(races,t){
 let brier=0,ll=0,hit=0;
 for(const r of races){
  const p=F.calibrateRows(r.field,t),w=p.find(x=>x.id===r.winner);
  assert(w&&w.p>0);
  ll-=Math.log(w.p/100);
  brier+=p.reduce((a,x)=>a+(x.p/100-(x.id===r.winner?1:0))**2,0);
  hit+=+(p.slice().sort((a,b)=>b.p-a.p||a.id.localeCompare(b.id))[0].id===r.winner);
 }
 return {races:races.length,top1_winners:hit,
  top1_hit_rate:hit/races.length,mean_multiclass_brier:brier/races.length,mean_log_loss:ll/races.length};
}
function fit(races){
 let selected={temperature:1,mean_log_loss:Infinity};
 for(let n=0;n<=600;n++){
  const t=+(0.5+n*0.01).toFixed(2),v=quality(races,t).mean_log_loss;
  if(v<selected.mean_log_loss)selected={temperature:t,mean_log_loss:v};
 }
 return selected;
}
function approx(x,y,label){assert(Math.abs(x-y)<1e-9,label+': '+x+' versus '+y);}
function compareMetric(x,y,label){
 for(const k of ['races','top1_winners','top1_hit_rate','mean_multiclass_brier','mean_log_loss'])
  approx(x[k],y[k],label+' '+k);
}
function audit(){
 const a=rows(histories[0]),b=rows(histories[1]),t1=fit(a),t2=fit(b);
 assert.equal(a.length,30);assert.equal(b.length,19);
 approx(t1.temperature,saved.forward_test.fitted_temperature,'17 Oct temperature');
 approx(t2.temperature,saved.reverse_test.fitted_temperature,'24 Oct temperature');
 compareMetric(quality(a,1),saved.forward_test.training_raw,'17 Oct raw');
 compareMetric(quality(a,t1.temperature),saved.forward_test.training_candidate,'17 Oct fitted');
 compareMetric(quality(b,1),saved.forward_test.holdout_raw,'24 Oct raw');
 compareMetric(quality(b,t1.temperature),saved.forward_test.holdout_candidate,'24 Oct held out');
 compareMetric(quality(a,t2.temperature),saved.reverse_test.holdout_candidate,'17 Oct held out');
 assert(quality(b,t1.temperature).mean_log_loss>quality(b,1).mean_log_loss);
 assert(quality(b,t1.temperature).mean_multiclass_brier>quality(b,1).mean_multiclass_brier);
 assert(quality(a,t2.temperature).mean_log_loss>quality(a,1).mean_log_loss);
 assert(quality(a,t2.temperature).mean_multiclass_brier>quality(a,1).mean_multiclass_brier);
 assert.equal(saved.eligible_to_publish,false);
 assert.equal(saved.status,'REJECTED_OUT_OF_SAMPLE_NO_PRODUCTION_CALIBRATION');
 assert.equal(F.fitFrozen([],[]).calibration_fitted,false);
 return {status:'PASS: NO APPROVED CALIBRATION',model:M.VERSION,
  retrospective_dates:[histories[0].date,histories[1].date],races:49,
  fitted_on_17:t1.temperature,heldout_24:{raw:quality(b,1),candidate:quality(b,t1.temperature)},
  fitted_on_24:t2.temperature,heldout_17:{raw:quality(a,1),candidate:quality(a,t2.temperature)},
  publication_approved:false};
}
if(require.main===module)console.log(JSON.stringify(audit(),null,2));
module.exports={audit,quality,fit};
