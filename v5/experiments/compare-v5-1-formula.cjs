'use strict';
/* V5 versus V5.1 numerical formula: matched-field, retrospective diagnostics.
 * This file loads outcomes ONLY for scoring and never inside either model.
 * These dates are NOT a prospective pre-race frozen calibration set.
 */
const assert=require('node:assert/strict');
const V5=require('../model.js');
const V51=require('./model-v5-1.cjs');
const State=require('../site-state.js');
const Source31=require('../research.json');
const Overlay31=require('../official-latest.json');
const Audit31=require('../audits/2026-10-31-postrace-review.json');
const History17=require('../backtests/2026-10-17-retrospective.json');
const History24=require('../backtests/2026-10-24-retrospective.json');
const R7=require('../cards/2026-11-07/rosehill-research.json');
const A7=require('../cards/2026-11-07/ascot-research.json');
const O7=require('../cards/2026-11-07/official-final.json');
const Q=require('./v5-1-evidence-gate.cjs');
const canonical=s=>String(s||'').normalize('NFKD').toUpperCase()
 .replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const round=x=>Number(x.toFixed(6));
const avg=(rows,k)=>round(rows.reduce((s,r)=>s+r[k],0)/rows.length);
function scores(model,data,going,winners,exclude=new Set()){
 const out=model.calculate(data,going),rows=[];
 for(const [raceId,winner] of winners){
  if(exclude.has(raceId))continue;
  const field=out.records.filter(x=>x.race_id===raceId);
  assert(field.length>=2,'Incomplete model race '+raceId);
  const w=field.find(x=>x.id===winner||canonical(x.horse)===canonical(winner));
  assert(w,'Outcome winner absent from saved field '+raceId+' '+winner);
  const p=w.p_exact/100,leader=field.find(x=>x.rank===1);
  assert(leader,'Missing model leader '+raceId);
  assert(Math.abs(field.reduce((s,x)=>s+x.p_exact,0)-100)<1e-9,'Not normalized '+raceId);
  rows.push({raceId,winner:w.id,leader:leader.id,hit:Number(w.id===leader.id),
   brier:field.reduce((s,x)=>s+Math.pow(x.p_exact/100-Number(x.id===w.id),2),0),
   logloss:-Math.log(Math.max(1e-15,p)),winner_probability:p,field:field.map(x=>x.id).sort()});
 }
 return rows;
}
const nameToId=(date,meeting,r)=>date+'_'+meeting+'_R'+String(r).padStart(2,'0');
const NOV7_VERIFIED_WINNERS=[
 ['ROSEHILL',3,'SAVVY SPY (NZ)','https://racehub.com.au/raceday-wrap/rosehill-2026-11-07'],
 ['ROSEHILL',5,'PROBABILITY THEORY','https://racehub.com.au/form-guide/horse-racing/rosehill/2026-11-07/race-5'],
 ['ROSEHILL',7,'LAZZURA','https://racehub.com.au/raceday-wrap/rosehill-2026-11-07'],
 ['ROSEHILL',10,'HORSESHOE HILL','https://racehub.com.au/raceday-wrap/rosehill-2026-11-07'],
 ['ASCOT',6,'BEATTY','https://www.tabtouch.com.au/racing/2026-11-07/pr'],
 ['ASCOT',7,'OURGIRLCANRUN','https://racehub.com.au/form-guide/horse-racing/ascot/2026-11-07/race-7'],
 ['ASCOT',9,'KING OF LIGHT','https://www.tabtouch.com.au/racing/2026-11-07/pr']
];
function groups(){
 const hist=[History17,History24].map(d=>{
  assert.equal(d.backtest_eligible,false);
  assert.equal(d.status,'RETROSPECTIVE_RESEARCH_DIAGNOSTIC_ONLY');
  const winners=d.results.filter(x=>x.verified===true&&x.won===true).map(x=>[x.race_id,x.id]);
  assert.equal(winners.length,d.input.races.length);
  return {label:d.date,type:'RETROSPECTIVE_RECONSTRUCTED',data:d.input,going:d.going,winners,exclude:new Set()};
 });
 const source=State.applyOfficialOverlay(Source31,Overlay31);
 const bad=new Set(Audit31.mismatches.map(x=>nameToId(Audit31.date,x.meeting,x.race)));
 assert.equal(bad.size,7);
 const october={label:'2026-10-31',type:'ARCHIVED_MISMATCH_FILTERED',
  data:source,going:Overlay31.going,
  winners:Audit31.records.map(x=>[x.race_id,x.winner]),exclude:bad};
 const november=['ROSEHILL','ASCOT'].map(meeting=>{
  const original=meeting==='ROSEHILL'?R7:A7;
  const rec=Q.reconcileSnapshot(original,O7,meeting);
  assert.equal(rec.provenance.date,'2026-11-07');
  const winners=NOV7_VERIFIED_WINNERS.filter(x=>x[0]===meeting)
   .map(x=>[nameToId('2026-11-07',x[0],x[1]),x[2]]);
  return {label:'2026-11-07/'+meeting,type:'SEVEN_CHOSEN_REVIEWED_RACES_ONLY',
   data:rec.data,going:{default:'Good 4'},winners,exclude:new Set()};
 });
 return [...hist,october,...november];
}
function run(){
 const output=groups().map(g=>{
  const base=scores(V5,g.data,g.going,g.winners,g.exclude);
  const candidate=scores(V51,g.data,g.going,g.winners,g.exclude);
  assert.equal(candidate.length,base.length);
  for(let i=0;i<base.length;i++){
   assert.equal(candidate[i].raceId,base[i].raceId);
   assert.equal(candidate[i].winner,base[i].winner);
   assert.deepEqual(candidate[i].field,base[i].field);
  }
  const summarize=x=>({races:x.length,top1_wins:x.reduce((s,r)=>s+r.hit,0),
   mean_multiclass_brier:avg(x,'brier'),mean_log_loss:avg(x,'logloss'),
   mean_winner_probability:avg(x,'winner_probability')});
  return {date:g.label,provenance:g.type,
   baseline:summarize(base),candidate:summarize(candidate),
   leader_changes:candidate.filter((x,i)=>x.leader!==base[i].leader).map((x,i)=>({
     race:x.raceId,original:base[i].leader,candidate:x.leader,winner:x.winner
   })),baseline_races:base,candidate_races:candidate};
 });
 const head=output.slice(0,3),sum=(name,key)=>{
  const n=head.reduce((z,x)=>z+x[name].races,0);
  return key==='races'?n:key==='top1_wins'?
   head.reduce((z,x)=>z+x[name].top1_wins,0):
   round(head.reduce((z,x)=>z+x[name][key]*x[name].races,0)/n);
 };
 const keys=['races','top1_wins','mean_multiclass_brier','mean_log_loss'];
 const totals={};
 for(const model of ['baseline','candidate']){
  totals[model]=Object.fromEntries(keys.map(k=>[k,sum(model,k)]));
 }
 return {schema:'v5-1-matched-field-formula-comparison/v1',
  run_kind:'RETROSPECTIVE_DIAGNOSTIC_ONLY',baseline_version:V5.VERSION,
  candidate_version:V51.VERSION,formula_approved:false,
  prospective_frozen_forecasts:0,
  historical_totals:totals,
  groups:output.map(x=>({date:x.date,provenance:x.provenance,baseline:x.baseline,
   candidate:x.candidate,leader_changes:x.leader_changes})),
  notes:['17 and 24 October snapshots are retrospective reconstructions, not independently proven pre-jump data.',
   '31 October excludes seven saved-versus-actual field mismatches, leaving 22 eligible races.',
   '7 November is ONLY seven reviewed pre-race-selected races, not the full 20 racing results or a model Top 10 record.',
   'This candidate was developed after seeing 7 November results. Better historical metrics are NOT a forward-test improvement.',
   'No result is an input to either model; all results are used in this comparator only.']};
}
if(require.main===module)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
module.exports={run,groups,scores};
