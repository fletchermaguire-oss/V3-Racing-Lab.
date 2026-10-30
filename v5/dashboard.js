/* Shared V5 views; the original homepage keeps its navigation and visual shell. */
(function(global){
'use strict';
var C=null,D=null,target=null,embedded=false,navigate=null;
var match=global.location&&global.location.search.match(/[?&]tab=(sim|multi|top10|races|results|qa|cal|weather|sync|compare)(?:&|$)/);
var S={page:match?match[1]:'overview',meeting:'RANDWICK',race:null,runner:null,top:'ALL',topMode:'RESEARCH',topN:10,multi:[],compareA:null,compareB:null};
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
 return add(wrap,note('Provisional model estimates · source '+(C.official?C.official.observed_at:(D.official_check_at||D.saved_at))+' · final starters/emergencies NOT confirmed'+(C.localScratchCount?' · '+C.localScratchCount+' local exclusion(s)':'')),controls);
}
function changeNotice(){
 var v=C.lastChange;
 if(!v)return null;
 var panel=box('BOARD CHANGE · '+v.reason,v.notice);
 v.changed_selections.forEach(function(x){panel.append(e('p','muted small',x.race_id+': '+x.previous+' → '+x.current));});
 if(!v.changed_selections.length&&v.raw_leader_changes.length)panel.append(e('p','muted small',
  v.raw_leader_changes.length+' raw race leaders changed, but the win-first selection list did not.'));
 return panel;
}
function metrics(){var grid=e('div','grid stats');[[C.board.raceCount,'Races'],[C.board.sourceCount,'Source dossiers'],[C.board.activeCount,'Included runners'],[C.board.excludedCount,'Excluded runners']].forEach(function(m){grid.append(add(e('div','panel metric'),e('div','number',m[0]),e('div','label',m[1])));});return grid;}
function venueCards(){var g=e('div','grid');Object.keys(C.going).forEach(function(v){var m=(D.meetings||[]).find(function(x){return x.meeting===v;})||{},r=D.races.filter(function(x){return x.meeting===v;});g.append(add(e('div','panel track'),e('div','venue',v),e('h3','',r.length+' races'),e('p','','Model scenario: '+C.going[v]),e('p','','Saved observation '+D.saved_at+': '+(m.official_29_oct||'Not verified')),e('p','','Rail: '+(m.rail||'Not verified')),action('View races',function(){selectRace(r[0].id);},'primary')));});return g;}
function overview(){
 var root=app(),research=C.curated?C.curated.entries.slice(0,10):[],venues=Object.keys(C.going),
  readOfficial=function(m){return C.official&&C.official.meetings.find(function(x){return x.meeting===m;});},
  sourceTime=C.official?C.official.observed_at:(D.official_check_at||D.saved_at||'Not checked');
 if(/^\d{4}-\d{2}-\d{2}T/.test(String(sourceTime))){
  var observed=Date.parse(sourceTime);
  if(Number.isFinite(observed))sourceTime=new Date(observed).toLocaleString('en-AU',{
   timeZone:'Australia/Brisbane',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'
  })+' AEST';
 }
 var hero=add(e('section','rlv5-command-hero'),
  add(e('div','rlv5-command-title'),e('div','eyebrow','SATURDAY · '+D.date),
   e('h2','','Saturday Command Centre'),
   e('p','','Independent selections, current field evidence and straightforward race analysis. No invented confidence.')));
 var heroActions=add(e('div','rlv5-command-actions'),
  action('Explore races',function(){go('races');},'primary'),
  action('Top 5 / 10 / 15',function(){go('top10');},'ghost'));
 hero.append(heroActions);root.append(hero);
 var status=e('section','rlv5-command-status');
 var meetingCard=add(e('div','rlv5-command-stat'),
  e('span','rlv5-stat-label','MEETINGS'),
  e('strong','','Randwick · Flemington · Ascot'),
  e('small','',C.board.raceCount+' races · '+C.board.activeCount+' provisional starters'));
 status.append(meetingCard);
 var trackCard=add(e('div','rlv5-command-stat'),e('span','rlv5-stat-label','TRACK REPORT'));
 venues.forEach(function(m){var sheet=readOfficial(m);
  trackCard.append(add(e('div','rlv5-stat-line'),e('span','',m),e('b','',sheet?sheet.track_going+' · source':C.going[m]+' · scenario')));
 });
 status.append(trackCard);
 var scratches=add(e('div','rlv5-command-stat'),e('span','rlv5-stat-label','PUBLISHED SCRATCHINGS'));
 if(C.official){
  var total=C.official.meetings.reduce(function(n,x){return n+x.scratched_total;},0);
  scratches.append(e('strong','',total+' across three meetings'));
  scratches.append(e('small','','Observed '+sourceTime+' · not final-field certified'));
 }else{
  scratches.append(e('strong','','Awaiting official refresh'));
  scratches.append(e('small','','Showing saved field · '+sourceTime));
 }
 status.append(scratches);
 status.append(add(e('div','rlv5-command-stat'),
  e('span','rlv5-stat-label','RESEARCH INTEGRITY'),
  e('strong','',C.curated?C.curated.priority_research_count+' independently ranked picks':'Research unavailable'),
  e('small','','Final starters / pre-race result lock not verified')));
 root.append(status);
 var main=e('section','rlv5-command-columns'),left=add(e('div','rlv5-command-board'),
   add(e('div','rlv5-command-panel-head'),
    add(e('div'),e('span','rlv5-kicker','THE MAIN BOARD'),e('h3','','Independent Top 10'),
     e('p','','Original researched order · live model numbers are separate and uncalibrated')),
    action('View Top 15',function(){S.topN=15;go('top10');},'ghost')));
 if(research.length){
  // Header and data rows must be siblings. Putting horse rows inside the
  // five-column header grid caused overlapping names and percentages on phones.
  var list=e('div','rlv5-command-picks');
  list.append(add(e('div','rlv5-command-picks-head'),
   e('span','','#'),e('span','','HORSE / RACE'),e('span','','GRADE'),e('span','','MODEL'),e('span','','FIELD')));
  research.forEach(function(h){
   var row=e('button','rlv5-command-pick'+(h.eligible?'':' is-unavailable')),desc=e('div','rlv5-pick-description');
   row.type='button';row.dataset.runnerId=h.id;if(h.model_pct!==null)row.dataset.modelPct=String(h.model_pct);
   add(desc,e('strong','',h.horse),e('small','',h.meeting+' R'+h.race+' · '+(h.reason||'Researched form profile')));
   add(row,e('span','rlv5-rank',String(h.rank)),desc,e('span','rlv5-grade',h.form_tier),
    e('span','rlv5-pick-pct',h.model_pct===null?'—':pct(h.model_pct)),
    e('span','rlv5-pick-status'+(h.eligible?'':' is-unavailable'),h.eligible?'Provisional':'Out of field'));
   row.addEventListener('click',function(){selectRace(h.race_id,h.id);});
   list.append(row);
  });left.append(list);
 }else left.append(note('No independent Top 10 checkpoint available; raw model leaders are not substitutions.'));
 left.append(e('p','rlv5-command-disclaimer','Horse percentages are uncalibrated model estimates, not verified win probabilities. A scratched pick retains its original rank.'));
 var right=e('div','rlv5-command-insights');
 var leaders=add(e('section','rlv5-insight-card'),
  add(e('div','rlv5-insight-head'),e('span','rlv5-kicker','RESEARCH FOCUS'),e('h3','','Top three researched cases')));
 research.slice(0,3).forEach(function(h){
  var row=add(e('button','rlv5-insight-runner'),e('span','rlv5-rank',String(h.rank)),
    add(e('span','rlv5-insight-runner-info'),e('strong','',h.horse),e('small','',h.meeting+' R'+h.race)),
    e('span','rlv5-pick-pct',h.model_pct===null?'—':pct(h.model_pct)));
  row.type='button';row.addEventListener('click',function(){selectRace(h.race_id,h.id);});leaders.append(row);
 });
 if(!research.length)leaders.append(e('p','muted small','No independent research checkpoint loaded.'));
 leaders.append(e('p','rlv5-command-disclaimer','Research order ≠ calibrated probability order.'));
 right.append(leaders);
 var multi=add(e('section','rlv5-insight-card'),add(e('div','rlv5-insight-head'),
  e('span','rlv5-kicker','SIMPLE BUILDER'),e('h3','','Two or three distinct races')));
 if(research.length>=2){
  multi.append(e('p','rlv5-insight-pair',research[0].horse+'  +  '+research[1].horse));
  multi.append(e('p','muted small','A starting pair from the preserved research order; not a certified multi.'));
 }
 multi.append(action('Open Multi Builder',function(){go('multi');},'primary'));right.append(multi);
 var diverge=research.filter(function(h){
  var race=C.board.baseline.races.find(function(r){return r.id===h.race_id;});
  return race&&race.leader&&race.leader.toUpperCase()!==h.horse.toUpperCase()&&h.eligible;
 });
 var disagreement=add(e('section','rlv5-insight-card'),add(e('div','rlv5-insight-head'),
  e('span','rlv5-kicker','CHECK THE DIFFERENCE'),e('h3','','Research vs live model')));
 if(diverge.length){
  diverge.slice(0,2).forEach(function(h){
   var race=C.board.baseline.races.find(function(r){return r.id===h.race_id;});
   disagreement.append(add(e('p','rlv5-difference'),e('strong','',h.meeting+' R'+h.race),
    e('span','','Research: '+h.horse),e('span','','Model: '+race.leader)));
  });
 }else disagreement.append(e('p','muted small','No researched and live model disagreement currently flagged among eligible Top 10 runners.'));
 disagreement.append(e('p','rlv5-command-disclaimer','A disagreement is a review prompt, not automatic evidence that either pick wins.'));
 right.append(disagreement);
 add(main,left,right);root.append(main);
 root.append(add(e('div','rlv5-command-section-title'),e('h3','','Meeting overview'),
  e('span','','Official reports and hypothetical scenarios are labelled separately')));
 var meetingGrid=e('section','rlv5-meeting-grid');
 venues.forEach(function(m){
  var sheet=readOfficial(m),races=D.races.filter(function(x){return x.meeting===m;}),
   top=research.find(function(h){return h.meeting===m;}),
   card=add(e('section','rlv5-meeting-card'),
    e('span','rlv5-kicker',m),e('h3','',races.length+' races'),
    add(e('div','rlv5-meeting-details'),e('span','','Track'),e('strong','',sheet?sheet.track_going+' · official source':C.going[m]+' · model scenario')),
    add(e('div','rlv5-meeting-details'),e('span','','Scratchings'),e('strong','',sheet?String(sheet.scratched_total):'Not refreshed')),
    add(e('div','rlv5-meeting-details'),e('span','','Top researched'),e('strong','',top?top.horse+' · R'+top.race:'No Top 10 pick')));
  card.append(action('View '+m+' races',function(){selectRace((top&&top.race_id)||races[0].id,top?top.id:null);},'ghost'));meetingGrid.append(card);
 });
 root.append(meetingGrid);
 var integrity=add(e('section','rlv5-integrity-bar'),e('strong','','Results integrity'),
  e('span','','Pre-race published lock: not verified'),
  e('span','','Prospective win record: pending official locked outcomes'),
  e('span','','Calibration: not established'),
  link('Open Results','/results.html'));
 root.append(integrity);
 if(C.error)root.append(add(e('p','rlv5-command-alert'),e('strong','','Sync warning: '),e('span','',C.error)));
}

function curatedSet(){
 return C.curated?C.curated.entries.slice(0,S.topN).filter(function(h){return S.top==='ALL'||h.meeting===S.top;}):[];
}
function topSet(){
 var candidates=S.topMode==='MODEL'?C.board.leaders:C.board.winFirst.priority.map(function(a){
  var h=model(a.runner_id);
  return Object.assign({},h,{_screen_status:a.status,_floor:a.robust_floor,_screen_reasons:a.reasons});
 });
 return candidates.slice(0,S.topN).filter(function(h){return S.top==='ALL'||h.meeting===S.top;});
}
function toplist(){
 if(S.topMode==='RESEARCH'&&C.curated){
  var wrap=e('div','toplist'),items=curatedSet();
  items.forEach(function(h){
   var row=e('div','toprow'),mid=e('div'),stat=e('div','model-row-stat');
   row.dataset.runnerId=h.id;
   if(h.model_pct!==null)row.dataset.modelPct=String(h.model_pct);
   add(mid,e('strong','',h.horse),
    e('small','',h.meeting+' R'+h.race+' · '+(h.research_lane==='CONDITIONAL_REVIEW'?'FURTHER REVIEW · ':'TOP 10 · ')+'Form grade '+h.form_tier+' · '+(h.eligible?'STARTER PROVISIONAL':'OUT OF FIELD')),
    e('small','',h.race_day_assessment.replaceAll('_',' ')+' · '+(h.notes.length?h.notes.join(', '):'No new screening flags')));
   add(stat,e('strong','',h.model_pct===null?'—':pct(h.model_pct)),
     e('small','','Uncalibrated V5 chance'),e('small','','Original #'+h.original_rank+' · ranked #'+h.rank));
   var buttons=e('div','workshop-actions'),view=action('View race',function(){selectRace(h.race_id,h.id);},'ghost');
   buttons.append(view);
   if(C.setResearchOverride&&h.eligible)buttons.append(action('Edit grade / rank',function(){
    var form=e('div','panel'),fields=e('div','filters');
    var grade=e('select');C.curatedGradeOptions.forEach(function(g){var o=e('option','',g);o.value=g;grade.append(o);});grade.value=h.form_tier;
    var rank=e('select');C.curated.entries.forEach(function(_,i){var o=e('option','',String(i+1));o.value=String(i+1);rank.append(o);});rank.value=String(h.rank);
    var reason=e('input');reason.type='text';reason.placeholder='Explain form, trainer, scratching or track evidence';reason.maxLength=500;reason.setAttribute('aria-label','Required reason for research change');
    add(fields,e('span','','Form tier:'),grade,e('span','','Rank:'),rank,reason);
    add(form,fields,action('Save audited local change',function(){
     try{C.setResearchOverride(h.id,{tier:grade.value,rank:Number(rank.value),reason:reason.value});}
     catch(err){reason.setCustomValidity(err.message);reason.reportValidity();}
    },'primary'));
    row.append(form);
    view.disabled=true;
   },'ghost'));
   add(row,e('div','slot',String(h.rank).padStart(2,'0')),mid,stat,buttons);
   wrap.append(row);
  });
  if(!items.length)wrap.append(note('No researched selection for this meeting. No replacement horse has been invented.'));
  return wrap;
 }
 var list=e('div','toplist'),items=topSet();
 if(!items.length)return add(list,note('No research priority qualifies under these conditions. The model is abstaining.'));
 items.forEach(function(h,i){
  var row=e('button','toprow'),mid=e('div'),stat=e('div','model-row-stat');row.type='button';
  row.dataset.runnerId=h.id;row.dataset.modelPct=String(h.p);
  add(mid,e('strong','',h.horse),e('small','',h.meeting+' R'+h.race+' · gap '+h.gap.toFixed(2)+'pp'),
    e('small','',h._screen_status?'SCREENED RESEARCH PRIORITY':'RAW MODEL ONLY'));
  add(stat,e('strong','',pct(h.p)),e('small','','Provisional model estimate'),
    e('small','','Scenario floor '+pct(h._floor===undefined?h.robust_floor:h._floor)));
  add(row,e('div','slot',String(i+1).padStart(2,'0')),mid,stat);
  row.addEventListener('click',function(){selectRace(h.race_id,h.id);});list.append(row);
 });
 return list;
}
function researchHistory(){
 if(!C.curated)return null;
 var panel=box('Research revisions · what changed','Archived top-ten positions are retained. Local edits have a date, reason and before/after values. Changes stored on this device are not a shared Airtable publication.');
 var items=C.researchHistory.slice(-10).reverse();
 if(!items.length)panel.append(e('p','muted small','No changes to the frozen research checkpoint since it was loaded.'));
 items.forEach(function(entry){
  panel.append(e('p','muted small',entry.at+' · '+entry.reason+' · '+entry.changes.length+' affected researched runner(s)'));
  entry.changes.slice(0,4).forEach(function(x){
   panel.append(e('p','muted small',x.horse+': #'+x.old_rank+' → #'+x.new_rank+
    ', '+x.old_grade+' → '+x.new_grade+', '+(x.old_model_pct===null?'—':pct(x.old_model_pct))+
    ' → '+(x.new_model_pct===null?'—':pct(x.new_model_pct))+
    ' · '+x.old_status+' → '+x.new_status));
  });
 });
 return panel;
}
function aTierSummary(){
 if(!C.curated)return null;
 var panel=box('Original A-tier form · preserved','A-tier is the established historical form assessment, NOT a guarantee or an automatic A-grade race-day play.');
 C.curated.aTier.forEach(function(x){
  panel.append(e('p','muted small',x.horse+' · '+x.meeting+' R'+x.race+
    ' · original form '+x.archived_form_tier+(x.form_tier!==x.archived_form_tier?' · latest local grade '+x.form_tier:'')+' · '+x.race_day_assessment.replaceAll('_',' ')+
    (x.horse==='Hot And High'?' · Soft 5 record unavailable; race-day confidence conditional':'') ));
 });
 return panel;
}
function top10(){
 // The primary shortlist is ALWAYS independently researched; model leaderboards
 // and local edit controls are optional, collapsed diagnostics below it.
 var root=app(),research=C.curated,items=curatedSet();
 var header=add(e('div','rlv5-shortlist-heading'),
  e('span','rlv5-shortlist-eyebrow','SATURDAY · '+D.date),
  e('h2','','Top '+S.topN+' Selections'),
  e('p','','Our researched horses in original rank order — not automatically reordered by the live model.'));
 root.append(header);
 var switcher=e('div','rlv5-shortlist-switch');
 [5,10,15].forEach(function(n){
  var btn=action('Top '+n,function(){S.topN=n;render();},S.topN===n?'primary':'ghost');
  btn.className+=' rlv5-shortlist-tab'+(S.topN===n?' active':'');
  btn.setAttribute('aria-pressed',String(S.topN===n));
  switcher.append(btn);
 });
 root.append(switcher);
 if(!research){
  root.append(note('No saved independent research list is available. Live model leaders are not substitutes.'));return;
 }
 var subtitle=e('p','rlv5-shortlist-intro',S.topN===15?
  'Ranks 11–15 are additional review candidates, not equal-conviction Top 10 selections.':
  'Only independently reviewed selections appear here. A scratching does not silently promote another horse.');
 root.append(subtitle);
 var list=e('div','rlv5-shortlist-cards');
 items.forEach(function(h){
  var card=e('button','rlv5-shortlist-card'+(h.eligible?'':' excluded')),
   name=e('div','rlv5-shortlist-name'),
   details=e('div','rlv5-shortlist-details'),
   grades=e('div','rlv5-shortlist-grades');
  card.type='button';card.dataset.runnerId=h.id;
  if(h.model_pct!==null)card.dataset.modelPct=String(h.model_pct);
  name.append(e('strong','',h.horse));
  details.append(e('span','rlv5-shortlist-race',h.meeting+' · R'+h.race));
  if(h.research_lane==='CONDITIONAL_REVIEW')details.append(e('span','rlv5-shortlist-extra','Additional review'));
  name.append(details);
  if(h.reason)name.append(e('p','rlv5-shortlist-reason',h.reason));
  grades.append(e('span','rlv5-shortlist-grade',h.form_tier));
  grades.append(e('strong','rlv5-shortlist-percent',h.model_pct===null?'—':pct(h.model_pct)));
  grades.append(e('small','','MODEL ESTIMATE'));
  if(!h.eligible)grades.append(e('span','rlv5-shortlist-out','Out of field'));
  add(card,e('span','rlv5-shortlist-rank',String(h.rank).padStart(2,'0')),name,grades);
  card.addEventListener('click',function(){selectRace(h.race_id,h.id);});
  list.append(card);
 });
 if(!items.length)list.append(note('No reviewed selections for this meeting. Research positions are not automatically replaced.'));
 root.append(list);
 root.append(e('p','rlv5-shortlist-warning',
  'Model percentages are provisional and uncalibrated. Research grades describe form, not guaranteed chances. Final starters are not certified.'));
 // No forecast, scenario, audit log or alternative algorithm is placed in the main board.
 // The historical edit workflow is preserved but deliberately hidden by default.
 var advanced=e('details','rlv5-shortlist-advanced');
 advanced.append(e('summary','','Filters and research audit (optional)'));
 var inner=e('div','rlv5-shortlist-advanced-body');
 inner.append(setField('Meeting',[{value:'ALL',text:'All meetings'}].concat(
  Object.keys(C.going).map(function(m){return {value:m,text:m};})),S.top,
  function(v){S.top=v;render();}));
 inner.append(e('p','muted small','Grade/rank edits stay on this device, need a written reason and do not publish a shared research change.'));
 inner.append(toplist());
 inner.append(researchHistory());
 var screen=e('details','rlv5-shortlist-model-audit');
 screen.append(e('summary','','Strict model review · diagnostics only'));
 var hold=C.board.winFirst.review.filter(function(h){return S.top==='ALL'||h.meeting===S.top;});
 if(!hold.length)screen.append(e('p','muted small','No additional model-screened candidates awaiting review.'));
 hold.slice(0,8).forEach(function(h){
  screen.append(e('p','muted small',h.horse+' · '+h.meeting+' R'+h.race+' · '+h.reasons.join(', ')));
 });
 inner.append(screen);
 advanced.append(inner);root.append(advanced);
}
function raceNav(){
 var all=D.races.filter(function(r){return r.meeting===S.meeting;}),filter=e('div','filters');
 filter.append(setField('Meeting',Object.keys(C.going).map(function(x){return {value:x,text:x};}),S.meeting,function(v){
  S.meeting=v;S.race=D.races.find(function(r){return r.meeting===v;}).id;S.runner=null;render();
 }),setField('Race',all.map(function(r){return {value:r.id,text:'R'+r.race+' · '+r.title};}),S.race,function(v){
  S.race=v;S.runner=null;render();
 }));
 var grid=e('div','racechips');
 all.forEach(function(r){
  var research=C.curated&&C.curated.entries.find(function(h){return h.race_id===r.id;});
  var line=r.distance_m+'m · '+(research?'Research: '+research.horse:'No researched selection');
  var chip=add(e('button','racechip'+(r.id===S.race?' active':'')),
   e('b','','Race '+r.race),e('small','',line));
  chip.type='button';
  chip.addEventListener('click',function(){S.race=r.id;S.runner=null;render();});
  grid.append(chip);
 });
 return [filter,grid];
}
function facts(h){var x=model(h.id),names={career:'Career record',recency:'Recent form',distance:'Distance record',surface:'Surface record',course:'Course record',class:'Class performance',weight:'Weight',barrier:'Barrier',layoff:'Layoff',pace:'Pace stress',draw:'Draw stress'};
 function lines(xs){return xs.map(function(v){return (names[v.feature]||v.feature)+': '+(v.contribution>0?'+':'')+v.contribution.toFixed(3)+' score contribution';});}
 return {pros:x?lines(x.positive_drivers):[],cons:x?lines(x.negative_drivers):[]};
}
function evidence(title,text){var details=e('details','evidencebox');return add(details,e('summary','',title),e('pre','',text||'Not documented'));}
function humanAnalysis(h,x){
 if(!global.RacingLabHorseAnalysis)return note('Readable form analysis unavailable; check the source dossier below.');
 var source=C.curated&&C.curated.entries.find(function(v){return v.id===h.id;});
 var r=raceOf(h.race_id),result=global.RacingLabHorseAnalysis.analysis(h,r,x,C.going[r.meeting],source);
 var section=e('section','horse-brief'),intro=e('p','horse-brief-intro','Based on recorded form and the current track scenario. These are evidence-based reasons, not guaranteed outcomes.');
 section.append(add(e('div','horse-brief-head'),e('h4','','Runner assessment'),intro));
 var cards=e('div','horse-brief-grid');
 [['Why it can win',result.pros,'advantage'],['What could beat it',result.cons,'risk']].forEach(function(part){
  var card=add(e('section','horse-brief-card '+part[2]),e('h5','',part[0])),ul=e('ul','horse-brief-list');
  if(!part[1].length)ul.append(e('li','','No verified evidence recorded yet.'));
  part[1].forEach(function(reason){var item=e('li');add(item,e('strong','',reason.title),e('p','',reason.detail));ul.append(item);});
  card.append(ul);cards.append(card);
 });
 section.append(cards);
 if(result.unknown.length){
  var cautions=add(e('section','horse-brief-unknown'),e('h5','','Still to confirm')),ul=e('ul','horse-brief-list');
  result.unknown.forEach(function(v){ul.append(e('li','',v));});cautions.append(ul);section.append(cautions);
 }
 section.append(e('p','muted small',result.source));
 return section;
}
function horseDetail(h){
 var x=model(h.id),research=C.curated&&C.curated.entries.find(function(v){return v.id===h.id;}),
 root=e('div','panel detail rlv5-horse-detail'),top=e('div','rlv5-horse-title'),
 identity=add(e('div','rlv5-horse-identity'),e('span','rlv5-kicker','HORSE ANALYSIS'),
  e('h3','',h.horse),
  e('p','muted small','No. '+h.tab+' · Barrier '+(h.barrier??'—')+' · '+(h.weight_kg??'—')+'kg · '+(h.trainer||'Trainer not verified')+' / '+(String(h.jockey||'').trim()||'Rider not declared')));
 if(research)identity.append(e('span','rlv5-horse-tag','Independent research #'+research.original_rank));
 if(x&&x.rank===1)identity.append(e('span','rlv5-horse-tag','Model rank 1 · diagnostic'));
 top.append(identity);
 if(x)top.append(add(e('div','rlv5-horse-score'),e('strong','',pct(x.p)),
  e('span','','Uncalibrated model'),e('small','','Current race rank #'+x.rank)));
 else top.append(e('span','rlv5-horse-unavailable',C.model.statusOf(h)));
 root.append(top);
 if(!String(h.jockey||'').trim())root.append(e('p','rlv5-rider-alert','Rider not declared in saved field — check official declaration. This is not confirmation of a scratching.'));
 root.append(humanAnalysis(h,x));
 var deep=e('details','rlv5-horse-technical');
 deep.append(e('summary','','Full form, statistics, model QA and local scenario tools'));
 if(x){
  deep.append(e('p','muted small','Model fair odds $'+x.fair_odds.toFixed(2)+' · scenario range '+pct(x.model_range[0])+'–'+pct(x.model_range[1])+' · evidence coverage '+Math.round(x.completeness*100)+'% (coverage, not confidence).'));
  deep.append(evidence('Source-input QA flags',x.input_issues.join('\n')||'No structural input issue flagged. Final fields, gear and source evidence still require verification.'));
 }
 [['Dated form',h.form],['Surface / distance / course statistics',h.statistics],['Research notes',h.strengths],
 ['Source risks',h.risks],['Historical settling',h.historical_map],['Outstanding verification',h.outstanding]].forEach(function(p){deep.append(evidence(p[0],p[1]));});
 var sourceExcluded=!x&&!C.isLocalScratch(h.id),localButton=action(C.isLocalScratch(h.id)?'Undo local exclusion':'Exclude locally',function(){C.setLocalScratch(h.id,!C.isLocalScratch(h.id));},'ghost');
 localButton.disabled=sourceExcluded;
 deep.append(localButton,e('p','muted small','Local exclusions are what-if scenarios. Officially scratched runners cannot be reinstated here.'));
 root.append(deep);return root;
}

function racesPage(){
 var root=app();root.append(head('Race Centre','One researched selection per race where available. Model rankings are diagnostics, not competing picks.'));
 var navwrap=e('div','rlv5-race-select');raceNav().forEach(function(node){navwrap.append(node);});root.append(navwrap);
 var r=raceOf(S.race),summary=C.board.baseline.races.find(function(x){return x.id===r.id;}),hs=runners(r.id),
  reviewed=C.curated&&C.curated.entries.find(function(h){return h.race_id===r.id;}),
  official=C.official&&C.official.meetings.find(function(x){return x.meeting===r.meeting;});
 var hero=add(e('section','rlv5-race-hero'),
  e('span','rlv5-kicker',r.meeting+' · RACE '+r.race),
  e('h2','',r.title||code(r)),
  e('p','',r.distance_m+'m · '+summary.field+' currently included · '+summary.excluded+' excluded'));
 var chips=e('div','rlv5-race-tags');
 add(chips,e('span','',official?'Source track: '+official.track_going:'Model track scenario: '+C.going[r.meeting]),
  e('span','',official?'Source meeting scratchings: '+official.scratched_total:'Official scratching refresh pending'),
  e('span','','Current model scenario: '+C.going[r.meeting]));
 hero.append(chips);
 // This is a distribution warning, not a revised pick or a calibrated rating.
 if(summary.status==='MODELLED_PROVISIONAL'&&summary.field>=10&&summary.chaos>=93&&summary.gap<=2){
  hero.append(add(e('p','rlv5-race-no-standout'),e('strong','','No clear model standout. '),
   e('span','','The top runner is '+pct(summary.top_p)+' with just '+pct(summary.gap)+' between first and second. Treat this as a crowded race, not a high-confidence single.')));
 }
 hero.append(e('p','rlv5-race-source',official?
  'Official sheet last published '+official.source_last_published+'. Final starter and emergency status remains unverified.':
  'Saved research source '+(D.official_check_at||D.saved_at)+'. Final official starters are not verified.'));
 root.append(hero);
 // One primary selection only: the independent human-reviewed shortlist.
 // When no horse is reviewed (or it is out of the field), do not silently
 // promote the live model leader into a new recommended pick.
 var pickPanel=e('section','rlv5-race-selection'+(reviewed&&reviewed.eligible?'':' no-pick'));
 var pickTitle=reviewed&&reviewed.eligible?reviewed.horse:'No current researched selection';
 var reason=reviewed&&reviewed.eligible?
  'Independent research · original overall rank #'+reviewed.original_rank+'. Provisional until final field certification.':
  reviewed?'Previously researched: '+reviewed.horse+' (out of current field). No automatic replacement selected.':
  'This race does not have an independently reviewed selection in the saved Top 15.';
 pickPanel.append(
  e('span','rlv5-kicker','OUR RESEARCHED SELECTION'),
  e('h3','',pickTitle),
  e('p','',reason));
 if(reviewed&&reviewed.eligible&&reviewed.reason)
  pickPanel.append(e('p','rlv5-race-selection-reason',reviewed.reason));
 root.append(pickPanel);
 // Technical comparison remains accessible, but is NOT a second pick card.
 var modelNotes=e('details','rlv5-model-notes');
 modelNotes.append(e('summary','','Model check · not another selection'));
 var modelBody=e('div','rlv5-model-notes-body');
 modelBody.append(e('p','',
  'Highest raw model estimate: '+(summary.leader||'none')+
  (summary.top_p!==null&&summary.top_p!==undefined?' ('+pct(summary.top_p)+')':'')+
  '. These probabilities are uncalibrated and can change with field and track updates.'));
 if(reviewed&&summary.leader&&summary.leader.toUpperCase()!==reviewed.horse.toUpperCase())
  modelBody.append(e('p','rlv5-model-disagreement',
   'Model disagrees with the researched horse. Review the form and field before changing any selection; no automatic switch.'));
 modelBody.append(e('p','','This is a calculation for comparison, not a recommendation or an additional top pick.'));
 modelNotes.append(modelBody);root.append(modelNotes);
 if(!hs.length){root.append(note('No runner dossiers in this race.'));return;}
 if(!hs.some(function(h){return h.id===S.runner;})){
  S.runner=(reviewed&&reviewed.eligible?reviewed.id:null)||(hs.find(function(h){return !!model(h.id);})||hs[0]).id;
 }
 var columns=e('div','rlv5-race-columns'),
 list=add(e('div','rlv5-race-list'),add(e('div','rlv5-race-list-header'),
  e('h3','','Runners'),e('span','',summary.field+' active · ranked by provisional model')));
 hs.forEach(function(h){
  var x=model(h.id),tags=e('span','rlv5-runner-tags'),
   row=e('button','rlv5-runrow'+(h.id===S.runner?' active':'')),label=e('span','rlv5-runner-label');
  row.type='button';row.dataset.runnerId=h.id;if(x)row.dataset.modelPct=String(x.p);
  add(label,e('strong','',h.horse),e('small','',x?'Model rank #'+x.rank:C.model.statusOf(h)));
  if(reviewed&&reviewed.id===h.id)tags.append(e('span','rlv5-tag research','Research'));
  if(x&&x.rank===1)tags.append(e('span','rlv5-tag leader','Model rank 1'));
  if(!x)tags.append(e('span','rlv5-tag unavailable','Out of field'));
  add(row,e('span','rlv5-runner-tab',String(h.tab??'—')),label,
   e('span','rlv5-runner-prob',x?pct(x.p):'—'),tags);
  row.addEventListener('click',function(){S.runner=h.id;render();});
  list.append(row);
 });
 add(columns,list,horseDetail(hs.find(function(h){return h.id===S.runner;})));root.append(columns);
 var lower=e('div','rlv5-race-lower'),top4=add(e('section','rlv5-mini-panel'),
  e('span','rlv5-kicker','RACE SNAPSHOT'),e('h3','','Top four · live model, not research picks'));
 C.board.baseline.records.filter(function(x){return x.race_id===r.id;}).slice(0,4).forEach(function(h,i){
  top4.append(add(e('div','rlv5-topfour-row'),e('span','',String(i+1)),e('strong','',h.horse),e('span','',pct(h.p))));
 });
 var simulation=add(e('section','rlv5-mini-panel'),e('span','rlv5-kicker','RACE SIMULATOR'),
  e('h3','','See the full field model'),
  e('p','', 'Run the existing 10,000-draw simulation. Draws illustrate the model; they cannot establish true winning chances.'));
 simulation.append(action('Open race simulator',function(){go('sim');},'ghost'));
 lower.append(top4,simulation);root.append(lower);
 var scenariosDetails=e('details','rlv5-race-advanced');
 scenariosDetails.append(e('summary','','Change track scenario · advanced'),scenarios());
 root.append(scenariosDetails);
}

function workshop(kind){if(!global.RacingLabWorkshop){app().append(note('Tool failed to load. Reload the page.'));return;}global.RacingLabWorkshop[kind]({C:C,D:D,S:S,app:app,head:head,facts:facts,render:render,scenarios:scenarios});}
function comparePage(){add(app(),head('Compare runners','Model probabilities and source evidence for two runners in the same race.'),scenarios());raceNav().forEach(function(x){app().append(x);});var hs=runners(S.race);if(!hs.length)return;
 if(!hs.some(function(h){return h.id===S.compareA;}))S.compareA=hs[0].id;if(!hs.some(function(h){return h.id===S.compareB;}))S.compareB=(hs[1]||hs[0]).id;
 var opts=hs.map(function(h){return {value:h.id,text:h.horse};}),filters=e('div','filters');filters.append(setField('Runner A',opts,S.compareA,function(v){S.compareA=v;render();}),setField('Runner B',opts,S.compareB,function(v){S.compareB=v;render();}));app().append(filters,add(e('div','compare'),horseDetail(hs.find(function(h){return h.id===S.compareA;})),horseDetail(hs.find(function(h){return h.id===S.compareB;}))));
}
function qaPage(){add(app(),head('Model QA',C.board.version+' · '+C.revision),metrics(),scenarios(),officialPanel(),box('Win-first screening',C.board.winFirst.priority.length+' provisional research priorities · '+C.board.winFirst.review.length+' review-only · '+C.board.winFirst.avoid.length+' withheld races. Formula uses fixed Good 4/Soft 5 and conservative-class scenarios; no validated hit-rate gain.'),box('Whole-field checks',C.board.baseline.races.filter(function(r){return r.sum===100;}).length+' races total 100.00%. Exclusions remain in the source audit. A race with fewer than two included runners is withheld.'),box('Model status','Formula regression checks pass. Coefficients remain uncalibrated. The stored dossier does not establish completion of replay, trainer, gear, sectional or race-day field checks.'));}
function calPage(){add(app(),head('Calibration','Measured accuracy must come from frozen pre-race forecasts and verified results.'),box('Current status','Historical V5 calibration has not been established. Passing formula checks does not establish an improved strike rate. Scenario ranges are sensitivity checks.'),link('Open existing Top 5/10/15 results','/results.html'));}
function weatherPage(){add(app(),head('Weather & Tracks','Scenarios update the model everywhere. Saved observations remain dated.'),scenarios(),officialPanel(),venueCards());}
function syncPage(){add(app(),head('Data & Sync','One shared board for every screen.'),metrics(),officialPanel(),box('Evidence source',C.live?'Complete matching Airtable evidence received '+C.live.as_of+'. This is not official race-day certification.':'Saved snapshot '+D.saved_at+' is loaded. Live Airtable evidence is not confirmed.'),(function(){var panel=box('Latest refresh',C.error||'No refresh error recorded.');var line=panel.children&&panel.children[1];if(line)line.id='v5-sync-status';return panel;})(),action('Refresh Airtable evidence',function(){refresh(C);},'primary'),link('Static evidence','/v5/research.json'),link('GitHub code','https://github.com/fletchermaguire-oss/V3-Racing-Lab.'));}
function resultsPage(){add(app(),head('Results & History · Top 5 / 10 / 15','Existing selections and results are preserved.'),box('Historical record','Some historical rankings were reconstructed from saved probabilities rather than frozen pre-race lists. They remain labelled as retrospective.'),link('Open Results & History','/results.html','btn primary'));}
function statusOnly(){
 if(!C)return;
 var badge=document.getElementById('livebadge');
 if(badge)badge.textContent=C.error?'SYNC WARNING · SAVED BOARD':C.live?'AIRTABLE · MODEL UPDATED':'SAVED MODEL · PROVISIONAL';
 var status=document.getElementById('v5-sync-status');
 if(status)status.textContent=C.error||'No refresh error recorded.';
}
function render(){if(!C)return;D=C.data;if(!raceOf(S.race)){S.race=D.races[0].id;S.meeting=D.races[0].meeting;}
 if(global.RacingLabWorkshop)global.RacingLabWorkshop.stop();if(!embedded)nav();app().replaceChildren();
 var views={overview:overview,top10:top10,races:racesPage,multi:function(){workshop('multiPage');},sim:function(){workshop('simPage');},compare:comparePage,qa:qaPage,cal:calPage,weather:weatherPage,sync:syncPage,results:resultsPage};(views[S.page]||overview)();app().append(e('div','footer',C.board.version+' · '+C.revision+' · model estimates uncalibrated · source snapshot '+D.saved_at));
}
function officialPanel(){
 var p=box('Official scratchings / track review',C.official?
  'Observed '+C.official.observed_at+' · published sheets shown below. These are source-backed scratchings and track grades, NOT certified final starters/emergency activations.'
  :'Saved official-dated snapshot '+(D.official_check_at||'unavailable')+' · automatic refresh not yet confirmed. Final official declarations still outstanding.');
 if(C.official)C.official.meetings.forEach(function(s){
  p.append(e('p','muted small',s.meeting+' · '+s.track_going+' · '+s.scratched_total+
   ' scratched · published '+s.source_last_published));
 });
 p.append(action('Check official scratching sheets now',function(){refreshOfficial(C);},'primary'));
 return p;
}
async function refreshOfficial(controller){
 try{
  const response=await fetch('/api/v5/official',{cache:'no-store'});
  if(!response.ok)throw Error('Official sheets HTTP '+response.status);
  controller.applyOfficialSheets(await response.json());
 }catch(err){controller.reportError('Official update unavailable; saved field retained: '+err.message);}
}
async function refresh(controller){try{var r=await fetch('/api/v5/evidence',{cache:'no-store'});if(!r.ok)throw Error('Airtable HTTP '+r.status);controller.applyEvidence(await r.json());}catch(err){controller.reportError('Saved board retained: '+err.message);}}
function startRefresh(controller){if(controller.refreshStarted)return;controller.refreshStarted=true;refresh(controller);refreshOfficial(controller);setInterval(function(){if(document.visibilityState==='visible'){refresh(controller);refreshOfficial(controller);}},300000);}
function renderInto(container,page,controller,onNavigate,race){embedded=true;target=container;C=controller;navigate=onNavigate;S.page=page;D=C.data;if(race&&raceOf(race)){S.race=race;S.meeting=raceOf(race).meeting;}render();}
 global.RacingLabV5Dashboard={renderInto:renderInto,startRefresh:startRefresh,showFeedStatus:statusOnly,stop:function(){if(global.RacingLabWorkshop)global.RacingLabWorkshop.stop();}};
 if(document.getElementById('workspace'))global.RacingLabV5State.load().then(function(controller){C=controller;D=C.data;C.subscribe(function(_,event){if(event&&event.statusOnly)statusOnly();else render();});render();startRefresh(C);}).catch(function(err){app().replaceChildren(note('Current formula could not load: '+err.message),link('Results & History','/results.html'));});
})(window);
