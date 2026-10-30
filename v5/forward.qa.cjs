'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),F=require('./forward.js');
const Empty=require('./prospective-record.json');
const d=JSON.parse(JSON.stringify(Empty));
const sha='a'.repeat(40);
function verified(){
 const x=JSON.parse(JSON.stringify(Empty));
 x.status='VERIFIED_FORWARD_TRACKING';x.independent_freeze_verified=true;
 x.freeze_proof={sha:sha,url:'https://github.com/user/repository/commit/'+sha,committed_at_utc:'2026-10-31T00:30:00Z'};
 x.locked_selections=[{rank:1,race_id:'2026-10-31_RANDWICK_R08',runner_id:'2026-10-31_RANDWICK_R08_06',active_at_lock:true,
  locked_at_utc:'2026-10-31T00:40:00Z',race_at_utc:'2026-10-31T05:00:00Z',
  race_start_source:'https://example.com/races/2026-10-31/8'}];
 return x;
}
test('empty prospective ledger yields no completed or frozen selections; no retrospective win rate leaks in',()=>{
 const x=F.summarize(d);assert.equal(x.status,'NOT_YET_ELIGIBLE_FOR_FORWARD_STRIKE_RATE');
 assert.equal(x.completed,0);assert.deepEqual(x.groups.map(v=>v.win_rate),[null,null,null]);
});
test('claimed freeze without independent proof cannot report prospective wins',()=>{
 const x=verified();x.independent_freeze_verified=false;x.status='PRE_RACE_LOCK_CLAIMED';
 x.official_results=[];assert.equal(F.summarize(x).groups[0].completed,0);
});
test('only source-verified official winners count for a genuinely pre-race frozen selection',()=>{
 const x=verified();let result=F.summarize(x);
 assert.equal(result.locked,1);assert.equal(result.groups[0].pending,1);
 x.official_results=[{race_id:'2026-10-31_RANDWICK_R08',winner_id:'2026-10-31_RANDWICK_R08_06',
  status:'OFFICIALLY_VERIFIED',official_url:'https://www.racingaustralia.horse/FreeFields/Results.aspx?Key=X',
  verified_at_utc:'2026-10-31T07:00:00Z'}];
 result=F.summarize(x);assert.equal(result.completed,1);assert.equal(result.groups[0].wins,1);
 assert.equal(result.groups[0].win_rate,100);
 x.official_results[0].winner_id='2026-10-31_RANDWICK_R08_07';
 result=F.summarize(x);assert.equal(result.groups[0].wins,0);
});
test('post-race lock, missing published Git SHA, unknown race, or duplicate finish is rejected',()=>{
 const x=verified();
 const copy=()=>JSON.parse(JSON.stringify(x));
 let z=copy();z.locked_selections[0].locked_at_utc=z.locked_selections[0].race_at_utc;
 assert.throws(()=>F.summarize(z),/Invalid/);
 z=copy();z.freeze_proof.url='https://example.com/commit/fake';assert.throws(()=>F.summarize(z),/Missing GitHub commit/);
 z=copy();z.locked_selections[0].active_at_lock=false;assert.throws(()=>F.summarize(z),/Invalid/);
 z=copy();z.official_results=[{race_id:'UNLISTED',winner_id:'none',status:'OFFICIALLY_VERIFIED',
   official_url:'https://example.com/result',verified_at_utc:'2026-10-31T08:00:00Z'}];
 assert.throws(()=>F.summarize(z),/Unmatched/);
 z=copy();z.independent_freeze_verified=false;assert.equal(F.summarize(z).completed,0);
});
