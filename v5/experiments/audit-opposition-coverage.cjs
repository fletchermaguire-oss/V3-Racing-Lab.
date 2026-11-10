'use strict';
/* Source-only audit. No winner lists or post-race features can enter. */
const cards=[
 require('../backtests/2026-10-17-retrospective.json').input,
 require('../backtests/2026-10-24-retrospective.json').input,
 require('../research.json'),
 require('../cards/2026-11-03/research.json')
];
function audit(){
 const entries=cards.map(card=>{
  const runners=card.runners||[];
  const hasLinked=h=>(Array.isArray(h.historical_opponent_ratings)&&h.historical_opponent_ratings.length>0)||
   (Array.isArray(h.historical_opponents)&&h.historical_opponents.length>0)||
   (Array.isArray(h.historical_starts)&&h.historical_starts.some(s=>Array.isArray(s.opponent_ratings)&&s.opponent_ratings.length>0));
  return {date:card.date,snapshot:card.saved_at||null,runner_entries:runners.length,
   runners_with_structured_historical_opponents:runners.filter(hasLinked).length};
 });
 const total=entries.reduce((s,x)=>s+x.runner_entries,0),linked=entries.reduce((s,x)=>s+x.runners_with_structured_historical_opponents,0);
 return {schema:'racing-lab-l5-opponent-source-coverage/v1',status:'SOURCE_AUDIT_NOT_BACKTEST',
  dates:entries,runner_entries:total,linked_rating_entries:linked,
  missing_entries:total-linked,model_coefficients_changed:false,
  notes:'This checks linked historical opponent ratings, not class labels or inferred rival quality. Provenance and cross-jurisdiction rating comparability remain unverified.'};
}
if(require.main===module)console.log(JSON.stringify(audit(),null,2));
module.exports={audit};
