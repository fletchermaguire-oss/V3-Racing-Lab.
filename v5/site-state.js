/* One versioned board for the original site and the V5 studio. */
(function(root,factory){
  var api=factory(typeof module==='object'&&module.exports?require('./model.js'):root.RacingLabV5Model,
   typeof module==='object'&&module.exports?require('./curated.js'):root.RacingLabV5Curated);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RacingLabV5State=api;
})(typeof window!=='undefined'?window:globalThis,function(M,Curated){
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
  if(!overlay||!['racing-lab-friday-field-overlay/v1','racing-lab-racecard-overlay/v2'].includes(overlay.schema))throw Error('Unverified or missing official field overlay');
  if(overlay.race_date!==input.date)throw Error('Field overlay date mismatch');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(overlay.checked_date)||overlay.checked_date>input.date)throw Error('Invalid racecard overlay date');
  if(overlay.checked_date===input.date&&
     (typeof overlay.checked_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d(?:\.\d+)?[+-]\d\d:\d\d$/.test(overlay.checked_at)||
      overlay.checked_at.slice(0,10)!==input.date||!Number.isFinite(Date.parse(overlay.checked_at))))
    throw Error('Race-day overlay requires a timestamp with local timezone');
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
      var h=resolve(race,horse);h.status='SCRATCHED — official sheet '+overlay.checked_date;h.emergency_activated=false;
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
  next.official_check_at=overlay.checked_at||overlay.checked_date;
  next.official_overlay_notice=overlay.notice;
  next.official_overlay_sources=overlay.source_documents;
  next.emergency_review_races=Object.keys(overlay.emergency_order||{}).map(r=>input.date+'_'+r);
  next.emergencies_certified=false; // Source scratching sheet does NOT certify provisional reserve promotions.
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
  var source=clone(input),data=clone(source),going={},local=new Set(),listeners=[],live=null,lastError='',lastChange=null,official=null,officialGoing={};
  var checkpoint=options.checkpoint||null,overrides={},history=[],curated=null;
  data.races.forEach(function(r){going[r.meeting]=options.going&&options.going[r.meeting]||datedGoing(source,r.meeting);});
  officialGoing=Object.assign({},going);
  var storage=options.storage,settingsKey='racing-lab-v5-settings:'+data.date,archiveKey='racing-lab-v5-research:'+data.date,sourceStamp=recordedGoingStamp(source)+'|'+String(source.official_check_at||'');
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
  if(checkpoint){
    if(!Curated)throw Error('Research ranking module missing');
    Curated.validate(checkpoint,data);
    try{
      var saved=storage&&JSON.parse(storage.getItem(archiveKey)||'null');
      if(saved&&saved.version===Curated.VERSION){
        var currentArchiveId=checkpoint.revision_id||checkpoint.as_of;
        var previousArchiveId=saved.checkpoint_revision||saved.checkpoint_at;
        history=Array.isArray(saved.history)?saved.history.slice(-59):[];
        if(previousArchiveId===currentArchiveId)overrides=saved.overrides&&typeof saved.overrides==='object'?saved.overrides:{};
        else history.push({at:new Date().toISOString(),reason:'ARCHIVED_RESEARCH_CHECKPOINT_REPLACED',
          previous_checkpoint:previousArchiveId,new_checkpoint:currentArchiveId,
          changes:[],source:'NEW_FILE_REVISION',approval:'RESEARCH_ONLY'});
      }
    }catch(e){overrides={};history=[];}
    curated=Curated.assemble(checkpoint,data,board,going,overrides);
  }
  function keepArchive(){
    try{if(storage&&checkpoint)storage.setItem(archiveKey,JSON.stringify({
      checkpoint_at:checkpoint.as_of,checkpoint_revision:checkpoint.revision_id||checkpoint.as_of,
      version:Curated.VERSION,overrides:overrides,history:history.slice(-60)}));}catch(e){}
  }
  function researchChange(reason,previous){
    if(!checkpoint)return;
    const before=previous||curated;
    curated=Curated.assemble(checkpoint,data,board,going,overrides);
    if(!before)return;
    const old=new Map(before.entries.map(x=>[x.id,x]));
    const changes=[];
    curated.entries.forEach(x=>{
      const prior=old.get(x.id);
      if(!prior)return;
      const differs=prior.eligible!==x.eligible||prior.form_tier!==x.form_tier||
        prior.rank!==x.rank||prior.race_day_assessment!==x.race_day_assessment||
        prior.model_pct!==x.model_pct||prior.track_current!==x.track_current;
      if(differs)changes.push({horse:x.horse,race_id:x.race_id,
        old_rank:prior.rank,new_rank:x.rank,old_grade:prior.form_tier,new_grade:x.form_tier,
        old_status:prior.race_day_assessment,new_status:x.race_day_assessment,
        old_model_pct:prior.model_pct,new_model_pct:x.model_pct});
    });
    if(changes.length){
      history.push({at:new Date().toISOString(),reason:reason,previous_revision:key,
        changes:changes,source:'LOCAL_SITE_SESSION_OR_AIRTABLE',approval:'RESEARCH_ONLY'});
      history=history.slice(-60);
    }
    keepArchive();
  }
  function setResearchOverride(runnerId,fields){
    if(!checkpoint||!curated)throw Error('No archived research list loaded');
    const current=curated.entries.find(x=>x.id===runnerId);
    if(!current)throw Error('Runner not on the researched list');
    const entry=Curated.edit(curated,runnerId,{
      tier:fields&&fields.tier||current.form_tier,
      rank:fields&&fields.rank!==undefined?fields.rank:current.rank,
      reason:fields&&fields.reason
    });
    const previous=curated,ordered=curated.entries.filter(x=>x.id!==runnerId);
    ordered.splice(entry.rank-1,0,current);
    ordered.forEach((x,i)=>{
      const prior=overrides[x.id]||{};
      overrides[x.id]=Object.assign({},prior,{rank:i+1});
    });
    overrides[runnerId]=Object.assign({},overrides[runnerId],entry,{rank:entry.rank});
    researchChange('MANUAL_RESEARCH_OVERRIDE: '+entry.reason,previous);
    notify();
  }
  function notify(){
    try{if(storage)storage.setItem(settingsKey,JSON.stringify({sourceSavedAt:sourceStamp,going:going,localIds:Array.from(local)}));}catch(e){}
    keepArchive();
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
    data=next;going=nextGoing;board=result;key=revision(data,going);researchChange(reason||'SCENARIO_CHANGE');notify();
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
    data=next;board=result;key=revision(data,going);researchChange(value?'LOCAL_SCRATCHING':'LOCAL_REINSTATEMENT');notify();
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
    if(JSON.stringify(next.runners)===JSON.stringify(source.runners)){
      live={as_of:q.as_of};lastError='';
      return; // New Airtable request contained no new evidence; preserve simulator and UI state.
    }
    var nextSource=clone(next);
    next.runners.forEach(function(h){if(local.has(h.id)&&M.isEligible(h))h.status='SCRATCHED — local scenario';});
    var result=M.board(next,{going:going});
    noteChange('AIRTABLE_EVIDENCE_UPDATE',board,result);
    source=nextSource;data=next;board=result;key=revision(data,going);live={as_of:q.as_of};lastError='';researchChange('AIRTABLE_EVIDENCE_UPDATE');notify();
  }
  function applyOfficialSheets(q){
    if(!q||q.schema!=='racing-lab-official-sheets/v1'||q.status!=='OFFICIAL_SHEETS_RECONCILED'||
       q.race_date!==source.date||q.publication_approved!==false||q.final_fields_verified!==false||
       !Array.isArray(q.meetings)||q.meetings.length!==Object.keys(going).length)
      throw Error('Incomplete or mismatched official sheets; saved board retained');
    var timestamp=Date.parse(q.observed_at);
    if(!Number.isFinite(timestamp)||(official&&timestamp<=Date.parse(official.observed_at)))
      throw Error('Stale or invalid official observed timestamp');
    var nextSource=clone(source),newGoing=Object.assign({},going),nextOfficialGoing=Object.assign({},officialGoing);
    var index=new Map(),seenMeetings=new Set(),scratches=0;
    nextSource.runners.forEach(function(h){
      var key=h.race_id+'|'+canonical(h.horse);
      if(index.has(key))throw Error('Duplicated source runner identity');
      index.set(key,h);
    });
    q.meetings.forEach(function(sheet){
      if(!sheet||!Object.hasOwn(going,sheet.meeting)||seenMeetings.has(sheet.meeting)||
         typeof sheet.source_last_published!=='string'||!sheet.source_last_published.trim()||!/^(Good [34]|Soft [567]|Heavy (8|9|10))$/.test(sheet.track_going)||
         !Number.isSafeInteger(sheet.scratched_total)||sheet.scratched_total<0||
         !sheet.scratchings||typeof sheet.scratchings!=='object'||Array.isArray(sheet.scratchings)||
         sheet.confirmed_final_starters!==false||sheet.emergencies_confirmed!==false)
         throw Error('Invalid official meeting/source payload; saved board retained');
      seenMeetings.add(sheet.meeting);
      if(going[sheet.meeting]===officialGoing[sheet.meeting])newGoing[sheet.meeting]=sheet.track_going;
      nextOfficialGoing[sheet.meeting]=sheet.track_going;
      var counted=0,names=new Set();
      Object.entries(sheet.scratchings).forEach(function(pair){
        var race=pair[0],horses=pair[1],raceId=source.date+'_'+race;
        if(!race.startsWith(sheet.meeting+'_R')||!nextSource.races.some(x=>x.id===raceId)||!Array.isArray(horses))
         throw Error('Official sheet race mismatch: '+race);
        horses.forEach(function(name){
          var key=raceId+'|'+canonical(name),h=index.get(key);
          if(!h||names.has(key))throw Error('Unknown/duplicate official scratching: '+race+' '+name);
          names.add(key);counted++;
          h.status='SCRATCHED — verified against official published sheet '+sheet.source_last_published;
          h.emergency_activated=false;
        });
      });
      if(counted!==sheet.scratched_total)throw Error('Official scratching total does not match named runners: '+sheet.meeting);
      scratches+=counted;
    });
    if(seenMeetings.size!==Object.keys(going).length)throw Error('Official meetings missing');
    nextSource.official_observed_at=q.observed_at;
    nextSource.official_sources=q.meetings.map(function(x){return {
      meeting:x.meeting,url:x.source_url,published:x.source_last_published,going:x.track_going,
      scratching_count:x.scratched_total
    };});
    if(official&&JSON.stringify(nextSource.runners)===JSON.stringify(source.runners)&&
       JSON.stringify(nextSource.official_sources)===JSON.stringify(source.official_sources)&&
       JSON.stringify(newGoing)===JSON.stringify(going)){
      official.last_checked_at=q.observed_at;lastError='';
      return official; // Identical published sheets must not restart race animation or edits.
    }
    var next=clone(nextSource);
    next.runners.forEach(function(h){if(local.has(h.id)&&M.isEligible(h))h.status='SCRATCHED — local scenario';});
    var result=M.board(next,{going:newGoing});
    noteChange('OFFICIAL_SCRATCHINGS_AND_TRACK_CHECK',board,result);
    source=nextSource;data=next;going=newGoing;officialGoing=nextOfficialGoing;
    board=result;key=revision(data,going);official={observed_at:q.observed_at,
     meetings:q.meetings.map(function(x){return {meeting:x.meeting,source_last_published:x.source_last_published,
       source_url:x.source_url,track_going:x.track_going,scratched_total:x.scratched_total};}),
     final_fields_verified:false,matched_scratchings:scratches};
    lastError='';researchChange('OFFICIAL_SCRATCHINGS_AND_TRACK_CHECK');notify();
    return official;
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
    get revision(){return key;},get live(){return live;},get error(){return lastError;},get lastChange(){return lastChange;},
    get curated(){return curated;},get researchHistory(){return history.slice();},get researchCheckpoint(){return checkpoint;},
    get official(){return official;},get officialGoing(){return Object.assign({},officialGoing);},applyOfficialSheets:applyOfficialSheets,
    get curatedGradeOptions(){return Curated?Curated.GRADES.slice():[];},
    setResearchOverride:setResearchOverride,get localScratchCount(){return local.size;},
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
   return f('/v5/official-latest.json',{cache:'no-store'}).then(function(r){
    if(!r.ok)throw Error('Official snapshot HTTP '+r.status+' (saved board withheld)');
    return r.json();
   }).then(function(overlay){
    return f('/v5/shortlists/current.json',{cache:'no-store'}).then(function(r){
       if(!r.ok)throw Error('Frozen researched Top 10 unavailable: '+r.status);
       return r.json();
      }).then(function(checkpoint){
       return {data:applyOfficialOverlay(data,overlay),going:overlay.going,checkpoint:checkpoint};
      });
   });
  }).then(function(part){
   var storage;try{storage=typeof localStorage!=='undefined'?localStorage:null;}catch(e){}
   return create(part.data,{storage:storage,going:part.going,checkpoint:part.checkpoint||null});
  }).catch(function(e){pending=null;throw e;});
 }
 return pending;
}
return {create:create,load:load,applyOfficialOverlay:applyOfficialOverlay};
});
