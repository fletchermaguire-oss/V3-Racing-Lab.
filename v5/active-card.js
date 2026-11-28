/* Explicit, source-dated racecard selector. Historical cards remain reachable. */
(function(root){
 'use strict';
 var q=root.location&&String(root.location.search||'')||'';
 var old31=/(?:[?&])card=2026-10-31(?:&|$)/.test(q);
 var old03=/(?:[?&])card=2026-11-03(?:&|$)/.test(q);
 var old14=/(?:[?&])card=2026-11-14(?:&|$)/.test(q);
 var old21=/(?:[?&])card=2026-11-21(?:&|$)/.test(q);
 var card=old31?{
   date:'2026-10-31',research_url:'/v5/research.json',live_refresh:true
 }:old03?{
   date:'2026-11-03',research_url:'/v5/cards/2026-11-03/research.json',
   analysis_url:'/v5/cards/2026-11-03/analysis.json',
   official_overlay_url:'/v5/cards/2026-11-03/official-20261102.json',
   live_refresh:false,source_label:'3 November original imported form archive'
 }:old14?{
   date:'2026-11-14',research_url:'/v5/cards/2026-11-14/research.json',
   going:{SANDOWN:'Heavy 8',NEWCASTLE:'Soft 5',DOOMBEN:'Heavy 8',ASCOT:'Soft 5'},
   independent_shortlist_url:'/v5/cards/2026-11-14/independent-top15.json',
   official_research_only:true,live_refresh:false,
   source_label:'Saturday 14 November official scratching sheets · final fields not fully certified'
 }:old21?{
   date:'2026-11-21',research_url:'/v5/cards/2026-11-21/research.json',
   going:{"CRANBOURNE":"Good 4","KEMBLA GRANGE":"Good 4","ASCOT":"Good 4","SUNSHINE COAST":"Soft 5"},
   independent_shortlist_url:'/v5/cards/2026-11-21/independent-top15.json',
   official_research_only:true,live_refresh:false,source_label:'21 November · official R3 scratching/Soft5 · remainder provisional'
 }:{
   date:'2026-11-28',research_url:'/v5/cards/2026-11-28/research.json',
   going:{
    "SANDOWN-HILLSIDE":"Soft 6","ROSEHILL":"Good 4","DOOMBEN":"Soft 6","ASCOT":"Good 4",
    "MORPHETTVILLE PARKS":"Good 4","KEMBLA GRANGE":"Good 4","GOLD COAST":"Soft 6",
    "TOOWOOMBA":"Good 4","CEDUNA":"Good 4","GOONDIWINDI":"Good 4","HOME HILL":"Good 4",
    "KEMPSEY":"Soft 6","MT ISA":"Good 4","THANGOOL":"Good 4","WAGGA RIVERSIDE":"Soft 5","WOOLAMAI":"Heavy 8"
   },
   official_research_only:true,fields_only:true,live_refresh:false,
   source_label:'28 November · 16-meeting fields-only import · 12 Racing Australia and 4 Racing & Sports sources · no approved predictions'
 };
 if(typeof module==='object'&&module.exports)module.exports=card;
 else root.RacingLabV5Card=Object.freeze(card);
})(typeof window!=='undefined'?window:globalThis);
