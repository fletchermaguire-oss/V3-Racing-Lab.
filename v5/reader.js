/* V5 reader compatibility shim.
 * Today / Races / Top 10 / Multi / Tools now link to all features directly;
 * the obsolete permanent Studio and Thursday picks overlays obscure mobile
 * navigation and must not be added again.
 */
(function(){
'use strict';
function removeObsoleteBubbles(){
 for(const id of ['rlv5-permanent-link','rlv5-oaks-day-link']){
  const n=document.getElementById(id);
  if(n)n.remove();
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',removeObsoleteBubbles,{once:true});
else removeObsoleteBubbles();
})();
