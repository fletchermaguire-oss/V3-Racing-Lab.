/* Shared V5 views; the original homepage keeps its navigation and visual shell. */
(function(global){
'use strict';
var C=null,D=null,target=null,embedded=false,navigate=null;
var match=global.location&&global.location.search.match(/[?&]tab=(sim|multi|top10|races|results|qa|cal|weather|sync|compare)(?:&|$)/);
var S={page:match?match[1]:'overview',meeting:'RANDWICK',race:null,runner:null,top:'ALL',topN:10,multi:[],compareA:null,compareB:null};
var PAGES=[['overview','Overview'],['top10','Daily Top 5/10/15'],['races','Race Centre'],['multi','Multi Lab'],['sim','Simulator'],['compare','Compare'],['qa','Model QA'],['cal','Calibration'],['weather','Weather & Tracks'],['sync','Data & Sync'],['results','Results & History']];
function e(tag,cls,txt){var x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined&&txt!==null)x.textContent=String(txt);return x;}
function app(){return target||document.getElementById('workspace');}
function add(p){for(var i=1;i<arguments.length;i++)if(arguments[i])p.append(arguments[i]);return p;}
function box(title,text){var p=e('div','panel');if(title)p.append(e('h3','',title));if(text)p.append(e('p','muted small',text));return p;}
function action(label,fn,style){var b=e('button','btn '+(style||''),label);b.type='button';b.addEventListener('click',fn);return b;}
function link(label,url,cls){var a=e('a',cls||'btn ghost',label);a.href=url;return a;}
function head(title,text){return add(e('div','sectionhead'),add(e('div'),e('h2','',title),e('p','',text||'')));}
function note(text){return e('div','notice',text);}
function pct(p){return Number(p).toFixed(2)+'%';}
function raceOf(id){return D.races.find(function(r){return r.id===id;});}
function model(id){return C.board.baseline.records.find(function(h){return h.id===id;});}
function code(r){return r.meeting+' R'+r.race;}
function runners(id){return D.runners.filter(function(h){return h.race_id===id;}).sort(function(a,b){var x=model(a.id),y=model(b.id);return (x?x.rank:999)-(y?y.rank:999)||a.tab-b.tab;});}
function go(page){if(global.RacingLabWorkshop)global.RacingLabWorkshop.stop();S.page=page;if(embedded&&navigate){navigate(page,S.race);return;}render();global.scrollTo(0,0);}
function selectRace(id,horse){S.race=id;S.meeting=raceOf(id).meeting;S.runner=horse||null;go('races');}
function setField(label,options,value,change){var l=add(e('label','field'),e('span','',label)),s=e('select');options.forEach(function(o){var opt=e('option','',o.text);opt.value=o.value;s.append(opt);});s.value=value;s.addEventListener('change',function(){change(s.value);});l.append(s);return l;}
function nav(){
var side=document.getElementById('sidenav'),mobile=document.getElementById('mobile-nav');
side.replaceChildren();mobile.replaceChildren();
var brand=e('div','brand'),mark=e('div','brand-mark','V5'),bt=e('div'),title=e('div','brand-title','RACING LAB'),sub=e('div','brand-sub','PRO EDITION · V5');
add(bt,title,sub);add(brand,mark,bt);side.append(brand);
var paths={
overview:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
races:'<path d="M4 18h16M6 6l3 3-2 5h10l-2-6-4-3-4 1"/><path d="M8 14v4m8-4v4"/>',
top10:'<path d="M4 20h16M6 16V9h3v7m3 0V5h3v11m3 0v-5h3v5"/>',
multi:'<path d="M4 5h16v14H4zM8 9h8M8 13h8"/><path d="m17 18 2 2 3-4"/>',
sim:'<ellipse cx="12" cy="12" rx="9" ry="6"/><ellipse cx="12" cy="12" rx="5" ry="2.5"/><circle cx="12" cy="6" r="1"/>',
compare:'<path d="M4 7h16l-4-4m4 4-4 4M20 17H4l4-4m-4 4 4 4"/>',
pros:'<path d="M8 12l3 3 6-7"/><path d="M3 5h18v14H3z"/>',
qa:'<path d="m12 2 9 4v6c0 6-4 9-9 10-5-1-9-4-9-10V6z"/><path d="m8 12 3 3 5-5"/>',
cal:'<path d="M3 19h18M5 16V9m5 7V6m5 10v-4m5 4V3"/>',
weather:'<path d="M5 16H4a3 3 0 0 1 0-6 5 5 0 0 1 9-2 4 4 0 0 1 4 5c0 2-2 3-4 3H5z"/>',
sync:'<circle cx="12" cy="12" r="3"/><path d="M4 9l-2 3 2 3 3 1 1 4h8l1-4 3-1 2-3-2-3-3-1-1-4H8L7 8z"/>',
results:'<path d="M7 3h10v5a5 5 0 0 1-10 0V3z"/><path d="M9 15h6m-3-2v7m-5 0h10"/>'
};
function icon(id){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[id]||paths.overview)+'</svg>';}
function makeButton(id,cls){
var it=PAGES.find(function(x){return x[0]===id;});if(!it)return null;
var b=e('button',cls+(S.page===id?' active':''));
b.type='button';b.innerHTML=icon(id)+'<span>'+it[1]+'</span>';
b.addEventListener('click',function(){go(id);});
return b;
}
var main=['overview','races','top10','multi','sim','compare'];
var second=['results','qa','cal','weather','sync'];
side.append(e('div','nav-group','RACING STUDIO'));
main.forEach(function(id){side.append(makeButton(id,'navbtn'));});
side.append(e('div','nav-group','RESEARCH & CONTROLS'));
second.forEach(function(id){side.append(makeButton(id,'navbtn'));});
var foot=e('div','sidebar-foot');
add(foot,e('strong','','◉ SHARED V5 FORMULA'),e('p','',C.board.raceCount+' races · '+C.board.activeCount+' included runners. Model estimates remain uncalibrated.'),link('Original Racing Lab ↗','/',''));
side.append(foot);
var mobileShort={overview:'Home',races:'Races',top10:'Top 10',multi:'Multi',sim:'Simulator'};
['overview','races','top10','multi','sim'].forEach(function(id){var b=makeButton(id,'');b.querySelector('span').textContent=mobileShort[id];mobile.append(b);});
var previous=document.getElementById('v5-more-popup');if(previous)previous.remove();
var popup=e('div','v5-more-menu');popup.id='v5-more-popup';popup.hidden=true;
var phead=e('div','v5-more-head','MORE RACING LAB SECTIONS');popup.append(phead);
['results','compare','weather','qa','cal','sync'].forEach(function(id){var b=makeButton(id,'v5-more-item');popup.append(b);});
document.body.append(popup);
var more=e('button','v5-more-trigger'+(['compare','weather','qa','cal','sync','results'].includes(S.page)?' active':''));more.type='button';
more.innerHTML=icon('sync')+'<span>More</span>';
more.addEventListener('click',function(){popup.hidden=!popup.hidden;more.setAttribute('aria-expanded',String(!popup.hidden));});
more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','v5-more-popup');mobile.append(more);
document.getElementById('pagetitle').textContent=PAGES.find(function(x){return x[0]===S.page;})[1];
document.getElementById('livebadge').textContent=C.live?'AIRTABLE · MODEL UPDATED':'SAVED MODEL · PROVISIONAL';
}

