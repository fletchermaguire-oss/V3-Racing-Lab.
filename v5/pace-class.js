/* V5 research-only diagnostic: pre-race pace pressure, class assumptions and
 * Flemington straight-course evidence. It never changes original probabilities
 * or selects a winner, and NEVER uses post-race results to build features.
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./model.js'):root.RacingLabV5Model);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.RacingLabV5PaceClass=api;
})(typeof window!=='undefined'?window:globalThis,function(Model){
'use strict';
const VERSION='v5-pace-class-diagnostic/v1';
const round=(n,d=2)=>Number(n.toFixed(d));
function canonical(s){return String(s||'').normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');}
function beforeRace(day){const t=Date.parse(day+'T00:00:00Z');if(!Number.isFinite(t))throw Error('Missing race day');return t;}
function straightStarts(h,cutoff){
 const text=String(h.form||''),sample=[],seen=new Set();
 const re=/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+FLEMINGTON\s+(\d+)m\s+\(([GSH])\)[^:\n]*:\s*(\d+)\/(\d+),\s*PDF margin\s*([\d.]+)L/gi;
 let m;
 while((m=re.exec(text))!==null){
  const d=Date.UTC(+m[3],+m[2]-1,+m[1]),iso=new Date(d).toISOString().slice(0,10);
  if(new Date(d).getUTCFullYear()!==+m[3]||new Date(d).getUTCMonth()!==+m[2]-1||
     new Date(d).getUTCDate()!==+m[1]||d>=cutoff||seen.has(iso))continue;
  const distance=+m[4],pos=+m[6],field=+m[7];
  if(distance>1200||distance<800||pos<1||pos>field||field<2)continue;
  sample.push({date:iso,distance_m:distance,finish:pos,field,surface:m[5].toUpperCase()});
  seen.add(iso);
 }
 sample.sort((a,b)=>b.date.localeCompare(a.date));
 return {starts:sample.length,wins:sample.filter(s=>s.finish===1).length,top3:sample.filter(s=>s.finish<=3).length,
  races:sample.slice(0,6),cutoff_only:true};
}
function inspect(data,options){
 const o=options||{},raceId=o.race_id;
 if(!Model||typeof Model.calculate!=='function'||!data||!Array.isArray(data.runners)||!Array.isArray(data.races))
  throw Error('Complete original dated dossier and shared V5 model required');
 const race=data.races.find(r=>r.id===raceId);if(!race)throw Error('Unknown race ID');
 const going=String(o.going||'Good 4');
 if(!/^(Good [34]|Soft [567]|Heavy (8|9|10))$/.test(going))throw Error('Unknown going scenario');
 const baseline=Model.calculate(data,{default:going});
 const selected=o.runner_id||baseline.records.find(h=>h.race_id===raceId&&h.rank===1)?.id;
 if(!selected)throw Error('No modelled contenders in race');
 const record=baseline.records.find(h=>h.id===selected&&h.race_id===raceId);
 if(!record)throw Error('Chosen runner is scratched, excluded or outside this race');
 const runners=baseline.records.filter(h=>h.race_id===raceId),known=runners.filter(h=>h.settle_fraction!==null);
 const front=known.filter(h=>h.settle_fraction<=0.34);
 // These are low-resolution HISTORICAL 800m tendencies, not actual race
 // instructions, speed maps or sectionals. No data => unknown, not neutral.
 const frontCount=front.length,coverage=round(known.length/runners.length),frontShare=known.length?round(frontCount/known.length):null;
 const assessment=coverage<.6?'INSUFFICIENT_HISTORICAL_SETTLING':frontCount>=4?'MULTIPLE_POTENTIAL_EARLY_LEADERS':
  frontCount>=2?'POTENTIAL_TEMPO_PRESSURE':'PACE_NOT_ESTABLISHED';
 const variants=[
  {key:'baseline',label:'Current V5',value:baseline},
  {key:'strong_pace',label:'Strong early pace (hypothetical)',value:Model.calculate(data,{default:going},Model.CONFIG.weights.class,{pace:1})},
  {key:'slow_pace',label:'Slow early pace (hypothetical)',value:Model.calculate(data,{default:going},Model.CONFIG.weights.class,{pace:-1})},
  {key:'conservative_class',label:'Reduced class effect (hypothetical)',value:Model.calculate(data,{default:going},Model.CONFIG.conservativeClass)},
  {key:'no_class',label:'Class removed (diagnostic only)',value:Model.calculate(data,{default:going},0)}
 ];
 const selectedForms=variants.map(v=>{
  const rows=v.value.records.filter(h=>h.race_id===raceId).sort((a,b)=>a.rank-b.rank),
   self=rows.find(h=>h.id===selected),competitors=rows.filter(h=>h.id!==selected);
  if(!self||!competitors.length)throw Error('Incomplete scenario field');
  const strongest=competitors.reduce((a,b)=>a.p_exact>b.p_exact?a:b);
  return {key:v.key,label:v.label,horse:self.horse,rank:self.rank,pct:self.p,
   separation_pp:round(self.p-strongest.p),strongest_rival:strongest.horse,
   leader:rows[0].horse,field:rows.length};
 });
 const current=selectedForms[0],forms=new Map(selectedForms.map(f=>[f.key,f]));
 const sameLeader=selectedForms.every(f=>f.leader===selectedForms[0].leader);
 const flags=[];
 if(coverage<.6)flags.push('HISTORICAL_PACE_EVIDENCE_INCOMPLETE');
 if(assessment==='MULTIPLE_POTENTIAL_EARLY_LEADERS')flags.push('POTENTIAL_EARLY_PACE_CONTEST');
 if(forms.get('strong_pace').rank!==current.rank||forms.get('slow_pace').rank!==current.rank)
  flags.push('SELECTED_RANK_SENSITIVE_TO_UNVERIFIED_TEMPO');
 if(forms.get('conservative_class').rank!==current.rank||forms.get('no_class').rank!==current.rank)
  flags.push('SELECTED_RANK_SENSITIVE_TO_CLASS_ASSUMPTION');
 if(current.rank===1&&!sameLeader)flags.push('RACE_LEADER_CHANGES_UNDER_STRESS');
 const isStraight=race.straight===true||(race.meeting==='FLEMINGTON'&&race.distance_m<=1200);
 const cutoff=beforeRace(data.date),horse=data.runners.find(h=>h.id===selected);
 const straight=isStraight?straightStarts(horse,cutoff):null;
 if(isStraight)flags.push('STRAIGHT_LANE_BIAS_NOT_VERIFIED');
 if(isStraight&&straight.starts===0)flags.push('NO_RECORDED_FLEMINGTON_STRAIGHT_START');
 const probs=selectedForms.map(x=>x.pct),min=round(Math.min(...probs)),max=round(Math.max(...probs));
 return {schema:VERSION,race_date:data.date,race_id:raceId,meeting:race.meeting,distance_m:race.distance_m,
  scenario_going:going,runner_id:selected,horse:record.horse,
  pressure:{status:assessment,known_runners:known.length,modelled_runners:runners.length,
   evidence_coverage:coverage,historical_potential_leaders:front.map(x=>x.horse),front_share:frontShare,
   limitation:'Median historical 800m positions; no verified race-day map, early split sectionals or pace forecast.'},
  class:{grade_quality:record.grade_quality,opposition_class_anchor:record.opposition_class_anchor,
   opposition_class_edge:record.opposition_class_edge,limitation:'Ordinal historic race-grade hypothesis, NOT measured strength of individual opponents.'},
  straight:{applies:isStraight,history:straight,lane_bias_verified:false,
   limitation:isStraight?'Historical Flemington <=1200m finishes only; barrier/rail/lane advantage cannot be inferred.':'Not a Flemington straight-course race.'},
  stress:selectedForms,selected_model_range_pct:[min,max],selected_stress_spread_pp:round(max-min),
  flags,review_required:flags.some(f=>/RANK_SENSITIVE|LEADER_CHANGES|EVIDENCE_INCOMPLETE|STRAIGHT_LANE/.test(f)),
  original_selection_unchanged:true,model_coefficients_unchanged:true,results_in_inputs:false,
  caution:'Experimental uncalibrated conditional estimates. No prospective proof of improved hit rate; review before considering any selection change.'};
}
return Object.freeze({VERSION,inspect,straightStarts});
});