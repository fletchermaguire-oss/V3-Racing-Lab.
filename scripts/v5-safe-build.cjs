'use strict';
/* Published probabilities are not regenerated during a 31 October research-only release. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const raw=JSON.parse(fs.readFileSync('v5/research.json','utf8'));
const board=JSON.parse(fs.readFileSync('published-board.json','utf8'));
assert(html.includes('window.RacingLabApp'), 'Original homepage/engine missing');
assert(html.includes('/v5/reader.js'), 'V5 reader missing');
assert.equal(raw.schema,'racing-lab-v5-research/2026-10-29','Snapshot schema mismatch');
assert.equal(raw.date,'2026-10-31','Wrong research date');
assert.equal(raw.publication.approved,false,'Research must not publish predictions');
assert.equal(raw.races.length,29,'All 29 races required');
assert.equal(raw.runners.length,408,'All 408 PDF entries required');
assert.equal(raw.runners.filter(x=>x.original_pick).length,19,'Must preserve 19 qualitative leaders');
assert(!raw.runners.some(x=>Object.hasOwn(x,'win_probability')),'Do not publish unapproved win percentages');
assert.notEqual(board.publication?.status,'APPROVED','Stale previous meeting marked as approved');
assert(fs.existsSync('v5/index.html'),'Static no-JS research fallback missing');
assert(fs.existsSync('v5/reader.css')&&fs.existsSync('v5/reader.js'),'Missing V5 resources');
for(const page of ['index.html','v5/index.html']){
 const text=fs.readFileSync(page,'utf8');
 for(const asset of ['model.js','site-state.js','dashboard.js','workshop.js'])assert(text.includes('/v5/'+asset),'Missing shared runtime '+asset+' on '+page);
}
console.log('PASS: Existing racing shell and history preserved; shared V5 runtime; 29 races; 408 dossiers. Model estimates remain provisional and unapproved.');

/* 7 Nov 2026: publication integrity, not a date-driven tip generator.
 * A research checkpoint must never masquerade as a signed final Saturday board.
 * A proposed certified board must pass source, full field, going, and change audit.
 */
const readiness=JSON.parse(fs.readFileSync('v5/cards/2026-11-07/readiness.json','utf8'));
assert.equal(readiness.date,'2026-11-07','Saturday checkpoint is dated incorrectly');
assert.equal(readiness.total_races,29,'Saturday meeting inventory changed; verify new source before editing');
assert.equal(readiness.meetings.reduce((n,m)=>n+m.races,0),29,'Saturday race count mismatch');
const finalProposalFile='v5/cards/2026-11-07/final-proposal.json';
if(fs.existsSync(finalProposalFile)){
 const proposal=JSON.parse(fs.readFileSync(finalProposalFile,'utf8'));
 const gate=require('../v5/release-gate-hardened.cjs');
 assert.equal(proposal.date,readiness.date,'Final proposal/checkpoint mismatch');
 const audit=gate.assess(proposal,proposal.reviewed_as_of);
 assert(audit.certified_final_release,'No certified final V5 release: '+audit.blockers.join('; '));
 assert.equal(readiness.final_starters_verified,true,'Final starter checkpoint not approved');
 assert.equal(readiness.model_probabilities_ready,true,'Final model distributions not approved');
 assert.equal(readiness.winning_selections_frozen,true,'No independently frozen final predictions');
}else{
 assert.equal(readiness.status,'PRE_FINAL_RESEARCH_ONLY','Cannot mark Saturday final without a release proposal');
 assert.equal(readiness.final_starters_verified,false,'Source fields are not yet certified');
 assert.equal(readiness.model_probabilities_ready,false,'Do not claim approved full-field numbers');
 assert.equal(readiness.winning_selections_frozen,false,'Cannot claim pre-race freeze without proof');
}
console.log('PASS: 7 Nov source checkpoint / final-release barrier; no automatic winner or percentage promotion.');

const active=require('../v5/active-card.js');
if(active.date!=='2026-10-31'){
 const source=JSON.parse(fs.readFileSync('.'+active.research_url,'utf8'));
 assert.equal(source.date,active.date,'Active-card date mismatch');
 /* A new Saturday must be checked using its explicitly staged going.
  * Do not silently run all meetings under the model's Good 4 default.
  * The 3 Nov archived card keeps its separately verified historical overlay path.
  */
 const originalModel=require('../v5/model.js');
 const plannedGoing=active.date==='2026-11-03'?null:active.going;
 if(active.date!=='2026-11-03'){
  const preflight=require('../v5/future-card-preflight.cjs').checkResearch({
   card:source,going:plannedGoing,model:originalModel
  });
  assert.equal(preflight.status,'RESEARCH_ONLY_READY',
   'New Saturday input/going validation blocked: '+preflight.blockers.join('; '));
 }
 const model=originalModel.board(source,plannedGoing?{going:plannedGoing}:{});
 if(plannedGoing)model.baseline.races.forEach(r=>{
  assert.equal(r.going,plannedGoing[r.meeting],
   'Build validation going must match displayed active-card going: '+r.meeting);
 });
 assert.equal(model.raceCount,source.expected_inventory.races);
 assert.equal(model.sourceCount,source.expected_inventory.runners,'Complete listed inventory');
 assert.equal(model.activeCount+model.excludedCount,source.expected_inventory.runners,'Active plus excluded must match source inventory');
 assert(model.scenarios.every(s=>s.races.every(r=>r.sum===100)),'Active-card scenario distributions must total 100');
 assert.equal(source.publication.approved,false);
 for(const page of ['index.html','v5/index.html'])assert(fs.readFileSync(page,'utf8').includes('/v5/active-card.js'),'Dated source selector missing');
 console.log('PASS: Active '+source.date+' card; '+model.raceCount+' races; '+model.activeCount+' listed entries; ten full-field scenarios.');
}

/* Dynamic next-date final-release gate, without touching historical cards. */
if(active.date!=='2026-11-07'&&active.date!=='2026-10-31'){
 const proposalFile='v5/cards/'+active.date+'/final-proposal.json';
 if(fs.existsSync(proposalFile)){
  const proposal=JSON.parse(fs.readFileSync(proposalFile,'utf8'));
  const gate=require('../v5/release-gate-hardened.cjs');
  assert.equal(proposal.date,active.date,'Proposal does not match current card date');
  const audit=gate.assess(proposal,proposal.reviewed_as_of);
  assert(audit.certified_final_release,'Future release blocked: '+audit.blockers.join('; '));
 }
}
