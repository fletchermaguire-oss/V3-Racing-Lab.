'use strict';
/*
 * Reproduce the 7 November V5.1 quality-gate shadow review.
 * No outcome data or odds are loaded; the saved 5 November form and
 * 7 November morning declarations are the only inputs.
 */
const Q=require('./v5-1-evidence-gate.cjs');
const Official=require('../cards/2026-11-07/official-final.json');
const inputs=[
 ['ROSEHILL',require('../cards/2026-11-07/rosehill-research.json')],
 ['ASCOT',require('../cards/2026-11-07/ascot-research.json')]
];
const cards=inputs.map(([meeting,data])=>Q.evaluate(data,Official,meeting,'Good 4'));
const output={
 schema:'v5-1-shadow-replay/v1',date:'2026-11-07',
 experimental:true,calibrated:false,outcomes_in_inputs:false,publication_approved:false,
 missing_meetings:['FLEMINGTON'],method:'Original V5-L5 model, reconciled official 7 Nov morning starter snapshot, evidence/robustness screening only',
 summary:{
  races:cards.reduce((n,c)=>n+c.screen.length,0),
  active_runners:cards.reduce((n,c)=>n+c.reconciliation.activeCount,0),
  eligible_for_human_review:cards.reduce((n,c)=>n+c.screen.filter(x=>x.screen_status==='MODEL_LEADER_ELIGIBLE_FOR_REVIEW').length,0),
  flagged_for_evidence_review:cards.reduce((n,c)=>n+c.screen.filter(x=>x.screen_status==='EVIDENCE_REVIEW_REQUIRED').length,0)
 },
 meetings:cards.map(c=>({
  meeting:c.meeting,official_checked_at:c.reconciliation.official_checked_at,
  source_date:c.reconciliation.original_source_date,
  active_runners:c.reconciliation.activeCount,
  scratched_or_removed:c.reconciliation.removed.length,
  races:c.screen
 }))
};
process.stdout.write(JSON.stringify(output,null,2)+'\n');
