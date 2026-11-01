/* Exploratory fixed-scenario replay over recorded 31 October winners.
 * This experiment is held OUTSIDE production model/UI. It is not a fitted
 * predictor, credible validation of 60% wins, or a new selection board.
 */
'use strict';
const Model=require('../model.js'),State=require('../site-state.js');
const Source=require('../research.json'),Overlay=require('../official-latest.json');
const Results=require('../audits/2026-10-31-postrace-review.json');
const data=State.applyOfficialOverlay(Source,Overlay);
const frozenGoing=Overlay.going;
const experiments=[
 {id:'original_good4',label:'Original saved going and class',going:frozenGoing,pace:0,classWeight:Model.CONFIG.weights.class},
 {id:'all_strong_pace',label:'Strong pace in every race, no ex-post judgement',going:frozenGoing,pace:1,classWeight:Model.CONFIG.weights.class},
 {id:'all_slow_pace',label:'Slow pace in every race, no ex-post judgement',going:frozenGoing,pace:-1,classWeight:Model.CONFIG.weights.class},
 {id:'class_conservative',label:'Reduced class coefficient (fixed)',going:frozenGoing,pace:0,classWeight:Model.CONFIG.conservativeClass},
 {id:'class_removed',label:'Class completely removed (fixed)',going:frozenGoing,pace:0,classWeight:0}
];
const canonical=s=>String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
function run(){
 if(Results.schema!=='racing-lab-postrace-diagnostics/v1'||Results.date!==data.date||
  Results.records.length!==29)throw Error('Historical diagnostics snapshot does not match pre-race card');
 const bad=new Set(Results.mismatches.map(x=>data.date+'_'+x.meeting+'_R'+String(x.race).padStart(2,'0')));
 const set=Results.records.filter(x=>!bad.has(x.race_id));
 if(set.length!==22||bad.size!==7)throw Error('Expected 22 intact snapshots and seven field mismatches');
 const summary=experiments.map(exp=>{
  const result=Model.calculate(data,exp.going,exp.classWeight,{pace:exp.pace});
  let leaderWins=0,log=0,brier=0,sumWinner=0;
  for(const row of set){
   const field=result.records.filter(x=>x.race_id===row.race_id);
   const winner=field.find(x=>canonical(x.horse)===canonical(row.winner));
   if(!winner||field.length<2)throw Error('Winner missing from clean saved field: '+row.race_id);
   leaderWins+=(winner.rank===1?1:0);
   const pw=winner.p_exact/100;
   if(!(pw>0&&pw<1))throw Error('Bad whole-field distribution');
   sumWinner+=pw;
   log-=Math.log(pw);
   brier+=field.reduce((acc,x)=>acc+Math.pow(x.p_exact/100-(x.id===winner.id?1:0),2),0);
  }
  const round=x=>+(x/set.length).toFixed(6);
  return {id:exp.id,leader_wins:leaderWins,scored_races:set.length,
   mean_log_loss:round(log),mean_multiclass_brier:round(brier),
   mean_winner_probability:round(sumWinner)};
 });
 return {schema:'racing-lab-fixed-pace-class-shadow/v1',
  date:data.date,archive_only:true,model_coefficients_updated:false,
  training_or_model_selection_prohibited:true,
  excluded_field_mismatch_races:[...bad].sort(),clean_races:set.length,scenarios:summary,
  caveats:['This is a retrospective fixed-scenario comparison on 22 one-day races, not a prospective test.',
  'Winner ranks and probability scores depend on the original published field; exclude seven known final-starter mismatches.',
  'Do not pick a winning pace direction or adjust class weights per race after observing the winner.',
  'No independent calibration, speed map, rail/lane data, or 60% strike rate can be inferred here.']};
}
if(require.main===module)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
module.exports={run,experiments};
