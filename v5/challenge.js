/* Evidence-based V5 challenge gate.
 * Recomputes scenario comparisons from PRE-RACE dossier data only.
 * Results/outcomes are prohibited inputs; never mutate the saved research
 * ranking or auto-certify an alternative. Flag unresolved disagreements.
 */
(function(root,factory){
 const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;
 else root.RacingLabV5Challenge=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const SCHEMA='racing-lab-pre-race-challenge/v1';
const SUPPORTED=['Good 4','Soft 5','Soft 6','Soft 7','Heavy 8','Heavy 9','Heavy 10'];
function pct(x){return Math.round(x*100)/100;}
function surfaceRecord(text,kind){
 const m=String(text||'').match(new RegExp('\\b'+kind+'\\s*:?\\s*(\\d+)\\s*-\\s*(\\d+)\\s*-\\s*(\\d+)','i'));
 if(!m)return {wins:null,places:null,starts:null,label:'Not documented'};
 const wins=+m[1],places=+m[2],starts=+m[3];
 if(wins+places>starts||starts===0)return {wins:null,places:null,starts:null,label:'Not documented'};
 return {wins,places,starts,label:wins+'/'+starts+' wins, '+places+' other placings'};
}
function wetHistory(h){
 const soft=surfaceRecord(h.statistics,'Soft'),heavy=surfaceRecord(h.statistics,'Heavy');
 if(soft.starts===null&&heavy.starts===null)return {soft,heavy,starts:0,wins:0,known:false};
 return {soft,heavy,starts:(soft.starts||0)+(heavy.starts||0),
  wins:(soft.wins||0)+(heavy.wins||0),known:true};
}
function validate(data,Model,raceId,incumbentId,challengerId,going){
 if(!data||!Array.isArray(data.races)||!Array.isArray(data.runners)||!Model||typeof Model.calculate!=='function')
  throw Error('Verified racecard and shared model are required');
 const race=data.races.find(x=>x.id===raceId);
 if(!race)throw Error('Unknown race');
 if(!SUPPORTED.includes(going))throw Error('Unsupported going; no inferred track condition');
 if(incumbentId===challengerId)throw Error('Choose a different challenger');
 const first=data.runners.find(x=>x.id===incumbentId&&x.race_id===raceId);
 const second=data.runners.find(x=>x.id===challengerId&&x.race_id===raceId);
 if(!first||!second||!Model.isEligible(first)||!Model.isEligible(second))
  throw Error('Both horses must be included in the same saved race field');
 return {race,first,second};
}
function compare(data,Model,options){
 const o=options||{},g=o.reported_going||'Soft 5';
 const pair=validate(data,Model,o.race_id,o.incumbent_id,o.challenger_id,g);
 const reportType=['USER_OBSERVATION','OFFICIAL_REPORT','SCENARIO_ONLY'].includes(o.source_type)?o.source_type:'SCENARIO_ONLY';
 const now=String(o.observed_at||'');
 if(now&&!Number.isFinite(Date.parse(now)))throw Error('Invalid observation timestamp');
 const mm=o.rain_mm===undefined||o.rain_mm===null||o.rain_mm===''?null:Number(o.rain_mm);
 if(mm!==null&&(!Number.isFinite(mm)||mm<0||mm>500))throw Error('Invalid rainfall observation');
 if(reportType==='OFFICIAL_REPORT'&&!/^https:\/\//.test(o.source_url||''))
  throw Error('Official-source claim needs a real URL');
 // Both distributions come from the SAME original cutoff data. No observed
 // winners, prices, post-race comments or discretionary probability multipliers.
 const get=going=>Model.calculate(data,{default:going});
 const good=get('Good 4'),scenario=get(g);
 const fetch=(b,id)=>b.records.find(x=>x.id===id);
 const baseA=fetch(good,pair.first.id),baseB=fetch(good,pair.second.id);
 const wetA=fetch(scenario,pair.first.id),wetB=fetch(scenario,pair.second.id);
 if(!baseA||!baseB||!wetA||!wetB)throw Error('Excluded or missing model row');
 const wetFirst=wetHistory(pair.first),wetSecond=wetHistory(pair.second);
 const shift=pct((wetB.p-baseB.p)-(wetA.p-baseA.p));
 const reason=[];
 const wetShare=(x)=>x.starts>=3?x.wins/x.starts:null;
 // These are REVIEW triggers, not recalibrated coefficients or win claims.
 const bRate=wetShare(wetSecond),aRate=wetShare(wetFirst);
 if(bRate!==null&&bRate>=.6&&(aRate===null||bRate-aRate>=.25)){
  reason.push('CHALLENGER_HAS_MATERIAL_WET_FORM_EVIDENCE');
 }
 if(shift>=3)reason.push('CHALLENGER_RELATIVE_SCENARIO_UPLIFT');
 if(baseB.rank>baseA.rank&&wetB.rank<baseB.rank)reason.push('CHALLENGER_RANK_IMPROVES_ON_SCENARIO');
 if(wetB.p>=wetA.p)reason.push('CHALLENGER_NOW_MODELS_LEVEL_OR_AHEAD');
 if(wetA.p-wetB.p<2&&baseA.p-baseB.p>=4)reason.push('LEAD_COLLAPSES_ON_SCENARIO');
 if(!wetFirst.known||!wetSecond.known)reason.push('WET_HISTORY_INCOMPLETE');
 if(g.startsWith('Soft ')&&g!=='Soft 5')reason.push('SOFT_GRADES_SHARE_AN_UNCALIBRATED_SURFACE_BUCKET');
 const finishTime=Date.parse(data.date+'T00:00:00Z');
 const timestamp=now?Date.parse(now):null;
 const timing=!timestamp?'OBSERVATION_TIME_UNVERIFIED':timestamp>=finishTime+86400000?'AFTER_RACE_DAY_HISTORICAL_REPLAY':'RACE_START_TIME_NOT_VERIFIED';
 const status=reason.some(x=>/CHALLENGER_HAS|RELATIVE_SCENARIO|LEAD_COLLAPSES|NOW_MODELS/.test(x))?'REASSESSMENT_REQUIRED':'NO_MATERIAL_CHALLENGE_DETECTED';
 return {
  schema:SCHEMA,status,review_timing:timing,source_type:reportType,source_url:o.source_url||null,
  observed_at:now||null,rain_mm:mm,observation_note:String(o.note||'').slice(0,500),
  race_date:data.date,race_id:pair.race.id,meeting:pair.race.meeting,
  compared_against:'Good 4',scenario:g,
  incumbent:{id:pair.first.id,horse:pair.first.horse,good4_pct:baseA.p,scenario_pct:wetA.p,
   good4_rank:baseA.rank,scenario_rank:wetA.rank,wet_form:wetFirst},
  challenger:{id:pair.second.id,horse:pair.second.horse,good4_pct:baseB.p,scenario_pct:wetB.p,
   good4_rank:baseB.rank,scenario_rank:wetB.rank,wet_form:wetSecond},
  relative_shift_pp:shift,scenario_gap_pp:pct(wetA.p-wetB.p),flags:reason,
  result_status:'NOT_USED_OR_INFERRED',model_untouched:true,rankings_untouched:true,
  action:'Independent human re-review is required if flags are material; do NOT auto-swap the shortlist. Record evidence and a pre-race timestamp before a separately authorized change.',
  caveat:'Dossier-derived model percentages remain experimental and uncalibrated. Going and rainfall are scenarios unless independently verified. Post-race outcomes are never fed to the model.'
 };
}
return Object.freeze({SCHEMA,wetHistory,compare});
});
