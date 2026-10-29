/* One versioned board for the original site and the V5 studio. */
(function(root,factory){
  var api=factory(typeof module==='object'&&module.exports?require('./model.js'):root.RacingLabV5Model);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RacingLabV5State=api;
})(typeof window!=='undefined'?window:globalThis,function(M){
'use strict';
function clone(x){return JSON.parse(JSON.stringify(x));}
function revision(data,going){
  var text=JSON.stringify([M.VERSION,data,going]),hash=2166136261;
  for(var i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;
  return M.VERSION+':'+data.date+':'+hash.toString(16);
}
function create(input,options){
  if(!M)throw Error('Formula failed to load');
  options=options||{};
  var source=clone(input),data=clone(source),going={},local=new Set(),listeners=[],live=null,lastError='';
  data.races.forEach(function(r){going[r.meeting]='Good 4';});
  var storage=options.storage,settingsKey='racing-lab-v5-settings:'+data.date;
  try{
    var settings=storage&&JSON.parse(storage.getItem(settingsKey)||'null');
    if(settings&&settings.sourceSavedAt===source.saved_at){
      var candidate=Object.assign({},going);
      Object.keys(candidate).forEach(function(m){if(settings.going&&Object.hasOwn(settings.going,m))candidate[m]=settings.going[m];});
      var next=clone(source),ids=Array.isArray(settings.localIds)?settings.localIds:[];
      next.runners.forEach(function(h){if(ids.includes(h.id)&&M.isEligible(h)){h.status='SCRATCHED — local scenario';local.add(h.id);}});
      M.board(next,{going:candidate});data=next;going=candidate;
    }
  }catch(e){data=clone(source);local.clear();data.races.forEach(function(r){going[r.meeting]='Good 4';});}
  var board=M.board(data,{going:going}),key=revision(data,going);
  function notify(){
    try{if(storage)storage.setItem(settingsKey,JSON.stringify({sourceSavedAt:source.saved_at,going:going,localIds:Array.from(local)}));}catch(e){}
    listeners.slice().forEach(function(fn){fn(api);});
  }
  function commit(next,nextGoing){
    var result=M.board(next,{going:nextGoing});
    data=next;going=nextGoing;board=result;key=revision(data,going);notify();
  }
  function setGoing(meeting,value){
    if(!Object.hasOwn(going,meeting))throw Error('Unknown meeting');
    var next=Object.assign({},going);next[meeting]=value;commit(clone(data),next);
  }
  function setLocalScratch(id,value){
    var original=source.runners.find(function(h){return h.id===id;});
    if(!original)throw Error('Unknown runner');
    if(value&&!M.isEligible(original))throw Error('A source exclusion cannot be restored locally');
    var next=clone(data),runner=next.runners.find(function(h){return h.id===id;});
    runner.status=value?'SCRATCHED — local scenario':original.status;
    var result=M.board(next,{going:going});
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
    get revision(){return key;},get live(){return live;},get error(){return lastError;},get localScratchCount(){return local.size;},
    get model(){return M;},subscribe:function(fn){listeners.push(fn);return function(){listeners=listeners.filter(function(x){return x!==fn;});};},
    setGoing:setGoing,setLocalScratch:setLocalScratch,isLocalScratch:function(id){return local.has(id);},applyEvidence:applyEvidence,
    reportError:function(message){lastError=message;notify();},rows:rows,
    multi:function(ids){return M.multi(board,ids);},simulate:function(race,count,seed){return M.simulateWinners(rows(race),count,seed);},
    legacySnapshot:legacySnapshot};
  return api;
}
var pending=null;
function load(fetcher){
  if(!pending)pending=(fetcher||fetch)('/v5/research.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw Error('Research HTTP '+r.status);return r.json();})
    .then(function(data){var storage;try{storage=typeof localStorage!=='undefined'?localStorage:null;}catch(e){}return create(data,{storage:storage});})
    .catch(function(e){pending=null;throw e;});
  return pending;
}
return {create:create,load:load};
});
