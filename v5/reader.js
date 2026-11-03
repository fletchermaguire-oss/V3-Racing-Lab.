/* The research launcher opens the studio using the same formula and source. */
(function(){
'use strict';
function mount(){
 var link=document.getElementById('rlv5-permanent-link');
 if(link){link.textContent='V5 STUDIO';link.setAttribute('aria-label','Open V5 model studio');}
 var oaks=document.getElementById('rlv5-oaks-day-link');
 if(!oaks){
  oaks=document.createElement('a');
  oaks.id='rlv5-oaks-day-link';
  oaks.href='/v5/?tab=oaks';
  oaks.textContent='THU 5 NOV PICKS';
  oaks.setAttribute('aria-label','View provisional Flemington Oaks Day selections');
  oaks.style.cssText='position:fixed;right:12px;bottom:68px;z-index:2147483628;padding:10px 13px;border:1px solid #77f0c0;border-radius:999px;background:#172d2b;color:#b4f8da;font:bold 11px system-ui;text-decoration:none;box-shadow:0 4px 18px #0008';
  document.body.appendChild(oaks);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
