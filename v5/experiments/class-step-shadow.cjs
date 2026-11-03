'use strict';
/* Pre-race class progression challenger. Read-only. Never derives horse
   speed from race-level 600m splits. Never uses results in inputs. */
const assert=require('node:assert/strict');
const M=require('../model.js'),Rank=require('./rank-driver-shadow.cjs');
const ALPHAS=Object.freeze([0,0.2,0.4]);
const SOURCES={
 '2026-10-17':require('../backtests/2026-10-17-retrospective.json').input,
 '2026-10-24':require('../backtests/2026-10-24-retrospective.json').input,
 '2026-10-31':require('../research.json'),
 '2026-11-03':require('../cards/2026-11-03/research.json')
};
const canon=s=>String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const iso=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
function auDate(s){const m=String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):null;}
function history(h,asOf){
 const cutoff=String(asOf).slice(0,10);assert.ok(iso(cutoff));
 const a=[];
 const add=(date,label,pos,field,margin)=>{
  const grade=M.historicalRaceLevel(label);
  if(date&&iso(date)&&date<cutoff&&grade!==null&&Number.isInteger(pos)&&pos>=1&&Number.isInteger(field)&&field>=2&&pos<=field)
   a.push({date,grade,pos,field,margin});
 };
 if(Array.isArray(h.historical_starts)){
  h.historical_starts.forEach(s=>{if(s.used_in_model===true&&Number.isFinite(s.margin_l)&&s.margin_l>=0)
    add(s.date,s.race_class,s.finish,s.field,s.margin_l);});
 }else{
  const form=String(h.form||'');
  if(/^Previous Friday source-snapshot race form \(not refreshed against Saturday\):/.test(form)){
   for(const part of form.split(/\s+\|\s+/)){
    const m=part.match(/(\d+)(?:st|nd|rd|th) of (\d+) (\d{1,2}\/\d{1,2}\/\d{4}) [\s\S]+? RST (.+?) Race\b/i);
    if(m)add(auDate(m[3]),m[4],+m[1],+m[2],null);
   }
  }else{
   for(const line of form.split('\n')){
    const m=line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+.+?\s+\d+m\s+\([GSH]\),\s*(.+?):\s*(\d+)\/(\d+),\s*PDF margin\s*([\d.]+)L/i);
    if(m)add(auDate(m[1]),m[2],+m[3],+m[4],+m[5]);
   }
  }
 }
 return a.sort((x,y)=>y.date.localeCompare(x.date)).slice(0,5);
}
function evidence(h,cutoff){
 const all=history(h,cutoff),competitive=all.filter(x=>x.pos<=3||x.pos/x.field<=0.5||(x.margin!==null&&x.margin<=2));
 return {known:all.length,competitive:competitive.length,
  best_competitive:competitive.length?Math.max(...competitive.map(x=>x.grade)):null};
}
function load(date){
 const card=SOURCES[date];assert.ok(card&&card.date===date&&iso(card.saved_at));
 return {card,races:new Map(card.races.map(x=>[x.id,x])),runners:new Map(card.runners.map(x=>[x.id,x]))};
}
function field(c,ctx,alpha){
 const r=ctx.races.get(c.id);assert.ok(r);
 const target=M.historicalRaceLevel(r.race_class||r.class||'');
 const n=c.rows.length,u=M.CONFIG.uniformReserve,T=M.CONFIG.temperature;
 const rows=c.rows.map(x=>{
  const h=ctx.runners.get(x.id);assert.ok(h,'Unmatched saved runner '+x.id);
  const e=evidence(h,ctx.card.saved_at);
  const gap=target!==null&&e.best_competitive!==null?Math.max(0,target-e.best_competitive):null;
  const q=(x.p_exact/100-u/n)/(1-u);
  assert.ok(q>0);
  return {id:x.id,horse:x.horse,evidence:e,gap,
   baseline:x.p_exact/100,weight:q*Math.exp(-alpha*Math.min(2.5,gap===null?0:gap)/T)};
 });
 const sum=rows.reduce((s,x)=>s+x.weight,0);
 rows.forEach(x=>{x.p=(1-u)*x.weight/sum+u/n;});
 assert.ok(Math.abs(rows.reduce((s,x)=>s+x.p,0)-1)<1e-10);
 if(alpha===0)assert.ok(rows.every(x=>Math.abs(x.p-x.baseline)<1e-11),'Baseline must reproduce exact stored probabilities');
 rows.sort((a,b)=>b.p-a.p||a.id.localeCompare(b.id));
 return {rows,target,graded:rows.filter(x=>x.evidence.known).length,
  class_step:rows.filter(x=>x.gap!==null&&x.gap>0).length};
}
function evaluate(dataset,alpha){
 const ctx=load(dataset.date),cases=[];
 for(const c of dataset.races){
  const winner=c.rows.find(x=>c.winner.id?x.id===c.winner.id:canon(x.horse)===canon(c.winner.horse));
  assert.ok(winner,'Winner missing '+c.id);
  const a=field(c,ctx,alpha),rank=a.rows.findIndex(x=>x.id===winner.id)+1;
  assert.ok(rank>0);
  const p=a.rows[rank-1].p;
  cases.push({race_id:c.id,rank,target_known:a.target!==null,graded:a.graded,class_step:a.class_step,
   log_loss:-Math.log(p),brier:a.rows.reduce((s,x)=>s+(x.p-(x.id===winner.id?1:0))**2,0)});
 }
 const mean=k=>+(cases.reduce((s,x)=>s+x[k],0)/cases.length).toFixed(6);
 return {date:dataset.date,alpha,races:cases.length,targets_known:cases.filter(x=>x.target_known).length,
  class_step_exposures:cases.reduce((s,x)=>s+x.class_step,0),
  top1:cases.filter(x=>x.rank===1).length,top3:cases.filter(x=>x.rank<=3).length,top5:cases.filter(x=>x.rank<=5).length,
  brier:mean('brier'),log_loss:mean('log_loss'),
  winner_ranks:alpha===0?cases.map(x=>({race_id:x.race_id,rank:x.rank,has_target:x.target_known})):undefined};
}
function run(){
 const dates=Rank.loadDatasets().map(d=>({date:d.date,source:d.source,scenarios:ALPHAS.map(a=>evaluate(d,a))}));
 const original=dates.map(d=>d.scenarios[0]);
 assert.deepEqual(original.map(x=>x.races),[30,19,22,20]);
 assert.deepEqual(original.map(x=>x.top1),[13,4,7,3]);
 const totals=ALPHAS.map(a=>{
  const rows=dates.map(d=>d.scenarios.find(x=>x.alpha===a)),n=rows.reduce((s,x)=>s+x.races,0);
  return {alpha:a,races:n,targets_known:rows.reduce((s,x)=>s+x.targets_known,0),
   top1:rows.reduce((s,x)=>s+x.top1,0),top3:rows.reduce((s,x)=>s+x.top3,0),top5:rows.reduce((s,x)=>s+x.top5,0),
   brier:+(rows.reduce((s,x)=>s+x.races*x.brier,0)/n).toFixed(6),
   log_loss:+(rows.reduce((s,x)=>s+x.races*x.log_loss,0)/n).toFixed(6)};
 });
 return {schema:'racing-lab-class-step-shadow/v1',status:'RETROSPECTIVE_RESEARCH_ONLY_NOT_DEPLOYABLE',
  source_fields_only:true,no_result_feature_leakage:true,no_horse_specific_sectionals_invented:true,
  coefficient_changes_live:false,scenarios:ALPHAS,dates,totals,
  caveats:['Historical race-class levels are ordinal proxies, not official performance ratings.',
   'Unknown target grades or insufficient competitive historical form receive no class-step adjustment.',
   'All 91 races are retrospective. 17/24 are unverified source reconstructions; 31 October excludes 7 mismatch races; 3 November uses Monday 2 November preliminary fields.',
   'No winning alpha is a reason to promote the model without later genuinely pre-jump frozen datasets and independent holdouts.']};
}
if(require.main===module)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
module.exports={run,history,evidence,field,evaluate,ALPHAS};
