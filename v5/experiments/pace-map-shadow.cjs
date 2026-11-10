'use strict';
/* Historical 800m settling-based pace-contest challenger.
 * Predeclared rule; read-only. A pace map is NOT race-day speed, sectional
 * timing, strategy, or proof the horse settles identically next start.
 * Unknown data contributes zero; results enter only the postrace scorer.
 */
const assert=require('node:assert/strict');
const Model=require('../model.js'),Rank=require('./rank-driver-shadow.cjs');
const STRENGTHS=Object.freeze([0,0.12,0.30]);
function scenario(rows){
 assert.ok(rows.length>=2);
 const known=rows.filter(x=>x.settle_fraction!==null&&x.settle_fraction!==undefined&&
   Number.isFinite(x.settle_fraction)&&x.settle_fraction>=0&&x.settle_fraction<=1);
 const cover=known.length/rows.length,front=known.filter(x=>x.settle_fraction<=0.34).length;
 let direction=0,status='NEUTRAL_CONTEST';
 if(cover<.70){status='INSUFFICIENT_SETTLING_EVIDENCE';}
 else if(front>=4){direction=1;status='MULTIPLE_POTENTIAL_EARLY_LEADERS';}
 else if(front<=1&&rows.length>=8){direction=-1;status='LONE_OR_NO_EARLY_LEADER';}
 return {status,direction,known:known.length,total:rows.length,coverage:+cover.toFixed(4),front_count:front};
}
function predict(rows,strength){
 assert.ok(STRENGTHS.includes(strength),'Only predeclared pace strengths supported');
 const p=scenario(rows),n=rows.length,u=Model.CONFIG.uniformReserve,T=Model.CONFIG.temperature;
 const data=rows.map(x=>{
  const base=(x.p_exact/100-u/n)/(1-u);
  assert.ok(base>0&&Number.isFinite(base));
  const f=x.settle_fraction;
  const adjustment=p.direction!==0&&Number.isFinite(f)?strength*p.direction*(f-0.5):0;
  return {id:x.id,horse:x.horse,raw:base*Math.exp(adjustment/T),baseline:x.p_exact/100};
 });
 const total=data.reduce((s,x)=>s+x.raw,0);
 const rated=data.map(x=>({id:x.id,horse:x.horse,probability:(1-u)*x.raw/total+u/n,baseline:x.baseline}));
 assert.ok(Math.abs(rated.reduce((s,x)=>s+x.probability,0)-1)<1e-10);
 if(strength===0)assert.ok(rated.every(x=>Math.abs(x.probability-x.baseline)<1e-11),'Baseline changed');
 rated.sort((a,b)=>b.probability-a.probability||a.id.localeCompare(b.id));
 return {pace:p,rows:rated};
}
function canonical(x){return String(x||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');}
function evaluate(d,strength){
 const records=[];
 for(const c of d.races){
  const winner=c.rows.find(x=>c.winner.id?x.id===c.winner.id:canonical(x.horse)===canonical(c.winner.horse));
  assert.ok(winner,'Winner missing from frozen field: '+c.id);
  const p=predict(c.rows,strength),rank=p.rows.findIndex(x=>x.id===winner.id)+1;
  assert.ok(rank>0);
  const pw=p.rows[rank-1].probability;
  records.push({race_id:c.id,rank,field_size:c.rows.length,pace:p.pace.status,direction:p.pace.direction,
   coverage:p.pace.coverage,front_count:p.pace.front_count,
   log_loss:-Math.log(pw),brier:p.rows.reduce((acc,x)=>acc+(x.probability-(x.id===winner.id?1:0))**2,0)});
 }
 const mean=k=>+(records.reduce((s,x)=>s+x[k],0)/records.length).toFixed(6);
 return {date:d.date,strength,races:records.length,
  pressure_races:records.filter(x=>x.direction===1).length,slow_races:records.filter(x=>x.direction===-1).length,
  insufficient_evidence:records.filter(x=>x.pace==='INSUFFICIENT_SETTLING_EVIDENCE').length,
  top1:records.filter(x=>x.rank===1).length,
  top3:records.filter(x=>x.rank<=3).length,
  top5:records.filter(x=>x.rank<=5).length,
  brier:mean('brier'),log_loss:mean('log_loss'),
  changed_races:strength===0?undefined:records.filter(x=>x.direction!==0).length,
  detailed:strength===0?records.map(x=>({race_id:x.race_id,rank:x.rank,pace:x.pace,coverage:x.coverage})):undefined};
}
function run(){
 const ds=Rank.loadDatasets(),rows=ds.map(d=>({date:d.date,source:d.source,scenarios:STRENGTHS.map(s=>evaluate(d,s))}));
 assert.deepEqual(rows.map(x=>x.scenarios[0].top1),[13,4,7,3]);
 const total=STRENGTHS.map(s=>{
  const v=rows.map(x=>x.scenarios.find(a=>a.strength===s)),n=v.reduce((a,b)=>a+b.races,0);
  return {strength:s,races:n,pressure_races:v.reduce((a,b)=>a+b.pressure_races,0),slow_races:v.reduce((a,b)=>a+b.slow_races,0),
   insufficient_evidence:v.reduce((a,b)=>a+b.insufficient_evidence,0),top1:v.reduce((a,b)=>a+b.top1,0),
   top3:v.reduce((a,b)=>a+b.top3,0),top5:v.reduce((a,b)=>a+b.top5,0),
   brier:+(v.reduce((a,b)=>a+b.races*b.brier,0)/n).toFixed(6),
   log_loss:+(v.reduce((a,b)=>a+b.races*b.log_loss,0)/n).toFixed(6)};
 });
 return {schema:'racing-lab-historical-pace-shadow/v1',status:'RETROSPECTIVE_RESEARCH_NOT_DEPLOYABLE',
  results_used_only_to_score:true,source_historical_settle_positions_only:true,
  horse_sectional_speeds_fabricated:false,live_formula_unchanged:true,
  thresholds:{min_coverage:.70,front_fraction_max:.34,multiple_leaders_min:4,slow_leaders_max:1,slow_min_field:8},
  strengths:STRENGTHS,dates:rows,totals:total,
  caveats:['Historical settling is not a verified race-day speed map, individual 600m sectional, rider intention, or known pace.',
   'All 91 races are retrospective; 17/24 source freeze unverified, 31 Oct has seven field-mismatched races excluded, 3 Nov is the saved Monday field.',
   'Predeclared rules are provisional; no retrospective improvement warrants production promotion without genuine forward tests.']};
}
if(require.main===module)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
module.exports={run,scenario,predict,evaluate,STRENGTHS};