function scenarios(){var wrap=e('div','model-scenarios'),controls=e('div','filters');
 Object.keys(C.going).forEach(function(meeting){controls.append(setField(meeting+' scenario',['Good 4','Soft 5','Soft 6','Heavy 8'].map(function(v){return {value:v,text:v};}),C.going[meeting],function(value){C.setGoing(meeting,value);}));});
 return add(wrap,note('Provisional model estimates · final fields and going unverified · research '+D.saved_at+(C.localScratchCount?' · '+C.localScratchCount+' local exclusion(s)':'')),controls);
}
function metrics(){var grid=e('div','grid stats');[[C.board.raceCount,'Races'],[C.board.sourceCount,'Source dossiers'],[C.board.activeCount,'Included runners'],[C.board.excludedCount,'Excluded runners']].forEach(function(m){grid.append(add(e('div','panel metric'),e('div','number',m[0]),e('div','label',m[1])));});return grid;}
function venueCards(){var g=e('div','grid');Object.keys(C.going).forEach(function(v){var m=(D.meetings||[]).find(function(x){return x.meeting===v;})||{},r=D.races.filter(function(x){return x.meeting===v;});g.append(add(e('div','panel track'),e('div','venue',v),e('h3','',r.length+' races'),e('p','','Model scenario: '+C.going[v]),e('p','','Saved observation '+D.saved_at+': '+(m.official_29_oct||'Not verified')),e('p','','Rail: '+(m.rail||'Not verified')),action('View races',function(){selectRace(r[0].id);},'primary')));});return g;}
function overview(){var hero=add(e('div','hero'),e('div','eyebrow',D.date+' · '+C.board.version),e('h2','','Your racing command centre.'),e('p','','One formula across the rankings, whole fields, simulator and Multi Lab.'));
 hero.append(add(e('div','heroActions'),action('Daily Top 10',function(){go('top10');},'primary'),action('Race Centre',function(){go('races');}),link('Results · Top 5/10/15','/results.html'),action('Simulator',function(){go('sim');})));
 add(app(),hero,metrics(),scenarios(),head('Leading model chances','One leader per race, ranked by independent win probability.'),toplist(),head('Track scenarios','Saved observations and assumptions are shown separately.'),venueCards());
}
function topSet(){return C.board.leaders.filter(function(h){return S.top==='ALL'||h.meeting===S.top;}).slice(0,S.topN);}
function toplist(){var list=e('div','toplist');topSet().forEach(function(h,i){var row=e('button','toprow'),mid=e('div'),stat=e('div','model-row-stat');row.type='button';row.dataset.runnerId=h.id;row.dataset.modelPct=String(h.p);
 add(mid,e('strong','',h.horse),e('small','',h.meeting+' R'+h.race+' · gap '+h.gap.toFixed(2)+'pp'));
 add(stat,e('strong','',pct(h.p)),e('small','','Fair $'+h.fair_odds.toFixed(2)),e('small','','Range '+pct(h.model_range[0])+'–'+pct(h.model_range[1])));
 add(row,e('div','slot',String(i+1).padStart(2,'0')),mid,stat);row.addEventListener('click',function(){selectRace(h.race_id,h.id);});list.append(row);});return list;}
