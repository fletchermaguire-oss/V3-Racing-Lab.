/* Simulator and Multi Lab consume the same versioned formula board. */
(function(global){
'use strict';
var sim=null;
function el(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;}
function put(p){for(var i=1;i<arguments.length;i++)if(arguments[i])p.append(arguments[i]);return p;}
function button(label,fn,kind){var b=el('button','btn '+(kind||''),label);b.type='button';b.addEventListener('click',fn);return b;}
function note(p,txt){p.append(el('p','workshop-note',txt));}
function control(label,node){return put(el('label','workshop-field'),el('span','',label),node);}
function select(opts,value,fn){var s=el('select','workshop-select');opts.forEach(function(x){var o=el('option','',x.text);o.value=x.value;s.append(o);});s.value=value;s.addEventListener('change',function(){fn(s.value);});return s;}
function percent(v){return Number(v).toFixed(2)+'%';}
function raw(C,id){return C.data.runners.find(function(x){return x.id===id;});}
function confirmedForMulti(C,id){
 var h=raw(C,id);
 return !!h&&!/^(?:EMERGENCY|RESERVE)\b/i.test(String(h.status||''))&&
  C.board.baseline.records.some(function(x){return x.id===id;});
}
function save(C,S){try{global.localStorage.setItem('racing-lab-v5-multi:'+C.data.date,JSON.stringify(S.multi));}catch(e){}}
function sanitize(C,S){
 if(S.multiDate!==C.data.date){S.multiDate=C.data.date;S.multi=[];try{var saved=JSON.parse(global.localStorage.getItem('racing-lab-v5-multi:'+C.data.date)||'[]');if(Array.isArray(saved))S.multi=saved;}catch(e){}}
 var seen=new Set();S.multi=(S.multi||[]).filter(function(id){var x=C.board.baseline.records.find(function(h){return h.id===id;});if(!x||!confirmedForMulti(C,id)||seen.has(x.race_id))return false;seen.add(x.race_id);return true;}).slice(0,S.multiSize||2);save(C,S);
}
function raceControls(ctx,type){
 var C=ctx.C,S=ctx.S,D=C.data,meetings=Array.from(new Set(D.races.map(function(x){return x.meeting;})));
 if(!meetings.includes(S[type+'Meeting']))S[type+'Meeting']=meetings[0];
 var races=D.races.filter(function(r){return r.meeting===S[type+'Meeting'];});
 if(!races.some(function(r){return r.id===S[type+'Race'];}))S[type+'Race']=races[0].id;
 function changed(){S.simSample=null;S.simWinner=null;ctx.render();}
 return put(el('div','workshop-controls'),
  control('Meeting',select(meetings.map(function(m){return {value:m,text:m};}),S[type+'Meeting'],function(v){S[type+'Meeting']=v;S[type+'Race']=null;changed();})),
  control('Race',select(races.map(function(r){return {value:r.id,text:'R'+r.race+' · '+r.title};}),S[type+'Race'],function(v){S[type+'Race']=v;changed();})));
}
function multiPage(ctx){
 stop();var C=ctx.C,S=ctx.S,B=C.board,app=ctx.app();
 S.multiSize=S.multiSize===3?3:2;sanitize(C,S);
 var safePriorities=B.winFirst.priority.filter(function(h){return confirmedForMulti(C,h.runner_id);});
 var researched=(C.curated?C.curated.entries.filter(function(h){
  return h.research_lane==='TOP10_RESEARCH'&&h.eligible&&confirmedForMulti(C,h.id);
 }):[]);
 var suggested=researched.length?researched.map(function(h){return h.id;}):safePriorities.map(function(h){return h.runner_id;});
 var label=researched.length?'researched':'strict screened';
 put(app,ctx.head('Multi Builder','Keep it simple: two or three horses, one per race. Original research order is preserved; final starters are not yet certified.'));
 var selection=el('section','panel workshop-panel multi-simple'),actions=el('div','workshop-actions multi-primary-actions');
 var fill=button('Use '+label+' top '+S.multiSize,function(){
  S.multi=suggested.slice(0,S.multiSize);save(C,S);ctx.render();
 },'primary');
 fill.disabled=suggested.length<S.multiSize;
 put(actions,control('Legs',select([{value:'2',text:'2 legs'},{value:'3',text:'3 legs'}],String(S.multiSize),function(v){
  S.multiSize=+v;sanitize(C,S);ctx.render();
 })),fill,button('Clear',function(){S.multi=[];save(C,S);ctx.render();},'ghost'));
 put(selection,el('h3','','Your '+S.multiSize+'-leg selection'),actions);
 if(fill.disabled)note(selection,'Not enough eligible '+label+' contenders for '+S.multiSize+' legs. The builder will not invent replacements.');
 if(!S.multi.length)note(selection,'No legs added yet. Choose the researched top '+S.multiSize+' or open the manual horse picker below.');
 S.multi.forEach(function(id){var x=B.baseline.records.find(function(h){return h.id===id;}),h=raw(C,id),line=el('div','workshop-leg');
  put(line,put(el('div','workshop-leg-top'),el('b','',x.horse),
   el('span','workshop-chip',x.meeting+' R'+x.race)),
   el('p','muted small','Individual uncalibrated model estimate: '+percent(x.p)),
   button('Remove '+h.horse,function(){S.multi=S.multi.filter(function(v){return v!==id;});save(C,S);ctx.render();},'ghost'));
  selection.append(line);
 });
 if(S.multi.some(function(id){return !researched.some(function(h){return h.id===id;});}))
  note(selection,'At least one leg is outside the preserved researched Top 10; it is a manual choice, not an automatically certified recommendation.');
 if(S.multi.length>=2){
  var result=C.multi(S.multi),metric=el('div','model-joint');metric.dataset.jointPct=String(result.baseline_joint_pct);
  put(metric,el('div','eyebrow','UNCALIBRATED COMBINED MODEL ESTIMATE'),el('strong','model-big',percent(result.baseline_joint_pct)),
   el('p','muted small','Not a proven win probability or betting guarantee. Depends on uncalibrated individual estimates and independence assumptions.'));
  selection.append(metric);
 }
 app.append(selection);
 var advanced=el('details','workshop-advanced');
 advanced.open=!!S.multiManualOpen;
 var toggle=el('summary','workshop-advanced-summary','Choose or replace horses manually');
 toggle.addEventListener('click',function(){S.multiManualOpen=!S.multiManualOpen;});
 advanced.append(toggle);
 var picker=el('div','workshop-picker');
 picker.append(raceControls(ctx,'multi'));
 var contenders=el('section','panel workshop-panel');contenders.append(el('h3','','Runners in selected race'));
 var list=el('div','workshop-candidates'),field=C.data.runners.filter(function(h){return h.race_id===S.multiRace;});
 field.sort(function(a,b){var x=B.baseline.records.find(function(r){return r.id===a.id;}),y=B.baseline.records.find(function(r){return r.id===b.id;});return (x?x.rank:999)-(y?y.rank:999)||a.tab-b.tab;});
 field.forEach(function(h){var x=B.baseline.records.find(function(r){return r.id===h.id;}),included=!!x&&confirmedForMulti(C,h.id),selected=S.multi.includes(h.id),
  conflict=S.multi.some(function(id){return raw(C,id).race_id===h.race_id&&id!==h.id;}),full=S.multi.length>=S.multiSize;
  var line=el('div','workshop-candidate'),info=put(el('div','workshop-candidate-text'),el('strong','','#'+h.tab+' '+h.horse),
   el('small','',x?'Model estimate: '+percent(x.p):C.model.statusOf(h)));
  var b=button(!included?'Excluded':selected?'Selected':conflict?'Same race':full?'Full':'Add leg',function(){
    if(!included||selected||conflict||full)return;S.multi.push(h.id);save(C,S);ctx.render();
  },'primary');
  b.disabled=!included||selected||conflict||full;
  put(line,info,b);list.append(line);
 });
 contenders.append(list);picker.append(contenders);
 var conditions=el('details','workshop-scenario-advanced');conditions.append(el('summary','','Change track scenarios (advanced)'),ctx.scenarios());
 picker.append(conditions);advanced.append(picker);app.append(advanced);
 app.append(el('p','muted small','Source: '+C.data.date+' · The research shortlist is independently reviewed; model estimates are uncalibrated. Scratched and unverified emergency runners are excluded. Changes in model percentages do not reorder the preserved independent Top 10.'));
}
function stop(){if(sim&&sim.raf&&typeof global.cancelAnimationFrame==='function')global.cancelAnimationFrame(sim.raf);sim=null;}
function simulatorPage(ctx){
 stop();var C=ctx.C,S=ctx.S,app=ctx.app();
 put(app,ctx.head('Race Simulator','Sample winners from the complete field using the same model as the rankings and Multi Lab.'),ctx.scenarios(),raceControls(ctx,'sim'));
 var r=C.data.races.find(function(x){return x.id===S.simRace;}),rows=C.rows(r.id),token=C.revision+'|'+r.id;
 if(S.simToken!==token){S.simToken=token;S.simSample=null;S.simWinner=null;}
 if(!S.simSeed)S.simSeed=C.data.date;
 var panel=el('section','panel workshop-panel sim-stage');put(panel,el('h3','',r.meeting+' R'+r.race+' · '+r.distance_m+'m · '+rows.length+' included runners'));
 if(rows.length<2){note(panel,'Fewer than two included runners. Simulation is unavailable.');app.append(panel);return;}
 var seed=el('input','workshop-select');seed.value=S.simSeed;seed.type='text';seed.maxLength=120;
 seed.addEventListener('input',function(){S.simSeed=seed.value;});
 var summary=el('p','muted small','Ready. Use the same seed to reproduce a draw.'),stage=el('div','workshop-track'),visuals=[];
 rows.forEach(function(h){var lane=el('div','workshop-lane'),bar=el('div','workshop-lane-progress'),pct=el('span','workshop-pct','0%'),rail=el('div','workshop-lane-rail');bar.append(el('span','workshop-horse-dot','♞'));rail.append(bar);put(lane,el('span','workshop-lane-label',h.horse),rail,pct);stage.append(lane);visuals.push({id:h.id,bar:bar,pct:pct});});
 var speed=select([{value:'1',text:'Normal'},{value:'3',text:'Fast (3×)'}],String(S.simSpeed||1),function(v){S.simSpeed=+v;if(sim)sim.speed=+v;});
 function draw(){
  stop();S.simSeed=seed.value||C.data.date;
  var result=C.simulate(r.id,1,S.simSeed),winner=result.rows.find(function(x){return x.sim_wins===1;});S.simWinner=winner.id;
  summary.textContent='One model draw in progress. Movement is decorative; it is not a pace forecast.';
  var clock=0,last=null,duration=global.matchMedia&&global.matchMedia('(prefers-reduced-motion: reduce)').matches?500:6000;
  sim={raf:0,speed:+S.simSpeed||1};
  function frame(t){if(!sim)return;if(last!==null)clock+=Math.min(100,t-last)*sim.speed;last=t;
   visuals.forEach(function(v){var fraction=Math.min(1,clock/duration),position=v.id===winner.id?fraction:fraction*0.86;v.bar.style.width=(position*100).toFixed(2)+'%';v.pct.textContent=Math.round(position*100)+'%';});
   if(clock>=duration){summary.textContent='Sampled winner: '+winner.horse+' · '+percent(winner.model_p)+' model chance · seed '+S.simSeed;stop();return;}
   sim.raf=global.requestAnimationFrame(frame);
  }
  if(typeof global.requestAnimationFrame==='function')sim.raf=global.requestAnimationFrame(frame);
  else {summary.textContent='Sampled winner: '+winner.horse+' · '+percent(winner.model_p);stop();}
 }
 var actions=el('div','workshop-actions');put(actions,control('Seed',seed),control('Playback',speed),button('▶ Play one draw',draw,'primary'),
  button('Run 10,000 draws',function(){S.simSeed=seed.value||C.data.date;S.simSample=C.simulate(r.id,10000,S.simSeed);ctx.render();},'primary'),
  button('Reset',function(){S.simSample=null;S.simWinner=null;ctx.render();},'ghost'));
 put(panel,actions,summary,stage);note(panel,'Animation shows one sampled winner. Repeated draws illustrate the supplied model; they do not improve its accuracy or establish real race odds.');app.append(panel);
 var results=el('section','panel workshop-panel');results.append(el('h3','',S.simSample?'10,000-draw comparison':'Whole-field model · 100.00%'));
 if(S.simSample)results.append(el('p','muted small','Completed '+S.simSample.count.toLocaleString()+' draws · seed '+S.simSample.seed));
 var table=el('table'),thead=el('thead'),header=el('tr');['Runner','Model chance','Sample wins','Sample frequency'].forEach(function(v){header.append(el('th','',v));});thead.append(header);table.append(thead);var body=el('tbody');
 rows.forEach(function(h){var sample=S.simSample&&S.simSample.rows.find(function(x){return x.id===h.id;}),row=el('tr');row.dataset.runnerId=h.id;row.dataset.modelPct=String(h.p);[h.horse,percent(h.p),sample?String(sample.sim_wins):'—',sample?percent(sample.sim_win_pct):'—'].forEach(function(v){row.append(el('td','',v));});body.append(row);});table.append(body);var wrap=el('div','tablewrap');wrap.append(table);results.append(wrap);app.append(results);
}
 global.RacingLabWorkshop={multiPage:multiPage,simPage:simulatorPage,stop:stop,sanitizeMulti:sanitize};
})(window);
