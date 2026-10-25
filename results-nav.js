/* Racing Lab sidebar enhancement. Keeps existing pages intact. */
(function(){
 function install(){
  const compare=document.querySelector('.navbtn[data-page="compare"]');
  if(compare)compare.remove();
  const existing=document.getElementById('results-history-nav');
  if(existing)return;
  const first=document.querySelector('.navbtn[data-page]');
  if(!first)return;
  const b=document.createElement('button');
  b.id='results-history-nav';b.className='navbtn';b.type='button';
  b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18M7 16l4-5 4 2 5-8"/></svg><span>Results &amp; History</span>';
  b.addEventListener('click',function(){window.location.href='/results.html'});
  first.insertAdjacentElement('afterend',b);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
 new MutationObserver(function(){if(!document.getElementById('results-history-nav')||document.querySelector('.navbtn[data-page="compare"]'))install()}).observe(document.body,{childList:true,subtree:true});
})();
