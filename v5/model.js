/* Racing Lab V5-L2 · independent whole-field evidence model · 29 Oct research snapshot.
 * EXPERIMENTAL, UNCALIBRATED. All displayed probabilities are conditional on the
 * Thursday PDF-listed fields, Good 4 working scenario and recorded dossier facts.
 * No market prices, original qualitative picks, or synthetic historical validation.
 */
(function(global){
'use strict';
const VERSION='V5-L3-20261029';
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function num(x,fallback){var v=Number(x);return Number.isFinite(v)?v:fallback;}
function parseStats(h){
 var out={},text=String(h.statistics||'');
 ['Career','course','distance','Good','Soft','Heavy'].forEach(function(k){
  var re=new RegExp('\\b'+k+'\\s+(\\d+)\\s*-\\s*(\\d+)\\s*-\\s*(\\d+)','i'),m=text.match(re);
  out[k.toLowerCase()]=m?{w:+m[1],place:+m[2],n:+m[3]}:null;
 });
 return out;
}
function parseStarts(h){
 return String(h.form||'').split('\n').map(function(line){
  var m=line.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(.+?)\s+(\d+)m\s+\(([GSH])\),\s*(.+?):\s*(\d+)\/(\d+),\s*PDF margin\s*([\d.]+)L/i);
  if(!m)return null;
  return {date:new Date(Date.UTC(+m[3],+m[2]-1,+m[1])),venue:m[4],trip:+m[5],surface:m[6].toUpperCase(),className:m[7],pos:+m[8],field:+m[9],margin:+m[10]};
 }).filter(Boolean).sort(function(a,b){return b.date-a.date;}).slice(0,6);
}
function rate(st,fieldPrior){
 if(!st||!st.n)return fieldPrior;
 return (st.w+0.33*st.place+4*fieldPrior)/(st.n+4);
}
/* Class-quality prior is a transparent ordinal proxy, NOT an independently fitted rating.
 * Used only when the dated form actually identifies a race grade.
 * A G1 placing should not be scored like a maiden win, nor does any G1
 * appearance guarantee high present ability. Winning margin & finish matter.
 */
function classSignal(name){
 var n=String(name||'').toUpperCase(),g=n.match(/\bG([123])\b/);
 if(g)return g[1]==='1'?1.15:g[1]==='2'?0.85:0.59;
 if(/\bLR\b|LISTED/.test(n))return 0.38;
 if(/\bOPEN\b/.test(n))return 0.15;
 var bm=n.match(/\bBM(?:0-)?(\d+)/);
 if(bm)return clamp((+bm[1]-78)/56,-0.28,0.36);
 if(/\bMDN|MAIDEN\b/.test(n))return -0.45;
 if(/\bCL[1-3]\b/.test(n))return -0.22;
 return 0;
}
function classQuality(starts){
 // Best meaningful recent performance at recognised level, discounted for
 // a beaten run. No race-grade label => no class point is manufactured.
 var values=starts.map(function(s){
  var grade=classSignal(s.className);
  var finish=clamp((s.field-s.pos)/Math.max(1,s.field-1),0,1);
  var quality=(0.28+0.72*finish)*Math.exp(-clamp(s.margin,0,20)/13);
  return grade>=0?grade*quality:grade*quality;
 });
 // Avoid class-quality overreaction to one exceptional race.
 values.sort(function(a,b){return b-a;});
 return values.length ? 0.75*values[0]+0.25*(values[1]===undefined?values[0]:values[1]) : 0;
}
function mapPosition(h){
 var text=String(h.historical_map||''),vals=[...text.matchAll(/Settled\s+(\d+)(?:st|nd|rd|th)\s+800m/gi)].map(function(m){return +m[1];});
 if(!vals.length)return null;
 return median(vals.slice(0,5));
}
function median(nums){nums=nums.filter(Number.isFinite).sort(function(a,b){return a-b});return nums.length?nums[Math.floor(nums.length/2)]:0;}
function runnerFeatures(h,r,scenario,medWeight,medBarrier,gradeFactor){
 var st=parseStats(h),start=parseStarts(h),asOf=Date.UTC(2026,9,31);
 var n=Math.max(2,num(r.field_count,0)||0);
 var prior=1/n,career=rate(st.career,prior),trip=rate(st.distance,prior),track=rate(st.course,prior);
 var surface=rate(st[scenario==='Soft 5'?'soft':'good'],prior);
 var form=0,wsum=0,bestClass=classQuality(start);
 start.forEach(function(s,i){
  var age=Math.max(0,(asOf-s.date)/86400000),recent=Math.exp(-age/145),
      w=recent*Math.pow(0.76,i),fraction=clamp((s.field-s.pos)/Math.max(1,s.field-1),0,1),
      margin=clamp(s.margin,0,16);
  var perf=(fraction-0.5)*1.65+0.22*(s.pos===1?1:0)-0.037*margin+0.30*classSignal(s.className)*clamp((fraction-0.20)*1.2,0.15,1);
  if(s.trip>0&&r.distance_m>0)perf+=0.10*Math.exp(-Math.abs(s.trip-r.distance_m)/400);
  if(s.surface===(scenario==='Soft 5'?'S':'G'))perf+=0.06;
  form+=w*perf;wsum+=w;

 });
 form=wsum>0?form/wsum:0;
 var latest=start[0],days=latest?Math.round((asOf-latest.date)/86400000):null;
 var layoff=(days!==null&&days>120)?-Math.min(.30,(days-120)/360):0;
 var surfaceScore=Math.log(Math.max(.02,surface)/Math.max(.02,prior));
 var careerScore=Math.log(Math.max(.02,career)/Math.max(.02,prior));
 var distScore=Math.log(Math.max(.02,trip)/Math.max(.02,prior));
 var trackScore=Math.log(Math.max(.02,track)/Math.max(.02,prior));
 var straight=r.meeting==='FLEMINGTON'&&r.distance_m<=1200;
 var barrier=straight?0:-0.015*Math.max(0,num(h.barrier,medBarrier)-Math.max(6,medBarrier+2));
 var weight=0.025*clamp(medWeight-num(h.weight_kg,medWeight),-6,6);
 var full={career:0.24*careerScore,recency:0.76*form,distance:0.19*distScore,surface:0.22*surfaceScore,
    course:0.12*trackScore,class:(gradeFactor==null?0.55:gradeFactor)*bestClass,barrier:barrier,weight:weight,layoff:layoff};
 var score=Object.keys(full).reduce(function(s,k){return s+full[k];},0);
 var completeness=(st.career?0.22:0)+(st.distance?0.13:0)+(st[scenario==='Soft 5'?'soft':'good']?0.13:0)+
   (st.course?0.08:0)+Math.min(0.34,start.length*0.07)+
   (h.historical_map&&h.historical_map.includes('Settled')?0.06:0)+(h.risks?0.04:0);
 return {h:h,raw:score,parts:full,starts:start.length,daysSinceLast:days,completeness:+clamp(completeness,0,1).toFixed(2),
   career:st.career,dist:st.distance,track:st.course,surfaceRecord:st[scenario==='Soft 5'?'soft':'good'],straight:straight,classQuality:bestClass,settle800:mapPosition(h)};
}
function normalize(items){
 var max=Math.max.apply(null,items.map(function(x){return x.raw;}));
 // Temperature=0.78; reserve 15% for field-uniform probability, deliberately
 // tempering strong evidence because this is NOT a trained or calibrated model.
 var z=items.map(function(x){return Math.exp(clamp((x.raw-max)/0.78,-25,0));});
 var sum=z.reduce(function(a,b){return a+b;},0);
 var ps=z.map(function(x){return 100*(0.85*x/sum+0.15/items.length);});
 var rounded=ps.map(function(p){return Math.round(p*100)/100;});
 var error=Math.round((100-rounded.reduce(function(a,b){return a+b;},0))*100);
 if(error){var ix=rounded.indexOf(Math.max.apply(null,rounded));rounded[ix]=+(rounded[ix]+error/100).toFixed(2);}
 return rounded;
}
function calculate(d,scenario,gradeFactor){
 if(!d||d.date!=='2026-10-31'||!Array.isArray(d.races)||d.races.length!==29||!Array.isArray(d.runners)||d.runners.length!==408)throw Error('Full 31 October inventory required');
 var result=[],raceBoards=[],allIds={},excluded=0;
 d.races.forEach(function(r){
  var listed=d.runners.filter(function(h){return h.race_id===r.id;});
  var horses=listed.filter(function(h){return !/^SCRATCHED\b/i.test(h.status||'');});
  excluded+=listed.length-horses.length;
  if(horses.length<2)throw Error('Empty or incomplete race '+r.id);
  var used=new Set();horses.forEach(function(h){if(!h.id||used.has(h.id)||allIds[h.id])throw Error('Runner ID duplicate '+h.id);used.add(h.id);allIds[h.id]=true;});
  var mw=median(horses.map(function(h){return num(h.weight_kg,NaN);}));
  var mb=median(horses.map(function(h){return num(h.barrier,NaN);}));
  var entries=horses.map(function(h){return runnerFeatures(h,Object.assign({},r,{field_count:horses.length}),scenario,mw,mb,gradeFactor);});
  var ps=normalize(entries),sortRaw=entries.map(function(x){return x.raw;}).sort(function(a,b){return b-a;});
  entries.forEach(function(x,i){
   x.p=ps[i];x.model_score=+clamp(50+18*(x.raw-median(entries.map(function(z){return z.raw;}))),1,99).toFixed(1);
   x.fair_odds=+(100/x.p).toFixed(2);
  });
  entries.sort(function(a,b){return b.p-a.p;});
  var top=entries[0].p,second=entries[1].p,spread=top-second;
  var probs=entries.map(function(x){return x.p/100;});
  var entropy=-probs.reduce(function(s,p){return s+p*Math.log(Math.max(1e-12,p));},0)/Math.log(entries.length);
  var chaos=+clamp(100*(0.65*entropy+0.35*Math.exp(-spread/15)),0,100).toFixed(0);
  var gap=+(top-second).toFixed(2);
  entries.forEach(function(x,rank){
   result.push({id:x.h.id,race_id:r.id,horse:x.h.horse,meeting:r.meeting,race:r.race,
    rank:rank+1,p:x.p,model_score:x.model_score,fair_odds:x.fair_odds,field_size:entries.length,
    field_gap:gap,chaos:chaos,completeness:x.completeness,days_since_last:x.daysSinceLast,
    features:x.parts,grade_quality:+x.classQuality.toFixed(3),settle_800:x.settle800,original_pick:!!x.h.original_pick});
  });
  var quality=entries.map(function(x){return x.classQuality;}).sort(function(a,b){return b-a;});
  var qIndex=quality.slice(0,Math.max(2,Math.ceil(entries.length/3))).reduce(function(z,n){return z+n;},0)/Math.max(2,Math.ceil(entries.length/3));
  raceBoards.push({id:r.id,meeting:r.meeting,race:r.race,title:r.title,listed_field:listed.length,excluded:listed.length-horses.length,field:entries.length,
    field_quality:+qIndex.toFixed(2),leader:entries[0].h.horse,top_p:top,gap:gap,chaos:chaos,sum:+entries.reduce(function(s,x){return s+x.p;},0).toFixed(2)});
 });
 if(result.length!==d.runners.length-excluded||raceBoards.some(function(x){return Math.abs(x.sum-100)>0.0001}))throw Error('Full-field probability QA failed');
 return {version:VERSION,scenario:scenario,status:'PROVISIONAL_UNCALIBRATED',asOf:'29 October 2026 runner research; working 31 October scenario',
   caveat:'Conditional estimates, NOT externally calibrated probabilities or verified raceday starter fields; no market input.',
   records:result,races:raceBoards};
}
function board(d){
 // Four independently scored conditions: two surfaces and two weights on
 // recorded class performance. Original qualitative selections do not enter.
 // Model sensitivity is NOT a confidence interval or statistical calibration.
 var good=calculate(d,'Good 4',0.55),
     soft=calculate(d,'Soft 5',0.55),
     goodConservative=calculate(d,'Good 4',0.28),
     softConservative=calculate(d,'Soft 5',0.28);
 var scenarios=[good,soft,goodConservative,softConservative],
     maps=scenarios.map(function(x){return new Map(x.records.map(function(y){return [y.id,y];}));}),
     goodRace=new Map(good.races.map(function(r){return [r.id,r];}));
 good.records.forEach(function(x){
  var alt=maps[1].get(x.id);
  var values=maps.map(function(m){return m.get(x.id).p;});
  var ranks=maps.map(function(m){return m.get(x.id).rank;});
  x.soft_p=alt.p;
  x.surface_swing=+(x.p-alt.p).toFixed(2);
  x.model_range=[Math.min.apply(null,values),Math.max.apply(null,values)];
  x.robust_floor=+Math.min.apply(null,values).toFixed(2);
  x.robust_spread=+(Math.max.apply(null,values)-Math.min.apply(null,values)).toFixed(2);
  x.top1_scenarios=ranks.filter(function(n){return n===1;}).length;
  x.top3_scenarios=ranks.filter(function(n){return n<=3;}).length;
  x.rank_scenarios=ranks;
  // A race-dependent separation is needed; a raw probability advantage in
  // a small field is not independent proof of a strong edge.
  x.gap=+(x.p-(good.records.filter(function(y){return y.race_id===x.race_id&&y.id!==x.id;})
                .reduce(function(z,y){return Math.max(z,y.p);},0))).toFixed(2);
  x.field_quality=goodRace.get(x.race_id).field_quality;
  x.field_chaos=goodRace.get(x.race_id).chaos;
  x.g1_wins=0;x.g1_top2=0;
  var horse=d.runners.find(function(h){return h.id===x.id;});
  if(horse){
   String(horse.form||'').split('\n').forEach(function(line){
    if(/\bGroup G1:\s*\d+\/\d+/i.test(line)){
      var place=line.match(/\bGroup G1:\s*(\d+)\/\d+/i);
      if(place){if(+place[1]===1)x.g1_wins++;if(+place[1]<=2)x.g1_top2++;}
    }
   });
  }
  x.elite_form=x.g1_wins>=2&&x.g1_top2>=3&&x.top1_scenarios>=3;
  x.quality_flags=[];
  if(x.completeness<0.70)x.quality_flags.push('LIMITED_DOSSIER');
  if(x.robust_spread>=6)x.quality_flags.push('SCENARIO_SENSITIVE');
  if(x.top1_scenarios<3)x.quality_flags.push('UNSTABLE_RACE_LEAD');
  if(x.field_chaos>=90)x.quality_flags.push('CROWDED_RACE');
  x.research_status=x.quality_flags.length?'HIGH_UNCERTAINTY':'PROVISIONAL';
 });
 // External market is deliberately applied AFTER all independent full-field
 // forecasts are computed. It does not affect probabilities or ranking scores.
 // A large discrepancy blocks approval rather than being silently backfitted.
 var audit=(d.market_audit||[]).map(function(a){
  var h=good.records.find(function(x){return x.race_id===a.race_id&&x.horse===a.horse;});
  var price=+a.decimal_odds,implied=price>1?+(100/price).toFixed(2):null;
  return {race_id:a.race_id,horse:a.horse,observed_at:a.observed_at,source:a.source,
    price:price,implied_p:implied,model_p:h?h.p:null,
    gap_pp:h&&implied!==null?+(implied-h.p).toFixed(2):null,
    severity:h&&implied!==null&&Math.abs(implied-h.p)>=20?'CRITICAL_MODEL_DISAGREEMENT':'REVIEW'};
 });
 audit.forEach(function(a){if(a.severity==='CRITICAL_MODEL_DISAGREEMENT'){
  var h=good.records.find(function(x){return x.race_id===a.race_id&&x.horse===a.horse;});
  if(h){h.market_audit=a;h.quality_flags.push('MODEL_MARKET_DISAGREEMENT');h.research_status='CRITICAL_QA';}
 }});
 // All active, not only the Good 4 winners: the robust leader may be a different
 // horse from the baseline pick and is chosen on its LOWER four-scenario estimate.
 var robustLeaders=d.races.map(function(r){
  var rs=good.records.filter(function(x){return x.race_id===r.id;});
  rs.sort(function(a,b){return b.robust_floor-a.robust_floor||b.top1_scenarios-a.top1_scenarios||b.p-a.p;});
  return rs[0];
 }).sort(function(a,b){return b.robust_floor-a.robust_floor||b.top1_scenarios-a.top1_scenarios;});
 var leaders=good.records.filter(function(x){return x.rank===1;}).sort(function(a,b){return b.p-a.p;});
 // Explicit data-quality screen. An excluded horse still appears on the raw
 // and all-races robustness boards. This is not proof of profitable selection.
 var qualified=robustLeaders.filter(function(x){return x.quality_flags.length===0;});
 // Highest-certainty race form is a separate evidence gate, not a probability
 // adjustment. Requires 2+ G1 wins, 3+ G1 top-twos in dated recent starts,
 // and the same race winner in at least 3 of 4 variants.
 var elite=leaders.filter(function(x){return x.elite_form;})
   .sort(function(a,b){return b.g1_wins-a.g1_wins||b.g1_top2-a.g1_top2||b.robust_floor-a.robust_floor;});
 var shortlist=elite.concat(qualified.filter(function(x){return !elite.some(function(z){return z.id===x.id;});})).slice(0,10);

 if(good.records.length!==d.runners.filter(function(x){return !/^SCRATCHED\b/i.test(x.status||'');}).length||robustLeaders.length!==29||
    scenarios.some(function(s){return s.races.length!==29||s.races.some(function(r){return r.sum!==100;});}))
    throw Error('V5-L2 scenario integrity check failed');
 return {version:VERSION,date:d.date,status:'PROVISIONAL_UNCALIBRATED',
  assumption:'Good 4 working scenario; 408 original Thursday PDF runners; verified race-specific exclusions remove scratched runners from each scenario',
  sourceCount:d.runners.length,activeCount:good.records.length,excludedCount:d.runners.length-good.records.length,raceCount:d.races.length,baseline:good,soft:soft,
  marketAudit:audit,publication_blocked:audit.some(function(a){return a.severity==='CRITICAL_MODEL_DISAGREEMENT';}),
  stress:{goodClassConservative:goodConservative,softClassConservative:softConservative},
  model_variants:['Good 4 · base class','Soft 5 · base class','Good 4 · conservative class','Soft 5 · conservative class'],
  leaders:leaders,robustLeaders:robustLeaders,qualifiedLeaders:qualified,eliteLeaders:elite,top10:shortlist,
  screen:{description:'Grade/going sensitivity, Thursday form completeness and race competitiveness check; research filter only',
    rules:{completeAtLeast:0.70,scenarioSwingBelow:6,top1InScenariosAtLeast:3,chaosBelow:90},
    qualifiedRaceCount:qualified.length,eliteRaceCount:elite.length,shortlistCount:shortlist.length,totalRaceCount:robustLeaders.length}};
}
global.RacingLabV5Model={VERSION:VERSION,board:board,calculate:calculate};
})(typeof window==='undefined'?globalThis:window);
