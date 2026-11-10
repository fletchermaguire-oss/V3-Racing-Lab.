'use strict';
/* L5 untouched. One predeclared feature family at a time is reweighted,
 * and whole-field probabilities are recalculated using the ORIGINAL model
 * temperature + uniform reserve. Results are used ONLY after predictions.
 * Four archived retrospective/provisional race dates ≠ untouched holdout.
 */
const assert=require('node:assert/strict');
const Model=require('../model.js');
const Rank=require('./rank-driver-shadow.cjs');
const FEATURES=Object.freeze(['career','recency','distance','surface','course','class','barrier','weight','layoff']);
const SCALES=Object.freeze([0.5,0]);  // Half contribution and fully removed
function canonical(s){return String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');}
function field(rows,feature,scale){
 assert.ok(FEATURES.includes(feature),'Only preregistered L5 components');
 assert.ok(SCALES.includes(scale),'Only preregistered scales');
 assert.ok(Array.isArray(rows)&&rows.length>=2);
 const u=Model.CONFIG.uniformReserve,T=Model.CONFIG.temperature,n=rows.length;
 const entries=rows.map(r=>{
  const component=r.features?.[feature];
  assert.ok(Number.isFinite(component),'Every current starter must have feature '+feature);
  const p=r.p_exact/100,q=(p-u/n)/(1-u);
  assert.ok(q>0&&Number.isFinite(q),'Original full-field distribution invalid');
  return {id:r.id,horse:r.horse,race_id:r.race_id,base_prob:p,component,
   unreserved:q*Math.exp((scale-1)*component/T)};
 });
 const total=entries.reduce((s,x)=>s+x.unreserved,0);
 const forecast=entries.map(x=>({id:x.id,horse:x.horse,probability:u/n+(1-u)*x.unreserved/total,
  original:x.base_prob,component:x.component}));
 assert.ok(forecast.every(x=>x.probability>0&&x.probability<1));
 assert.ok(Math.abs(forecast.reduce((s,x)=>s+x.probability,0)-1)<1e-10);
 return forecast.sort((a,b)=>b.probability-a.probability||a.id.localeCompare(b.id));
}
function winnerId(race){
 const matches=race.rows.filter(r=>race.winner.id?r.id===race.winner.id:canonical(r.horse)===canonical(race.winner.horse));
 assert.equal(matches.length,1,'Winner must match one saved full field '+race.id);
 return matches[0].id;
}
function evalRace(race,feature,scale){
 const first=race.rows.slice().sort((a,b)=>b.p_exact-a.p_exact||a.id.localeCompare(b.id))[0];
 const rows=field(race.rows,feature,scale),winner=winnerId(race);
 const winnerIndex=rows.findIndex(x=>x.id===winner);
 assert.ok(winnerIndex>=0);
 const after=rows[0],change=first.id!==after.id;
 const wonOriginal=first.id===winner,wonAfter=after.id===winner;
 return {race_id:race.id,date:race.id.slice(0,10),winner_id:winner,field_size:rows.length,
  prior_leader:first.id,challenger_leader:after.id,
  flip:change,
  gained:change&&!wonOriginal&&wonAfter,
  harmed:change&&wonOriginal&&!wonAfter,
  both_wrong:change&&!wonOriginal&&!wonAfter,
  original_won:wonOriginal,challenger_won:wonAfter,
  top3:winnerIndex<3,top5:winnerIndex<5,
  brier:rows.reduce((a,x)=>a+(x.probability-(x.id===winner?1:0))**2,0),
  log_loss:-Math.log(rows[winnerIndex].probability)};
}
function evaluate(){
 const ds=Rank.loadDatasets(),runs=[];
 for(const feature of FEATURES)for(const scale of SCALES){
  const dates=ds.map(d=>{
   const races=d.races.map(r=>evalRace(r,feature,scale));
   const mean=k=>races.reduce((s,x)=>s+x[k],0)/races.length;
   return {date:d.date,races:races.length,top1:races.filter(x=>x.challenger_won).length,
    top3:races.filter(x=>x.top3).length,top5:races.filter(x=>x.top5).length,
    brier:+mean('brier').toFixed(6),log_loss:+mean('log_loss').toFixed(6),
    flips:races.filter(x=>x.flip).length,gains:races.filter(x=>x.gained).length,
    harms:races.filter(x=>x.harmed).length,both_wrong:races.filter(x=>x.both_wrong).length,
    changed:races.filter(x=>x.flip).map(x=>({race_id:x.race_id,
     from:x.prior_leader,to:x.challenger_leader,gained:x.gained,harmed:x.harmed,both_wrong:x.both_wrong}))};
  });
  const n=dates.reduce((s,d)=>s+d.races,0),sum=k=>dates.reduce((s,d)=>s+d[k],0);
  runs.push({feature,scale,races:n,top1:sum('top1'),top3:sum('top3'),top5:sum('top5'),
   brier:+(dates.reduce((s,d)=>s+d.races*d.brier,0)/n).toFixed(6),
   log_loss:+(dates.reduce((s,d)=>s+d.races*d.log_loss,0)/n).toFixed(6),
   flips:sum('flips'),gains:sum('gains'),harms:sum('harms'),
   both_wrong:sum('both_wrong'),dates});
 }
 assert.ok(runs.every(x=>x.races===91));
 const baseline=ds.map(d=>({date:d.date,races:d.races.length,top1:d.races.filter(r=>r.rows.slice().sort((a,b)=>b.p_exact-a.p_exact||a.id.localeCompare(b.id))[0].id===winnerId(r)).length,
  brier:d.races.reduce((s,r)=>s+r.rows.reduce((z,x)=>
   z+(x.p_exact/100-(x.id===winnerId(r)?1:0))**2,0),0)/d.races.length,
  log_loss:d.races.reduce((s,r)=>s-Math.log(r.rows.find(x=>x.id===winnerId(r)).p_exact/100),0)/d.races.length}));
 assert.equal(baseline.reduce((s,d)=>s+d.races,0),91);
 assert.equal(baseline.reduce((s,d)=>s+d.top1,0),27);
 const bas={races:91,top1:27,top3:49,top5:65,
  brier:+(baseline.reduce((s,d)=>s+d.races*d.brier,0)/91).toFixed(6),
  log_loss:+(baseline.reduce((s,d)=>s+d.races*d.log_loss,0)/91).toFixed(6),
  dates:baseline.map(d=>({date:d.date,races:d.races,top1:d.top1}))};
 return {schema:'racing-lab-l5-feature-ablation/v1',status:'RETROSPECTIVE_RESEARCH_NO_PROMOTION',
  baseline:bas,scales:SCALES,features:FEATURES,runs,
  paired_method:'full-field inverse reserve, subtract only one existing logit feature, restore original temperature and reserve',
  no_fitted_coefficients:true,production_l5_unchanged:true,no_new_predictors:true,
  caveat:'17/24 reconstructed postrace sources, 31 Oct 7 field mismatches excluded, 3 Nov provisional field. This is not a new forward holdout or proof that ablated weights should change.'};
}
if(require.main===module)console.log(JSON.stringify(evaluate(),null,2));
module.exports={FEATURES,SCALES,field,evalRace,evaluate};
