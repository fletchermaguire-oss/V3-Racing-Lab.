/* ISOLATED RESEARCH EXPERIMENT. NEVER USE AS LIVE V5 FORMULA.
 * Derived from V5-L5, testing only neutral treatment of missing class evidence.
 * Coefficients remain experimental and uncalibrated. Scenario sensitivity is
 * NOT a confidence interval. No result, price, tip, or horse-name override
 * enters scoring. This module never approves or publishes a forecast.
 */
(function(global){
'use strict';
const VERSION='V5-L5-NEUTRAL-MISSING-CLASS-EXPERIMENT-20261030';
const CONFIG=Object.freeze({
 temperature:0.78,uniformReserve:0.15,
 weights:Object.freeze({career:0.24,recency:0.76,distance:0.19,surface:0.22,course:0.12,class:0.55}),
 conservativeClass:0.28,priorStarts:4
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const round=(x,n=2)=>Number(x.toFixed(n));
const unique=a=>Array.from(new Set(a));
function num(x,fallback=null){
 if(x===null||x===undefined||typeof x==='boolean'||typeof x==='object'||String(x).trim()==='')return fallback;
 const v=Number(x);return Number.isFinite(v)?v:fallback;
}
function median(xs){
 const a=xs.filter(Number.isFinite).slice().sort((a,b)=>a-b),n=a.length;
 return n?(n%2?a[(n-1)/2]:(a[n/2-1]+a[n/2])/2):null;
}
function day(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
 const t=Date.parse(value+'T00:00:00Z');
 return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===value?t:null;
}
function auDay(value){
 const m=String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 return m?day(m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0')):null;
}
function statusOf(h){
 const s=String(h.status||'').trim();
 if(/^(?:SCRATCHED|WITHDRAWN|WITHDRAW|EXCLUDED)\b/i.test(s))return 'SCRATCHED';
 if(/^(?:EMERGENCY|RESERVE)\b/i.test(s))return h.emergency_activated===true?'ACTIVE_UNVERIFIED':'EMERGENCY';
 if(/^(?:ACTIVE_VERIFIED|CONFIRMED_STARTER)$/i.test(s))return 'ACTIVE_VERIFIED';
 if(/^(?:DECLARED|ACTIVE)\b/i.test(s)&&!/not verified|unverified|not confirmed/i.test(s))return 'ACTIVE_UNVERIFIED';
 return 'LISTED_UNVERIFIED';
}
function isEligible(h){return !['SCRATCHED','EMERGENCY'].includes(statusOf(h));}
function validate(d){
 if(!d||day(d.date)===null||!Array.isArray(d.races)||!d.races.length||!Array.isArray(d.runners))throw Error('A valid card date, races and runners are required');
 const ids=new Set(),horseIds=new Set(),identities=new Set(),byRace=new Map(),issues=[];
 d.races.forEach(r=>{
  if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id))throw Error('Missing or duplicate race ID');
  if(/^\d{4}-\d{2}-\d{2}_/.test(r.id)&&r.id.slice(0,10)!==d.date)throw Error('Race date mismatch: '+r.id);
  if(!(num(r.distance_m)>0))throw Error('Invalid race distance: '+r.id);
  ids.add(r.id);byRace.set(r.id,[]);
 });
 d.runners.forEach(h=>{
  if(!h||typeof h.id!=='string'||!h.id||horseIds.has(h.id))throw Error('Missing or duplicate runner ID: '+(h&&h.id));
  if(typeof h.horse!=='string'||!h.horse.trim())throw Error('Missing horse name: '+h.id);
  if(!byRace.has(h.race_id))throw Error('Orphan runner: '+h.id);
  const identity=h.race_id+'|'+h.horse.trim().replace(/\s+/g,' ').toUpperCase();
  if(identities.has(identity))throw Error('Duplicate horse in race: '+h.horse);
  identities.add(identity);
  horseIds.add(h.id);byRace.get(h.race_id).push(h);
 });
 const expected=d.expected_inventory;
 if(expected){
  if(expected.races!==undefined&&expected.races!==d.races.length)throw Error('Expected race count mismatch');
  if(expected.runners!==undefined&&expected.runners!==d.runners.length)throw Error('Expected runner count mismatch');
 }
 if(d.saved_at&&day(String(d.saved_at).slice(0,10))===null)throw Error('Invalid snapshot date');
 if(d.saved_at&&String(d.saved_at).slice(0,10)>=d.date)issues.push('SNAPSHOT_NOT_PROVEN_PRE_RACE');
 return {byRace:byRace,issues:issues};
}
function parseStats(h){
 const out={},issues=[],s=String(h.statistics||'');
 const aliases={career:'Career',course:'(?:course|Track)',distance:'(?:distance|Dist)',good:'Good',soft:'Soft',heavy:'Heavy'};
 Object.keys(aliases).forEach(k=>{
  const label=aliases[k];
  const official=Array.from(s.matchAll(new RegExp('\\b'+label+'\\s+(\\d+):(\\d+)-(\\d+)-(\\d+)','gi')))
   .map(m=>({n:+m[1],w:+m[2],place:+m[3]+ +m[4]}));
  const legacy=Array.from(s.matchAll(new RegExp('\\b'+label+'\\s*:?[ \\t]*(\\d+)\\s*-\\s*(\\d+)\\s*-\\s*(\\d+)','gi')))
   .map(m=>({w:+m[1],place:+m[2],n:+m[3]}));
  const records=official.length?official:legacy;
  const valid=records.filter(x=>[x.w,x.place,x.n].every(Number.isSafeInteger)&&x.w>=0&&x.place>=0&&x.w+x.place<=x.n);
  if(valid.length!==records.length)issues.push('INVALID_'+k.toUpperCase()+'_COUNTS');
  const variants=unique(valid.map(x=>[x.w,x.place,x.n].join(':')));
  if(variants.length>1){issues.push('CONFLICTING_'+k.toUpperCase()+'_COUNTS');out[k]=null;}
  else out[k]=valid.length?valid[0]:null;
 });
 return {records:out,issues:issues};
}
function parseStarts(h,cutoff){
 const issues=[],rows=[],seen=new Map();let future=0,invalid=0,duplicates=0;
 const source=String(h.form||''),isSnapshot=/^Previous Friday source-snapshot race form \(not refreshed against Saturday\):/.test(source);
 const entries=isSnapshot?source.split(/\s+\|\s+/):source.split('\n');
 entries.forEach(line=>{
  const t=line.trim();
  const dated=/^\d{1,2}\/\d{1,2}\/\d{4}\b/.test(t);
  const alternate=isSnapshot&&/\d+(?:st|nd|rd|th)\s+of\s+\d+\s+\d{1,2}\/\d{1,2}\/\d{4}/i.test(t);
  if(!dated&&!alternate)return;
  let date,pos,field,margin,trip,venue,surface,className;
  if(dated){
   const m=t.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(\d+)m\s+\(([GSH])\),\s*(.+?):\s*(\d+)\/(\d+),\s*PDF margin\s*([\d.]+)L/i);
   if(!m){invalid++;return;}
   date=auDay(m[1]);venue=m[2].trim();trip=+m[3];surface=m[4].toUpperCase();className=m[5];
   pos=+m[6];field=+m[7];margin=num(m[8]);
  }else{
   // Explicit archived Friday form format. Do NOT parse narrative "1st of"
   // fragments unless the record identifies the historical snapshot format.
   const m=t.match(/(\d+)(?:st|nd|rd|th)\s+of\s+(\d+)\s+(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+Margin\s+([\d.]+)\s+Lengths?\s+Distance\s+(\d+)m\s+SOT\s+([GSH])\s+RST\s+(.+?)\s+Race\b/i);
   if(!m){invalid++;return;}
   pos=+m[1];field=+m[2];date=auDay(m[3]);venue=m[4].trim();margin=num(m[5]);trip=+m[6];
   surface=m[7].toUpperCase();className=m[8].trim();
  }
  if(date===null||field<2||pos<1||pos>field||trip<=0||margin===null||margin<0){invalid++;return;}
  if(date>=cutoff){future++;return;}
  const row={date:date,venue:venue,trip:trip,surface:surface,className:className,pos:pos,field:field,margin:margin};
  const key=String(date),signature=JSON.stringify(row);
  if(seen.has(key)){
   duplicates++;const prev=seen.get(key);
   if(prev.signature!==signature){prev.conflict=true;issues.push('CONFLICTING_START_ON_'+new Date(date).toISOString().slice(0,10));}
  }else seen.set(key,{row:row,signature:signature,conflict:false});
 });
 seen.forEach(x=>{if(!x.conflict)rows.push(x.row);});
 if(invalid)issues.push('INVALID_DATED_FORM');
 if(future)issues.push('POST_CUTOFF_FORM_IGNORED');
 return {rows:rows.sort((a,b)=>b.date-a.date).slice(0,6),issues:unique(issues),ignored_future:future,invalid:invalid,duplicates:duplicates};
}
function rate(st,prior){
 return !st||st.n===0?prior:(st.w+0.33*st.place+CONFIG.priorStarts*prior)/(st.n+CONFIG.priorStarts);
}
/* Historical class levels are ordinal HYPOTHESES, never empirically
 * verified rival ratings. A Group 1 near-win beats a low-grade win on
 * class, but insufficient evidence cannot be turned into certainty.
 */
function historicalRaceLevel(name){
 const n=String(name||'').toUpperCase(),g=n.match(/\bG([123])\b/);
 if(g)return g[1]==='1'?3.6:g[1]==='2'?2.7:2.1;
 if(/\bLR\b|\bLISTED\b/.test(n))return 1.65;
 const bm=n.match(/\bBM(?:0-)?(\d+)/);
 if(bm)return clamp((+bm[1]-40)/45,0.25,1.5);
 if(/\b1MW\b|\bNMW1Y\b/.test(n))return 0.76;
 const cl=n.match(/\bCL([1-6])\b/);
 if(cl)return 0.23+0.12*+cl[1];
 if(/\bMDN\b|\bMAIDEN\b/.test(n))return 0.18;
 if(/\bOPEN\b|\bQLTY\b/.test(n))return 1.35;
 return null;
}
function classQuality(starts){
 let weight=0,sum=0;const values=[];
 starts.slice(0,5).forEach((s,i)=>{
  const level=historicalRaceLevel(s.className);
  if(level===null)return; // Unknown grade contributes no invented class signal.
  const finish=(s.field-s.pos)/(s.field-1);
  const perf=s.pos===1?1+0.025*clamp(s.margin,0,6):
   (0.15+0.85*Math.pow(finish,0.85))*Math.exp(-clamp(s.margin,0,24)/18);
  const adjusted=level*perf,w=Math.pow(0.82,i);
  sum+=w*adjusted;weight+=w;values.push(adjusted);
 });
 if(!values.length)return null; // Unknown class is not numeric low class.
 values.sort((a,b)=>b-a);
 const high=(values[0]+(values[1]===undefined?values[0]:values[1]))/2;
 return (0.75*sum/weight+0.25*high)*values.length/(values.length+0.65);
}
function settling(h,starts){
 const vals=[],fractions=[];
 const re=/Settled\s+(\d+)(?:st|nd|rd|th)\s+800m\s+\((\d{1,2}\/\d{1,2}\/\d{4})\)/gi;
 Array.from(String(h.historical_map||'').matchAll(re)).forEach(m=>{
  const date=auDay(m[2]),s=starts.find(x=>x.date===date),position=+m[1];
  if(s&&position>=1&&position<=s.field){vals.push(position);fractions.push((position-1)/(s.field-1));}
 });
 return {position:median(vals.slice(0,5)),fraction:median(fractions.slice(0,5))};
}
function goingOf(scenario,r){
 let v=typeof scenario==='string'?scenario:scenario&&(scenario[r.id]||scenario[r.meeting]||scenario.default);
 if(typeof v!=='string')throw Error('Missing explicit going scenario: '+r.id);
 const m=v.trim().match(/^(Good(?:\s+[34])?|Soft(?:\s+[567])?|Heavy(?:\s+(?:8|9|10))?)$/i);
 if(!m)throw Error('Unsupported going scenario: '+v);
 return {label:v.trim(),key:/^Soft/i.test(v)?'soft':/^Heavy/i.test(v)?'heavy':'good',code:/^Soft/i.test(v)?'S':/^Heavy/i.test(v)?'H':'G'};
}
function runnerFeatures(h,r,going,medWeight,medBarrier,classWeight,context){
 const parsed=parseStats(h),st=parsed.records,formAudit=parseStarts(h,context.cutoff),starts=formAudit.rows;
 const prior=1/r.field_count,ratios={career:rate(st.career,prior),distance:rate(st.distance,prior),course:rate(st.course,prior),surface:rate(st[going.key],prior)};
 let form=0,wsum=0;
 starts.forEach((s,i)=>{
  const age=(context.raceDay-s.date)/86400000,w=Math.exp(-age/145)*Math.pow(0.76,i);
  const fraction=(s.field-s.pos)/(s.field-1);
  // A larger winning margin helps; a larger beaten margin hurts.
  const marginTerm=s.pos===1?0.015*clamp(s.margin,0,6):-0.037*clamp(s.margin,0,16);
  let perf=(fraction-0.5)*1.65+0.22*(s.pos===1?1:0)+marginTerm;
  perf+=0.10*Math.exp(-Math.abs(s.trip-r.distance_m)/400);
  if(s.surface===going.code)perf+=0.06;
  form+=w*perf;wsum+=w;
 });
 form=wsum?form/wsum:0;
 const days=starts.length?Math.round((context.raceDay-starts[0].date)/86400000):null;
 const layoff=days!==null&&days>120?-Math.min(.30,(days-120)/360):0;
 const signal=x=>Math.log(Math.max(.02,x)/Math.max(.02,prior));
 const straight=r.straight===true||(r.meeting==='FLEMINGTON'&&r.distance_m<=1200);
 const barrierValue=num(h.barrier),weightValue=num(h.weight_kg);
 const barrierValid=Number.isSafeInteger(barrierValue)&&barrierValue>=1;
 const weightValid=weightValue!==null&&weightValue>0&&weightValue<=100;
 const barrier=straight||!barrierValid||medBarrier===null?0:-0.015*Math.max(0,barrierValue-Math.max(6,medBarrier+2));
 const weight=!weightValid||medWeight===null?0:0.025*clamp(medWeight-weightValue,-6,6);
 const settle=settling(h,starts),quality=classQuality(starts);
 const pace=settle.fraction===null?0:context.pace*(settle.fraction-0.5)*0.12;
 const draw=straight||!barrierValid||context.maxBarrier<2?0:context.drawBias*((context.maxBarrier+1)/2-barrierValue)/((context.maxBarrier-1)/2)*0.06;
 const parts={career:CONFIG.weights.career*signal(ratios.career),recency:CONFIG.weights.recency*form,
  distance:CONFIG.weights.distance*signal(ratios.distance),surface:CONFIG.weights.surface*signal(ratios.surface),
  course:CONFIG.weights.course*signal(ratios.course),class:0,
  barrier:barrier,weight:weight,layoff:layoff,pace:pace,draw_sensitivity:draw};
 const completeness=clamp((st.career&&st.career.n>0?0.22:0)+(st.distance&&st.distance.n>0?0.13:0)+
  (st[going.key]&&st[going.key].n>0?0.13:0)+(st.course&&st.course.n>0?0.08:0)+Math.min(0.34,starts.length*0.07)+
  (settle.fraction!==null?0.06:0)+(typeof h.risks==='string'&&h.risks.trim()?0.04:0),0,1);
 const issues=parsed.issues.concat(formAudit.issues);
 if(!barrierValid)issues.push('MISSING_OR_INVALID_BARRIER');
 if(!weightValid)issues.push('MISSING_OR_INVALID_WEIGHT');
 if(!starts.length)issues.push('MISSING_PARSEABLE_RECENT_FORM');
 if(!st.career||st.career.n===0)issues.push('MISSING_CAREER_SAMPLE');
 return {h:h,raw:Object.values(parts).reduce((a,b)=>a+b,0),parts:parts,starts:starts,daysSinceLast:days,
  completeness:round(completeness),classQuality:quality,settle:settle,issues:unique(issues),formAudit:formAudit};
}
function normalize(items){
 const max=Math.max.apply(null,items.map(x=>x.raw));
 if(!Number.isFinite(max))throw Error('Nonfinite model score');
 const z=items.map(x=>Math.exp(clamp((x.raw-max)/CONFIG.temperature,-700,0))),total=z.reduce((a,b)=>a+b,0);
 const exact=z.map(x=>100*((1-CONFIG.uniformReserve)*x/total+CONFIG.uniformReserve/items.length));
 const units=exact.map(p=>Math.floor(p*100)),remaining=10000-units.reduce((a,b)=>a+b,0);
 const order=exact.map((p,i)=>({i:i,fraction:p*100-units[i],id:items[i].h.id})).sort((a,b)=>b.fraction-a.fraction||a.id.localeCompare(b.id));
 if(remaining<0||remaining>items.length)throw Error('Probability rounding failed');
 for(let i=0;i<remaining;i++)units[order[i].i]++;
 return {exact:exact,rounded:units.map(v=>v/100)};
}
function calculate(d,scenario,classWeight=CONFIG.weights.class,options={}){
 const inventory=validate(d),raceDay=day(d.date),saved=d.saved_at?day(String(d.saved_at).slice(0,10)):null;
 if(!(Number.isFinite(classWeight)&&classWeight>=0&&classWeight<=2))throw Error('Invalid class coefficient');
 if(options.cutoffDate!==undefined&&day(options.cutoffDate)===null)throw Error('Invalid information cutoff');
 // Historical evidence must precede race day and the source snapshot day.
 // Date-only snapshot metadata does not prove any same-day result was known.
 const cutoff=Math.min(raceDay,saved===null?raceDay:saved,options.cutoffDate?day(options.cutoffDate):raceDay);
 const pace=options.pace===undefined?0:options.pace,drawBias=options.drawBias===undefined?0:options.drawBias;
 if(!Number.isFinite(pace)||Math.abs(pace)>1||!Number.isFinite(drawBias)||Math.abs(drawBias)>1)throw Error('Invalid pace or draw stress');
 const records=[],races=[],excluded=[],runnerAudit=[];
 d.races.forEach(r=>{
  const listed=inventory.byRace.get(r.id),horses=listed.filter(isEligible);
  listed.forEach(h=>{
   const status=statusOf(h);runnerAudit.push({id:h.id,race_id:r.id,status:status,included:isEligible(h)});
   if(!isEligible(h))excluded.push({id:h.id,race_id:r.id,horse:h.horse,status:status,reason:String(h.status||'')});
  });
  const going=goingOf(scenario,r),base={id:r.id,meeting:r.meeting,race:r.race,title:r.title,going:going.label,
   listed_field:listed.length,excluded:listed.length-horses.length,field:horses.length};
  if(horses.length<2){
   races.push(Object.assign(base,{status:'NO_CONTEST',leader:null,top_p:null,gap:null,chaos:null,sum:null,issues:['FEWER_THAN_TWO_INCLUDED_RUNNERS']}));
   return;
  }
  const weights=horses.map(h=>num(h.weight_kg)).filter(x=>x!==null&&x>0&&x<=100);
  const barriers=horses.map(h=>num(h.barrier)).filter(x=>Number.isSafeInteger(x)&&x>0);
  const context={raceDay:raceDay,cutoff:cutoff,pace:pace,drawBias:drawBias,maxBarrier:barriers.length?Math.max.apply(null,barriers):0};
  const entries=horses.slice().sort((a,b)=>a.id.localeCompare(b.id)).map(h=>runnerFeatures(h,Object.assign({},r,{field_count:horses.length}),going,median(weights),median(barriers),classWeight,context));
  // Each contender is rated relative to the actual competitors in this race.
  // The three highest-rated rivals and the median rival determine an anchor.
  // This is current-field competition, not a historic-opponent database.
  entries.forEach(x=>{
   const others=entries.filter(y=>y.h.id!==x.h.id&&Number.isFinite(y.classQuality))
     .map(y=>y.classQuality).sort((a,b)=>b-a);
   const top=others.slice(0,Math.min(3,others.length));
   const anchor=others.length?0.65*top.reduce((s,v)=>s+v,0)/top.length+0.35*median(others):null;
   const edge=x.classQuality===null||anchor===null?null:x.classQuality-anchor;
   const contribution=edge===null?0:classWeight*edge;
   x.parts.class=contribution;x.raw+=contribution;
   x.oppositionAnchor=anchor;x.oppositionEdge=edge;
  });
  const p=normalize(entries),mid=median(entries.map(x=>x.raw));
  entries.forEach((x,i)=>{x.p=p.rounded[i];x.pExact=p.exact[i];});
  entries.sort((a,b)=>b.pExact-a.pExact||a.h.id.localeCompare(b.h.id));
  const top=entries[0].p,second=entries[1].p,gap=round(top-second);
  const entropy=-entries.reduce((s,x)=>s+x.pExact/100*Math.log(x.pExact/100),0)/Math.log(entries.length);
  const chaos=round(clamp(100*(0.65*entropy+0.35*Math.exp(-gap/15)),0,100),0);
  entries.forEach((x,i)=>{
   const drivers=Object.keys(x.parts).map(k=>({feature:k,contribution:round(x.parts[k],5)}));
   records.push({id:x.h.id,race_id:r.id,horse:x.h.horse,meeting:r.meeting,race:r.race,
    rank:i+1,p:x.p,p_exact:x.pExact,model_score:round(clamp(50+18*(x.raw-mid),1,99),1),
    fair_odds:round(100/x.pExact),field_size:entries.length,field_gap:gap,chaos:chaos,
    completeness:x.completeness,days_since_last:x.daysSinceLast,features:x.parts,grade_quality:x.classQuality===null?null:round(x.classQuality,3),
     opposition_class_anchor:x.oppositionAnchor===null?null:round(x.oppositionAnchor,3),opposition_class_edge:x.oppositionEdge===null?null:round(x.oppositionEdge,3),
    settle_800:x.settle.position,settle_fraction:x.settle.fraction,status:statusOf(x.h),original_pick:!!x.h.original_pick,
    input_issues:x.issues,form_audit:{accepted:x.starts.length,ignored_future:x.formAudit.ignored_future,invalid:x.formAudit.invalid,duplicates:x.formAudit.duplicates},
    g1_wins:x.starts.filter(s=>/\bG1\b/i.test(s.className)&&s.pos===1).length,
    g1_top2:x.starts.filter(s=>/\bG1\b/i.test(s.className)&&s.pos<=2).length,
    positive_drivers:drivers.filter(x=>x.contribution>0).sort((a,b)=>b.contribution-a.contribution),
    negative_drivers:drivers.filter(x=>x.contribution<0).sort((a,b)=>a.contribution-b.contribution)});
  });
  const quality=entries.map(x=>x.classQuality).filter(Number.isFinite).sort((a,b)=>b-a);
  const size=Math.min(quality.length,Math.max(2,Math.ceil(entries.length/3)));
  races.push(Object.assign(base,{status:'MODELLED_PROVISIONAL',field_quality:size?round(quality.slice(0,size).reduce((a,b)=>a+b,0)/size):null,
   leader:entries[0].h.horse,top_p:top,gap:gap,chaos:chaos,sum:round(entries.reduce((s,x)=>s+x.p,0)),
   field_verified:horses.every(h=>statusOf(h)==='ACTIVE_VERIFIED')&&r.field_verified===true,
   issues:unique(entries.flatMap(x=>x.issues))}));
 });
 if(records.length+excluded.length+runnerAudit.filter(a=>a.included&&!records.some(x=>x.id===a.id)).length!==d.runners.length||
    races.some(r=>r.status==='MODELLED_PROVISIONAL'&&r.sum!==100))throw Error('Whole-field inventory QA failed');
 return {version:VERSION,scenario:scenario,date:d.date,status:races.every(r=>r.status==='MODELLED_PROVISIONAL')?'PROVISIONAL_UNCALIBRATED':'INCOMPLETE_INPUT',calibration_status:'NOT_ESTABLISHED',
  market_blind:true,publication_approved:false,asOf:d.saved_at||null,
  caveat:'Conditional model estimates; uncalibrated; field and going assumptions require official verification.',
  records:records,races:races,excluded:excluded,runnerAudit:runnerAudit,input_issues:inventory.issues};
}
function sortProbability(a,b){return b.p_exact-a.p_exact||b.completeness-a.completeness||b.robust_floor-a.robust_floor||b.gap-a.gap||a.id.localeCompare(b.id);}
/* Single win-first selection gate. Raw win probabilities remain diagnostics.
 * Scenarios are fixed Good 4, Soft 5 and both conservative-class variants:
 * changing the screen's selected track cannot promote a different leader.
 * Race-level abstention is deliberate; estimates remain uncalibrated.
 */
function winFirstBoard(baseline,scenarios){
 const good=scenarios[8],soft=scenarios[1],goodCon=scenarios[9],softCon=scenarios[3];
 const datasets=[good,soft,goodCon,softCon],lookups=datasets.map(s=>new Map(s.records.map(x=>[x.id,x])));
 const priority=[],review=[],avoid=[],byRace=[];
 baseline.races.forEach(r=>{
  const pick=s=>s.records.find(x=>x.race_id===r.id&&x.rank===1);
  const g=pick(good),s=pick(soft);
  if(r.going!=='Good 4'&&r.going!=='Soft 5'){
   const x={race_id:r.id,meeting:r.meeting,race:r.race,status:'NO_SELECTION',reasons:['TRACK_GRADE_OUTSIDE_TESTED_GOOD4_SOFT5']};
   avoid.push(x);byRace.push(x);return;
  }
  if(!g||!s){
   const x={race_id:r.id,meeting:r.meeting,race:r.race,status:'NO_SELECTION',reasons:['INCOMPLETE_FIELD']};
   avoid.push(x);byRace.push(x);return;
  }
  if(g.id!==s.id){
   const x={race_id:r.id,meeting:r.meeting,race:r.race,status:'NO_SELECTION',
    reasons:['GOING_CHANGES_RACE_LEADER'],good4:g.horse,soft5:s.horse};
   avoid.push(x);byRace.push(x);return;
  }
  const current=baseline.records.find(x=>x.id===g.id);
  if(!current){
   const x={race_id:r.id,meeting:r.meeting,race:r.race,status:'NO_SELECTION',reasons:['CANONICAL_LEADER_NOT_IN_CURRENT_FIELD']};
   avoid.push(x);byRace.push(x);return;
  }
  const samples=lookups.map(m=>m.get(g.id)),p=samples.map(x=>x.p),floor=Math.min(...p),ceiling=Math.max(...p);
  const gap=Math.min(...[good,soft].map(a=>{
   const rows=a.records.filter(x=>x.race_id===r.id).sort((x,y)=>x.rank-y.rank);
   return rows.length>=2?rows[0].p-rows[1].p:0;
  }));
  const chaos=Math.max(good.races.find(x=>x.id===r.id).chaos,soft.races.find(x=>x.id===r.id).chaos);
  const reasons=[];
  if(!samples.every(x=>x.rank===1))reasons.push('CLASS_ASSUMPTION_CHANGES_RANK');
  if(current.form_audit.accepted<3)reasons.push('LIMITED_RECENT_FORM');
  if(current.completeness<0.78)reasons.push('INCOMPLETE_DOSSIER');
  if(current.input_issues.length)reasons.push('FORM_INPUT_ISSUES');
  if(floor<17)reasons.push('LOW_CONSERVATIVE_CHANCE');
  if(gap<4)reasons.push('WEAK_FIELD_SEPARATION');
  if(chaos>89)reasons.push('CROWDED_RACE');
  if(ceiling-floor>12)reasons.push('WIDE_CLASS_OR_GOING_SENSITIVITY');
  if(current.days_since_last!==null&&current.days_since_last>70)reasons.push('FITNESS_AFTER_BREAK');
  if(current.days_since_last!==null&&current.days_since_last<=7)reasons.push('SHORT_BACKUP');
  const item={runner_id:g.id,horse:g.horse,race_id:r.id,meeting:r.meeting,race:r.race,
   model_pct:current.p,robust_floor:floor,robust_spread:round(ceiling-floor),min_gap:round(gap),
   max_chaos:chaos,completeness:current.completeness,dated_starts:current.form_audit.accepted,
   grade_quality:current.grade_quality,reasons:reasons,good4_pct:g.p,soft5_pct:s.p};
  if(!reasons.length){item.status='PRIORITY_RESEARCH';priority.push(item);}
  else if(floor>=13&&gap>=4&&chaos<=89&&current.form_audit.accepted>=3&&
   current.completeness>=0.78&&!current.input_issues.length){
   item.status='REVIEW_ONLY';review.push(item);
  }else{item.status='NO_SELECTION';avoid.push(item);}
  byRace.push(item);
 });
 const rank=(a,b)=>b.robust_floor-a.robust_floor||b.min_gap-a.min_gap||a.race_id.localeCompare(b.race_id);
 priority.sort(rank);review.sort(rank);
 const candidates=priority.concat(review);
 return {status:'RESEARCH_ONLY_UNCALIBRATED',method:'FIXED_GOOD4_SOFT5_PLUS_CONSERVATIVE_CLASS',
  priority:priority,review:review,avoid:avoid,byRace:byRace,researchCandidates:candidates,
  top5:candidates.slice(0,5),top10:candidates.slice(0,10),top15:candidates.slice(0,15),
  caveat:'Only consistent scenario leaders enter the list; review-only horses are NOT research priorities. No padding, frozen approval, or demonstrated win-rate gain.'};
}

function board(d,options={}){
 const baselineGoing=options.going||'Good 4';
 const variants=[
  {label:'Baseline going; base class',going:baselineGoing,classWeight:CONFIG.weights.class},
  {label:'Soft 5; base class',going:'Soft 5',classWeight:CONFIG.weights.class},
  {label:'Baseline going; conservative class',going:baselineGoing,classWeight:CONFIG.conservativeClass},
  {label:'Soft 5; conservative class',going:'Soft 5',classWeight:CONFIG.conservativeClass},
  {label:'Baseline going; fast pace',going:baselineGoing,classWeight:CONFIG.weights.class,pace:1},
  {label:'Baseline going; slow pace',going:baselineGoing,classWeight:CONFIG.weights.class,pace:-1},
  {label:'Baseline going; inside draw sensitivity',going:baselineGoing,classWeight:CONFIG.weights.class,drawBias:1},
  {label:'Baseline going; outside draw sensitivity',going:baselineGoing,classWeight:CONFIG.weights.class,drawBias:-1},
  {label:'Good 4; base class',going:'Good 4',classWeight:CONFIG.weights.class},
  {label:'Good 4; conservative class',going:'Good 4',classWeight:CONFIG.conservativeClass}
 ];
 const scenarios=variants.map(v=>calculate(d,v.going,v.classWeight,{pace:v.pace,drawBias:v.drawBias,cutoffDate:options.cutoffDate}));
 const good=scenarios[0],maps=scenarios.map(s=>new Map(s.records.map(x=>[x.id,x]))),byRace=new Map();
 good.records.forEach(x=>{if(!byRace.has(x.race_id))byRace.set(x.race_id,[]);byRace.get(x.race_id).push(x);});
 good.records.forEach(x=>{
  const values=maps.map(m=>m.get(x.id).p),ranks=maps.map(m=>m.get(x.id).rank),field=byRace.get(x.race_id);
  x.soft_p=maps[1].get(x.id).p;x.surface_swing=round(x.p-x.soft_p);
  x.model_range=[Math.min.apply(null,values),Math.max.apply(null,values)];
  x.robust_floor=x.model_range[0];x.robust_spread=round(x.model_range[1]-x.model_range[0]);
  x.top1_scenarios=ranks.filter(n=>n===1).length;x.top3_scenarios=ranks.filter(n=>n<=3).length;x.rank_scenarios=ranks;
  x.scenario_probabilities=scenarios.map((s,i)=>({label:variants[i].label,p:maps[i].get(x.id).p,rank:ranks[i]}));
  x.gap=round(x.p-Math.max.apply(null,field.filter(h=>h.id!==x.id).map(h=>h.p)));
  // Both possible goings must be checked even when Soft 5 is the baseline.
  x.good4_p=maps[8].get(x.id).p;
  x.good4_rank=maps[8].get(x.id).rank;
  x.soft5_rank=ranks[1];
  x.going_dependent_lead=x.rank===1&&x.good4_rank!==x.soft5_rank;
  const r=good.races.find(r=>r.id===x.race_id);x.field_quality=r.field_quality;x.field_chaos=r.chaos;
  x.quality_flags=[];
  if(x.completeness<0.70)x.quality_flags.push('LIMITED_DOSSIER');
  if(x.input_issues.length)x.quality_flags.push('INPUT_REVIEW_REQUIRED');
  if(x.robust_spread>=6)x.quality_flags.push('SCENARIO_SENSITIVE');
  if(x.going_dependent_lead)x.quality_flags.push('GOING_DEPENDENT_LEAD');
  if(x.top1_scenarios<Math.ceil(variants.length*0.75))x.quality_flags.push('UNSTABLE_RACE_LEAD');
  if(x.field_chaos>=90)x.quality_flags.push('CROWDED_RACE');
  x.publication_flags=['UNCALIBRATED_MODEL'];
  if(!r.field_verified)x.publication_flags.push('FINAL_FIELD_UNVERIFIED');
  x.research_status=x.quality_flags.length?'HIGH_UNCERTAINTY':'PROVISIONAL';
  x.elite_form=x.g1_wins>=2&&x.g1_top2>=3; // Diagnostic only; never promotes a selection.
 });
 const audit=(Array.isArray(d.market_audit)?d.market_audit:[]).map(a=>{
  const h=good.records.find(x=>x.race_id===a.race_id&&x.horse===a.horse),price=num(a.decimal_odds),valid=price!==null&&price>1;
  const implied=valid?100/price:null;
  return {race_id:a.race_id,horse:a.horse,observed_at:a.observed_at||null,source:a.source||null,
   price:valid?price:null,implied_p:implied===null?null:round(implied),model_p:h?h.p:null,
   gap_pp:h&&implied!==null?round(implied-h.p):null,
   severity:!valid?'INVALID_QUOTE':h&&Math.abs(implied-h.p)>=20?'CRITICAL_MODEL_DISAGREEMENT':'REVIEW'};
 });
 const leaders=good.records.filter(x=>x.rank===1).sort(sortProbability);
 const robustLeaders=Array.from(byRace.values()).map(rows=>rows.slice().sort((a,b)=>b.robust_floor-a.robust_floor||sortProbability(a,b))[0])
  .sort((a,b)=>b.robust_floor-a.robust_floor||sortProbability(a,b));
 const qualified=leaders.filter(x=>x.quality_flags.length===0);
 return {version:VERSION,date:d.date,status:good.status,calibration_status:'NOT_ESTABLISHED',market_blind:true,
  assumption:'Conditional listed fields; explicit baseline '+(typeof baselineGoing==='string'?baselineGoing:'per-race going scenarios')+'; unverified starters remain provisional.',
  sourceCount:d.runners.length,activeCount:good.records.length,excludedCount:good.excluded.length,raceCount:d.races.length,
  baseline:good,soft:scenarios[1],marketAudit:audit,publication_blocked:true,publication_reasons:['UNCALIBRATED_MODEL','OFFICIAL_FIELD_AND_TRACK_REVIEW_REQUIRED'],
  stress:{goodClassConservative:scenarios[2],softClassConservative:scenarios[3]},scenarios:scenarios,model_variants:variants.map(v=>v.label),
  leaders:leaders,robustLeaders:robustLeaders,qualifiedLeaders:qualified,eliteLeaders:leaders.filter(x=>x.elite_form),
  winFirst:winFirstBoard(good,scenarios),
  top5:leaders.slice(0,5),top10:leaders.slice(0,10),top15:leaders.slice(0,15),
  screen:{description:'Evidence and sensitivity screen; no price or horse override; not a calibration or hit-rate claim.',
   rules:{completeAtLeast:0.70,scenarioSwingBelow:6,top1InScenariosAtLeast:Math.ceil(variants.length*0.75),chaosBelow:90,goingIndependentLeader:true},
   qualifiedRaceCount:qualified.length,totalRaceCount:leaders.length,shortlistCount:Math.min(10,leaders.length)}};
}
function validateRows(rows){
 if(!Array.isArray(rows)||rows.length<2)throw Error('A full race distribution is required');
 const ids=new Set();let sum=0;
 rows.forEach(r=>{
  if(!r||typeof r.id!=='string'||!r.id||ids.has(r.id)||!Number.isFinite(r.p)||r.p<0||r.p>100)throw Error('Invalid or duplicate probability row');
  ids.add(r.id);sum+=r.p;
 });
 if(Math.abs(sum-100)>1e-7)throw Error('Race probabilities must total 100');
}
function rng(seed){
 let x=2166136261;
 for(const c of String(seed))x=Math.imul(x^c.charCodeAt(0),16777619)>>>0;
 if(!x)x=1;
 return function(){x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
}
function simulateWinners(rows,count=10000,seed=VERSION){
 validateRows(rows);
 if(!Number.isSafeInteger(count)||count<1||count>1000000)throw Error('Invalid simulation count');
 const races=unique(rows.map(r=>r.race_id));
 if(races.length!==1||!races[0])throw Error('Simulation requires one race');
 const random=rng(seed),hits=rows.map(()=>0);
 for(let i=0;i<count;i++){
  let v=random()*100;
  for(let j=0;j<rows.length;j++){v-=rows[j].p;if(v<0||j===rows.length-1){hits[j]++;break;}}
 }
 return {version:VERSION,race_id:races[0],count:count,seed:String(seed),status:'SIMULATION_OF_UNCALIBRATED_MODEL',
  rows:rows.map((r,i)=>({id:r.id,horse:r.horse,model_p:r.p,sim_wins:hits[i],sim_win_pct:round(100*hits[i]/count)}))};
}
function multi(b,ids){
 if(!b||b.version!==VERSION||!Array.isArray(b.scenarios)||!Array.isArray(ids)||ids.length<2||ids.length>3||new Set(ids).size!==ids.length)throw Error('Choose two or three unique legs from this model version');
 const legs=ids.map(id=>b.baseline.records.find(r=>r.id===id));
 if(legs.some(x=>!x)||new Set(legs.map(x=>x.race_id)).size!==legs.length)throw Error('Legs must be included starters from distinct races');
 const scenarios=b.scenarios.map((s,i)=>{
  const rows=ids.map(id=>s.records.find(r=>r.id===id));
  if(rows.some(x=>!x))throw Error('Leg missing from a model scenario');
  return {label:b.model_variants[i],joint_pct:100*rows.reduce((p,x)=>p*x.p/100,1)};
 });
 return {version:VERSION,status:'PROVISIONAL_UNCALIBRATED',legs:legs.map(r=>({id:r.id,race_id:r.race_id,p:r.p})),
  baseline_joint_pct:scenarios[0].joint_pct,scenario_range_pct:[Math.min.apply(null,scenarios.map(s=>s.joint_pct)),Math.max.apply(null,scenarios.map(s=>s.joint_pct))],
  scenarios:scenarios,assumption:'Product assumes independence across races. Scenario range is sensitivity, not a confidence interval or guaranteed hit rate.'};
}
function stamp(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)||day(value.slice(0,10))===null)return null;
 const time=value.slice(11,19).split(':').map(Number);
 if(time[0]>23||time[1]>59||time[2]>59)return null;
 const t=Date.parse(value);return Number.isFinite(t)?t:null;
}
function evaluateFrozen(forecasts,results){
 if(!Array.isArray(forecasts)||!Array.isArray(results))throw Error('Forecast and verified result arrays required');
 const forecastCounts=new Map(),resultCounts=new Map(),resultMap=new Map(),excluded=[],scored=[],bins=Array.from({length:10},()=>({n:0,p:0,w:0}));
 forecasts.forEach(f=>forecastCounts.set(f.race_id,(forecastCounts.get(f.race_id)||0)+1));
 results.forEach(r=>{resultCounts.set(r.race_id,(resultCounts.get(r.race_id)||0)+1);resultMap.set(r.race_id,r);});
 forecasts.forEach(f=>{
  const reject=reason=>excluded.push({race_id:f.race_id||null,reason:reason});
  if(!f.race_id||forecastCounts.get(f.race_id)!==1)return reject('ONE_FROZEN_VERSION_PER_RACE_REQUIRED');
  const r=resultMap.get(f.race_id);
  if(!r||resultCounts.get(f.race_id)!==1||r.verified!==true||!/^https:\/\//.test(r.official_url||''))return reject('MISSING_UNIQUE_VERIFIED_RESULT');
  const snapshot=stamp(f.snapshot_at_utc),raceAt=stamp(f.race_at_utc),frozenAt=stamp(f.frozen_at_utc);
  if(f.publication_frozen!==true||f.publication_approved!==true||!/^https:\/\//.test(f.freeze_proof_url||'')||
     snapshot===null||raceAt===null||frozenAt===null||snapshot>=raceAt||frozenAt<snapshot||frozenAt>=raceAt)return reject('NO_PRE_RACE_FROZEN_PROVENANCE');
  if(typeof f.model_version!=='string'||!f.model_version||typeof f.field_revision!=='string'||!f.field_revision||f.field_revision!==r.field_revision)return reject('MODEL_OR_FIELD_REVISION_MISSING');
  try{validateRows(f.rows);}catch(e){return reject('INVALID_WHOLE_FIELD_PROBABILITIES');}
  if(!Array.isArray(r.active_runner_ids)||new Set(r.active_runner_ids).size!==r.active_runner_ids.length||
     JSON.stringify(r.active_runner_ids.slice().sort())!==JSON.stringify(f.rows.map(x=>x.id).sort())||
     !r.active_runner_ids.includes(r.winner_runner_id)||f.rows.some(x=>x.race_id&&x.race_id!==f.race_id))return reject('RESULT_FIELD_MISMATCH');
  let brier=0;
  f.rows.forEach(x=>{
   const p=x.p/100,y=x.id===r.winner_runner_id?1:0;brier+=(p-y)**2;
   const bin=bins[Math.min(9,Math.floor(p*10))];bin.n++;bin.p+=p;bin.w+=y;
  });
  const winnerP=f.rows.find(x=>x.id===r.winner_runner_id).p/100;
  const top=f.rows.slice().sort((a,b)=>b.p-a.p||a.id.localeCompare(b.id))[0];
  scored.push({race_id:f.race_id,model_version:f.model_version,brier:brier,log_loss:-Math.log(Math.max(1e-15,winnerP)),top1_won:top.id===r.winner_runner_id});
 });
 const mean=(rows,key)=>rows.length?rows.reduce((s,r)=>s+r[key],0)/rows.length:null;
 const reliability=bins.map((b,i)=>{
  if(!b.n)return {lower:i/10,upper:(i+1)/10,count:0,mean_predicted:null,observed:null,wilson95:null};
  const observed=b.w/b.n,z=1.96,den=1+z*z/b.n,center=(observed+z*z/(2*b.n))/den;
  const half=z*Math.sqrt(observed*(1-observed)/b.n+z*z/(4*b.n*b.n))/den;
  return {lower:i/10,upper:(i+1)/10,count:b.n,mean_predicted:b.p/b.n,observed:observed,wilson95:[Math.max(0,center-half),Math.min(1,center+half)]};
 });
 const count=bins.reduce((s,b)=>s+b.n,0),versions=unique(scored.map(r=>r.model_version));
 return {status:scored.length?'FROZEN_FORECAST_DIAGNOSTIC':'NO_VERIFIED_BACKTEST',races:scored.length,excluded:excluded,scored:scored,
  mean_multiclass_brier:mean(scored,'brier'),mean_log_loss:mean(scored,'log_loss'),log_loss_clip_epsilon:1e-15,
  top1_hit_rate:scored.length?scored.filter(x=>x.top1_won).length/scored.length:null,
  ece:count?reliability.filter(b=>b.count).reduce((s,b)=>s+b.count/count*Math.abs(b.mean_predicted-b.observed),0):null,
  reliability:reliability,by_model_version:versions.map(v=>{const rows=scored.filter(r=>r.model_version===v);return {model_version:v,races:rows.length,mean_multiclass_brier:mean(rows,'brier'),mean_log_loss:mean(rows,'log_loss')};}),
  calibration_fitted:false,caveat:'Inputs must be independently verified upstream. These diagnostics do not fit coefficients, prove future accuracy, or turn scenario ranges into confidence intervals.'};
}
const api={VERSION:VERSION,CONFIG:CONFIG,historicalRaceLevel:historicalRaceLevel,classQuality:classQuality,board:board,calculate:calculate,isEligible:isEligible,statusOf:statusOf,simulateWinners:simulateWinners,multi:multi,evaluateFrozen:evaluateFrozen};
global.RacingLabV5NeutralClassExperiment=Object.freeze(api);
if(typeof module!=='undefined'&&module.exports)module.exports=global.RacingLabV5NeutralClassExperiment;
})(typeof window==='undefined'?globalThis:window);
