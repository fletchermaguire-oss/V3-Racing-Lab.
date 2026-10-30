/* Plain-English runner evidence. Independent of V5 rankings and probabilities.
 * Only uses saved runner dossier, dated form, track scenario and research risks.
 * Missing evidence is explicitly labelled unknown, never a proven disadvantage.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RacingLabHorseAnalysis=api;})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
function text(s){return String(s==null?'':s).trim();}
function trim(s){return text(s).replace(/\s+/g,' ').replace(/\s*[.;,]+\s*$/,'');}
function count(s,label){
 const re=new RegExp('\\b'+label+'\\s+(?:(\\d+)\\s*:\\s*(\\d+)\\s*-\\s*(\\d+)\\s*-\\s*(\\d+)|(\\d+)\\s*-\\s*(\\d+)\\s*-\\s*(\\d+))','i');
 const m=re.exec(s);
 if(!m)return null;
 if(m[1]!==undefined)return {starts:+m[1],wins:+m[2],places:+m[3]+ +m[4]};
 return {wins:+m[5],places:+m[6],starts:+m[7]};
}
function dated(s){
 const rx=/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+(\d+)m\s+\(([GSH])\),\s*([^:\n]+):\s*(\d+)\/(\d+),\s*PDF margin\s*([\d.]+)L/gim;
 return Array.from(text(s).matchAll(rx)).map(m=>({
  date:m[1],venue:trim(m[2]),distance:+m[3],surface:m[4],
  grade:trim(m[5]),pos:+m[6],field:+m[7],margin:+m[8]
 })).filter(x=>x.pos>0&&x.pos<=x.field&&x.field>1);
}
function raceClass(r){return /\bG1\b|\bGroup\s+G1\b/i.test(r.grade)?'Group 1':/\bG2\b/i.test(r.grade)?'Group 2':/\bG3\b/i.test(r.grade)?'Group 3':/\bLR\b|\bLISTED\b/i.test(r.grade)?'Listed':null;}
function quality(label){return (label||'').replace(/\bOPEN\s+Group\s+G([123])\b/i,'Group $1').replace(/\bQlty\s+Group\s+G([123])\b/i,'Group $1').replace(/\bOPEN\s+Group\s+LR\b/i,'Listed').replace(/\bGroup\s+G([123])\b/i,'Group $1');}
function clause(s){const t=trim(s);return t?t[0].toUpperCase()+t.slice(1).replace(/[.!?]$/,'')+'.':'';}
function push(arr,title,detail){const clean=clause(detail);if(clean&&!arr.some(a=>a.title===title))arr.push({title,detail:clean});}
function analysis(h,race,m,going,curated){
 const pros=[],cons=[],unknown=[];
 const stats=text(h.statistics),record=count(stats,'Career'),course=count(stats,'(?:course|Track)'),dist=count(stats,'(?:distance|Dist)');
 const surface=/^Soft/i.test(going)?count(stats,'Soft'):/^Heavy/i.test(going)?count(stats,'Heavy'):count(stats,'Good');
 const runs=dated(h.form),last=runs[0]||null,ratings=runs.filter(x=>/\bG[123]\b|\bGroup\s+[123]\b|\bLR\b|\bListed\b/i.test(x.grade));
 const num=(v)=>v===null||v===undefined||text(v)===''?null:Number(v);
 const barrier=num(h.barrier),weight=num(h.weight_kg),n=m&&Number.isFinite(m.field_size)?m.field_size:null;
 if(record&&record.starts>0&&record.wins<=record.starts&&record.places<=record.starts-record.wins){
  const wins=record.wins+' win'+(record.wins===1?'':'s')+' from '+record.starts+' starts';
  push(pros,'Career record',wins+'. '+(record.places?record.places+' further placing'+(record.places===1?'':'s')+' in the source record':'The sample is small enough to avoid assuming this always repeats'));
 }else unknown.push('The career record could not be confirmed from this dossier.');
 if(last){
  const finish=last.pos===1?'Won':last.pos===2?'Finished second':last.pos===3?'Finished third':'Finished '+last.pos+'th';
  const place=last.pos===1?'by '+last.margin+' lengths':'beaten '+last.margin+' lengths';
  const sentence=finish+' of '+last.field+' at '+last.venue+' over '+last.distance+'m ('+quality(last.grade)+'), '+place;
  push(last.pos<=3?pros:cons,last.pos<=3?'Last-start performance':'Last-start concern',sentence);
 }
 const strong=runs.find(x=>x.pos===1&&/\bG[123]\b/i.test(x.grade));
 if(strong&&(!last||strong.date!==last.date))push(pros,'Proven stakes-level ability','Won a '+quality(strong.grade)+' over '+strong.distance+'m at '+strong.venue+' on '+strong.date);
 else if(ratings.length&&ratings[0].pos<=2&&last&&last.pos>3)push(pros,'Strong earlier opposition','Has a recent top-two result in '+quality(ratings[0].grade)+', so the latest run is not the entire form picture');
 if(course&&course.wins>0)push(pros,'Proven at this course','Has '+course.wins+' win'+(course.wins===1?'':'s')+' from '+course.starts+' recorded starts at this course');
 if(dist&&dist.starts>=1&&dist.wins>0)push(pros,'Proven at the distance','Has '+dist.wins+' win'+(dist.wins===1?'':'s')+' from '+dist.starts+' recorded starts at this distance');
 else if(!dist||dist.starts===0)unknown.push('No reliable distance-specific record is available; suitability must be checked.');
 else if(dist.starts<=2)unknown.push('Only '+dist.starts+' recorded distance start'+(dist.starts===1?'':'s')+'; there is not enough evidence to call the trip a weakness.');
 if(surface&&surface.wins>0)push(pros,'Going experience','Has won '+surface.wins+' of '+surface.starts+' recorded starts on '+going.replace(/\s+\d+$/,'')+' going');
 else if(!surface||surface.starts===0)unknown.push('No recorded '+going+' sample is available. This is uncertainty, not proof the horse dislikes the surface.');
 else if(surface.starts<3)unknown.push('Only '+surface.starts+' recorded starts on '+going+'; the surface effect is uncertain.');
 if(last&&race&&Number.isFinite(race.distance_m)&&Math.abs(last.distance-race.distance_m)>=350)
  push(cons,'Change in distance','This race is '+race.distance_m+'m, compared with '+last.distance+'m last time. The change in trip needs to suit');
 if(Number.isFinite(barrier)&&barrier>=10&&(!n||n>=10))
  push(cons,'Wide draw','Barrier '+barrier+' may make it harder to obtain a comfortable position, depending on the early pace and track pattern');
 if(Number.isFinite(weight)&&weight>=60)
  push(cons,'Weight to manage','The published weight is '+weight+'kg; the actual riding claim and weight relative to rivals should be confirmed');
 if(runs.length<3)unknown.push('Only '+runs.length+' machine-readable dated '+(runs.length===1?'start was':'starts were')+' found in this dossier; earlier performances may be missing.');
 const risk=text(curated&&curated.risk);
 if(risk)push(cons,'Key race-specific danger',risk);
 const sourcedRisk=text(h.risks);
 if(!risk&&sourcedRisk&&!/^No specific verified negative/i.test(sourcedRisk)){
  const t=sourcedRisk.replace(/^HOW THIS RUNNER CAN LOSE:\s*/i,'').split(/\.\s+(?=[A-Z])/)[0];
  if(t.length>12)push(cons,'What could go wrong',t.length>320?t.slice(0,317)+'…':t);
 }
 if(pros.length<2&&Number.isFinite(barrier)&&barrier<=3)
  push(pros,'Inside draw','Barrier '+barrier+' may allow an economical run if the horse settles well');
 if(cons.length===0&&last&&last.pos>1)push(cons,'Still needs to improve','The most recent run was not a win; map, strength of opposition and how this race is run still matter');
 if(cons.length===0)push(cons,'Race-shape uncertainty','The saved dossier does not establish how the tempo, interference and race-day track pattern will unfold');
 if(!pros.length)unknown.push('Insufficient verified positive evidence to name a clear advantage; check the complete source dossier.');
 if(!m)unknown.push('Runner is excluded from the current provisional field; these notes do not imply it will start.');
 return {pros:pros.slice(0,4),cons:cons.slice(0,3),unknown:unknown.slice(0,3),
  status:m?'PROVISIONAL_RESEARCH':'NOT_CURRENT_FIELD',
  source:'Saved form and research dossier; contextual comments are conditional, not guarantees.'};
}
return Object.freeze({analysis:analysis,count:count,dated:dated});
});
