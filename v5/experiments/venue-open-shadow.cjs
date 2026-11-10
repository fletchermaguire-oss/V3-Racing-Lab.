'use strict';
/* V5-L5 targeted shadow test: possible class-context bias for strong results in
 * generic, ungraded regional Open/Quality races. One bounded optional residual.
 * NEVER assert country horses are weaker, change L5 coefficients, or auto-select
 * from retrospective outcomes. The region dictionary is a research hypothesis,
 * NOT verified official metropolitan/provincial/country handicap classification.
 * Original model p_exact + model temperature/reserve remain untouched for alpha=0.
 */
const assert=require('node:assert/strict');
const Model=require('../model.js');
const Rank=require('./rank-driver-shadow.cjs');
const ALPHAS=Object.freeze([0,0.18,0.36]);
const REGIONAL=new Set(['DUBBO','TAMWORTH','MUSWELLBROOK','WAGGA','WAGGA WAGGA',
 'GRAFTON','WARRNAMBOOL','OAKBANK','BATHURST','MUDGEE','KALGOORLIE',
 'NORTHAM','BUNBURY','COFFS HARBOUR','TOOWOOMBA','WANGARATTA','PENOLA',
 'ALBURY','COWRA','ORANGE','SCONE']);
const CARDS=Object.freeze({
 '2026-10-17':require('../backtests/2026-10-17-retrospective.json').input,
 '2026-10-24':require('../backtests/2026-10-24-retrospective.json').input,
 '2026-10-31':require('../research.json'),
 '2026-11-03':require('../cards/2026-11-03/research.json')
});
function toDay(d){
 const m=String(d||'').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 if(!m)return null;
 const x=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
 const t=Date.parse(x+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===x?x:null;
}
function canon(s){return String(s||'').toUpperCase().replace(/\s+/g,' ').trim().replace(/[^A-Z0-9]/g,'');}
function isUntieredOpen(label){
 const n=String(label||'').toUpperCase();
 return /\b(?:OPEN|QLTY|QUALITY)\b/.test(n)&&
 !/\b(?:G[123]|GROUP\s*[123]|LR|LISTED|BM(?:0-)?\d+|1MW|NMW1Y|CL[1-6])\b/.test(n);
}
function extractStarts(form,cutoff){
 const rows=[],seen=new Set(),text=String(form||'');
 // PDF-dated form: one verified historical start per line.
 for(const l of text.split('\n')){
  const m=l.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(\d+)m\s+\([GSH]\),\s*(.+?):\s*(\d+)\/(\d+),\s*PDF margin\s*([\d.]+)L/i);
  if(!m)continue;
  const date=toDay(m[1]),v=canon(m[2]),className=m[4],pos=+m[5],field=+m[6],margin=+m[7];
  if(!date||date>=cutoff||!v||!Number.isFinite(margin)||field<2||pos<1||pos>field||seen.has(date))continue;
  seen.add(date);rows.push({date,venue:v,className,pos,field,margin});
 }
 // 24 October snapshot format: archived pre-race historical lines.
 if(/^Previous Friday source-snapshot race form/.test(text)){
  const re=/(\d+)(?:st|nd|rd|th)\s+of\s+(\d+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+Margin\s+([\d.]+)\s+Lengths?\s+Distance\s+\d+m\s+SOT\s+[GSH]\s+RST\s+(.+?)\s+Race\b/gi;
  for(const m of text.matchAll(re)){
   const date=toDay(m[3]),v=canon(m[4]),className=m[6],pos=+m[1],field=+m[2],margin=+m[5];
   if(!date||date>=cutoff||!v||field<2||pos<1||pos>field||seen.has(date))continue;
   seen.add(date);rows.push({date,venue:v,className,pos,field,margin});
  }
 }
 return rows.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
}
function exposure(form,cutoff){
 const starts=extractStarts(form,cutoff),den=starts.reduce((s,x,i)=>s+Math.pow(.82,i),0);
 const qualified=starts.filter(s=>REGIONAL.has(s.venue)&&isUntieredOpen(s.className)&&(s.pos===1||(s.pos===2&&s.margin<=2)));
 const value=den?starts.reduce((s,x,i)=>s+((REGIONAL.has(x.venue)&&isUntieredOpen(x.className)&&
  (x.pos===1||(x.pos===2&&x.margin<=2)))?Math.pow(.82,i):0),0)/den:0;
 return {value,starts:starts.length,qualifying:qualified.length,disclosure:'Region labels are venue proxies, not verified rival quality.'};
}
function normalize(rows,meta,alpha){
 assert.ok(ALPHAS.includes(alpha)&&rows.length>=2);
 const n=rows.length,u=Model.CONFIG.uniformReserve,t=Model.CONFIG.temperature;
 const raw=rows.map(x=>{
  const q=(x.p_exact/100-u/n)/(1-u);
  assert.ok(q>0&&Number.isFinite(q),'Original model must have a positive, complete distribution');
  const ex=meta.get(x.id)||{value:0,starts:0,qualifying:0};
  return {...x,baseline:x.p_exact/100,exposure:ex.value,raw:q*Math.exp(-alpha*ex.value/t)};
 });
 const total=raw.reduce((s,r)=>s+r.raw,0);
 const ranked=raw.map(r=>({id:r.id,horse:r.horse,probability:u/n+(1-u)*r.raw/total,
  baseline:r.baseline,exposure:r.exposure}));
 assert.ok(Math.abs(ranked.reduce((s,r)=>s+r.probability,0)-1)<1e-10);
 if(alpha===0)assert.ok(ranked.every(r=>Math.abs(r.baseline-r.probability)<1e-10));
 return ranked.sort((a,b)=>b.probability-a.probability||a.id.localeCompare(b.id));
}
function winnerId(c){
 const matches=c.rows.filter(x=>c.winner.id?x.id===c.winner.id:canon(x.horse)===canon(c.winner.horse));
 assert.equal(matches.length,1,'Winner must match exactly one archived contender: '+c.id);
 return matches[0].id;
}
function evaluateDataset(dataset,alpha,sourceCard){
 const form=new Map(sourceCard.runners.map(h=>[h.id,h]));
 const cutoff=String(sourceCard.saved_at||dataset.date).slice(0,10);
 const qa={date:dataset.date,alpha,races:dataset.races.length,affected_races:0,
  affected_runners:0,unmatched_runners:0,top1:0,top3:0,top5:0,
  brier:0,log_loss:0,flips:[],race_outcomes:[]};
 for(const race of dataset.races){
  const meta=new Map();
  for(const row of race.rows){
   const h=form.get(row.id);
   if(!h){qa.unmatched_runners++;continue;}
   const e=exposure(h.form,cutoff);meta.set(row.id,e);
   if(e.value>0)qa.affected_runners++;
  }
  const p=normalize(race.rows,meta,alpha),win=winnerId(race),r=p.findIndex(x=>x.id===win)+1;
  const original=race.rows.slice().sort((a,b)=>b.p_exact-a.p_exact||a.id.localeCompare(b.id))[0];
  if([...meta.values()].some(x=>x.value>0))qa.affected_races++;
  if(original.id!==p[0].id){
   qa.flips.push({race_id:race.id,from:original.horse,to:p[0].horse,
    helped:p[0].id===win,harmed:original.id===win,
    original_win:original.id===win,shadow_win:p[0].id===win});
  }
  qa.top1+=r===1?1:0;qa.top3+=r<=3?1:0;qa.top5+=r<=5?1:0;
  qa.brier+=p.reduce((z,x)=>z+(x.probability-(x.id===win?1:0))**2,0);
  qa.log_loss+=-Math.log(p.find(x=>x.id===win).probability);
  qa.race_outcomes.push({race_id:race.id,winner_rank:r,leader:p[0].id});
 }
 qa.brier=+(qa.brier/qa.races).toFixed(6);
 qa.log_loss=+(qa.log_loss/qa.races).toFixed(6);
 return qa;
}
function run(){
 const ds=Rank.loadDatasets();
 const summary=ALPHAS.map(alpha=>{
  const dates=ds.map(d=>evaluateDataset(d,alpha,CARDS[d.date]));
  const n=dates.reduce((a,b)=>a+b.races,0);
  const agg=k=>dates.reduce((a,b)=>a+b[k],0);
  return {alpha,races:n,top1:agg('top1'),top3:agg('top3'),top5:agg('top5'),
   brier:+(dates.reduce((s,d)=>s+d.races*d.brier,0)/n).toFixed(6),
   log_loss:+(dates.reduce((s,d)=>s+d.races*d.log_loss,0)/n).toFixed(6),
   affected_races:agg('affected_races'),affected_runners:agg('affected_runners'),
   unmatched_runners:agg('unmatched_runners'),flips:dates.flatMap(d=>d.flips),
   gains:dates.flatMap(d=>d.flips).filter(f=>f.helped&&!f.harmed).length,
   harms:dates.flatMap(d=>d.flips).filter(f=>f.harmed&&!f.helped).length,
   dates:dates.map(d=>({date:d.date,races:d.races,top1:d.top1,top3:d.top3,
    top5:d.top5,brier:d.brier,log_loss:d.log_loss,affected_races:d.affected_races,
    unmatched_runners:d.unmatched_runners,flips:d.flips}))};
 });
 const original=summary[0];
 assert.equal(original.races,91);
 assert.equal(original.top1,27);
 return {schema:'racing-lab-regional-ungraded-open-shadow/v1',
  status:'RETROSPECTIVE_DIAGNOSTIC_NOT_DEPLOYABLE',
  known_venue_dictionary:[...REGIONAL].sort(),hypothesis:'Penalize only a small share of high-performing, ungraded regional Open results',
  source_type:'HISTORICAL_FORM_ONLY',cutoff:'PRE_RACE_ARCHIVED_DATE_ONLY',results_used_as_predictors:false,
  original_L5_unchanged:true,independently_frozen_forward_evidence:false,
  scenarios:summary,
  decision:'Do not promote without prospective results. A diagnostic that fails to improve is a useful rejected hypothesis.',
  caveats:['Regional venue dictionary is an unverified context proxy, not independently established opponent strength.',
   'Source archive includes retrospective reconstructions on 17/24 October, seven excluded 31 October mismatched fields and Monday 3 November preliminary inputs.',
   'One or two retrospective changes can be accidental; all correct and incorrect changes are listed.',
   'Nothing in this program changes the L5 model, published selections, human shortlist or results.']};
}
if(require.main===module)console.log(JSON.stringify(run(),null,2));
module.exports={ALPHAS,REGIONAL,CARDS,isUntieredOpen,extractStarts,exposure,normalize,run,evaluateDataset};
