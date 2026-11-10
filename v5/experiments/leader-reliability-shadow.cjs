'use strict';
/* PREDECLARED research-only screens against stored V5-L5 leaders.
 * No changes to coefficients, full-field model, forecast, or frozen boards.
 * Winning label is only consulted AFTER the selection/ranking is calculated.
 */
const assert=require('node:assert/strict');
const Rank=require('./rank-driver-shadow.cjs');
const canonical=s=>String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
function selectionFromRace(race){
 const rows=race.rows.slice().sort((a,b)=>b.p_exact-a.p_exact||a.id.localeCompare(b.id));
 assert.ok(rows.length>=2);
 const r=rows[0],gap=r.p_exact-rows[1].p_exact;
 const dated=r.form_audit&&Number.isFinite(r.form_audit.accepted)?r.form_audit.accepted:0;
 const complete=Number.isFinite(r.completeness)?r.completeness:0;
 const grade=Number.isFinite(r.grade_quality)?r.grade_quality:0;
 const issues=Array.isArray(r.input_issues)?r.input_issues:[];
 const weakGrade=grade<=0,thinEvidence=dated<3||complete<.70||issues.length>0;
 const crowded=rows.length>=15,unclearGap=gap<5;
 // Fixed risk screen only: gap, form coverage, size. Not a calibrated p.
 const screens={
  probability_at_least_20:r.p_exact>=20,
  separation_5pp_and_20pct:r.p_exact>=20&&gap>=5,
  evidence_3starts_70pct:!thinEvidence&&!weakGrade,
  compact_field_under15:!crowded,
  strict_winfirst:r.p_exact>=20&&gap>=5&&!thinEvidence&&!weakGrade&&!crowded
 };
 const qualityPenalty=(weakGrade?5:0)+(dated<3?3:0)+(complete<.70?3:0)+(issues.length?3:0)+(crowded?2:0);
 return {race_id:race.id,leader_id:r.id,leader_horse:r.horse,p:r.p_exact,gap,
  field_size:rows.length,completeness:complete,dated_starts:dated,
  grade_quality:grade,issue_count:issues.length,
  screens,quality_ranking_score:r.p_exact-qualityPenalty,
  baseline_ranking_score:r.p_exact,risk_reasons:[
   ...(weakGrade?['MISSING_RECOGNISED_CLASS']:[]),
   ...(dated<3?['FEWER_THAN_THREE_DATED_STARTS']:[]),
   ...(complete<.70?['COMPLETENESS_BELOW_70']:[]),
   ...(issues.length?['PARSED_INPUT_ISSUES']:[]),
   ...(crowded?['FIELD_15_PLUS']:[]),
   ...(unclearGap?['LEADER_GAP_BELOW_5PP']:[])
  ]};
}
function resolveWinner(race){
 const match=race.rows.filter(x=>race.winner.id?x.id===race.winner.id:canonical(x.horse)===canonical(race.winner.horse));
 assert.equal(match.length,1,'Winner must match one saved field: '+race.id);
 return match[0].id;
}
function wilson(w,n){
 if(!n)return null;
 const z=1.96,p=w/n,d=1+z*z/n,m=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;
 return [Math.max(0,(m-h)),Math.min(1,(m+h))].map(v=>+v.toFixed(4));
}
function stat(items){
 const n=items.length,w=items.filter(x=>x.won).length;
 return {picks:n,wins:w,hit_rate:n?+(w/n).toFixed(4):null,wilson95:wilson(w,n),
  model_expected_winners:+(items.reduce((sum,x)=>sum+(Number.isFinite(x.p)?x.p:0)/100,0)).toFixed(3)};
}
function topK(items,k,field){
 const sorted=items.slice().sort((a,b)=>b[field]-a[field]||a.race_id.localeCompare(b.race_id));
 return {k,selected:sorted.slice(0,k).map(x=>({race_id:x.race_id,horse:x.leader_horse,won:x.won,p:x.p})),
  ...stat(sorted.slice(0,k))};
}

