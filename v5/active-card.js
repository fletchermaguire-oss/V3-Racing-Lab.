/* Explicit, source-dated racecard selector. Historical cards remain reachable. */
(function(root){
 'use strict';
 var q=root.location&&String(root.location.search||'')||'';
 var old31=/(?:[?&])card=2026-10-31(?:&|$)/.test(q);
 var old03=/(?:[?&])card=2026-11-03(?:&|$)/.test(q);
 var card=old31?{
   date:'2026-10-31',research_url:'/v5/research.json',live_refresh:true
 }:old03?{
   date:'2026-11-03',research_url:'/v5/cards/2026-11-03/research.json',
   analysis_url:'/v5/cards/2026-11-03/analysis.json',
   official_overlay_url:'/v5/cards/2026-11-03/official-20261102.json',
   live_refresh:false,source_label:'3 November original imported form archive'
 }:{
   date:'2026-11-14',research_url:'/v5/cards/2026-11-14/research.json',
   going:{SANDOWN:'Good 4',NEWCASTLE:'Good 4',DOOMBEN:'Soft 5',ASCOT:'Soft 5'},
   independent_shortlist_url:'/v5/cards/2026-11-14/independent-top15.json',
   official_research_only:true,live_refresh:false,
   source_label:'Friday 13 Nov official-form source · 40 races · 544 accepted entries · 56 scratched · 25 unactivated emergencies · final Saturday starters not certified'
 };
 if(typeof module==='object'&&module.exports)module.exports=card;
 else root.RacingLabV5Card=Object.freeze(card);
})(typeof window!=='undefined'?window:globalThis);
