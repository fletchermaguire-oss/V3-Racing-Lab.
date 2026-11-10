'use strict';
/* Comparison of two predeclared race-shape rankings on exactly the same fields.
 * No winner can enter predict(); the winner is resolved only afterward.
 * No promotion to original model, public board or recommendation.
 */
const assert=require('node:assert/strict');
const Pace=require('./pace-map-shadow.cjs');
const Rank=require('./rank-driver-shadow.cjs');
const canonical=x=>String(x||'').normalize('NFKD').toUpperCase().replace(/[^A-Z0-9]/g,'');
function findWinner(race){
 const hit=race.rows.filter(x=>race.winner.id?x.id===race.winner.id:canonical(x.horse)===canonical(race.winner.horse));
 assert.equal(hit.length,1,'Winner must be one of the saved full-field competitors');
 return hit[0].id;
}
function evaluate(){
 const dates=Rank.loadDatasets(),flips=[],all=[];
 for(const day of dates){
  const byDay=[];
  for(const race of day.races){
   const baseline=Pace.predict(race.rows,0),shadow=Pace.predict(race.rows,.30);
   const winner=findWinner(race),from=baseline.rows[0],to=shadow.rows[0];
   const o={race_id:race.id,date:day.date,source:day.source,winner,baseline:firstName(from),
    challenger:firstName(to),baseline_correct:from.id===winner,challenger_correct:to.id===winner,
    action:from.id!==to.id?'PICK_CHANGED':'UNCHANGED',pace_status:shadow.pace.status,
    coverage:shadow.pace.coverage,field_size:race.rows.length};
   byDay.push(o);
   if(o.action==='PICK_CHANGED')flips.push(o);
  }
  all.push({date:day.date,races:byDay.length,baseline_hits:byDay.filter(x=>x.baseline_correct).length,
   challenger_hits:byDay.filter(x=>x.challenger_correct).length,
   flipped:byDay.filter(x=>x.action==='PICK_CHANGED').length});
 }
 const gained=flips.filter(x=>!x.baseline_correct&&x.challenger_correct);
 const harmed=flips.filter(x=>x.baseline_correct&&!x.challenger_correct);
 const bothWrong=flips.filter(x=>!x.baseline_correct&&!x.challenger_correct);
 const bothRight=flips.filter(x=>x.baseline_correct&&x.challenger_correct);
 assert.equal(bothRight.length,0,'A changed first pick cannot mean both are correct');
 assert.equal(gained.length-harmed.length,all.reduce((s,d)=>s+d.challenger_hits-d.baseline_hits,0));
 assert.equal(all.reduce((s,d)=>s+d.races,0),91);
 return {schema:'racing-lab-pace-flip-audit/v1',status:'RETROSPECTIVE_RACE_SHAPE_SHADOW_ONLY',
  baseline:'V5-L5 same runners/conditions',challenger:'Fixed historical-settling pace 0.30',
  scope_races:91,days:all,leader_changes:flips.length,
  gained_winners:gained.length,lost_winners:harmed.length,
  switched_between_losers:bothWrong.length,beneficial_flips:gained,harmful_flips:harmed,
  ineffective_flips:bothWrong,
  formula_changed_in_production:false,
  no_retroactive_winner_selection:true,
  warning:'All 91 races retrospective, much incomplete historical settling and source-field mismatches. Gains are NOT forward hit-rate evidence.'};
}
const firstName=x=>({id:x.id,horse:x.horse,model_pct:+(100*x.probability).toFixed(3)});
if(require.main===module)console.log(JSON.stringify(evaluate(),null,2));
module.exports={evaluate};
