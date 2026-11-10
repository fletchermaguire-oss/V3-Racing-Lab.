'use strict';
/*
 * V5 read-only, leakage-aware rank-driver ablation.
 *
 * Independently sourced POST-RACE winners live outside every model input.
 * The ranker is not trained or changed here. All rows are exploratory:
 * 17/24 Oct were retrospectively reconstructed; 31 Oct has seven field
 * mismatches excluded; 3 Nov is saved 2 Nov provisional (not final starters).
 *
 * Compare fixed recent-form multipliers without selecting a production winner.
 * An alpha multiplier is applied to each original logit contribution and the
 * full race is renormalised with the ORIGINAL uniform reserve and temperature.
 */
const assert=require('node:assert/strict');
const Model=require('../model.js');
const State=require('../site-state.js');
const OCT31=require('../audits/2026-10-31-postrace-review.json');
const NOV03=require('./2026-11-03-verified-winners.json');
const NOV03_ANALYSIS=require('../cards/2026-11-03/analysis.json');
const ALPHAS=Object.freeze([0,0.5,0.75,1,1.25,1.5]);

function canonical(s){
 return String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
}
function verifiedReconstructed(date){
 const src=require('../backtests/'+date+'-retrospective.json');
 assert.equal(src.date,date);
 assert.equal(src.backtest_eligible,false);
 const baseline=Model.calculate(src.input,src.going);
 const winners=src.results.filter(x=>x.verified===true&&x.won===true);
 assert.equal(winners.length,src.input.races.length);
 const map=new Map();
 for(const winner of winners){
  assert.ok(!map.has(winner.race_id),'Duplicated winner: '+winner.race_id);
  map.set(winner.race_id,{id:winner.id});
 }
 return {date,source:'RECONSTRUCTED_POSTRACE_ARCHIVE_NO_FREEZE_PROOF',
  races:baseline.races.map(r=>({id:r.id,rows:baseline.records.filter(x=>x.race_id===r.id),winner:map.get(r.id)}))};
}
function october31(){
 const src=require('../research.json'),overlay=require('../official-latest.json');
 const data=State.applyOfficialOverlay(src,overlay);
 const baseline=Model.calculate(data,overlay.going);
 const mismatch=new Set(OCT31.mismatches.map(x=>src.date+'_'+x.meeting+'_R'+String(x.race).padStart(2,'0')));
 assert.equal(mismatch.size,7);
 const valid=OCT31.records.filter(x=>!mismatch.has(x.race_id));
 assert.equal(valid.length,22);
 const included=new Set(valid.map(x=>x.race_id));
 const winners=new Map(valid.map(x=>[x.race_id,{horse:x.winner}]));
 assert.equal(winners.size,22);
 return {date:'2026-10-31',source:'SAVED_CARD_PROVISIONAL_7_FIELD_MISMATCHES_EXCLUDED',
  excluded_field_mismatches:[...mismatch].sort(),
  races:baseline.races.filter(r=>included.has(r.id)).map(r=>({id:r.id,rows:baseline.records.filter(x=>x.race_id===r.id),winner:winners.get(r.id)}))};
}
function november03(){
 assert.equal(NOV03.schema,'racing-lab-postrace-verified-winners/v1');
 assert.equal(NOV03.status,'POST_RACE_RESULTS_ONLY_NOT_A_PRE_RACE_FEATURE');
 assert.equal(NOV03.date,NOV03_ANALYSIS.date);
 assert.equal(NOV03_ANALYSIS.calibrated,false);
 assert.equal(NOV03_ANALYSIS.publication_approved,false);
 const winners=new Map();
 for(const r of NOV03.results){
  assert.ok(NOV03.source_urls[r.source]?.startsWith('https://'));
  assert.ok(!winners.has(r.race_id),'Duplicate November winner');
  winners.set(r.race_id,{horse:r.winner});
 }
 assert.equal(winners.size,20);
 return {date:'2026-11-03',source:'PRE_RACE_MON_2NOV_UNVERIFIED_FIELD_SAVED_ANALYSIS',
  races:NOV03_ANALYSIS.races.map(r=>({id:r.id,rows:NOV03_ANALYSIS.records.filter(x=>x.race_id===r.id),winner:winners.get(r.id)}))};
}
function remap(rows,alpha){
 assert.ok(Number.isFinite(alpha)&&alpha>=0&&alpha<=2);
 assert.ok(rows.length>=2);
 const u=Model.CONFIG.uniformReserve,temperature=Model.CONFIG.temperature,n=rows.length;
 const weighted=rows.map(x=>{
  assert.ok(x.p_exact>0&&Number.isFinite(x.features?.recency));
  const q=(x.p_exact/100-u/n)/(1-u);
  assert.ok(q>0,'Cannot invert the original uniform-reserve normalisation');
  return {id:x.id,horse:x.horse,w:q*Math.exp((alpha-1)*x.features.recency/temperature)};
 });
 const sum=weighted.reduce((a,x)=>a+x.w,0);
 const converted=weighted.map(x=>({id:x.id,horse:x.horse,p:(1-u)*x.w/sum+u/n}));
 assert.ok(converted.every(x=>x.p>0&&x.p<1));
 assert.ok(Math.abs(converted.reduce((a,x)=>a+x.p,0)-1)<1e-10);
 if(alpha===1)for(const x of converted){
  const original=rows.find(r=>r.id===x.id);
  assert.ok(Math.abs(x.p-original.p_exact/100)<1e-11,'Baseline not reproduced');
 }
 return converted.sort((a,b)=>b.p-a.p||a.id.localeCompare(b.id));
}
function resolve(c){
 assert.ok(c.winner&&c.rows.length>=2,'Unscorable race '+c.id);
 const matched=c.rows.filter(x=>c.winner.id?x.id===c.winner.id:canonical(x.horse)===canonical(c.winner.horse));
 assert.equal(matched.length,1,'Winner not uniquely matched in saved race: '+c.id);
 return matched[0].id;
}
function evaluate(dataset,alpha){
 const cases=dataset.races.map(c=>{
  const winnerId=resolve(c),reweighted=remap(c.rows,alpha);
  const rank=reweighted.findIndex(x=>x.id===winnerId)+1;
  const winnerP=reweighted[rank-1].p;
  const brier=reweighted.reduce((s,x)=>s+(x.p-(x.id===winnerId?1:0))**2,0);
  return {race_id:c.id,field_size:c.rows.length,winner_id:winnerId,rank,
    winner_probability:winnerP,leader_id:reweighted[0].id,leader_gap_pp:100*(reweighted[0].p-reweighted[1].p),
    log_loss:-Math.log(winnerP),brier};
 });
 const mean=k=>+(cases.reduce((s,x)=>s+x[k],0)/cases.length).toFixed(6);
 const hits=n=>cases.filter(x=>x.rank<=n).length;
 const sizes={large:cases.filter(x=>x.field_size>=15),small:cases.filter(x=>x.field_size<15)};
 return {date:dataset.date,alpha,source:dataset.source,races:cases.length,
  top1:hits(1),top3:hits(3),top5:hits(5),outside_top5:cases.length-hits(5),
  mean_log_loss:mean('log_loss'),mean_multiclass_brier:mean('brier'),
  large_fields:{races:sizes.large.length,top1:sizes.large.filter(x=>x.rank===1).length,
    outside_top5:sizes.large.filter(x=>x.rank>5).length},
  small_fields:{races:sizes.small.length,top1:sizes.small.filter(x=>x.rank===1).length,
    outside_top5:sizes.small.filter(x=>x.rank>5).length},
  winner_ranks:alpha===1?cases.map(x=>({race_id:x.race_id,rank:x.rank,field_size:x.field_size})):undefined};
}
function run(){
 const datasets=[verifiedReconstructed('2026-10-17'),verifiedReconstructed('2026-10-24'),october31(),november03()];
 const expected=[30,19,22,20];
 datasets.forEach((d,i)=>assert.equal(d.races.length,expected[i]));
 const assessments=datasets.map(d=>({date:d.date,source:d.source,
  excluded_field_mismatches:d.excluded_field_mismatches||[],
  scenarios:ALPHAS.map(a=>evaluate(d,a))}));
 const baseline=assessments.map(x=>x.scenarios.find(s=>s.alpha===1));
 assert.deepEqual(baseline.map(x=>x.top1).slice(0,2),[13,4]);
 assert.equal(baseline[3].top1,3,'Stored Monday 2 Nov provisional top-one audit must not be rewritten');
 const aggregate=ALPHAS.map(alpha=>{
  const rows=assessments.map(d=>d.scenarios.find(x=>x.alpha===alpha));
  const n=rows.reduce((s,x)=>s+x.races,0);
  return {alpha,races:n,top1:rows.reduce((s,x)=>s+x.top1,0),
   top3:rows.reduce((s,x)=>s+x.top3,0),top5:rows.reduce((s,x)=>s+x.top5,0),
   mean_log_loss:+(rows.reduce((s,x)=>s+x.races*x.mean_log_loss,0)/n).toFixed(6),
   mean_multiclass_brier:+(rows.reduce((s,x)=>s+x.races*x.mean_multiclass_brier,0)/n).toFixed(6)};
 });
 assert.ok(aggregate.every(x=>x.races===91));
 return {schema:'racing-lab-v5-rank-driver-shadow/v1',status:'RESEARCH_ONLY_NOT_A_TRAINING_HOLDOUT',
  trained:false,promoted_model:false,changed_production_files:false,results_enter_forecasting:false,
  model_version:Model.VERSION,feature:'recency',original_coefficient:Model.CONFIG.weights.recency,
  test_multipliers:ALPHAS,scored_races:91,baseline_cohort_counts:baseline.map(x=>({date:x.date,races:x.races,top1:x.top1,
    top3:x.top3,top5:x.top5,large_fields:x.large_fields})),assessments,aggregate,
  caveats:['Every date is retrospective for this analysis; 17/24 Oct reconstructions may contain later edits.',
   'Seven 31 Oct races are excluded due to documented starter-list mismatches. The 3 Nov source is a Monday provisional field, NOT the final 3 Nov scratched field.',
   'The 3 Nov results were already known when investigating recency: none of these dates is a genuine untouched final holdout for selecting a multiplier.',
   'A change in winner rankings does not establish calibrated probabilities or future hit rate. No weight or shortlist is promoted automatically.',
   'Keep venue, class, field size and track sensitivity comparisons and collect genuinely timestamped pre-race fields before training.']};
}
if(require.main===module)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
module.exports={run,remap,evaluate,ALPHAS,loadDatasets:()=>[verifiedReconstructed('2026-10-17'),verifiedReconstructed('2026-10-24'),october31(),november03()]};
