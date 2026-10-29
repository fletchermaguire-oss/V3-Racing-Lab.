/* Reuse the existing Racing Lab homepage, navigation and Results page. */
(function(global){
'use strict';
if(!global.RacingLabApp)return;
global.RacingLabV5State.load().then(function(C){
 global.RacingLabController=C;
 global.RacingLabApp.connectV5(C);
 global.RacingLabV5Dashboard.startRefresh(C);
}).catch(function(err){
 var root=document.getElementById('screen');root.replaceChildren();
 var p=document.createElement('p');p.textContent='Current formula could not load: '+err.message+'. Reload to retry.';root.append(p);
 var link=document.createElement('a');link.href='/results.html';link.textContent='Open Results & History';root.append(link);
});
})(window);