function contrast(original,challenger){
 const a=new Map(original.selected.map(x=>[x.race_id,x])),b=new Map(challenger.selected.map(x=>[x.race_id,x]));
 const removed=[...a.values()].filter(x=>!b.has(x.race_id));
 const added=[...b.values()].filter(x=>!a.has(x.race_id));
 assert.equal(removed.length,added.length,'Fixed-size cohort must exchange equal picks');
 return {changes:added.length,additional_winners:added.filter(x=>x.won).length,
  removed_winners:removed.filter(x=>x.won).length,
  net_wins:added.filter(x=>x.won).length-removed.filter(x=>x.won).length,
  added,removed};
}

function evaluate(){
 const raw=Rank.loadDatasets(),days=[];
 for(const d of raw){
  const items=d.races.map(r=>{
   const before=selectionFromRace(r);
   const winner=resolveWinner(r);
   return {...before,won:winner===before.leader_id};
  });
  assert.equal(new Set(items.map(x=>x.race_id)).size,items.length);
  const keys=Object.keys(items[0].screens);
  const screens=Object.fromEntries(keys.map(k=>[k,stat(items.filter(x=>x.screens[k]))]));
  const baseline={top5:topK(items,5,'baseline_ranking_score'),
   top10:topK(items,10,'baseline_ranking_score'),top15:topK(items,15,'baseline_ranking_score')};
  const quality={top5:topK(items,5,'quality_ranking_score'),
   top10:topK(items,10,'quality_ranking_score'),top15:topK(items,15,'quality_ranking_score')};
  const swaps=Object.fromEntries([5,10,15].map(k=>['top'+k,contrast(baseline['top'+k],quality['top'+k])]));
  days.push({date:d.date,source:d.source,races:items.length,baseline:stat(items),
   by_field_size:{under15:stat(items.filter(x=>x.field_size<15)),
    at_least15:stat(items.filter(x=>x.field_size>=15))},
   screens,leaderboard:{baseline,quality},swaps,
   // Prospective debugging: separate all entries, including losses.
   cases:items});
 }
 const all=days.flatMap(d=>d.cases),keys=Object.keys(all[0].screens);
 const byScreen=Object.fromEntries(keys.map(k=>[k,stat(all.filter(x=>x.screens[k]))]));
 const totals={baseline:stat(all),under15:stat(all.filter(x=>x.field_size<15)),
  at_least15:stat(all.filter(x=>x.field_size>=15)),screens:byScreen,
  leaderboard:{}};
 for(const k of [5,10,15]){
  let sums={};
  for(const label of ['baseline','quality']){
   const selected=days.flatMap(d=>d.leaderboard[label]['top'+k].selected);
   sums[label]={...stat(selected),days:days.length};
  }
  const differences=days.map(d=>({date:d.date,...d.swaps['top'+k]}));
  totals.leaderboard['top'+k]={...sums,
    swaps:days.map(d=>({date:d.date,...d.swaps['top'+k]}))};

 }
 return {schema:'racing-lab-leader-reliability-shadow/v1',
  status:'RETROSPECTIVE_NO_HOLDOUT_DO_NOT_DEPLOY',
  independent_forward_evidence:false,original_l5_unchanged:true,probabilities_calibrated:false,
  predeclared_filters:['p_exact>=20','gap>=5pp','3 dated starts and >=70% dossier with no parsing issues',
    'known historical class','field <15; strict = all'],
  simple_quality_ranking:'p_exact - 5 if missing class -3 if <3 dated starts -3 if completeness<70% -3 if any parse errors -2 if field>=15',
  sample_limitation:'17/24 retrospective reconstructions; 31 Oct excludes 7 mismatched fields; 3 Nov Monday provisional card.',
  dates:days,totals,
  caution:'Selective hit rate can rise by refusing hard races. Always report coverage, winner counts, Wilson intervals and harmed Top-5/10/15; do not fit thresholds to these four known-result dates.'};
}
if(require.main===module)console.log(JSON.stringify(evaluate(),null,2));
module.exports={selectionFromRace,resolveWinner,wilson,topK,evaluate};
