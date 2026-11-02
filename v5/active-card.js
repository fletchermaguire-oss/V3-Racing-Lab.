/* Explicit dated source selection. The 31 October archive stays unchanged. */
(function(root){
 'use strict';
 var archived=root.location&&/[?&]card=2026-10-31(?:&|$)/.test(root.location.search||'');
 var card=archived?{
  date:'2026-10-31',research_url:'/v5/research.json',live_refresh:true
 }:{
  date:'2026-11-03',research_url:'/v5/cards/2026-11-03/research.json',
  analysis_url:'/v5/cards/2026-11-03/analysis.json',live_refresh:false,
  source_label:'Feature Form PDFs · imported 2 November 2026'
 };
 if(typeof module==='object'&&module.exports)module.exports=card;
 else root.RacingLabV5Card=Object.freeze(card);
})(typeof window!=='undefined'?window:globalThis);
