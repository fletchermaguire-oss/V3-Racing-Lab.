/* Racing Lab V5 dashboard: user-facing research, never a synthetic forecast. */
(function(){
'use strict';
var D=null,live=false,liveAsOf='',S={page:'overview',meeting:'RANDWICK',race:'2026-10-31_RANDWICK_R01',runner:null,top:'ALL',multi:[],compareA:null,compareB:null,search:''};
var PAGES=[['overview','Overview'],['top10','Daily Top 10'],['races','Race Centre'],['pros','Pros & Cons'],['multi','Multi Lab'],['sim','Simulator'],['compare','Compare'],['qa','Model QA'],['cal','Calibration'],['weather','Weather & Tracks'],['sync','Data & Sync'],['results','Results']];
var VENUES=['RANDWICK','FLEMINGTON','ASCOT'];
function e(tag,cls,txt){var x=document.createElement(tag);if(cls)x.className=cls;if(txt!==undefined&&txt!==null)x.textContent=String(txt);return x;}
function app(){return document.getElementById('workspace');}
function add(p){for(var i=1;i<arguments.length;i++)if(arguments[i])p.append(arguments[i]);return p;}
function box(title,note){var p=e('div','panel');if(title)add(p,e('h3','',title));if(note)add(p,e('p','muted small',note));return p;}
function action(label,fn,style){var b=e('button','btn '+(style||''),label);b.type='button';b.addEventListener('click',fn);return b;}
function link(label,url,cls){var a=e('a',cls||'btn ghost',label);a.href=url;return a;}
function head(title,note){var h=e('div','sectionhead'),wrap=e('div');add(wrap,e('h2','',title),e('p','',note||''));h.append(wrap);return h;}
function note(txt){return e('div','notice',txt);}
function para(txt){return e('p','muted small',txt);}
function raceOf(id){return D.races.find(function(x){return x.id===id;});}
function runners(id){return D.runners.filter(function(x){return x.race_id===id;}).sort(function(a,b){return Number(b.original_pick)-Number(a.original_pick)||Number(a.tab)-Number(b.tab);});}
function leader(r){return D.runners.find(function(h){return h.race_id===r.id&&h.original_pick;});}
function code(r){return r.meeting+' R'+r.race;}
function go(page){S.page=page;render();window.scrollTo(0,0);}
function selectRace(rid,horse,page){S.race=rid;S.meeting=raceOf(rid).meeting;S.runner=horse||null;go(page||'races');}
function setField(label,options,selected,onchange){var l=e('label','field');add(l,e('span','',label));var s=e('select');options.forEach(function(o){var opt=e('option','',o.text);opt.value=o.value;if(o.value===selected)opt.selected=true;s.append(opt);});s.addEventListener('change',function(){onchange(s.value);});l.append(s);return l;}
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
var main=['overview','races','top10','multi','sim','compare','pros'];
var second=['qa','cal','weather','sync','results'];
side.append(e('div','nav-group','RACING STUDIO'));
main.forEach(function(id){side.append(makeButton(id,'navbtn'));});
side.append(e('div','nav-group','RESEARCH & CONTROLS'));
second.forEach(function(id){side.append(makeButton(id,'navbtn'));});
var foot=e('div','sidebar-foot');
add(foot,e('strong','','◉ 31 OCTOBER RESEARCH'),e('p','','29 races · 408 runner dossiers. Saved qualitative picks are not approved V5 winning probabilities.'),link('Original Racing Lab ↗','/',''));
side.append(foot);
var mobileShort={overview:'Home',races:'Races',top10:'Top 10',multi:'Multi',sim:'Simulator',pros:'Pros / Cons'};
['overview','races','top10','multi','sim','pros'].forEach(function(id){var b=makeButton(id,'');b.querySelector('span').textContent=mobileShort[id];mobile.append(b);});
var previous=document.getElementById('v5-more-popup');if(previous)previous.remove();
var popup=e('div','v5-more-menu');popup.id='v5-more-popup';popup.hidden=true;
var phead=e('div','v5-more-head','MORE RACING LAB SECTIONS');popup.append(phead);
['compare','weather','qa','cal','sync','results'].forEach(function(id){var b=makeButton(id,'v5-more-item');popup.append(b);});
document.body.append(popup);
var more=e('button','v5-more-trigger'+(['compare','weather','qa','cal','sync','results'].includes(S.page)?' active':''));more.type='button';
more.innerHTML=icon('sync')+'<span>More</span>';
more.addEventListener('click',function(){popup.hidden=!popup.hidden;more.setAttribute('aria-expanded',String(!popup.hidden));});
more.setAttribute('aria-expanded','false');more.setAttribute('aria-controls','v5-more-popup');mobile.append(more);
document.getElementById('pagetitle').textContent=PAGES.find(function(x){return x[0]===S.page;})[1];
document.getElementById('livebadge').textContent=live?'AIRTABLE RESEARCH LINKED':'V5 RESEARCH ONLY';
}
function metrics(){var v=e('div','grid stats');[['29','31 Oct races'],['408','PDF-listed runners'],['19','Original race leaders'],['0','Approved V5 forecasts']].forEach(function(m){var c=e('div','panel metric');add(c,e('div','number',m[0]),e('div','label',m[1]));v.append(c);});return v;}
function venueCards(){var g=e('div','grid');VENUES.forEach(function(v){var m=D.meetings.find(function(x){return x.meeting===v;});var r=D.races.filter(function(x){return x.meeting===v;});var c=e('div','panel track');add(c,e('div','venue',v),e('h3','',r.length+' races · '+D.runners.filter(function(h){return h.race_id.includes('_'+v+'_');}).length+' runners'),e('p','','Working Saturday: Good 4 · 29 Oct observed: '+m.official_29_oct),e('p','','Rail: '+m.rail),action('View race cards',function(){S.meeting=v;S.race=r[0].id;S.runner=null;go('races');},'primary'));g.append(c);});return g;}
function overview(){
var hero=e('div','hero');
add(hero,e('div','eyebrow','SATURDAY 31 OCTOBER 2026 · PRO V5'),e('h2','','Your racing command centre.'),e('p','','Original Racing Lab layout · 29 races · every runner researched. Race Centre, Top 10, Multi Lab, Pros & Cons and Compare are all in the familiar studio.'));
var buttons=e('div','heroActions');
add(buttons,action('Daily Top 10',function(){go('top10');},'primary'),action('Race Centre',function(){go('races');}),action('Pros & Cons',function(){go('pros');}),link('Original Simulator','/'));
hero.append(buttons);
add(app(),hero,metrics(),note('31 OCTOBER RESEARCH ONLY: The saved original qualitative selections are preserved. Saturday starters and independent V5 winning probabilities are not yet verified; no invented rankings or percentages.'),head('Daily Top 10 · saved review queue','Familiar Top 10 layout. These ten slots are not ranked by winning chance until the complete V5 model is verified.'),toplist(),head('Track intelligence','Good 4 is our working Saturday scenario, not a final certified condition.'),venueCards(),head('Strong research profiles','Open individual source-backed strengths, weaknesses and form.'));
var grid=e('div','grid');
allLeaders().filter(function(h){return ['RANDWICK_R08','FLEMINGTON_R06','FLEMINGTON_R08','RANDWICK_R07','RANDWICK_R06','FLEMINGTON_R05'].some(function(z){return h.race_id.endsWith(z);});}).forEach(function(h){var c=box(h.horse,shortRace(h.race_id)),f=facts(h);
add(c,e('p','small','PRO: '+(f.pros[0]||'See saved evidence')),e('p','muted small','RISK: '+(f.cons[0]||'Raceday conditions pending')),action('Read full pros & cons',function(){selectRace(h.race_id,h.id,'pros');}));
grid.append(c);});
app().append(grid);
}
function shortRace(id){var r=raceOf(id);return r?code(r)+' · '+r.title:'';}
function allLeaders(){return D.runners.filter(function(h){return h.original_pick;}).sort(function(a,b){var x=raceOf(a.race_id),y=raceOf(b.race_id);return VENUES.indexOf(x.meeting)-VENUES.indexOf(y.meeting)||x.race-y.race;});}
function firstStrength(h){return (h.strengths||'').replace(/^PDF-sourced:\s*/,'').split(';').slice(0,2).join(';').slice(0,180)||'Research dossier available';}
function topSet(){var ls=allLeaders();if(S.top!=='ALL')return ls.filter(function(h){return raceOf(h.race_id).meeting===S.top;}).slice(0,10);
var a=ls.filter(function(h){return h.race_id.includes('_RANDWICK_');}),b=ls.filter(function(h){return h.race_id.includes('_FLEMINGTON_');});var out=[];for(var i=0;i<5;i++){if(a[i])out.push(a[i]);if(b[i])out.push(b[i]);}return out;}
function toplist(){var list=e('div','toplist');topSet().forEach(function(h,i){var t=e('button','toprow');var mid=e('div');add(mid,e('strong','',h.horse),e('small','',shortRace(h.race_id)));add(t,e('div','slot',String(i+1).padStart(2,'0')),mid,e('span','chip','Review'));t.addEventListener('click',function(){selectRace(h.race_id,h.id,'races');});list.append(t);});return list;}
function top10(){add(app(),head('Daily Top 10','The proper Top 10 workspace is restored. This is a research review queue, NOT a ranked or approved V5 Top 10.'),note('Original 19 race leaders are preserved from our detailed reviews. The ten visible slots are arranged by track/race for navigation—not ranked by win chance. Final probability-ranked Top 10 will only be shown after full-field modelling, calibration checks and Saturday verification.'));
var f=e('div','filters');f.append(setField('Show leaders',[{value:'ALL',text:'Both eastern meetings (5 + 5)'},{value:'RANDWICK',text:'Randwick (10)'},{value:'FLEMINGTON',text:'Flemington (9)'},{value:'ASCOT',text:'Ascot (no saved original leaders)'}],S.top,function(v){S.top=v;render();}));app().append(f,toplist(),head('How Top 10 becomes official','Independent models cannot be replaced by a simple sorting rule.'),box('Publication checks','Final scratchings · complete runner evidence and pace maps · Good 4 and Soft 5 stress · full-field probability sums · historical calibration / uncertainty · separate QA review.'));
}
function raceNav(){var all=D.races.filter(function(r){return r.meeting===S.meeting;});var filter=e('div','filters');filter.append(setField('Meeting',VENUES.map(function(x){return {value:x,text:x};}),S.meeting,function(v){S.meeting=v;S.race=D.races.find(function(r){return r.meeting===v;}).id;S.runner=null;render();}));
filter.append(setField('Race',all.map(function(r){return {value:r.id,text:'R'+r.race+' · '+r.title};}),S.race,function(v){S.race=v;S.runner=null;render();}));
var grid=e('div','racechips');all.forEach(function(r){var b=e('button','racechip'+(r.id===S.race?' active':''));add(b,e('b','','Race '+r.race),e('small','',r.distance_m+'m · '+(r.original_pick||'No leader')));b.addEventListener('click',function(){S.race=r.id;S.runner=null;render();});grid.append(b);});return [filter,grid];}
function facts(h){var result={pros:[],cons:[]},pos=result.pros,neg=result.cons;var stat=h.statistics||'',form=h.form||'',last=form.split('\n').find(function(t){return /^\d{1,2}\/\d{1,2}\/\d{4}/.test(t.trim());})||'';
var stats=function(k){var mt=stat.match(new RegExp('\\b'+k+'\\s+(\\d+)-(\\d+)-(\\d+)','i'));return mt?{w:+mt[1],place:+mt[2],n:+mt[3]}:null;};
var c=stats('Career'),dist=stats('distance'),course=stats('course'),good=stats('Good'),soft=stats('Soft');
if(c&&c.n){pos.push('Career '+c.w+' wins and '+c.place+' other placings from '+c.n+' starts ('+Math.round(100*c.w/c.n)+'% historical win rate; not a race win forecast).');}
if(dist&&dist.w>0)pos.push('Proven at this distance: '+dist.w+' wins from '+dist.n+' starts.');
else if(dist&&dist.n>=3)neg.push('Distance record is winless in '+dist.n+' starts; sample and opposition matter.');
if(course&&course.w>0)pos.push('Has won at the host course ('+course.w+' from '+course.n+').');
else if(course&&course.n>=3)neg.push('Still seeking a first host-course win after '+course.n+' attempts.');
if(good&&good.w>0)pos.push('Recorded Good-track wins: '+good.w+' from '+good.n+' starts (working Saturday surface scenario).');
else if(good&&good.n>=3)neg.push('No Good-track wins from '+good.n+' starts; assess quality of prior opposition.');
if(soft&&soft.w>0&&soft.n)pos.push('Documented Soft-track winning form: '+soft.w+' from '+soft.n+' starts, relevant if rain changes the scenario.');
var fm=last.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?):\s*(\d+)\/(\d+),\s*PDF margin\s*([0-9.]+)L/);
if(fm){var place=+fm[3],margin=+fm[5];if(place===1)pos.unshift('Last start WIN: '+fm[1]+' '+fm[2]+' ('+fm[3]+'/'+fm[4]+', recorded margin '+margin+'L).');else if(place<=3&&margin<=2)pos.unshift('Recent competitive result: '+fm[3]+'/'+fm[4]+' at '+fm[2]+' on '+fm[1]+' ('+margin+'L recorded margin).');else if(place>=6)neg.unshift('Last-start finish '+fm[3]+'/'+fm[4]+' on '+fm[1]+' at '+fm[2]+'; form needs context.');}
var wins=form.split('\n').filter(function(x){return /^\d{1,2}\/\d{1,2}\/\d{4}/.test(x.trim())&&/\b1\/\d+,\s*PDF/.test(x);});if(wins.length&&(!fm||+fm[3]!==1))pos.push('Another documented recent win: '+wins[0].trim().slice(0,145)+'.');
if(Number(h.barrier)>=12)neg.push('Published barrier '+h.barrier+': a wide gate can increase map/cover risk depending on the race tempo and straight-course setup.');
if(Number(h.weight_kg)>=60)neg.push('Carries '+h.weight_kg+'kg: requires a field-relative handicap assessment, not an automatic negative.');
var risk=(h.risks||'').split(';').map(function(s){return s.trim();}).filter(function(s){return s&&s.length>12&&!/no specific verified negative|Raceday pattern|full stewards|unverified;|calibrated gear/i.test(s);});
risk.slice(0,2).forEach(function(s){if(!neg.some(function(n){return n.toLowerCase().includes(s.toLowerCase().slice(0,16));}))neg.push(s+'.');});
var strengths=(h.strengths||'').split(';').map(function(s){return s.trim();}).filter(function(s){return /sourced .*comment|trainer .*says|stewards|gear change|trial|blinkers|first up/i.test(s)&&!/PDF-sourced:/i.test(s)&&!/https?:/i.test(s);});strengths.slice(0,1).forEach(function(s){pos.push('Context (not an assumed benefit): '+s+'.');});
if(pos.length===0)pos.push('No sufficiently specific positive could be extracted automatically. Open the source dossier before assessing this runner.');
if(neg.length===0)neg.push('No specific material negative verified in the saved record; that is NOT evidence the runner is risk-free.');
if(/not verified|unverified/i.test(h.status||''))neg.push('Saturday starter, scratchings and actual track/rail remain unverified.');
return result;}
function bulletCard(cls,title,items){var c=e('div','factcard '+cls);c.append(e('h4','',title));var ul=e('ul');items.forEach(function(s){ul.append(e('li','',s));});c.append(ul);return c;}
function horseDetail(h){var root=e('div','panel detail');add(root,e('div','eyebrow',h.original_pick?'ORIGINAL RACE LEADER · NOT A FINAL V5 FORECAST':'FULL RUNNER RESEARCH'),e('h3','',h.horse),e('p','muted small','No. '+h.tab+' · Barrier '+h.barrier+' · '+h.weight_kg+'kg · '+h.trainer+' / '+h.jockey),e('div','pillrow'));
var f=facts(h);var cols=e('div','factgrid');add(cols,bulletCard('','PROS · supporting evidence',f.pros),bulletCard('risk','CONS · how this runner can lose',f.cons));root.append(cols);
var v=e('div','mini','Historical settling: '+(h.historical_map||'Not documented')+' — past runs do not establish Saturday positioning.');root.append(v);
[['Dated form',h.form],['Surface / distance / course statistics',h.statistics],['Source strengths and trainer notes',h.strengths],['Source risks and counterarguments',h.risks],['Full pace / historical settling',h.historical_map],['Unresolved research and verification',h.outstanding]].forEach(function(part){var details=e('details','evidencebox');details.append(e('summary','',part[0]),e('pre','',part[1]||'Not documented'));root.append(details);});
return root;}
function racePanel(mode){var r=raceOf(S.race);if(!r){return;}var bar=e('div','racebar');add(bar,e('div','eyebrow',r.meeting+' · RACE '+r.race),e('h3','',r.title+' · '+r.distance_m+'m'),e('p','','Original qualitative leader: '+(r.original_pick||'Unranked')+' · '+runners(r.id).length+' PDF entries · Saturday field unverified'));app().append(bar);
var cols=e('div','cols');var l=e('div','panel runnerlist');var hs=runners(r.id);if(!S.runner||!hs.some(function(h){return h.id===S.runner;}))S.runner=hs[0].id;hs.forEach(function(h){var row=e('button','runrow'+(h.id===S.runner?' active':''),'#'+h.tab+' '+h.horse+(h.original_pick?' ★':''));row.append(e('small','',h.original_pick?'Original research leader':'Thursday-listed · verify starter'));row.addEventListener('click',function(){S.runner=h.id;render();});l.append(row);});cols.append(l,horseDetail(hs.find(function(h){return h.id===S.runner;})));app().append(cols);
var section=e('details','evidencebox');section.append(e('summary','','Race shape, trainer context and outstanding QA'),e('pre','','Race intelligence: '+(r.source_notes||'Not documented')+'\n\nUnresolved: '+(r.qa_notes||'No completed QA record.')));app().append(section);
}
function racesPage(){add(app(),head('Race Centre','All 29 races, all 408 named runners, source-backed detail and two-sided analysis.'));raceNav().forEach(function(x){app().append(x);});racePanel();}
function prosPage(){add(app(),head('Runner Pros & Cons','Your proper evidence-based strengths versus vulnerabilities view, for EVERY horse—not generic praise.'));raceNav().forEach(function(x){app().append(x);});racePanel();}
function multiPage(){add(app(),head('Multi Lab','Build a research watchlist of 2–3 runner profiles. This does not make selections or calculate joint probabilities.'),note('No approved V5 probabilities = no genuine multi hit probability. The earlier published model is archived, not recalculated for Saturday.'));
var top=allLeaders(),p=e('div','panel');add(p,e('h3','','Saved watchlist ('+S.multi.length+'/3)'),para(S.multi.length?'These are research notes, not a wager recommendation.':'Select up to three original race leaders to compare their evidence.'));
S.multi.forEach(function(id){var h=D.runners.find(function(x){return x.id===id;});if(!h)return;var div=e('div','toprow');add(div,e('b','',h.horse),e('small','',shortRace(h.race_id)),action('Remove',function(){S.multi=S.multi.filter(function(x){return x!==id;});render();},'ghost'));p.append(div);});app().append(p);
var f=e('div','grid');top.forEach(function(h){var c=box(h.horse,shortRace(h.race_id));c.append(action(S.multi.includes(h.id)?'Added':'Add to watchlist',function(){if(S.multi.includes(h.id))return;if(S.multi.length>=3)return;S.multi.push(h.id);render();},S.multi.includes(h.id)?'ghost':'primary'));f.append(c);});app().append(f);
}
function simPage(){add(app(),head('Simulator','The original race visualisation was NOT deleted.'),note('The legacy simulator uses older saved race data; it must not be presented as a 31 October V5 simulation. A credible 31 October simulation requires verified fields, runner pace modelling and frozen full-field probabilities.'));
var c=box('Original Racing Lab simulator','The original site and all of its sections remain at the root website. This V5 research release leaves it untouched.');add(c,link('Open original Racing Lab','/','btn primary'),para('In the original interface, choose Simulator. Do not confuse archived model runners with the new V5 racing dates.'));app().append(c);
}
function comparePage(){add(app(),head('Compare runners','Compare any two documented horses in the same race. Facts and risks are shown side-by-side.'));raceNav().forEach(function(x){app().append(x);});var hs=runners(S.race);var filter=e('div','filters');
if(!hs.some(function(h){return h.id===S.compareA;}))S.compareA=hs[0]?.id;
if(!hs.some(function(h){return h.id===S.compareB;}))S.compareB=hs[1]?.id||hs[0]?.id;
var opts=hs.map(function(h){return {value:h.id,text:'#'+h.tab+' '+h.horse};});filter.append(setField('Runner A',opts,S.compareA,function(v){S.compareA=v;render();}),setField('Runner B',opts,S.compareB,function(v){S.compareB=v;render();}));app().append(filter);
var c=e('div','compare');[S.compareA,S.compareB].forEach(function(id){var h=hs.find(function(x){return x.id===id;}),p=box(h.horse,'Barrier '+h.barrier+' · '+h.weight_kg+'kg');var f=facts(h);p.append(bulletCard('','Pros',f.pros),bulletCard('risk','Cons',f.cons));c.append(p);});app().append(c);
}
function qaPage(){add(app(),head('Model QA','Publication checks and honest model status'),metrics(),note('NOT READY FOR APPROVED V5 RANKINGS. All 408 PDF runners and 29 races are stored, but Thursday acceptances are NOT final Saturday starters. The 31 October dataset has no approved win percentages.'));
var p=box('Checks still required');[['Field and scratches','Pending official Saturday verification'],['Weather / rail','Good 4 working scenario; Ascot observed Soft 5 on 29 Oct'],['Form / tactics','Dated PDFs captured; all replay / sectional / trainer evidence not fully audited'],['Probability sums','No approved V5 per-runner win percentages to score'],['Calibration','Historical retrospective diagnostic only; not out-of-sample V5 calibration']].forEach(function(x){var row=e('div','toprow');add(row,e('strong','',x[0]),e('small','',x[1]));p.append(row);});app().append(p);
}
function calPage(){add(app(),head('Calibration','Retrospective checks do not prove future winning probabilities.'),note('An Airtable historical diagnostic scores 30 races from 17 October. It explicitly says this is retrospective and NOT empirically calibrated. One race date is insufficient to claim calibrated V5 probabilities.'),box('Required next step','Freeze pre-race probability boards before racing on multiple independent race days; score verified winners using Brier/log loss and reliability bands; test calibration on held-out dates. No artificial historical hit rate.'));
}
function weatherPage(){add(app(),head('Weather & Tracks','Recorded Thursday observations versus Saturday Good 4 working scenario'),venueCards(),note('Do not silently change Ascot Soft 5 observed on 29 October into a verified Saturday Good 4. Track condition and scratching updates require official dated source verification.'));
}
function syncPage(){add(app(),head('Data & Sync','Where your V5 research really lives'),metrics());var b=box('Live evidence bridge',live?'Airtable API responded and matching runner evidence was loaded: '+liveAsOf:'Static snapshot is intact. Secure Airtable response is not confirmed for this browser session.');add(b,link('Airtable evidence endpoint','/api/v5/evidence'),link('GitHub code','https://github.com/fletchermaguire-oss/V3-Racing-Lab.'),link('Static research JSON','/v5/research.json'));app().append(b,note('The site does not automatically publish approved predictions, recalculate probabilities, verify scratchings or update its simulator from Airtable evidence. Those functions remain gated.'));
}
function resultsPage(){add(app(),head('Results','Race results, validation and existing history'),box('Archived racing results','The original Results page is available. Current Saturday results do not exist before the races run.'),link('Open Results','/results.html','btn primary'));}
function render(){if(!D)return;nav();app().replaceChildren();if(S.page==='overview')overview();else if(S.page==='top10')top10();else if(S.page==='races')racesPage();else if(S.page==='pros')prosPage();else if(S.page==='multi')multiPage();else if(S.page==='sim')simPage();else if(S.page==='compare')comparePage();else if(S.page==='qa')qaPage();else if(S.page==='cal')calPage();else if(S.page==='weather')weatherPage();else if(S.page==='sync')syncPage();else if(S.page==='results')resultsPage();app().append(e('div','footer','31 October 2026 · Research snapshot 29 October · Evidence sourced from Feature Form PDFs and connected Airtable · Original qualitative leaders preserved · No V5 win probability approval'));}
function liveUpdate(){fetch('/api/v5/evidence',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('HTTP '+r.status);return r.json();}).then(function(q){if(q.status!=='LIVE_RESEARCH_ONLY'||q.truncated||q.publication_approved!==false||!Array.isArray(q.records)||q.records.length!==408)throw Error('Not a complete live research snapshot');var map=new Map();q.records.forEach(function(x){var f=x.fields||{};map.set(String(f.fld4BGD5iAcZcGfaN)+'|'+String(f.fldll7dYIGf28MAKA),f);});if(D.runners.some(function(h){return !map.has(h.race_id+'|'+h.horse);}))throw Error('Runner inventory mismatch');D.runners.forEach(function(h){var f=map.get(h.race_id+'|'+h.horse);[['form','fldb2TMkMV0aeCuTQ'],['statistics','fldgSikt2WARtdwk8'],['strengths','fldwVqrxsNeuNQiLP'],['risks','fldj14UmWVhZY8Mgi'],['historical_map','fldoYxB5oh5AuF56e'],['outstanding','fldddV1wq9EL0f2zy']].forEach(function(pair){if(f[pair[1]])h[pair[0]]=String(f[pair[1]]);});});live=true;liveAsOf=q.as_of||'time unknown';render();}).catch(function(){/* Keep complete dated static source, never overwrite picks. */});}
fetch('/v5/research.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Research HTTP '+r.status);return r.json();}).then(function(v){if(v.date!=='2026-10-31'||v.publication?.approved!==false||v.races.length!==29||v.runners.length!==408||v.runners.filter(function(h){return h.original_pick;}).length!==19)throw Error('V5 integrity check failed');D=v;render();liveUpdate();}).catch(function(err){app().replaceChildren(note('Research load failed: '+err.message),link('Open original Racing Lab','/'));});
})();