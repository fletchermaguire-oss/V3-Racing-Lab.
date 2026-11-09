'use strict';
/* Uses unchanged L5 model; output is provisional research, NEVER final probability certification. */
const Source=require('./formula-source-integrity.cjs');
const Gate=require('./release-gate-hardened.cjs');
function checkResearch({card,going,model}={}){
 const source=Source.check({card,going});
 if(!source.ok)return {status:'BLOCKED_INCOMPLETE_SOURCE',source,blockers:source.issues};
 if(!model||typeof model.board!=='function')throw Error('Versioned V5 model is required');
 const board=model.board(card,{going});
 const raceRows=board.baseline?.races||[],rows=board.baseline?.records||[],errors=[];
 if(raceRows.length!==card.races.length)errors.push('RACE_COUNT_DIFFERS');
 if(board.sourceCount!==card.runners.length||board.activeCount+board.excludedCount!==card.runners.length)errors.push('RUNNER_INVENTORY_DIFFERS');
 const first=[];
 for(const race of raceRows){
  const f=rows.filter(x=>x.race_id===race.id).sort((a,b)=>b.p_exact-a.p_exact||a.id.localeCompare(b.id));
  if(f.length<2||f.some(x=>!Number.isFinite(x.p_exact)||x.p_exact<=0)||
      Math.abs(f.reduce((n,x)=>n+x.p_exact,0)-100)>.001){errors.push('INVALID_FIELD:'+race.id);continue;}
  first.push(f[0]);
 }
 first.sort((a,b)=>b.p_exact-a.p_exact||a.id.localeCompare(b.id));
 const list=first.map((x,i)=>({rank:i+1,race_id:x.race_id,runner_id:x.id,horse:x.horse,
  provisional_win_pct:x.p_exact,model_version:board.version}));
 return {status:errors.length?'BLOCKED_MODEL_QA':'RESEARCH_ONLY_READY',source,
  blockers:errors,model_version:board.version,date:card.date,top5:list.slice(0,5),
  top10:list.slice(0,10),top15:list.slice(0,15),one_per_race:true,
  publication_approved:false,calibration_established:false,official_starters_verified:false,
  caveat:'Model-only research list. Preserve separately frozen human research rankings; no real win-rate inference.'};
}
function checkFinal({proposal,asOf}={}){return Gate.assess(proposal,asOf);}
module.exports={checkResearch,checkFinal};
