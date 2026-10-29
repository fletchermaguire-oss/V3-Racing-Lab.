/* Racing Lab V5: additive research reader. Do not replace the V3 dashboard or publish draft forecasts. */
(function(){
"use strict";
var DATA="/v5/research.json", data=null, loading=null, activeRace=null, activeHorse=null, initialized=false;
function el(tag,cls,value){var x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined&&value!==null)x.textContent=String(value);return x;}
function child(p){for(var i=1;i<arguments.length;i++)if(arguments[i])p.appendChild(arguments[i]);return p;}
function clean(v){return v===undefined||v===null||v===""?"Not verified":String(v);}
function mount(){
if(initialized)return;initialized=true;var fallback=document.getElementById('rlv5-permanent-link');if(fallback)fallback.style.display='none';
var css=document.createElement("link");css.rel="stylesheet";css.href="/v5/reader.css";document.head.appendChild(css);
var launcher=el("button","rlv5-launcher","V5 RESEARCH"),shell=el("section","rlv5-shell");shell.hidden=true;
shell.setAttribute("role","dialog");shell.setAttribute("aria-modal","true");shell.setAttribute("aria-label","Racing Lab V5 research");shell.id="rlv5-research";
launcher.type="button";launcher.setAttribute("aria-controls","rlv5-research");launcher.setAttribute("aria-expanded","false");
var top=el("header","rlv5-top"),heading=el("div"),close=el("button","rlv5-close","Close ×");
child(heading,el("div","rlv5-kicker","SATURDAY 31 OCTOBER 2026"),el("h2","rlv5-heading","V5 Research Centre"),el("div","rlv5-subtitle","Original Racing Lab intact · All runners · Evidence from PDFs and Airtable"));
close.type="button";child(top,heading,close);
var guard=el("div","rlv5-guard","RESEARCH ONLY — no approved V5 probabilities · Good 4 is a working scenario · Saturday starters unverified");
var tools=el("div","rlv5-filters"),meetLabel=el("label","rlv5-filter"),raceLabel=el("label","rlv5-filter"),searchLabel=el("label","rlv5-filter");
var meet=el("select"),race=el("select"),search=el("input");search.type="search";search.placeholder="Search runners in this race";
child(meetLabel,el("span",null,"Meeting"),meet);child(raceLabel,el("span",null,"Race"),race);child(searchLabel,el("span",null,"Horse"),search);child(tools,meetLabel,raceLabel,searchLabel);
var raceInfo=el("div","rlv5-race"),content=el("div","rlv5-content"),list=el("div","rlv5-list"),detail=el("article","rlv5-detail"),foot=el("p","rlv5-foot","Research snapshot: 29 October 2026. This panel does not alter or approve the original model forecasts.");
child(content,list,detail);
var frame=el("div","rlv5-frame");child(frame,top,guard,tools,raceInfo,content,foot);shell.appendChild(frame);child(document.body,launcher,shell);
function show(open){shell.hidden=!open;document.body.classList.toggle("rlv5-open",open);launcher.setAttribute("aria-expanded",String(open));if(open)close.focus();else launcher.focus();}
function setWaiting(msg){detail.replaceChildren(el("p","rlv5-muted",msg));list.replaceChildren();}
function pairs(title,text){var box=el("section","rlv5-fact");child(box,el("h4",null,title),el("p",null,clean(text)));return box;}
function detailFor(h){if(!h){detail.replaceChildren(el("p","rlv5-muted","Select a runner"));return;}activeHorse=h.id;var head=el("div","rlv5-kicker",h.original_pick?"ORIGINAL RESEARCH LEADER — NOT AN APPROVED V5 FORECAST":"RUNNER RESEARCH");var t=el("h3",null,h.horse);var meta=el("p","rlv5-muted","No. "+clean(h.tab)+" · Gate "+clean(h.barrier)+" · "+clean(h.weight_kg)+"kg · "+clean(h.status));
var sub=el("p","rlv5-muted","Trainer: "+clean(h.trainer)+"  ·  Jockey: "+clean(h.jockey));
detail.replaceChildren(head,t,meta,sub,pairs("Career / course / distance / surface",h.statistics),pairs("Dated recent performances",h.form),pairs("Form positives",h.strengths),pairs("Risks / how this runner can lose",h.risks),pairs("Historical settling / map",h.historical_map),pairs("Missing verification",h.outstanding));
}
function render(){if(!data)return;var rid=race.value;var r=data.races.find(function(x){return x.id===rid;});if(!r)return;
activeRace=rid;raceInfo.replaceChildren(el("h3",null,r.title+" · R"+r.race+" · "+clean(r.distance_m)+"m"),el("p","rlv5-muted","Original qualitative leader: "+clean(r.original_pick)+" · Final Saturday scratchings and track not certified"));
var hs=data.runners.filter(function(x){return x.race_id===rid;}).sort(function(a,b){return Number(b.original_pick)-Number(a.original_pick)||(Number(a.tab)||99)-(Number(b.tab)||99);});
var query=search.value.trim().toLowerCase();if(query)hs=hs.filter(function(x){return x.horse.toLowerCase().includes(query);});
list.replaceChildren();hs.forEach(function(h){var btn=el("button","rlv5-runner"+(h.original_pick?" rlv5-original":"")+(h.id===activeHorse?" rlv5-selected":""), (h.original_pick?"★ ":"")+"#"+clean(h.tab)+" "+h.horse);
btn.type="button";btn.append(el("small","",h.original_pick?"Original research leader":h.status));
btn.addEventListener("click",function(){detailFor(h);Array.from(list.children).forEach(function(x){x.classList.remove("rlv5-selected");});btn.classList.add("rlv5-selected");});list.append(btn);});
var selected=hs.find(function(x){return x.id===activeHorse;})||hs.find(function(x){return x.original_pick;})||hs[0];detailFor(selected);
}
function setRaces(choose){race.replaceChildren();var venue=meet.value;data.races.filter(function(r){return r.meeting===venue;}).forEach(function(r){var op=el("option",null,"Race "+r.race+" · "+r.title);op.value=r.id;race.append(op);});if(choose)race.value=choose;if(!race.value&&race.options.length)race.selectedIndex=0;search.value="";activeHorse=null;render();}
function populate(){meet.replaceChildren();["RANDWICK","FLEMINGTON","ASCOT"].forEach(function(k){var op=el("option",null,k[0]+k.slice(1).toLowerCase());op.value=k;meet.append(op);});meet.value="RANDWICK";setRaces();}
async function getData(){if(data)return data;if(loading)return loading;
loading=fetch(DATA,{cache:"no-store"}).then(function(r){if(!r.ok)throw Error("Research download HTTP "+r.status);return r.json();}).then(function(v){if(!v||v.publication?.approved!==false||!Array.isArray(v.races)||!Array.isArray(v.runners)||v.races.length!==29||v.runners.length!==408)throw Error("Research publication guard or inventory check failed");data=v;populate();return v;});return loading;
}
launcher.addEventListener("click",function(){show(true);if(!data){setWaiting("Loading 408 documented runners…");getData().catch(function(e){setWaiting("Research not available: "+e.message);loading=null;});}});
close.addEventListener("click",function(){show(false);});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!shell.hidden)show(false);});
meet.addEventListener("change",function(){setRaces();});
race.addEventListener("change",function(){activeHorse=null;search.value="";render();});
search.addEventListener("input",function(){activeHorse=null;render();});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount,{once:true});else mount();
})();