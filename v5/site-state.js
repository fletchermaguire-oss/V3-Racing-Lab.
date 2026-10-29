/* One versioned board for the original site and the V5 studio. */
(function(root,factory){
  var api=factory(typeof module==='object'&&module.exports?require('./model.js'):root.RacingLabV5Model);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RacingLabV5State=api;
})(typeof window!=='undefined'?window:globalThis,function(M){
'use strict';
function clone(x){return JSON.parse(JSON.stringify(x));}
function datedGoing(source,meeting){
  var row=(source.meetings||[]).find(function(x){return x.meeting===meeting;})||{};
  var value=String(row.official_29_oct||'').trim();
  return /^(?:Good [34]|Soft [567]|Heavy (?:8|9|10))$/.test(value)?value:'Good 4';
}
function recordedGoingStamp(source){
  return String(source.saved_at||'')+'|'+(source.meetings||[]).map(function(x){
    return x.meeting+':'+datedGoing(source,x.meeting);
  }).sort().join('|');
}
function canonical(x){return String(x||'').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');}
function applyOfficialOverlay(input,overlay){
  if(!overlay||overlay.schema!=='racing-lab-friday-field-overlay/v1')throw Error('Unverified or missing official field overlay');
  if(overlay.race_date!==input.date)throw Error('Field overlay date mismatch');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(overlay.checked_date)||overlay.checked_date>=input.date)throw Error('Invalid pre-race overlay date');
  if(overlay.publication_approved!==false)throw Error('A research overlay cannot grant publication approval');
  var next=clone(input),seen=new Set(),index=new Map();
  next.runners.forEach(function(h){
    var key=h.race_id+'|'+canonical(h.horse);
    if(index.has(key))throw Error('Duplicated runner identity in source');
    index.set(key,h);
  });
  function resolve(race,horse){
    var id=input.date+'_'+race+'|'+canonical(horse),h=index.get(id);
    if(!h)throw Error('Official overlay references unknown runner: '+race+' '+horse);
    if(seen.has(id))throw Error('Official overlay duplicates a runner: '+race+' '+horse);
    seen.add(id);return h;
  }
  Object.keys(overlay.scratchings||{}).forEach(function(race){
    (overlay.scratchings[race]||[]).forEach(function(horse){
      var h=resolve(race,horse);h.status='SCRATCHED — 30 October dated official scratching sheet';h.emergency_activated=false;
    });
  });
  Object.keys(overlay.emergency_order||{}).forEach(function(race){
    var names=overlay.emergency_order[race],count=(overlay.projected_promotions||{})[race]||0;
    if(!Array.isArray(names)||!Number.isInteger(count)||count<0||count>names.length)throw Error('Invalid projected emergency count');
    names.forEach(function(horse,i){
      var h=resolve(race,horse);
      if(!M.isEligible(h))throw Error('Officially scratched runner cannot be promoted');
      h.status='EMERGENCY — provisional field projection';
      h.emergency_activated=i<count;
    });
  });
  next.official_check_at=overlay.checked_date;
  next.official_overlay_notice=overlay.notice;
  next.official_overlay_sources=overlay.source_documents;
  next.publication=Object.assign({},next.publication,{approved:false,model_probabilities_published:false,status:'RESEARCH_ONLY'});
  M.board(next,{going:overlay.going}); // Atomic inventory and scenario validation before accepting the overlay.
  return next;
}
function revision(data,going){
  var text=JSON.stringify([M.VERSION,data,going]),hash=2166136261;
  for(var i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;
  return M.VERSION+':'+data.date+':'+hash.toString(16);
}
function create(input,options){
  if(!M)throw Error('Formula failed to load');
  options=options||{};
  var source=clone(input),data=clone(source),going={},local=new Set(),listeners=[],live=null,lastError='',lastChange=null;
  data.races.forEach(function(r){going[r.meeting]=options.going&&options.going[r.meeting]||datedGoing(source,r.meeting);});
  var storage=options.storage,settingsKey='racing-lab-v5-settings:'+data.date,sourceStamp=recordedGoingStamp(source)+'|'+String(source.official_check_at||'');
  try{
    var settings=storage&&JSON.parse(storage.getItem(settingsKey)||'null');
    if(settings&&settings.sourceSavedAt===sourceStamp){
      var candidate=Object.assign({},going);
      Object.keys(candidate).forEach(function(m){if(settings.going&&Object.hasOwn(settings.going,m))candidate[m]=settings.going[m];});
      var next=clone(source),ids=Array.isArray(settings.localIds)?settings.localIds:[];
      next.runners.forEach(function(h){if(ids.includes(h.id)&&M.isEligible(h)){h.status='SCRATCHED — local scenario';local.add(h.id);}});
      M.board(next,{going:candidate});data=next;going=candidate;
    }
  }catch(e){data=clone(source);local.clear();data.races.forEach(function(r){going[r.meeting]=options.going&&options.going[r.meeting]||datedGoing(source,r.meeting);});}
  var board=M.board(data,{going:going}),key=revision(data,going);
  function notify(){
    try{if(storage)storage.setItem(settingsKey,JSON.stringify({sourceSavedAt:sourceStamp,going:going,localIds:Array.from(local)}));}catch(e){}
    listeners.slice().forEach(function(fn){fn(api);});
  }
  function noteChange(reason,previous,next){
    var prior=new Map(previous.winFirst.byRace.map(function(x){return [x.race_id,x];}));
    var changed=[];
    next.winFirst.byRace.forEach(function(x){
      var old=prior.get(x.race_id)||{},prev=old.runner_id||null,current=x.runner_id||null;
      if(prev!==current)changed.push({race_id:x.race_id,previous:old.horse||'NO SELECTION',
       current:x.horse||'NO SELECTION',reason:reason});
    });
    var previousRaw=new Map(previous.baseline.races.map(function(x){return [x.id,x.leader];}));
    var rawMoves=next.baseline.races.filter(function(x){return previousRaw.get(x.id)!==x.leader;})
      .map(function(x){return {race_id:x.id,previous:previousRaw.get(x.id),current:x.leader};});
    lastChange={reason:reason,previous_revision:key,changed_selections:changed,raw_leader_changes:rawMoves,
      notice:changed.length?'Selection identities changed: see race explanations.':'No win-first selection changed; raw rankings may have changed.'};
  }
  function commit(next,nextGoing,reason){
    var result=M.board(next,{going:nextGoing});
    noteChange(reason||'SCENARIO_CHANGE',board,result);
    data=next;going=nextGoing;board=result;key=revision(data,going);notify();
  }
  function setGoing(meeting,value){
    if(!Object.hasOwn(going,meeting))throw Error('Unknown meeting');
    var next=Object.assign({},going);next[meeting]=value;commit(clone(data),next,'TRACK_GOING_'+meeting);
  }
  function setLocalScratch(id,value){
    var original=source.runners.find(function(h){return h.id===id;});
    if(!original)throw Error('Unknown runner');
    if(value&&!M.isEligible(original))throw Error('A source exclusion cannot be restored locally');
    var next=clone(data),runner=next.runners.find(function(h){return h.id===id;});
    runner.status=value?'SCRATCHED — local scenario':original.status;
    var result=M.board(next,{going:going});
    noteChange(value?'LOCAL_SCRATCHING':'LOCAL_REINSTATEMENT',board,result);
    if(value)local.add(id);else local.delete(id);
    data=next;board=result;key=revision(data,going);notify();
  }
  function applyEvidence(q){
    if(!q||q.status!=='LIVE_RESEARCH_ONLY'||q.truncated||q.publication_approved!==false||!Array.isArray(q.records)||q.records.length!==source.runners.length)
      throw Error('Incomplete live evidence; saved board retained');
    var stamp=Date.parse(q.as_of);
    if(!Number.isFinite(stamp)||(live&&stamp<Date.parse(live.as_of)))throw Error('Invalid or older live evidence');
    var map=new Map();
    q.records.forEach(function(x){
      var f=x.fields||{},k=String(f.fld4BGD5iAcZcGfaN||'')+'|'+String(f.fldll7dYIGf28MAKA||'');
      if(map.has(k))throw Error('Duplicate live runner');map.set(k,f);
    });
    var next=clone(source),fields=[['form','fldb2TMkMV0aeCuTQ'],['statistics','fldgSikt2WARtdwk8'],['strengths','fldwVqrxsNeuNQiLP'],['risks','fldj14UmWVhZY8Mgi'],['historical_map','fldoYxB5oh5AuF56e'],['outstanding','fldddV1wq9EL0f2zy']];
    next.runners.forEach(function(h){
      var f=map.get(h.race_id+'|'+h.horse);if(!f)throw Error('Live field inventory mismatch');
      fields.forEach(function(p){if(typeof f[p[1]]==='string')h[p[0]]=f[p[1]];});
      var status=f.fldsSdoQPBOyW0AOJ;
      if(status&&typeof status==='object')status=status.name;
      // A generic listed/unverified label cannot silently reinstate a saved scratch.
      if(typeof status==='string'&&(M.isEligible(h)||!M.isEligible({status:status})))h.status=status;
    });
    var nextSource=clone(next);
    next.runners.forEach(function(h){if(local.has(h.id))h.status='SCRATCHED — local scenario';});
    var result=M.board(next,{going:going});
    noteChange('AIRTABLE_EVIDENCE_UPDATE',board,result);
    source=nextSource;data=next;board=result;key=revision(data,going);live={as_of:q.as_of};lastError='';notify();
  }
  function rows(race){return board.baseline.records.filter(function(h){return h.race_id===race;});}
  function legacySnapshot(){
    var raw=new Map(data.runners.map(function(h){return [h.id,h];})),tracks={},research={};
    Object.keys(going).forEach(function(meeting){
      var m=(data.meetings||[]).find(function(x){return x.meeting===meeting;})||{};
      tracks[meeting]={surface:going[meeting]+' (model scenario)',rail:m.rail||'Unverified',note:'Saved evidence '+data.saved_at+'; final fields and going unverified.'};
    });
    board.baseline.records.forEach(function(x){var h=raw.get(x.id);research[x.id]={
      form:String(h.form||'').split('\n'),note:h.strengths||'',risk:h.risks||'',
      rob:x.research_status,settle:x.settle_800,weight:h.weight_kg,jockey:h.jockey,trainer:h.trainer,
      low:x.model_range[0],high:x.model_range[1],statistics:h.statistics,trial:'Not independently verified'
    };});
    return {date:data.date,version:M.VERSION,tracks:tracks,research:research,
      races:data.races.map(function(r){var s=board.baseline.races.find(function(x){return x.id===r.id;});return {
        id:r.meeting+'_R'+String(r.race).padStart(2,'0'),name:r.title,distance:r.distance_m,
        class:r.class||'Saved research',time:r.time||'Time unverified',n:s.field,fieldVerified:false
      };}),
      records:board.baseline.records.map(function(x){var h=raw.get(x.id);return {
        runnerId:x.id,modelId:x.id,race:x.meeting+'_R'+String(x.race).padStart(2,'0'),name:x.horse,
        p:x.p,p_exact:x.p_exact,rating:x.model_score,barrier:h.barrier,status:x.status,
        low:x.model_range[0],high:x.model_range[1],fairOdds:x.fair_odds,quality_flags:x.quality_flags
      };}),publication:{status:'PROVISIONAL_UNCALIBRATED',approved:false},model_revision:key};
  }
  var api={get data(){return data;},get board(){return board;},get going(){return Object.assign({},going);},
    get revision(){return key;},get live(){return live;},get error(){return lastError;},get lastChange(){return lastChange;},get localScratchCount(){return local.size;},
    get model(){return M;},subscribe:function(fn){listeners.push(fn);return function(){listeners=listeners.filter(function(x){return x!==fn;});};},
    setGoing:setGoing,setLocalScratch:setLocalScratch,isLocalScratch:function(id){return local.has(id);},applyEvidence:applyEvidence,
    reportError:function(message){lastError=message;notify();},rows:rows,
    multi:function(ids){return M.multi(board,ids);},simulate:function(race,count,seed){return M.simulateWinners(rows(race),count,seed);},
    legacySnapshot:legacySnapshot};
  return api;
}
var pending=null;
function load(fetcher){
 if(!pending){
  var f=fetcher||fetch;
  pending=f('/v5/research.json',{cache:'no-store'}).then(function(r){
   if(!r.ok)throw Error('Research HTTP '+r.status);
   return r.json();
  }).then(function(data){
   if(data.date!=='2026-10-31')return {data:data,going:null};
   return f('/v5/official-snapshot-20261030.json',{cache:'no-store'}).then(function(r){
    if(!r.ok)throw Error('Official snapshot HTTP '+r.status+' (saved board withheld)');
    return r.json();
   }).then(function(overlay){
    return {data:applyOfficialOverlay(data,overlay),going:overlay.going};
   });
  }).then(function(part){
   var storage;try{storage=typeof localStorage!=='undefined'?localStorage:null;}catch(e){}
   return create(part.data,{storage:storage,going:part.going});
  }).catch(function(e){pending=null;throw e;});
 }
 return pending;
}
return {create:create,load:load,applyOfficialOverlay:applyOfficialOverlay};
});
