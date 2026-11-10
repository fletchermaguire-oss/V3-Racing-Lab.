'use strict';
/*
 * L5-preserving opposition-strength shadow, never published as a tip.
 * Peer ratings are an NEW input distinct from ordinal race-grade labels.
 * Research-only until independent source attestation and prospective scores.
 * Never infer a rating from race class, win margin, course or betting price.
 */
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const Model=require('../model.js');
const SCHEMA='racing-lab-historical-opposition/v1';
const METHOD='RESIDUAL_TO_L5_CLASS_V1';
const STRENGTH=0.10; // untrained, predeclared, bounded; cannot be tuned from known winners
const RATING_MIN=0,RATING_MAX=150;
const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&
 Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
function stamp(s){
 if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(s))return null;
 const t=Date.parse(s);return Number.isFinite(t)&&new Date(t).toISOString().slice(0,19)===s.slice(0,19)?t:null;
}
const url=x=>typeof x==='string'&&/^https:\/\/[^/\s]+\/\S+/.test(x);
const sha=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const canon=x=>String(x||'').normalize('NFKD').toUpperCase().replace(/[^A-Z0-9]/g,'');
function auDay(d){
 const m=String(d).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 const s=m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):null;
 return validDate(s)?s:null;
}
function savedStarts(h){
 const found=[],seen=new Set();
 for(const line of String(h.form||'').split('\n')){
  const m=line.match(/^(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+\d+m\s+\([GSH]\),\s*(.+?):\s*(\d+)\/(\d+),\s*PDF margin\s*[\d.]+L/i);
  if(!m)continue;
  const date=auDay(m[1]);if(!date||seen.has(date))continue;
  seen.add(date);
  found.push({date,venue:canon(m[2]),race_class:m[3],finish:Number(m[4]),field_size:Number(m[5])});
 }
 return found.sort((a,b)=>b.date.localeCompare(a.date));
}
function median(xs){
 if(!xs.length)return null;
 const a=xs.slice().sort((x,y)=>x-y),m=a.length>>1;
 return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function recordCheck({h,row,targetDate,asOf,sourceStart,scale}){
 const problems=[];
 if(!row||typeof row!=='object')return {ok:false,problems:['MISSING_OPPONENT_RECORD']};
 if(row.runner_id!==h.id||canon(row.horse)!==canon(h.horse))problems.push('CURRENT_RUNNER_MISMATCH');
 if(!Array.isArray(row.historical_races)||row.historical_races.length<2)problems.push('FEWER_THAN_TWO_HISTORICAL_FIELDS');
 const form=savedStarts(h),matched=[],ids=new Set();
 for(const item of Array.isArray(row.historical_races)?row.historical_races:[]){
  const issues=[],historicalDate=item?.historical_race_date,t=stamp(item?.historical_race_start_utc);
  if(!validDate(historicalDate)||historicalDate>=targetDate||t===null||
      item.historical_race_start_utc.slice(0,10)!==historicalDate||t>=asOf)
   issues.push('INVALID_OR_FUTURE_HISTORICAL_RACE');
  if(typeof item?.historical_race_id!=='string'||!item.historical_race_id.startsWith(historicalDate+'_')||
    ids.has(item.historical_race_id))issues.push('DUPLICATE_OR_BAD_HISTORICAL_RACE_ID');
  ids.add(item.historical_race_id);
  const v=form.find(s=>s.date===historicalDate&&s.venue===canon(item.venue));
  if(!v||v.field_size!==item.field_size||v.finish!==item.finish)issues.push('HISTORICAL_FIELD_NOT_IN_SAVED_FORM');
  if(item.rating_scale!==scale||typeof scale!=='string'||!scale.trim())issues.push('UNCOMPARABLE_RATING_SCALE');
  const published=stamp(item.source_published_at_utc),captured=stamp(item.source_captured_at_utc);
  if(!url(item.source_url)||!sha(item.source_sha256)||published===null||captured===null||
      published>captured||captured>asOf)issues.push('NO_TIMESTAMPED_SOURCE_PROOF');
  const peers=Array.isArray(item.opponents)?item.opponents:[],peerIds=new Set(),ratings=[];
  if(!Number.isInteger(item.field_size)||item.field_size<4||peers.length<Math.ceil(.60*(item.field_size-1)))
   issues.push('OPPOSITION_FIELD_COVERAGE_LOW');
  for(const peer of peers){
   if(!peer||typeof peer.id!=='string'||!peer.id||peer.id===h.id||peerIds.has(peer.id)||
      !Number.isFinite(peer.rating)||peer.rating<RATING_MIN||peer.rating>RATING_MAX||
      stamp(peer.rating_asof_utc)===null||stamp(peer.rating_asof_utc)>=t){
    issues.push('INVALID_HISTORICAL_PEER');continue;
   }
   peerIds.add(peer.id);ratings.push(peer.rating);
  }
  if(peers.length>item.field_size-1)issues.push('MORE_PEERS_THAN_FIELD');
  if(!issues.length){
   const sorted=ratings.slice().sort((a,b)=>b-a),upper=sorted.slice(0,Math.max(1,Math.ceil(sorted.length/4)));
   const strength=.70*median(ratings)+.30*median(upper);
   matched.push({race_id:item.historical_race_id,date:historicalDate,peer_count:ratings.length,
    historical_field_size:item.field_size,opposition_rating:strength});
  }else problems.push(...issues);
 }
 matched.sort((a,b)=>b.date.localeCompare(a.date));
 // 2+ genuinely matched historical meetings, not just unrelated data.
 if(matched.length<2)problems.push('TOO_FEW_MATCHED_HISTORICAL_RACES');
 return {ok:problems.length===0,problems:[...new Set(problems)],matched:matched.slice(0,5)};
}
function residuals(values,classes){
 const n=values.length,mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
 const v0=mean(values),c0=mean(classes),v=values.map(x=>x-v0),c=classes.map(x=>x-c0);
 const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
 const cvar=dot(c,c);
 const beta=cvar>1e-9?dot(v,c)/cvar:0;
 const raw=v.map((x,i)=>x-beta*c[i]);
 const vstd=Math.sqrt(dot(v,v)/n);
 return raw.map(x=>vstd>1e-9?Math.max(-1,Math.min(1,x/vstd)):0);
}
function applyToField(rows,evidence,{strength=STRENGTH}={}){
 if(!(Number.isFinite(strength)&&strength>=0&&strength<=STRENGTH))throw Error('Unregistered opposition adjustment size');
 if(!Array.isArray(rows)||rows.length<2||evidence.length!==rows.length)throw Error('Complete field and matched evidence required');
 const n=rows.length,u=Model.CONFIG.uniformReserve,T=Model.CONFIG.temperature;
 const q=evidence.map(x=>x.difficulty),c=rows.map(x=>x.grade_quality);
 if(q.some(x=>!Number.isFinite(x))||c.some(x=>!Number.isFinite(x)||x<=0))
  throw Error('Incomplete comparable opponent and L5 class inputs');
 const resid=residuals(q,c),weights=rows.map((x,i)=>{
  const p=x.p_exact/100,base=(p-u/n)/(1-u);
  if(!(base>0&&Number.isFinite(base)))throw Error('Invalid original L5 probability');
  return base*Math.exp(strength*resid[i]/T);
 });
 const sum=weights.reduce((a,b)=>a+b,0);
 const results=rows.map((x,i)=>({id:x.id,horse:x.horse,race_id:x.race_id,
  baseline_pct:x.p_exact,shadow_pct:100*(u/n+(1-u)*weights[i]/sum),
  opponent_difficulty:q[i],independent_residual:resid[i],delta_logit:strength*resid[i]}));
 if(Math.abs(results.reduce((s,x)=>s+x.shadow_pct,0)-100)>1e-9)
  throw Error('Whole-field normalization failed');
 if(strength===0&&results.some(x=>Math.abs(x.shadow_pct-x.baseline_pct)>1e-8))
  throw Error('Zero strength must reproduce identical L5');
 return results.sort((a,b)=>b.shadow_pct-a.shadow_pct||a.id.localeCompare(b.id));
}

/* Cross-runner historical source agreement: same historical race must not
 * claim impossible contradictory field sizes/finish positions/peer ratings.
 * A real dead heat requires a separate verifiable source; abstain here.
 */
function crossFieldConflicts(evidences){
 const historical=new Map(),bad=new Set();
 for(const row of evidences||[]){
  for(const x of Array.isArray(row?.historical_races)?row.historical_races:[]){
   const id=x?.historical_race_id;
   if(typeof id!=='string'||!id)continue;
   const current={runner_id:row.runner_id,finish:x.finish,field:x.field_size,
    date:x.historical_race_date,venue:canon(x.venue),rating_scale:x.rating_scale,
    peerRatings:new Map((Array.isArray(x.opponents)?x.opponents:[]).filter(p=>p&&typeof p.id==='string').map(p=>[p.id,p.rating]))};
   if(!historical.has(id)){historical.set(id,[current]);continue;}
   for(const prior of historical.get(id)){
    const mismatch=prior.field!==current.field||prior.date!==current.date||
     prior.venue!==current.venue||prior.rating_scale!==current.rating_scale||
     prior.finish===current.finish&&prior.runner_id!==current.runner_id;
    const peerConflict=[...current.peerRatings].some(([peer,v])=>prior.peerRatings.has(peer)&&prior.peerRatings.get(peer)!==v);
    if(mismatch||peerConflict){bad.add(prior.runner_id);bad.add(current.runner_id);}
   }
   historical.get(id).push(current);
  }
 }
 return bad;
}

function evaluate(card,baseline,manifest,asOfUtc){
 if(!card||!validDate(card.date)||!baseline||!Array.isArray(baseline.records))
  throw Error('Dated V5 racecard and its unchanged L5 calculation required');
 const asOf=stamp(asOfUtc);if(asOf===null)throw Error('UTC pre-race research cutoff required');
 const ready=manifest&&manifest.schema===SCHEMA&&manifest.target_date===card.date&&
  Array.isArray(manifest.runner_evidence)&&manifest.rating_scale&&manifest.method===METHOD;
 const root={schema:SCHEMA,model:Model.VERSION,race_date:card.date,
  provisional_only:true,calibration_established:false,source_authenticity_independently_verified:false,
  promotion_approved:false,strength:STRENGTH,results:[]};
 if(!ready)return {...root,status:'NO_COMPARABLE_SOURCE_DATA',
  results:card.races.map(r=>({race_id:r.id,status:'L5_UNCHANGED_MISSING_OPPONENT_DATA',leader_changed:false}))};
 const byId=new Map(card.runners.map(h=>[h.id,h]));
 const candidateById=new Map(),duplicate=new Set();
 const historicConflicts=crossFieldConflicts(manifest.runner_evidence);
 for(const e of manifest.runner_evidence){
  if(candidateById.has(e.runner_id))duplicate.add(e.runner_id);
  candidateById.set(e.runner_id,e);
 }
 for(const race of card.races){
  const l5=baseline.records.filter(x=>x.race_id===race.id).sort((a,b)=>a.rank-b.rank);
  const original=l5[0],start=stamp(manifest.race_starts_utc?.[race.id]);
  const reasons=[];
  if(l5.length<2||!original||start===null||asOf>=start)reasons.push('BAD_OR_ALREADY_STARTED_RACE');
  const checked=[];
  for(const h of l5){
   const horse=byId.get(h.id),e=candidateById.get(h.id);
   if(!horse||!e||duplicate.has(h.id)){reasons.push('MISSING_OR_DUPLICATE_RUNNER_EVIDENCE');continue;}
   if(historicConflicts.has(h.id)){reasons.push('CONTRADICTORY_SHARED_HISTORICAL_RACE');continue;}
   const v=recordCheck({h:horse,row:e,targetDate:card.date,asOf,sourceStart:start,scale:manifest.rating_scale});
   if(!v.ok)reasons.push(...v.problems);
   else{
    const group=v.matched;let total=0,weight=0;
    group.forEach((x,i)=>{const w=Math.pow(.82,i);total+=w*x.opposition_rating;weight+=w;});
    checked.push({id:h.id,difficulty:total/weight});
   }
  }
  const unique=[...new Set(reasons)];
  if(unique.length){
   root.results.push({race_id:race.id,status:'L5_UNCHANGED_INCOMPLETE_EVIDENCE',
    reason_codes:unique,leader_changed:false,original_leader_id:original?.id||null});
   continue;
  }
  const aligned=l5.map(h=>checked.find(x=>x.id===h.id));
  const current=applyToField(l5,aligned);
  const oldLeader=l5[0];
  root.results.push({race_id:race.id,status:'OPPONENT_SHADOW_ONLY',
   original_leader_id:oldLeader.id,shadow_leader_id:current[0].id,
   leader_changed:oldLeader.id!==current[0].id,field_size:l5.length,
   forecast:current,method:METHOD,
   caveat:'Not a certified source, model improvement or independently validated win probability.'});
 }
 root.comparable_races=root.results.filter(x=>x.status==='OPPONENT_SHADOW_ONLY').length;
 root.status=root.comparable_races?'SHADOW_FORECAST_REQUIRES_SOURCE_ATTESTATION':'NO_COMPARABLE_SOURCE_DATA';
 root.evidence_sha256=crypto.createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
 return root;
}
module.exports={SCHEMA,METHOD,STRENGTH,savedStarts,recordCheck,crossFieldConflicts,residuals,applyToField,evaluate};
