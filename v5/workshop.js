/* Racing Lab V5 workshop: functional simulated race visual and 2-3 leg research lab.
 * 29 Oct 2026. Illustrative, not calibrated betting forecasts. */
(function(global){
'use strict';
var sim=null;
var memoryKey='racing-lab-v5-multi-20261031';
function el(tag,cls,txt){var n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;}
function put(p){for(var i=1;i<arguments.length;i++)if(arguments[i])p.append(arguments[i]);return p;}
function fnButton(label,callback,kind){var b=el('button','btn '+(kind||''),label);b.type='button';b.addEventListener('click',callback);return b;}
function safeStore(ids){try{global.localStorage.setItem(memoryKey,JSON.stringify(ids));}catch(e){}}
function eligible(h){return !/^SCRATCHED\b/i.test(String(h.status||''));}
function career(h){var m=String(h.statistics||'').match(/Career\s+(\d+)-(\d+)-(\d+)/i);return m?{wins:+m[1],placed:+m[2],starts:+m[3]}:{wins:0,placed:0,starts:0};}
function record(h,grade,position){var rows=String(h.form||'').split('\n').filter(function(line){return /OPEN Group G[123]:\s*\d+\/\d+/i.test(line);});
 return rows.filter(function(line){var g=line.match(/Group G([123]):\s*(\d+)\/\d+/i);return g&&(+g[1]===grade)&&(+g[2]<=position);}).length;
}
function trackRecord(h,name){var m=String(h.statistics||'').match(new RegExp('\\b'+name+'\\s+(\\d+)-(\\d+)-(\\d+)','i'));return m?{w:+m[1],n:+m[3]}:null;}
function lastStart(h){var rows=String(h.form||'').split('\n');return rows.find(function(x){return /^\d{1,2}\/\d{1,2}\/2026/.test(x.trim());})||'';}
function gradeScore(h,going){
 // An explicitly uncalibrated review heuristic (0-100 form index, NOT probability)
 var c=career(h),wr=c.starts?c.wins/c.starts:0,cr=c.starts?(c.wins+c.placed)/c.starts:0;
 var g1win=record(h,1,1),g1place=record(h,1,2),g2win=record(h,2,1),g3win=record(h,3,1);
 var trip=trackRecord(h,'distance'),course=trackRecord(h,'course'),surf=trackRecord(h,going==='Soft 5'?'Soft':'Good');
 var last=lastStart(h),m=last.match(/:\s*(\d+)\/(\d+),\s*PDF margin\s*([\d.]+)L/);
 var sc=22*wr+8*cr+11*Math.min(3,g1win)+3*Math.min(4,g1place)+5*Math.min(2,g2win)+3*Math.min(2,g3win);
 if(m&&+m[1]===1)sc+=9;else if(m&&+m[1]<=3&&+m[3]<=2)sc+=5;
 if(trip&&trip.n>=2)sc+=Math.min(7,8*trip.w/trip.n);
 if(course&&course.n>=2)sc+=Math.min(6,7*course.w/course.n);
 if(surf&&surf.n>=3)sc+=Math.min(9,10*surf.w/surf.n);
 if(Number(h.barrier)>=12)sc-=5;
 if(Number(h.weight_kg)>=60)sc-=3;
 if(surf&&surf.n>=3&&surf.w===0)sc-=4;
 if(c.starts<=2)sc-=6;
 return Math.max(0,Math.min(100,Math.round(sc*10)/10));
}
function note(p,txt){put(p,el('p','workshop-note',txt));}
function statusLine(h,going,ctx){
 var f=ctx.facts(h);
 return {adv:(f.pros[0]||'Form evidence not yet sufficient for a firm view'),risk:(f.cons[0]||'Track, tactics and final starters require checking'),
    index:gradeScore(h,going)};
}
function activeRaces(D,meet){return D.races.filter(function(r){return r.meeting===meet;});}
function buildSelect(opts,value,change){var s=el('select','workshop-select');opts.forEach(function(o){var op=el('option','',o.text);op.value=o.value;op.selected=o.value===value;s.append(op);});s.value=value;s.addEventListener('change',function(){change(s.value);});return s;}
function labelControl(title,control){return put(el('label','workshop-field'),el('span','',title),control);}
function multiPage(ctx){
 stop();var D=ctx.D,S=ctx.S,app=ctx.app();
 if(!S.multiLoaded){
  S.multiLoaded=true;
  try{var saved=JSON.parse(global.localStorage.getItem(memoryKey)||'[]');if(Array.isArray(saved))S.multi=saved.filter(function(id){return D.runners.some(function(h){return h.id===id&&eligible(h);});}).slice(0,3);}catch(e){}
 }
 S.multi=(S.multi||[]).filter(function(id,i,arr){var h=D.runners.find(function(r){return r.id===id;});return h&&eligible(h)&&arr.indexOf(id)===i;}).slice(0,3);
 if(!S.multiGoing)S.multiGoing='Good 4';
 if(!S.multiMeeting)S.multiMeeting='RANDWICK';
 if(!S.multiRace||!D.races.some(function(r){return r.id===S.multiRace&&r.meeting===S.multiMeeting;}))S.multiRace=activeRaces(D,S.multiMeeting)[0].id;
 put(app,ctx.head('Multi Lab · 2–3 leg research builder','Choose any eligible race runner. Compare recorded form and specific risks; the model is not historically calibrated.'),
   el('p','workshop-lead','No bookmaker prices, fabricated win probabilities, or auto-filled “locks”. Only source-backed form indicators. Selections are saved on this device.'));
 var settings=el('div','workshop-controls');
 put(settings,
  labelControl('Track scenario',buildSelect([{value:'Good 4',text:'Good 4'},{value:'Soft 5',text:'Soft 5'}],S.multiGoing,function(v){S.multiGoing=v;ctx.render();})),
  labelControl('Meeting',buildSelect(['RANDWICK','FLEMINGTON','ASCOT'].map(function(t){return {value:t,text:t};}),S.multiMeeting,function(v){S.multiMeeting=v;S.multiRace=activeRaces(D,v)[0].id;ctx.render();})),
  labelControl('Race',buildSelect(activeRaces(D,S.multiMeeting).map(function(r){return {value:r.id,text:'R'+r.race+' · '+r.title};}),S.multiRace,function(v){S.multiRace=v;ctx.render();}))
 );
 app.append(settings);
 var field=D.runners.filter(function(h){return h.race_id===S.multiRace;}).sort(function(a,b){return gradeScore(b,S.multiGoing)-gradeScore(a,S.multiGoing);});
 var selectPanel=el('section','panel workshop-panel');
 put(selectPanel,el('h3','','Choose a runner · '+field.filter(eligible).length+' available in this saved field'),
  el('p','muted small','Form index is an uncalibrated evidence summary out of 100, NOT win probability. Scratched runners are disabled.'));
 var contenders=el('div','workshop-candidates');
 field.forEach(function(h){
  var line=el('div','workshop-candidate'),stat=statusLine(h,S.multiGoing,ctx);
  var text=put(el('div','workshop-candidate-text'),el('strong','',h.horse+' · #'+h.tab),el('small','','Form '+stat.index.toFixed(1)+'/100 · barrier '+h.barrier+' · '+h.weight_kg+'kg'),
    el('small','',stat.adv.slice(0,150)));
  var conflict=S.multi.some(function(id){var chosen=D.runners.find(function(x){return x.id===id;});return chosen&&chosen.race_id===h.race_id&&chosen.id!==h.id;});
  var already=S.multi.includes(h.id),full=S.multi.length>=3;
  var button=fnButton(!eligible(h)?'Scratched':already?'Selected':conflict?'Same race':full?'3 legs max':'Add leg',function(){
    if(!eligible(h)||already||conflict||S.multi.length>=3)return;
    S.multi.push(h.id);safeStore(S.multi);ctx.render();
  },already?'ghost':'primary');
  if(!eligible(h)||already||conflict||full)button.disabled=true;
  put(line,text,button);contenders.append(line);
 });
 selectPanel.append(contenders);app.append(selectPanel);
 var picks=el('section','panel workshop-panel');
 put(picks,el('h3','','Your selected legs · '+S.multi.length+'/3'));
 if(S.multi.length===0)note(picks,'Choose two independent races to begin. You can review three legs, but every additional required winner makes the combined result harder to achieve.');
 S.multi.forEach(function(id,i){
  var h=D.runners.find(function(x){return x.id===id;});if(!h)return;
  var score=statusLine(h,S.multiGoing,ctx),r=D.races.find(function(q){return q.id===h.race_id;});
  var item=el('div','workshop-leg');
  var top=put(el('div','workshop-leg-top'),el('b','',(i+1)+'. '+h.horse),el('span','workshop-chip',r.meeting+' R'+r.race+' · form '+score.index.toFixed(1)));
  put(item,top,el('p','','STRENGTH · '+score.adv),el('p','workshop-risk','RISK · '+score.risk),
   fnButton('Remove this leg',function(){S.multi=S.multi.filter(function(x){return x!==id;});safeStore(S.multi);ctx.render();},'ghost'));
  picks.append(item);
 });
 var safety=S.multi.length>=2?
 'The selected legs are from distinct races. This is an individual-runner evidence comparison; the joint win chance remains UNKNOWN until genuinely calibrated probabilities are available. Check late scratchings and final track.':
 'Select another race to compare. A single selection is not a multi.';
 note(picks,safety);
 put(picks,fnButton('Clear all',function(){S.multi=[];safeStore(S.multi);ctx.render();},'ghost'));
 app.append(picks);
 var starter=el('section','panel workshop-panel');
 put(starter,el('h3','','Quick form scan · all three meetings'),el('p','muted small','One leading recorded-form profile per race, ordered by evidence index. Not a statistically calibrated ranking and not limited to saved assistant picks.'));
 var best=D.races.map(function(r){var xs=D.runners.filter(function(h){return h.race_id===r.id&&eligible(h);})
  .sort(function(a,b){return gradeScore(b,S.multiGoing)-gradeScore(a,S.multiGoing);});return xs[0];})
  .filter(Boolean).sort(function(a,b){return gradeScore(b,S.multiGoing)-gradeScore(a,S.multiGoing);}).slice(0,12);
 best.forEach(function(h,i){
  var r=D.races.find(function(x){return x.id===h.race_id;});
  var row=el('div','workshop-minirow');
  put(row,el('strong','',(i+1)+'. '+h.horse),el('span','',r.meeting+' R'+r.race+' · index '+gradeScore(h,S.multiGoing).toFixed(1)),
  fnButton('Inspect',function(){S.multiMeeting=r.meeting;S.multiRace=r.id;ctx.render();},'ghost'));
  starter.append(row);
 });
 app.append(starter);
}
function median(arr){if(!arr.length)return null;arr.sort(function(a,b){return a-b;});return arr[Math.floor(arr.length/2)];}
function settle(h){var xs=[...String(h.historical_map||'').matchAll(/Settled\s+(\d+)(?:st|nd|rd|th)\s+800m/gi)].map(function(m){return +m[1];});return median(xs.slice(0,5));}
function stop(){if(sim&&sim.raf&&typeof global.cancelAnimationFrame==='function')global.cancelAnimationFrame(sim.raf);sim=null;}
function simulatorPage(ctx){
 stop();var D=ctx.D,S=ctx.S,app=ctx.app();
 if(!S.simMeeting)S.simMeeting='RANDWICK';
 if(!S.simRace||!D.races.some(function(r){return r.id===S.simRace&&r.meeting===S.simMeeting;}))S.simRace=activeRaces(D,S.simMeeting)[0].id;
 if(!S.simGoing)S.simGoing='Good 4';
 var r=D.races.find(function(x){return x.id===S.simRace;});
 var hs=D.runners.filter(function(h){return h.race_id===S.simRace&&eligible(h);}).sort(function(a,b){return a.tab-b.tab;});
 put(app,ctx.head('Race Simulator · interactive race view','Play a visual, hypothetical running of any of the 29 races. Race field and recorded form are loaded from existing research.'),
 el('p','workshop-lead','Illustrative race animation only — NOT a genuine sectional replay, validated pace map, or predictive win simulator. It produces no implied winning percentages.'));
 var f=el('div','workshop-controls');
 put(f,labelControl('Meeting',buildSelect(['RANDWICK','FLEMINGTON','ASCOT'].map(function(x){return {value:x,text:x};}),S.simMeeting,function(v){S.simMeeting=v;S.simRace=activeRaces(D,v)[0].id;ctx.render();})),
  labelControl('Race',buildSelect(activeRaces(D,S.simMeeting).map(function(x){return {value:x.id,text:'R'+x.race+' · '+x.title};}),S.simRace,function(v){S.simRace=v;ctx.render();})),
  labelControl('Surface',buildSelect([{value:'Good 4',text:'Good 4'},{value:'Soft 5',text:'Soft 5'}],S.simGoing,function(v){S.simGoing=v;ctx.render();})));
 app.append(f);
 var panel=el('section','panel workshop-panel sim-stage');
 put(panel,el('h3','',r.meeting+' · R'+r.race+' · '+r.distance_m+'m · '+hs.length+' listed active runners'));
 var summary=el('p','muted small','Ready. Press Play to animate the entire field.'),stage=el('div','workshop-track');
 var vis=[],seeded=hs.map(function(h){return {h:h,score:gradeScore(h,S.simGoing),style:settle(h),u:Math.random()};});
 seeded.forEach(function(item,i){
  var lane=el('div','workshop-lane'),head=el('span','workshop-lane-label','#'+item.h.tab+' '+item.h.horse),track=el('div','workshop-lane-rail');
  var progress=el('div','workshop-lane-progress'),dot=el('span','workshop-horse-dot','♞'),pct=el('span','workshop-pct','0%');
  put(progress,dot);track.append(progress);
  put(lane,head,track,pct);stage.append(lane);
  vis.push({item:item,bar:progress,pct:pct});
 });
 var standings=el('div','workshop-standings'),buttons=el('div','workshop-actions');
 var speed=buildSelect([{value:'1',text:'Normal speed'},{value:'3',text:'Fast (3×)'}],'1',function(v){if(sim)sim.multiplier=+v;});
 var play=fnButton('▶ Play race',function(){startRace();},'primary');
 var reset=fnButton('↺ Reset',function(){ctx.render();},'ghost');
 function startRace(){
  stop();stage.classList.add('running');
  standings.replaceChildren();summary.textContent='Race running · hypothetical form-weighted animation';
  play.textContent='▶ Run again';
  var baseline=seeded.reduce(function(a,v){return a+v.score;},0)/Math.max(1,seeded.length);
  var participants=vis.map(function(v){
   var z=v.item,style=z.style;
   // Randomness is deliberately visible; a recorded historical settling tendency only affects
   // *illustrative* early pacing. It is not a verified jockey instruction.
   var finish=1.03-(z.score-baseline)*0.0030+(z.u-0.5)*0.23;
   return {v:v,style:style,finish:Math.max(0.70,Math.min(1.37,finish)),position:0};
  });
  var duration=13000,clock=0,previous=0;
  sim={raf:0,multiplier:+speed.value||1};
  function tick(t){
   if(!sim)return;
   if(!previous)previous=t;
   clock+=(Math.min(60,t-previous)||0)/duration*sim.multiplier;previous=t;
   participants.forEach(function(p){
    var frac=Math.min(1,clock/p.finish),early=p.style===null?1:(p.style<=3?0.82:p.style>=10?1.16:1.0);
    var eased=Math.pow(frac,early);
    p.position=frac>=1?1:eased;
    p.v.bar.style.width=(100*p.position).toFixed(2)+'%';
    p.v.pct.textContent=(100*p.position).toFixed(0)+'%';
   });
   var leader=participants.slice().sort(function(a,b){return b.position-a.position||a.finish-b.finish;})[0];
   summary.textContent='Race position · '+(Math.min(100,100*clock)).toFixed(0)+'% run · leader '+leader.v.item.h.horse;
   if(clock>=Math.max.apply(null,participants.map(function(p){return p.finish;}))){
    var order=participants.slice().sort(function(a,b){return a.finish-b.finish;});
    summary.textContent='Illustrative finish · '+order[0].v.item.h.horse+' first (NOT a race prediction)';
    var final=el('div','workshop-finish-list');
    order.slice(0,Math.min(8,order.length)).forEach(function(p,i){put(final,el('div','',String(i+1)+'. '+p.v.item.h.horse));});
    put(standings,el('h4','','Illustrative finish order'),final,el('p','muted small','This outcome is only one randomised demonstration of how a race can unfold. It must never override your independent analysis.'));
    stop();return;
   }
   sim.raf=global.requestAnimationFrame(tick);
  }
  if(typeof global.requestAnimationFrame==='function')sim.raf=global.requestAnimationFrame(tick);
  else {summary.textContent='Animation not supported in this browser; inspect the saved runner form in Race Centre.';stop();}
 }
 put(buttons,play,reset,labelControl('Playback',speed));
 put(panel,summary,buttons,stage,standings);app.append(panel);
}
global.RacingLabWorkshop={multiPage:multiPage,simPage:simulatorPage,stop:stop,gradeScore:gradeScore};
})(window);
