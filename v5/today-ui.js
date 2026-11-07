/* V5 race-day first interface. Official Saturday fields are kept separate from the older V5 model. */
(function(global){
'use strict';
var root='/v5/cards/2026-11-07/';
var cache=null,request=null,last=null;
var state={meeting:'FLEMINGTON',race:7,selectedHorse:null,topN:10,topMeeting:'ALL',showOut:false};
var TOOL_ITEMS=[
 ['simulator','Simulator','Run the saved 10,000-draw model simulations · archived research'],
 ['compare','Compare horses','Compare runner evidence from the saved model card'],
 ['results','Results & history','Results, accuracy tracking and earlier racing days'],
 ['weather','Weather & tracks','Track reports, weather scenarios and rail information'],
 ['quality','Model QA','Data completeness, uncertainty and source review'],
 ['calibration','Calibration','Historical calibration and model diagnostics'],
 ['settings','Data & sync','Airtable connection and data controls'],
 ['oaks','5 Nov results','Thursday racing outcome and pre-race audit'],
 ['archive','Archived model','Previous V5 research board and all legacy form analysis']
];
function el(tag,cls,content){
 var x=document.createElement(tag);if(cls)x.className=cls;
 if(content!==undefined&&content!==null)x.textContent=String(content);
 return x;
}
function put(parent){for(var i=1;i<arguments.length;i++)if(arguments[i])parent.appendChild(arguments[i]);return parent;}
function button(label,handler,klass,pressed){
 var b=el('button','rl-simple-button'+(klass?' '+klass:''),label);b.type='button';
 if(pressed!==undefined)b.setAttribute('aria-pressed',String(!!pressed));
 b.addEventListener('click',handler);return b;
}
function detail(text){return el('p','rl-simple-muted',text);}
function heading(title,sub){return put(el('div','rl-simple-heading'),el('h2','',title),sub?detail(sub):null);}
function navigate(page){if(last&&last.opts&&typeof last.opts.navigate==='function')last.opts.navigate(page);}
function daySource(){return cache&&cache.official;}
function dateText(raw){if(!raw)return 'Time unavailable';try{return new Date(raw).toLocaleString('en-AU',{timeZone:'Australia/Brisbane',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});}catch(e){return raw;}}
function setMeeting(m){state.meeting=m;var mt=daySource().meetings.find(function(v){return v.meeting===m;});if(mt){var race=mt.races.find(function(r){return r.race===state.race;});state.race=race?race.race:1;}state.selectedHorse=null;state.showOut=false;rerender();}
function setRace(n){state.race=n;state.selectedHorse=null;state.showOut=false;rerender();}
function chooseHorse(entry){state.meeting=entry.meeting;state.race=entry.race;state.selectedHorse=entry.horse;state.showOut=false;navigate('races');}
function rerender(){if(last&&last.element)render(last.element,last.opts);}
function actual(){return cache&&cache.official&&cache.shortlist;}
function sourceLink(m,label){
 var a=el('a','rl-simple-source',label||'Official field ↗');a.href=m.official_acceptances_url||m.acceptances_url;a.target='_blank';a.rel='noopener noreferrer';return a;
}
function selection(m,n){return cache.shortlist.entries.find(function(x){return x.meeting===m&&x.race===n;});}
function meetingTabs(active,change,withAll){
 var row=el('div','rl-simple-tabs');var names=withAll?['ALL','FLEMINGTON','ROSEHILL','ASCOT']:['FLEMINGTON','ROSEHILL','ASCOT'];
 names.forEach(function(name){put(row,button(name==='ALL'?'All':name==='FLEMINGTON'?'Flemington':name==='ROSEHILL'?'Rosehill':'Ascot',function(){change(name);},'rl-simple-tab',active===name));});return row;
}
function copyLine(text){return el('small','rl-simple-muted',text);}
function topItem(x){
 var card=button('',function(){chooseHorse(x)},'rl-simple-toprow');
 var left=el('span','rl-simple-rank',x.rank);
 var body=put(el('span','rl-simple-topbody'),el('strong','',x.horse),copyLine(x.meeting+' · R'+x.race+' · #'+x.saddlecloth));
 var right=put(el('span','rl-simple-topchance'),el('strong','',Number(x.working_win_pct).toFixed(1)+'%'),copyLine('Working estimate'));
 return put(card,left,body,right);
}
function renderHome(container){
 put(container,heading('Saturday 7 November','Final declared fields · Flemington / Rosehill / Ascot'));
 var actions=el('div','rl-simple-quick');
 [['View every race','races'],['Top 10 selections','daily'],['Multi Builder','multi'],['All features','tools']].forEach(function(x,i){put(actions,button(x[0],function(){navigate(x[1]);},i===0?'rl-simple-primary':''));});
 put(container,actions);
 var info=el('div','rl-simple-metrics');
 put(info,metric('29','Races'),metric('302','Active runners'),metric('51','Scratchings / eliminated'));
 put(container,info);
 var grid=el('div','rl-simple-meetings');
 cache.official.meetings.forEach(function(m){
  var target=button('',function(){state.meeting=m.meeting;state.race=1;state.showOut=false;navigate('races');},'rl-simple-meeting');
  put(target,el('strong','',m.meeting),el('span','rl-simple-rating',m.track_going),
    copyLine(m.races.length+' races · '+m.active_count+' active · '+m.removed_count+' out'),
    el('span','rl-simple-open','View R1–R'+m.races.length+' →'));
  put(grid,target);
 });
 put(container,grid);
 var h=put(el('div','rl-simple-linehead'),el('h3','','Leading research selections'),button('Full Top 10 →',function(){navigate('daily')},'rl-simple-link'));
 put(container,h);
 var list=el('div','rl-simple-toplist');
 cache.shortlist.entries.slice(0,5).forEach(function(x){put(list,topItem(x));});put(container,list);
 put(container,foot('Selections are human-reviewed. Percentages are uncalibrated working estimates, not newly run V5 forecasts.'));
}
function metric(value,label){return put(el('div','rl-simple-metric'),el('strong','',value),el('small','',label));}
function foot(text){return el('p','rl-simple-foot',text);}
function renderTop(container){
 put(container,heading('Top '+state.topN+' selections','The original reviewed order, not auto-sorted by bookmaker odds.'));
 put(container,meetingTabs(state.topMeeting,function(m){state.topMeeting=m;rerender();},true));
 var bar=el('div','rl-simple-tabs rl-simple-topcontrols');
 [5,10].forEach(function(n){put(bar,button('Top '+n,function(){state.topN=n;rerender();},'rl-simple-tab',state.topN===n));});
 put(container,bar);
 var list=el('div','rl-simple-toplist');
 var rows=cache.shortlist.entries.slice(0,state.topN).filter(function(x){return state.topMeeting==='ALL'||state.topMeeting===x.meeting;});
 rows.forEach(function(x){put(list,topItem(x));});
 if(!rows.length)put(list,detail('No selections in this meeting and ranking range.'));
 put(container,list,foot('Tap a horse to jump straight to its race. Full-field model probabilities are not yet calibrated for this date.'));
}
function renderRaces(container){
 put(container,heading('Race Centre','Pick a meeting and race number. No dropdown menus.'));
 put(container,meetingTabs(state.meeting,setMeeting,false));
 var m=cache.official.meetings.find(function(x){return x.meeting===state.meeting;});
 if(!m){put(container,detail('Meeting data unavailable.'));return;}
 var chips=el('div','rl-simple-races');
 m.races.forEach(function(r){put(chips,button('R'+r.race,function(){setRace(r.race);},'rl-simple-racechip',state.race===r.race));});
 put(container,chips);
 var race=m.races.find(function(r){return r.race===state.race;})||m.races[0];
 if(state.race!==race.race)state.race=race.race;
 var cap=put(el('section','rl-simple-racehead'),
  el('span','rl-simple-eyebrow',m.meeting+' · R'+race.race),
  el('h3','',race.title||race.name),
  detail(race.active+' active runners · '+m.track_going+' · '+race.removed+' scratched / eliminated'));
 put(cap,sourceLink(m,'View official racecard ↗'));put(container,cap);
 var pick=selection(m.meeting,race.race);
 if(pick){
  var focus=put(el('section','rl-simple-pick'),el('span','rl-simple-eyebrow','REVIEWED SELECTION'),
   el('h3','',pick.horse),el('strong','rl-simple-pickpct',Number(pick.working_win_pct).toFixed(1)+'% working estimate'),
   detail(pick.review));
  put(container,focus);
 }
 var header=put(el('div','rl-simple-linehead'),el('h3','','All active runners'),el('span','rl-simple-muted',race.active+' runners'));put(container,header);
 var list=el('div','rl-simple-runlist');
 race.active_runners.forEach(function(h){
  var isPick=pick&&String(pick.saddlecloth)===String(h.number);
  var isSelected=state.selectedHorse&&h.horse.toUpperCase().indexOf(state.selectedHorse.toUpperCase())>=0;
  var line=button('',function(){state.selectedHorse=h.horse;rerender();},'rl-simple-runner'+(isSelected?' is-selected':''));
  put(line,el('span','rl-simple-runnum','#'+h.number),el('strong','',h.horse),
   isPick?el('span','rl-simple-picked','TOP 10 PICK'):null);
  put(list,line);
 });
 put(container,list);
 if(state.selectedHorse){
  put(container,put(el('div','rl-simple-selected'),
   el('strong','',state.selectedHorse),detail('Officially active at the published final declarations. No verified detailed form profile has been imported for this date.'),
   sourceLink(m,'Check official runners ↗')));
 }
 if(race.scratching_count||race.scratchings.length){
  put(container,button(state.showOut?'Hide scratchings':'Show '+race.scratchings.length+' scratched / eliminated',function(){state.showOut=!state.showOut;rerender();},'rl-simple-link'));
  if(state.showOut){var out=el('div','rl-simple-out');race.scratchings.forEach(function(s){put(out,el('div','',s.label));});put(container,out);}
 }
 var jump=el('div','rl-simple-prevnext'),index=m.races.findIndex(function(r){return r.race===race.race;});
 if(index>0)put(jump,button('← Previous race',function(){setRace(m.races[index-1].race)}));
 if(index<m.races.length-1)put(jump,button('Next race →',function(){setRace(m.races[index+1].race)},'rl-simple-primary'));
 put(container,jump,foot('Full statistical model and simulator remain available under All tools as archived model research, not today’s calibrated probabilities.'));
}
function renderTools(container,opts){
 last={element:container,opts:opts||last&&last.opts||{}};
 container.replaceChildren();
 put(container,heading('All features','Everything is still here, grouped into one place.'));
 var shortcuts=el('div','rl-simple-toolgrid');
 TOOL_ITEMS.forEach(function(item){
  var card=button('',function(){navigate(item[0]);},'rl-simple-tool');
  put(card,el('strong','',item[1]),detail(item[2]),el('span','rl-simple-open','Open →'));
  put(shortcuts,card);
 });
 put(container,shortcuts,foot('The simulator, calibration and legacy runner dossiers use earlier dated model data. Today’s official fields are shown separately.'));
}
function render(element,opts){
 if(!element)return;
 last={element:element,opts:opts||{}};
 element.classList&&element.classList.add('rl-simple-host');
 element.replaceChildren();
 if(!actual()){
  put(element,heading('Saturday field desk','Opening today’s verified racecards…'));
  if(!request)request=Promise.all([
   fetch(root+'official-final.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Fields '+r.status);return r.json();}),
   fetch(root+'independent-top10.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Shortlist '+r.status);return r.json();})
  ]).then(function(b){
   if(b[0].date!=='2026-11-07'||b[0].inventory.active!==302||b[0].inventory.races!==29||
      b[1].date!=='2026-11-07'||b[1].entries.length!==10||b[1].entries.some(function(x){return !x.active_verified;}))
      throw Error('Dated field integrity check failed');
   cache={official:b[0],shortlist:b[1]};return cache;
  }).catch(function(e){cache={error:e.message};return cache;}).then(function(){if(last&&(!last.element.isConnected||last.element.isConnected===true))rerender();});
  if(cache&&cache.error){
   element.replaceChildren(heading('Race-day data unavailable','The official snapshot could not be verified.'));
   var link=el('a','rl-simple-source','Open saved Saturday racecards ↗');link.href='/v5/saturday-2026-11-07.html';put(element,link,detail(cache.error));
  }
  return;
 }
 var page=opts&&opts.page||'home';
 if(page==='races')renderRaces(element);
 else if(page==='daily'||page==='top10')renderTop(element);
 else if(page==='tools')renderTools(element,opts);
 else renderHome(element);
}
global.RacingLabToday={render:render,renderTools:renderTools,select:function(meeting,race){state.meeting=meeting;state.race=race;state.selectedHorse=null;rerender();},getData:function(){return cache;}};
})(window);
