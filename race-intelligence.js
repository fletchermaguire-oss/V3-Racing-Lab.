/* Racing Lab V4 — evidence-grounded race intelligence. No external dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.RacingLabIntelligence=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const norm=s=>String(s??'').trim();
const asArray=x=>Array.isArray(x)?x:[];
const number=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
function analyzeRunner(h,d={},race={},evidence=[]){
 const items=[];const add=(kind,text,source,confidence='medium')=>{if(text&&source)items.push({kind,text,source,confidence})};
 const form=asArray(d.form);for(const line of form.slice(0,5)){
  if(typeof line!=='string')continue;
  if(/\b1st\/|\b2nd\/|\b3rd\/|won by|beaten 0\.[0-9]+L/i.test(line))add('positive','Recorded competitive performance: '+line,'saved dossier', 'medium');
  if(/\b(?:[6-9]|1[0-9])th\/|beaten [4-9](?:\.[0-9]+)?L/i.test(line))add('risk','Recorded below-placing performance: '+line,'saved dossier','medium');
 }
 if(norm(d.note)){for(const sentence of d.note.split(/(?<=[.!?])\s+/).slice(0,5)){
  if(/uncertain|doubt|poor|low|risk|wide|heavy|0 wins|0 from|top weight|concern|unproven|negative/i.test(sentence))add('risk',sentence,'saved analyst note','medium');
  else add('positive',sentence,'saved analyst note','low');
 }}
 if(norm(d.rob).toLowerCase()==='low')add('risk','Recorded model robustness is low.','saved dossier','high');
 if(number(d.weight)!==null&&d.weight>=60)add('risk','Carries '+d.weight+' kg; compare with rivals before assigning a weight penalty.','saved dossier','low');
 if(norm(d.trial))add('context','Recorded trial: '+d.trial,'saved dossier','medium');
 for(const ev of asArray(evidence)){
  if(!ev||!['positive','risk','context','pace'].includes(ev.kind)||!norm(ev.text)||!norm(ev.source)||!norm(ev.observedAt))continue;
  const cutoff=norm(race.asOf);if(cutoff&&ev.observedAt>cutoff)continue;
  add(ev.kind,ev.text,ev.source,ev.confidence||'medium');
 }
 const pace=items.filter(x=>x.kind==='pace');const scenario=[];
 if(number(d.settle)!==null){scenario.push('Historical settling position recorded as '+d.settle+'; use only as a starting assumption.');scenario.push(d.settle<=3?'Possible route: secure a forward position without overexertion, then sustain the finish.':'Possible route: settle with cover and obtain clear running before the final sprint.');}
 else scenario.push('Settling pattern is not verified; no horse-specific pace projection available.');
 if(number(h.barrier)!==null)scenario.push('Barrier '+h.barrier+' is recorded; advantage depends on speed map and track pattern.');
 if(pace.length)scenario.push(...pace.map(x=>x.text));
 const positives=items.filter(x=>x.kind==='positive');const risks=items.filter(x=>x.kind==='risk');
 return {runner:h.name,race:h.race,forecast:number(h.p),rating:number(h.rating),positives,risks,context:items.filter(x=>x.kind==='context'),scenario:{type:'conditional',lines:scenario},evidenceCount:items.length,coverage:!items.length?'missing':positives.length&&risks.length?'partial-two-sided':'partial',limitations:['Evidence descriptions do not explain the mathematical model unless factor attribution is supplied.','Do not treat scenario statements as verified predictions.']};
}
function analyzeRace(data,raceId,extraEvidence={}){
 if(!data||!Array.isArray(data.records))throw Error('Missing runner records');
 const runners=data.records.filter(h=>h.race===raceId&&number(h.p)!==null).sort((a,b)=>b.p-a.p);
 const race=asArray(data.races).find(r=>r.id===raceId)||{id:raceId};const match=/^(.+)_R(\d+)$/.exec(raceId);
 const profiles=runners.map(h=>{const n=match?Number(match[2]):0;const embedded=match&&match[1]==='RANDWICK'&&n<=4?data['r'+n]?.[h.name]:null;const dossier=embedded||data.research?.[h.runnerId]||{};return analyzeRunner(h,dossier,{...race,asOf:data.date},extraEvidence[h.name]||[])});
 const total=runners.reduce((s,h)=>s+h.p,0);return {raceId,asOf:data.date||null,modelTotal:total,fieldComplete:runners.length>1&&Math.abs(total-100)<.16,topThree:profiles.slice(0,3),fullField:profiles.map(p=>({runner:p.runner,forecast:p.forecast})),missingDossiers:profiles.filter(p=>p.coverage==='missing').map(p=>p.runner),generatedAt:new Date().toISOString()};
}
return {analyzeRunner,analyzeRace};
});
