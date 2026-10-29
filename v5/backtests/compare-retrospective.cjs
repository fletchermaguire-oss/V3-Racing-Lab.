'use strict';
/* Audits a retrospectively rebuilt 17 October card. Source records were
 * not proven frozen before racing. This MUST NOT set calibration flags. */
const fs=require('node:fs'),path=require('node:path');
const M=require('../model.js');
const hist=require('./2026-10-17-retrospective.json');
const baseline=require('./2026-10-17-L4-baseline.json');
function compare(){
 if(hist.backtest_eligible!==false||hist.status!=='RETROSPECTIVE_RESEARCH_DIAGNOSTIC_ONLY')
  throw Error('Historical fixture must remain marked retrospective');
 if(hist.input.date!==baseline.date)throw Error('Historical date mismatch');
 const next=M.board(hist.input,{going:hist.going}),old=new Map(baseline.records.map(x=>[x.id,x]));
 if(next.activeCount!==307||next.raceCount!==30||next.baseline.records.length!==old.size)
  throw Error('Historical field integrity mismatch');
 const winners=new Map(),official=new Map();
 hist.results.forEach(r=>{
  if(!r.verified)return;
  if(r.won){
   if(winners.has(r.race_id))throw Error('Multiple winners for '+r.race_id);
   winners.set(r.race_id,r.id);
   official.set(r.race_id,r.url);
  }
 });
 const races=next.baseline.races.map(r=>{
  const rows=next.baseline.records.filter(x=>x.race_id===r.id);
  const winner=winners.get(r.id),won=rows.find(x=>x.id===winner);
  if(!winner||!won||!/^https:\/\//.test(official.get(r.id)||'')||
     rows.some(x=>!old.has(x.id)))throw Error('Missing verified winner or race mismatch '+r.id);
  function metric(rowp){
   const top=rowp.slice().sort((a,b)=>b.p-a.p||a.id.localeCompare(b.id))[0];
   const wp=rowp.find(x=>x.id===winner).p/100;
   return {top1_won:top.id===winner,brier:rowp.reduce((s,x)=>s+(x.p/100-(x.id===winner?1:0))**2,0),
    log_loss:-Math.log(Math.max(1e-15,wp))};
  }
  return {race_id:r.id,meeting:r.meeting,winner,old:metric(rows.map(x=>({id:x.id,p:old.get(x.id).p}))),
   candidate:metric(rows.map(x=>({id:x.id,p:x.p_exact}))),uniform_brier:1-1/rows.length};
 });
 const mean=(a,fn)=>a.reduce((s,x)=>s+fn(x),0)/a.length;
 const oldSummary={wins:races.filter(x=>x.old.top1_won).length,brier:mean(races,x=>x.old.brier),
  log_loss:mean(races,x=>x.old.log_loss)};
 const newSummary={wins:races.filter(x=>x.candidate.top1_won).length,brier:mean(races,x=>x.candidate.brier),
  log_loss:mean(races,x=>x.candidate.log_loss)};
 // Deterministic race-resampling uncertainty; descriptive only because the
 // race-day form was not frozen and this is just one date.
 let seed=21764;function rng(){seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;}
 const deltas=[];for(let i=0;i<2000;i++){
  let total=0;
  for(let j=0;j<races.length;j++){const x=races[Math.floor(rng()*races.length)];total+=x.old.brier-x.candidate.brier;}
  deltas.push(total/races.length);
 }
 deltas.sort((a,b)=>a-b);
 return {status:'RETROSPECTIVE_DIAGNOSTIC_ONLY_NOT_CALIBRATION',date:hist.date,
  model_version:M.VERSION,source_model_baseline:baseline.model_version,
  races:races.length,verified_finishers:next.activeCount,verified_winners:winners.size,
  old:oldSummary,candidate:newSummary,uniform_brier:mean(races,x=>x.uniform_brier),
  mean_brier_gain:oldSummary.brier-newSummary.brier,
  bootstrap_95pct_brier_gain:[deltas[49],deltas[1949]],
  verified_pre_race_frozen_snapshots:0,production_calibration_allowed:false,
  reasons:['Single historical date','Aggregate form research may have changed after races',
   'Not proven frozen or independent','Ordinal class coefficients and probability temperature not fitted or validated'],
  tracks:Object.entries(Object.groupBy(races,x=>x.meeting)).map(([meeting,x])=>({
    meeting,races:x.length,L4_wins:x.filter(z=>z.old.top1_won).length,
    L5_wins:x.filter(z=>z.candidate.top1_won).length,
    L4_brier:mean(x,z=>z.old.brier),L5_brier:mean(x,z=>z.candidate.brier)
  }))};
}
const result=compare();
if(require.main===module)process.stdout.write(JSON.stringify(result,null,2)+'\n');
module.exports={compare};
