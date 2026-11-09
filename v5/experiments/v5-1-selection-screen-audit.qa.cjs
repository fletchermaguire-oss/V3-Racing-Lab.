'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Audit=require('./v5-1-selection-screen-audit.cjs');
test('screen audit includes all 31 Oct matched races and entire 7 Nov Rosehill/Ascot cards',()=>{
 const a=Audit.audit();
 assert.equal(a.status,'RETROSPECTIVE_AND_POST_OUTCOME_HYPOTHESIS_NOT_PROSPECTIVE');
 assert.equal(a.date_groups.length,3);
 assert.deepEqual(a.date_groups.map(x=>x.total.races),[22,10,10]);
 assert.equal(a.comparison.all.races,42);
 assert.equal(a.comparison.all.wins,14);
 assert.equal(a.comparison.eligible.races,21);
 assert.equal(a.comparison.eligible.wins,12);
 assert.equal(a.comparison.flagged.races,21);
 assert.equal(a.comparison.flagged.wins,2);
 assert.equal(a.results_used_for_scores_only,true);
});
test('missing old form cannot be presented as eligible prospective picks',()=>{
 const a=Audit.audit();
 assert(a.excluded_archives.some(x=>x.date==='2026-10-17'));
 assert(a.excluded_archives.some(x=>x.date==='2026-10-24'));
 assert(a.reasons.some(x=>x[0]==='LOW_DOCUMENTED_COMPLETENESS'));
 assert(a.reasons.some(x=>x[0]==='SMALL_MODEL_FIELD_GAP'));
});
