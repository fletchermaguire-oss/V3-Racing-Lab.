/* Racing Lab conditional scratchings display. Does not modify model or simulator. */
(()=>{'use strict';if(window.__RL_SCRATCH_BRIDGE__)return;window.__RL_SCRATCH_BRIDGE__=true;
const E=window.RacingLabScratchings;if(!E){console.error('Scratchings engine not loaded');return;}
const normalize=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g,'');
let busy=false,signature='',lastFetch=0,feed=null;
async function refresh(){if(Date.now()-lastFetch<60000)return;lastFetch=Date.now();try{const r=await fetch('/data/verified-scratchings.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('feed '+r.status);feed=await r.json()}catch(e){feed=null;console.warn('No verified scratchings feed',e.message)}}
function label(node,msg){let el=node.querySelector('.rl-scratching-note');if(!el){el=document.createElement('div');el.className='rl-scratching-note';el.style.cssText='font-size:12px;color:#f8c45b;padding:8px 0';node.prepend(el)}if(el.textContent!==msg)el.textContent=msg}
function apply(){const board=document.querySelector('#screen .hu-board'),race=document.querySelector('[data-change="race-jump"]')?.value,data=window.RacingLabApp?.data||window.DATA;if(!board||!race||!data)return;const date=data.date;const fullId=date+'_'+race;const field=(data.records||[]).filter(x=>x.race===race&&Number.isFinite(Number(x.p)));if(!field.length)return;
const key=fullId+'|'+JSON.stringify(feed)+'|'+field.map(x=>x.name+':'+x.p).join(',');if(key===signature)return;signature=key;
const entry=feed?.races?.[fullId];if(!entry){label(board,'No verified scratching update for '+fullId+'. Displaying saved model percentages.');return}
let result;try{const scratches=E.verify({...entry,raceId:fullId},fullId,field.map(x=>x.name));result=E.update(field,scratches)}catch(e){label(board,'Scratching data rejected: '+e.message+'. Saved model unchanged.');return}
const lookup=new Map(result.runners.map(x=>[normalize(x.name),x.p]));const rows=[...board.querySelectorAll('.hu-runner')];for(const row of rows){const name=row.querySelector('.hu-name')?.textContent||'';const value=lookup.get(normalize(name));const pct=row.querySelector('.hu-pct');if(pct){pct.textContent=value===undefined?'SCRATCHED':value.toFixed(2)+'%';pct.style.opacity=value===undefined?'.5':'1'}const fill=row.querySelector('.hu-fill');if(fill)fill.style.width=value===undefined?'0%':Math.min(100,value/Math.max(...result.runners.map(x=>x.p))*100)+'%'}
const cards=[...document.querySelectorAll('#screen .ev2-card')];for(const card of cards){const name=card.querySelector('.ev2-head b')?.textContent||'';const value=lookup.get(normalize(name));const pct=card.querySelector('.ev2-p');if(pct)pct.textContent=value===undefined?'SCRATCHED':value.toFixed(2)+'%'}
label(board,'Verified scratchings as of '+entry.asOf+' · '+result.scratched.length+' removed · conditional normalization ONLY (not a model/pace rerun). Source: '+entry.sourceUrl);
}
async function tick(){if(busy)return;busy=true;try{await refresh();apply()}finally{busy=false}}
new MutationObserver(()=>{if(!busy)queueMicrotask(tick)}).observe(document.body,{subtree:true,childList:true});document.addEventListener('change',()=>{signature='';setTimeout(tick,100)});setInterval(()=>{signature='';tick()},60000);tick();
})();
