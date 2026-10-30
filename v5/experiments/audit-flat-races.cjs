'use strict';
/* READ ONLY diagnostic. Do not tune/publish model from a retrospective fit. */
const M=require('../model.js'),D=require('../research.json'),O=require('../official-latest.json'),State=require('../site-state.js');
const hist=[require('../backtests/2026-10-17-retrospective.json'),require('../backtests/2026-10-24-retrospective.json')];
const round=(x,n=3)=>Number(x.toFixed(n));
const mean=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const field=State.applyOfficialOverlay(D,O),b=M.board(field,{going:O.going});
const flat=b.baseline.races.map(r=>{
 const rows=b.baseline.records.filter(x=>x.race_id===r.id).sort((a,b)=>b.p_exact-a.p_exact),
  eq=100/rows.length,
  near=rows.filter(x=>Math.abs(x.p-eq)<=2).length,
  noForm=rows.filter(x=>x.form_audit.accepted===0).length,
  noClass=rows.filter(x=>x.grade_quality===0).length,
  thin=rows.filter(x=>x.completeness<.5).length;
 return {race:r.id,meeting:r.meeting,raceNo:r.race,field:rows.length,equalPct:round(eq),
  leader:rows[0].horse,topPct:round(rows[0].p),secondPct:round(rows[1].p),gapPct:round(rows[0].p-rows[1].p),
  nearEqualCount:near,missingDatedForm:noForm,zeroRecognizedGradedForm:noClass,thinEvidence:thin,
  minPct:round(rows[rows.length-1].p),highChaos:r.chaos,avgCompleteness:round(mean(rows.map(x=>x.completeness)))};
}).sort((a,b)=>(b.nearEqualCount/b.field)-(a.nearEqualCount/a.field)||a.topPct-b.topPct);
const T0=M.CONFIG.temperature,U0=M.CONFIG.uniformReserve;
function remap(rows,T,U){
 const n=rows.length,q=rows.map(x=>Math.max(1e-16,(x.p_exact/100-U0/n)/(1-U0))),
 power=T0/T,z=q.map(x=>Math.pow(x,power)),sum=z.reduce((a,b)=>a+b,0);
 return z.map(v=>100*((1-U)*v/sum+U/n));
}
const sets=hist.flatMap(h=>{
 const bb=M.board(h.input,{going:h.going}).baseline,winners=new Map(h.results.filter(x=>x.verified&&x.won).map(x=>[x.race_id,x.id]));
 return bb.races.map(r=>({race_id:r.id,rows:bb.records.filter(x=>x.race_id===r.id),winner:winners.get(r.id)}));
});
const sensitivity=[];
for(const T of [.6,.78,.95,1.2]){
 for(const U of [0,.15,.3]){
  const byRace=sets.map(c=>{
   if(!c.winner)throw Error('Unknown race winner '+c.race_id);
   const p=remap(c.rows,T,U),winnerIdx=c.rows.findIndex(x=>x.id===c.winner),leaderIdx=p.indexOf(Math.max(...p));
   if(winnerIdx<0)throw Error('Winner absent '+c.race_id);
   return {hit:c.rows[leaderIdx].id===c.winner, brier:p.reduce((s,v,i)=>s+(v/100-(i===winnerIdx?1:0))**2,0),log:-Math.log(p[winnerIdx]/100)};
  });
  sensitivity.push({temperature:T,uniformReserve:U,top1Wins:byRace.filter(x=>x.hit).length,races:byRace.length,
   brier:round(mean(byRace.map(x=>x.brier)),6),logLoss:round(mean(byRace.map(x=>x.log)),6)});
 }
}
const local=b.baseline.records.find(x=>x.horse.toLowerCase()==='enamorada');
const output={
 label:'PROVISIONAL_SAVED_FRIDAY_SOURCE_ONLY_NOT_SATURDAY_FINAL',
 model:M.VERSION,config:{temperature:T0,uniformReserve:U0,weights:M.CONFIG.weights},
 fields:{races:b.baseline.races.length,active:b.activeCount,excluded:b.excludedCount,
  raceLeadersLessThan15:b.baseline.races.filter(r=>r.top_p<15).length,
  nearEqualMajorityRaces:flat.filter(x=>x.nearEqualCount>=x.field/2).length},
 flatRaces:flat.slice(0,15),
 enamo:local?{p:local.p,fieldSize:local.field_size,quality:local.grade_quality,form:local.form_audit,issues:local.input_issues}:null,
 retrospectiveOnly:{races:sets.length,sensitivity:sensitivity},
 note:'None of the tested temperatures/reserves are calibrated. Reconstructed 17/24 October snapshots might contain post-race updates. Changing coefficients to improve these two dates risks overfitting. No model changes approved.'
};
if(require.main===module)process.stdout.write(JSON.stringify(output,null,2)+'\n');
module.exports={remap,output};
