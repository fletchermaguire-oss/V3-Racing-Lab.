/* Racing Lab: deterministic scratching-aware conditional probability engine.
 * This is NOT a pace-adjusted model rerun. It is a transparent fallback only.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.RacingLabScratchings=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const norm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
 function update(field,scratchings){
  if(!Array.isArray(field)||!field.length)throw Error('No race field');
  if(!Array.isArray(scratchings))throw Error('Scratchings must be an array');
  const names=new Set();for(const h of field){if(!h.name||!Number.isFinite(Number(h.p))||Number(h.p)<0)throw Error('Invalid forecast runner');const k=norm(h.name);if(names.has(k))throw Error('Duplicate runner: '+h.name);names.add(k);}
  const scratched=new Set(scratchings.map(norm));for(const n of scratched)if(!names.has(n))throw Error('Unknown scratching: '+n);
  const remaining=field.filter(h=>!scratched.has(norm(h.name)));
  const total=remaining.reduce((s,h)=>s+Number(h.p),0);
  if(!remaining.length||total<=0)throw Error('No valid remaining field');
  const result=remaining.map(h=>({...h,p:Number((100*Number(h.p)/total).toFixed(4))}));
  return {runners:result,scratched:field.filter(h=>scratched.has(norm(h.name))).map(h=>h.name),method:'conditional-renormalization',modelRerun:false,paceReassessed:false,warning:'Conditional normalization only; not a fresh model forecast. Verify scratchings and reassess pace before publishing.'};
 }
 function verify(feed,raceId,knownNames){
  if(!feed||feed.raceId!==raceId||!Array.isArray(feed.scratchings)||!feed.sourceUrl||!/^https:\/\//.test(feed.sourceUrl)||!feed.asOf||Number.isNaN(Date.parse(feed.asOf)))throw Error('Missing race-specific, timestamped official scratching evidence');
  const set=new Set(knownNames.map(norm));for(const name of feed.scratchings)if(!set.has(norm(name)))throw Error('Scratching does not match race field: '+name);
  return feed.scratchings;
 }
 return {update,verify};
});
