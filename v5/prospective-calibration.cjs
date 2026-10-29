'use strict';
/* Research-only temperature calibration. This code NEVER automatically
 * publishes model probabilities or modifies racing data.
 * Requires genuinely frozen and verified race-day history.
 */
const M=require('./model.js');
const TEMPERATURES=Object.freeze([0.6,0.7,0.8,0.9,1,1.1,1.2,1.35,1.5,1.75,2,2.3]);
const LIMITS=Object.freeze({minimumTrainingDates:6,minimumTrainingRaces:120,minimumTestDates:2,minimumTestRaces:40});
function calibrateRows(rows,temp){
 if(!Array.isArray(rows)||rows.length<2||!(temp>0&&Number.isFinite(temp)))
  throw Error('Complete probability row and positive temperature required');
 const z=rows.map(r=>Math.pow(Math.max(1e-12,r.p/100),1/temp));
 const sum=z.reduce((a,b)=>a+b,0);
 return rows.map((r,i)=>({id:r.id,p:100*z[i]/sum}));
}
function quality(forecasts,byResult,temp){
 if(!forecasts.length)return {n:0,log_loss:null,brier:null,top1:null};
 const values=forecasts.map(f=>{
  const r=byResult.get(f.race_id),rows=calibrateRows(f.rows,temp);
  const winner=rows.find(x=>x.id===r.winner_runner_id);
  if(!winner)throw Error('Missing verified winner: '+f.race_id);
  const top=rows.slice().sort((a,b)=>b.p-a.p||a.id.localeCompare(b.id))[0];
  return {log_loss:-Math.log(Math.max(1e-15,winner.p/100)),
   brier:rows.reduce((a,x)=>a+(x.p/100-(x.id===winner.id?1:0))**2,0),
   top1:top.id===winner.id?1:0};
 });
 return {n:values.length,log_loss:values.reduce((a,x)=>a+x.log_loss,0)/values.length,
  brier:values.reduce((a,x)=>a+x.brier,0)/values.length,
  top1:values.reduce((a,x)=>a+x.top1,0)/values.length};
}
function fitFrozen(forecasts,results){
 // First apply all of V5's existing frozen-snapshot, race-field, and
 // official-result validation. Never bypass or duplicate it partially.
 const audit=M.evaluateFrozen(forecasts,results),accepted=new Set(audit.scored.map(x=>x.race_id));
 const eligible=forecasts.filter(f=>accepted.has(f.race_id)),byResult=new Map(results.map(r=>[r.race_id,r]));
 const rejected=()=>({status:'INSUFFICIENT_FROZEN_HISTORY',calibration_fitted:false,
  automatic_publication:false,accepted_races:audit.races,eligible_dates:[...new Set(eligible.map(f=>f.race_id.slice(0,10)))].length,
  exclusions:audit.excluded.length,limits:LIMITS,
  caveat:'No calibration fitted. Historical results or provisional snapshots without independently verified pre-race freeze provenance cannot be used.'});
 if(audit.status!=='FROZEN_FORECAST_DIAGNOSTIC')return rejected();
 if(eligible.some(f=>!/^\d{4}-\d{2}-\d{2}_/.test(f.race_id)))return rejected();
 const dates=[...new Set(eligible.map(f=>f.race_id.slice(0,10)))].sort();
 if(dates.length<LIMITS.minimumTrainingDates+LIMITS.minimumTestDates)return rejected();
 const testDateSet=new Set(dates.slice(-LIMITS.minimumTestDates));
 const train=eligible.filter(f=>!testDateSet.has(f.race_id.slice(0,10)));
 const holdout=eligible.filter(f=>testDateSet.has(f.race_id.slice(0,10)));
 if(train.length<LIMITS.minimumTrainingRaces||holdout.length<LIMITS.minimumTestRaces)return rejected();
 const fitted=TEMPERATURES.map(t=>({temperature:t,...quality(train,byResult,t)}))
  .sort((a,b)=>a.log_loss-b.log_loss||Math.abs(a.temperature-1)-Math.abs(b.temperature-1))[0];
 const trainBase=quality(train,byResult,1),testBase=quality(holdout,byResult,1),
  testCandidate=quality(holdout,byResult,fitted.temperature);
 // Even sufficient data do not justify auto-publishing. Require a
 // genuinely later held-out sample; the application decision is separate.
 const improved=testCandidate.brier<testBase.brier&&testCandidate.log_loss<testBase.log_loss;
 return {status:improved?'RESEARCH_CANDIDATE_REQUIRES_INDEPENDENT_REVIEW':'VALIDATION_FAILED_NO_CALIBRATION',
  calibration_fitted:false,automatic_publication:false,
  fitted_temperature_research_only:fitted.temperature,
  train_dates:dates.filter(x=>!testDateSet.has(x)),test_dates:[...testDateSet],
  training: {baseline:trainBase,candidate:fitted},
  heldout:{baseline:testBase,candidate:testCandidate},
  accepted_races:eligible.length,exclusions:audit.excluded.length,
  improved_both_holdout_losses:improved,limits:LIMITS,
  caveat:'No automatic publication or model coefficient change. Even this frozen-snapshot research fit requires independent replication and approval before use.'};
}
module.exports={calibrateRows,fitFrozen,LIMITS,TEMPERATURES};
