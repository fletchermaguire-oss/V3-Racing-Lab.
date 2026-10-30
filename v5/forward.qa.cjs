'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),F=require('./forward.js');
const Empty=require('./prospective-record.json');
const d=JSON.parse(JSON.stringify(Empty));
const sha='a'.repeat(40);
function verified(){
 const x=JSON.parse(JSON.stringify(Empty));
 x.status='VERIFIED_FORWARD_TRACKING';x.independent_freeze_verified=true;
 x.freeze_proof={sha:sha,url:'https://github.com/user/repository/commit/'+sha,committed_at_utc:'2026-10-31T00:41:00Z'};
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
 z=copy();z.official_results=[{race_id:'2026-10-31_RANDWICK_R08',winner_id:'2026-10-31_RANDWICK_R08_06',
   status:'OFFICIALLY_VERIFIED',official_url:'https://example.com/result',
   verified_at_utc:'2026-10-31T04:00:00Z'}];
 assert.throws(()=>F.summarize(z),/pre-start/);
 z=copy();z.independent_freeze_verified=false;assert.equal(F.summarize(z).completed,0);
});


test('duplicate research ranks cannot inflate forward Top 5/10/15 records',()=>{
 const x=verified();
 x.locked_selections.push({
  ...x.locked_selections[0],
  runner_id:'2026-10-31_FLEMINGTON_R02_04',
  race_id:'2026-10-31_FLEMINGTON_R02',
  rank:1
 });
 assert.throws(()=>F.summarize(x),/Invalid, duplicated/);
 x.locked_selections[1].rank=2;
 assert.equal(F.summarize(x).locked,2,'distinct locked ranks across races are permitted');
});
test('prospective record refuses non-boolean verification markers and malformed winner identities',()=>{
 const copy=x=>JSON.parse(JSON.stringify(x));
 const base=verified();
 let x=copy(base);
 x.independent_freeze_verified='true';
 assert.throws(()=>F.summarize(x),/Unrecognized prospective/);
 x=copy(base);
 x.official_results=[{
  race_id:'2026-10-31_RANDWICK_R08',
  winner_id:'2026-10-31_RANDWICK_R08_06junk',
  status:'OFFICIALLY_VERIFIED',
  official_url:'https://example.com/official-results',
  verified_at_utc:'2026-10-31T08:00:00Z',
  verified:true
 }];
 assert.throws(()=>F.summarize(x),/Unmatched/);
 x.official_results[0].winner_id='2026-10-31_RANDWICK_R08_06';
 x.official_results[0].verified='true';
 assert.throws(()=>F.summarize(x),/Unmatched/);
 x.official_results[0].verified=false;
 assert.throws(()=>F.summarize(x),/Unmatched/);
 x.official_results[0].verified=true;
 assert.equal(F.summarize(x).completed,1);
});


test('legacy locking automation is manual only and cannot regenerate researched Top 10',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const workflow=fs.readFileSync(path.join(__dirname,'..','.github','workflows','saturday-top10-lock.yml'),'utf8');
 const scriptPath=path.join(__dirname,'..','scripts','lock-top10.cjs');
 const source=fs.readFileSync(scriptPath,'utf8');
 require('node:child_process').execFileSync(process.execPath,['--check',scriptPath]);
 assert.match(workflow,/workflow_dispatch:/);
 assert.doesNotMatch(workflow,/\b(?:schedule|cron):/);
 assert.doesNotMatch(workflow,/picks\.sort|board\.selections\s*=/);
 assert.match(source,/ranks\.has\(r\.rank\)/);
 assert.match(source,/sort\(\(a,b\)=>a\.rank-b\.rank\)/);
 assert.match(source,/finalFieldCheckAt/);
 assert.match(source,/race_start_source/);
 assert.match(source,/Ascot scratching deadline/);
 assert.doesNotMatch(source,/valid\.slice\(0,10\)|predicted_win_pct-a\.predicted_win_pct/);
});


test('GitHub commit proof must follow the snapshot creation and precede the scheduled jump',()=>{
 const x=verified();
 assert.equal(F.summarize(x).locked,1,'real workflow creates file before GitHub commits it');
 const tooEarly=JSON.parse(JSON.stringify(x));
 tooEarly.freeze_proof.committed_at_utc='2026-10-31T00:39:59Z';
 assert.throws(()=>F.summarize(tooEarly),/Invalid, duplicated, after-start/,'a proof cannot predate the actual lock content');
 const tooLate=JSON.parse(JSON.stringify(x));
 tooLate.freeze_proof.committed_at_utc='2026-10-31T05:00:00Z';
 assert.throws(()=>F.summarize(tooLate),/Invalid, duplicated, after-start/,'a post-jump proof is not a pre-race forecast');
 const badLock=JSON.parse(JSON.stringify(x));
 badLock.locked_selections[0].locked_at_utc='2026-10-31T00:41:01Z';
 assert.throws(()=>F.summarize(badLock),/Invalid, duplicated, after-start/);
});