function top10(){add(app(),head('Daily Top '+S.topN,'All three meetings, one race leader per race. Top 5, 10 and 15 share the same probability order.'),scenarios());
 var controls=e('div','filters');controls.append(setField('Selections',[5,10,15].map(function(n){return {value:String(n),text:'Top '+n};}),String(S.topN),function(v){S.topN=+v;render();}),setField('Meeting',[{value:'ALL',text:'All meetings'}].concat(Object.keys(C.going).map(function(v){return {value:v,text:v};})),S.top,function(v){S.top=v;render();}));
 add(app(),controls,toplist(),e('p','muted small','Range = sensitivity across eight scenarios, not a confidence interval. Model fair odds are derived after scoring. Bookmaker prices and original picks do not determine this order.'));
}
function raceNav(){var all=D.races.filter(function(r){return r.meeting===S.meeting;}),filter=e('div','filters');filter.append(setField('Meeting',Object.keys(C.going).map(function(x){return {value:x,text:x};}),S.meeting,function(v){S.meeting=v;S.race=D.races.find(function(r){return r.meeting===v;}).id;S.runner=null;render();}),setField('Race',all.map(function(r){return {value:r.id,text:'R'+r.race+' · '+r.title};}),S.race,function(v){S.race=v;S.runner=null;render();}));
 var grid=e('div','racechips');all.forEach(function(r){var x=C.board.baseline.races.find(function(v){return v.id===r.id;}),b=add(e('button','racechip'+(r.id===S.race?' active':'')),e('b','','Race '+r.race),e('small','',r.distance_m+'m · '+(x.leader||'No contest')));b.type='button';b.addEventListener('click',function(){S.race=r.id;S.runner=null;render();});grid.append(b);});return [filter,grid];}
