'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Shortlist=require('./v5-1-reliability-shortlist.cjs');
const Rose=require('../cards/2026-11-07/rosehill-research.json');
const Ascot=require('../cards/2026-11-07/ascot-research.json');
const Official=require('../cards/2026-11-07/official-final.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const data=()=>[{meeting:'ROSEHILL',research:Rose},{meeting:'ASCOT',research:Ascot}];
const run=()=>Shortlist.build(data(),Official);
test('7 November candidate detects missing meeting and refuses to force 15 picks',()=>{
 const r=run();
 assert.equal(r.status,'EXPERIMENTAL_NOT_PUBLICATION_APPROVED');
 assert.equal(r.full_official_meeting_coverage,false);
 assert.equal(r.total_races,20);
 assert.equal(r.source_meetings.reduce((s,x)=>s+x.active_runners,0),197);
 assert.equal(r.qualified_races,10);
 assert.equal(r.flagged_races,10);
 assert.equal(r.tiers.top5.filled,5);
 assert.equal(r.tiers.top10.filled,10);
 assert.equal(r.tiers.top15.filled,10);
 assert.equal(r.tiers.top15.unfilled,5);
 assert.equal(r.publication_approved,false);
 assert.equal(r.pre_race_independently_frozen,false);
});
test('cross-meeting qualified shortlist is win-probability-first and one runner per race',()=>{
 const r=run();
 for(const tier of ['top5','top10','top15']){
  const rows=r.tiers[tier].selected;
  assert.equal(new Set(rows.map(x=>x.race_id)).size,rows.length);
  assert(rows.every(x=>x.screening_status==='MODEL_LEADER_ELIGIBLE_FOR_REVIEW'));
  assert(rows.every(x=>x.model_rank_in_race===1));
  assert(rows.every(x=>!x.win_probability_calibrated));
  assert(rows.every(x=>!x.official_start_certified));
  for(let i=1;i<rows.length;i++)assert(rows[i-1].model_pct>=rows[i].model_pct);
 }
});
test('Cashout flags remain explicit while known winners and losing favourites may still pass',()=>{
 const r=run();
 const cash=r.flagged_for_review.find(x=>x.horse==='CASHOUT');
 assert(cash);
 assert(cash.quality_issues.includes('THIN_PARSEABLE_RECENT_FORM'));
 assert(cash.quality_issues.includes('RECENT_FORM_DOMINATES_UNFAVOURABLE_CLASS_EVIDENCE'));
 const beatty=r.tiers.top10.selected.find(x=>x.horse==='BEATTY');
 assert(beatty);
 assert(beatty.sensitivity_warnings.includes('WIDE_GOING_CLASS_PROBABILITY_SPREAD'));
 assert(r.tiers.top10.selected.some(x=>x.horse==='SO SI GOD'));
 assert(r.tiers.top10.selected.some(x=>x.horse==='LET’S GO AGAIN'));
});
test('changing race order cannot change candidate shortlist or percentages',()=>{
 const original=run();
 const reversed=data().reverse().map(x=>({
  meeting:x.meeting,research:{...x.research,
   races:x.research.races.slice().reverse(),runners:x.research.runners.slice().reverse()}
 }));
 const changed=Shortlist.build(reversed,Official);
 assert.deepEqual(changed.tiers,original.tiers);
 assert.deepEqual(changed.ranked_all_race_leaders,original.ranked_all_race_leaders);
});
test('postrace outcome and bookmaker price fields do not change the shortlist',()=>{
 const d=data().map(x=>({meeting:x.meeting,research:clone(x.research)}));
 for(const card of d){
  card.research.post_race_winners=['SYNTHETIC'];
  card.research.runners.forEach(x=>{x.actual_winner=true;x.bookmaker_price=1.01;});
 }
 const changed=Shortlist.build(d,Official);
 const original=run();
 assert.deepEqual(changed.tiers,original.tiers);
 assert.deepEqual(changed.flagged_for_review,original.flagged_for_review);
});
test('date and active runner identity mismatch fail closed',()=>{
 const wrong=clone(Official);
 wrong.date='2026-11-08';
 assert.throws(()=>Shortlist.build(data(),wrong),/date mismatch/);
 const names=clone(Official);
 names.meetings.find(x=>x.meeting==='ASCOT').races[0].active_runners[0].horse='INVALID';
 assert.throws(()=>Shortlist.build(data(),names),/identity changed/);
});
