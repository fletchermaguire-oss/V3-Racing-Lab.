/* The research launcher opens the studio using the same formula and source. */
(function(){
'use strict';
function mount(){
 var link=document.getElementById('rlv5-permanent-link');
 if(link){link.textContent='V5 STUDIO';link.setAttribute('aria-label','Open V5 model studio');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