function facts(h){var x=model(h.id),names={career:'Career record',recency:'Recent form',distance:'Distance record',surface:'Surface record',course:'Course record',class:'Class performance',weight:'Weight',barrier:'Barrier',layoff:'Layoff',pace:'Pace stress',draw:'Draw stress'};
 function lines(xs){return xs.map(function(v){return (names[v.feature]||v.feature)+': '+(v.contribution>0?'+':'')+v.contribution.toFixed(3)+' score contribution';});}
 return {pros:x?lines(x.positive_drivers):[],cons:x?lines(x.negative_drivers):[]};
}
function evidence(title,text){var details=e('details','evidencebox');return add(details,e('summary','',title),e('pre','',text||'Not documented'));}
function horseDetail(h){var x=model(h.id),root=add(e('div','panel detail'),e('div','eyebrow',x?'MODEL RANK '+x.rank:C.model.statusOf(h)),e('h3','',h.horse),e('p','muted small','No. '+h.tab+' · Barrier '+(h.barrier??'—')+' · '+(h.weight_kg??'—')+'kg · '+h.trainer+' / '+h.jockey));
 if(x){add(root,e('strong','model-big',pct(x.p)),e('p','muted small','Model fair odds $'+x.fair_odds.toFixed(2)+' · scenario range '+pct(x.model_range[0])+'–'+pct(x.model_range[1])+' · evidence coverage '+Math.round(x.completeness*100)+'% (coverage, not confidence)'));
  var drivers=facts(h);root.append(evidence('Formula contributions',drivers.pros.concat(drivers.cons).join('\n')),evidence('Input checks',x.input_issues.join('\n')||'No structural input issue flagged. Final fields and source evidence still require verification.'));
 }
 var sourceExcluded=!x&&!C.isLocalScratch(h.id),localButton=action(C.isLocalScratch(h.id)?'Undo local exclusion':'Exclude locally',function(){C.setLocalScratch(h.id,!C.isLocalScratch(h.id));},'ghost');localButton.disabled=sourceExcluded;root.append(localButton,e('p','muted small','Local exclusions are what-if scenarios. Saved source scratchings cannot be reinstated here.'));
 [['Dated form',h.form],['Surface / distance / course statistics',h.statistics],['Research notes',h.strengths],['Source risks',h.risks],['Historical settling',h.historical_map],['Outstanding verification',h.outstanding]].forEach(function(p){root.append(evidence(p[0],p[1]));});return root;
}
function racesPage(){add(app(),head('Race Centre','The complete model field and source dossier for every runner.'),scenarios());raceNav().forEach(function(x){app().append(x);});var r=raceOf(S.race),summary=C.board.baseline.races.find(function(x){return x.id===r.id;}),hs=runners(r.id);
 add(app(),add(e('div','racebar'),e('h3','',code(r)+' · '+r.title+' · '+r.distance_m+'m'),e('p','',summary.field+' included · '+summary.excluded+' excluded · '+(summary.sum===null?'No contest':'field total '+pct(summary.sum))+' · '+summary.going+' scenario')));
 if(!hs.length){app().append(note('No runner dossiers in this race.'));return;}if(!hs.some(function(h){return h.id===S.runner;}))S.runner=hs[0].id;
 var columns=e('div','cols'),list=e('div','panel runnerlist');hs.forEach(function(h){var x=model(h.id),row=add(e('button','runrow'+(h.id===S.runner?' active':'')) ,e('strong','','#'+h.tab+' '+h.horse),e('small','',x?pct(x.p)+' · rank '+x.rank:C.model.statusOf(h)));row.type='button';row.dataset.runnerId=h.id;if(x)row.dataset.modelPct=String(x.p);row.addEventListener('click',function(){S.runner=h.id;render();});list.append(row);});add(columns,list,horseDetail(hs.find(function(h){return h.id===S.runner;})));app().append(columns);
}
function workshop(kind){if(!global.RacingLabWorkshop){app().append(note('Tool failed to load. Reload the page.'));return;}global.RacingLabWorkshop[kind]({C:C,D:D,S:S,app:app,head:head,facts:facts,render:render,scenarios:scenarios});}
function comparePage(){add(app(),head('Compare runners','Model probabilities and source evidence for two runners in the same race.'),scenarios());raceNav().forEach(function(x){app().append(x);});var hs=runners(S.race);if(!hs.length)return;
 if(!hs.some(function(h){return h.id===S.compareA;}))S.compareA=hs[0].id;if(!hs.some(function(h){return h.id===S.compareB;}))S.compareB=(hs[1]||hs[0]).id;
 var opts=hs.map(function(h){return {value:h.id,text:h.horse};}),filters=e('div','filters');filters.append(setField('Runner A',opts,S.compareA,function(v){S.compareA=v;render();}),setField('Runner B',opts,S.compareB,function(v){S.compareB=v;render();}));app().append(filters,add(e('div','compare'),horseDetail(hs.find(function(h){return h.id===S.compareA;})),horseDetail(hs.find(function(h){return h.id===S.compareB;}))));
}
function qaPage(){add(app(),head('Model QA',C.board.version+' · '+C.revision),metrics(),scenarios(),box('Whole-field checks',C.board.baseline.races.filter(function(r){return r.sum===100;}).length+' races total 100.00%. Exclusions remain in the source audit. A race with fewer than two included runners is withheld.'),box('Model status','Formula regression checks pass. Coefficients remain uncalibrated. The stored dossier does not establish completion of replay, trainer, gear, sectional or race-day field checks.'));}
function calPage(){add(app(),head('Calibration','Measured accuracy must come from frozen pre-race forecasts and verified results.'),box('Current status','Historical V5 calibration has not been established. Passing formula checks does not establish an improved strike rate. Scenario ranges are sensitivity checks.'),link('Open existing Top 5/10/15 results','/results.html'));}
function weatherPage(){add(app(),head('Weather & Tracks','Scenarios update the model everywhere. Saved observations remain dated.'),scenarios(),venueCards());}
function syncPage(){add(app(),head('Data & Sync','One shared board for every screen.'),metrics(),box('Evidence source',C.live?'Complete matching Airtable evidence received '+C.live.as_of+'. This is not official race-day certification.':'Saved snapshot '+D.saved_at+' is loaded. Live Airtable evidence is not confirmed.'),box('Latest refresh',C.error||'No refresh error recorded.'),action('Refresh Airtable evidence',function(){refresh(C);},'primary'),link('Static evidence','/v5/research.json'),link('GitHub code','https://github.com/fletchermaguire-oss/V3-Racing-Lab.'));}
function resultsPage(){add(app(),head('Results & History · Top 5 / 10 / 15','Existing selections and results are preserved.'),box('Historical record','Some historical rankings were reconstructed from saved probabilities rather than frozen pre-race lists. They remain labelled as retrospective.'),link('Open Results & History','/results.html','btn primary'));}
function render(){if(!C)return;D=C.data;if(!raceOf(S.race)){S.race=D.races[0].id;S.meeting=D.races[0].meeting;}
 if(global.RacingLabWorkshop)global.RacingLabWorkshop.stop();if(!embedded)nav();app().replaceChildren();
 var views={overview:overview,top10:top10,races:racesPage,multi:function(){workshop('multiPage');},sim:function(){workshop('simPage');},compare:comparePage,qa:qaPage,cal:calPage,weather:weatherPage,sync:syncPage,results:resultsPage};(views[S.page]||overview)();app().append(e('div','footer',C.board.version+' · '+C.revision+' · model estimates uncalibrated · source snapshot '+D.saved_at));
}
async function refresh(controller){try{var r=await fetch('/api/v5/evidence',{cache:'no-store'});if(!r.ok)throw Error('Airtable HTTP '+r.status);controller.applyEvidence(await r.json());}catch(err){controller.reportError('Saved board retained: '+err.message);}}
function startRefresh(controller){if(controller.refreshStarted)return;controller.refreshStarted=true;refresh(controller);setInterval(function(){if(document.visibilityState==='visible')refresh(controller);},300000);}
function renderInto(container,page,controller,onNavigate,race){embedded=true;target=container;C=controller;navigate=onNavigate;S.page=page;D=C.data;if(race&&raceOf(race)){S.race=race;S.meeting=raceOf(race).meeting;}render();}
 global.RacingLabV5Dashboard={renderInto:renderInto,startRefresh:startRefresh,stop:function(){if(global.RacingLabWorkshop)global.RacingLabWorkshop.stop();}};
 if(document.getElementById('workspace'))global.RacingLabV5State.load().then(function(controller){C=controller;D=C.data;C.subscribe(render);render();startRefresh(C);}).catch(function(err){app().replaceChildren(note('Current formula could not load: '+err.message),link('Results & History','/results.html'));});
})(window);
