'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Gate=require('./field-gate.js'),Lock=require('./lock-proposal.js');
const State=require('./site-state.js'),Model=require('./model.js');
const Data=require('./research.json'),Overlay=require('./official-latest.json');
const List=require('./shortlists/current.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const data=State.applyOfficialOverlay(Data,Overlay);
const raceId='2026-10-31_FLEMINGTON_R06';
const eligible=data.runners.filter(x=>x.race_id===raceId&&Gate.eligible(x));
const excluded=data.runners.filter(x=>x.race_id===raceId&&!Gate.eligible(x));
const report=()=>({schema:Gate.SCHEMA,race_date:data.date,races:[{
 race_id:raceId,source_type:'OFFICIAL_COMPLETE_STARTER_LIST',
 official_starters_url:'https://example.org/official-complete-starters',
 source_published_at:'2026-10-31T00:00:00Z',checked_at:'2026-10-31T00:05:00Z',
 human_reviewed_at:'2026-10-31T00:10:00Z',human_reviewed:true,reviewed_by:'Human reviewer',
 race_start_at:'2026-10-31T05:00:00Z',active_runner_ids:eligible.map(x=>x.id)
}]});
const satono=data.runners.find(h=>h.race_id===raceId&&h.horse==='Satono Glow');
test('all 29 saved 31 October fields stay explicitly unverified, never certified from official scratchings alone',()=>{
 const a=Gate.assess(data,null,{selected:[{id:satono.id,race_id:raceId}]});
 assert.equal(a.races.length,29);
 assert.equal(a.release_eligible_races,0);assert.equal(a.withheld_races,29);
 assert.equal(a.final_fields_approved,false);
 assert.equal(a.selected[0].release_eligible,false);
 assert.ok(a.selected[0].field_flags.includes('NO_FULL_STARTER_SOURCE'));
 const b=Gate.assess(data,Overlay);
 assert.equal(b.release_eligible_races,0);
 assert.ok(b.races.every(x=>x.flags.includes('ATTESTATION_SCHEMA_OR_DATE_INVALID')));
});
test('a human-reviewed full official-starter manifest can reconcile a field without changing model or shortlist',()=>{
 const orig=Model.calculate(data,{default:'Good 4'}).records.filter(x=>x.race_id===raceId).map(x=>[x.horse,x.p]);
 const att=report(),before=clone(data),a=Gate.assess(data,att,{selected:[{id:satono.id,race_id:raceId}]});
 assert.equal(a.release_eligible_races,1);
 assert.equal(a.selected[0].status,'FIELD_CHECK_PASSED');
 assert.equal(a.races.find(x=>x.race_id===raceId).official_declared_count,eligible.length);
 assert.equal(a.final_fields_approved,false,'one race verified is not the whole meeting verified');
 assert.deepEqual(data,before);
 assert.deepEqual(Model.calculate(data,{default:'Good 4'}).records.filter(x=>x.race_id===raceId).map(x=>[x.horse,x.p]),orig);
});
test('an unaccounted emergency or missing runner blocks clearance even if selection remains active',()=>{
 const att=report();att.races[0].active_runner_ids.pop();
 let a=Gate.assess(data,att,{selected:[{id:satono.id,race_id:raceId}]});
 assert.equal(a.release_eligible_races,0);
 assert.ok(a.races.find(x=>x.race_id===raceId).flags.includes('SAVED_MODEL_RUNNER_NOT_IN_FINAL_FIELD'));
 const b=report();b.races[0].active_runner_ids.push('2026-10-31_FLEMINGTON_R06_99');
 a=Gate.assess(data,b);
 assert.equal(a.release_eligible_races,0);
 assert.ok(a.races.find(x=>x.race_id===raceId).flags.includes('OFFICIAL_STARTER_NOT_IN_SAVED_DOSSIERS'));
 const changed=clone(data);
 const newlyExcluded=changed.runners.find(h=>h.id===eligible[0].id);
 newlyExcluded.status='SCRATCHED — official test-only example';
 const c=report();
 a=Gate.assess(changed,c);
 assert.ok(a.races.find(x=>x.race_id===raceId).flags.includes('SAVED_EXCLUSION_ACTUALLY_STARTING'));
});
test('after-jump, undocumented, missing review or wrong-day certificates never clear a field',()=>{
 const cases=[
  a=>{a.races[0].checked_at='2026-10-31T05:00:00Z';},
  a=>{a.races[0].human_reviewed_at='2026-10-31T05:00:00Z';},
  a=>{a.races[0].source_published_at='2026-10-31T06:00:00Z';},
  a=>{a.races[0].official_starters_url='';},
  a=>{a.races[0].human_reviewed=false;},
  a=>{a.races[0].active_runner_ids.push(a.races[0].active_runner_ids[0]);},
  a=>{a.race_date='2026-11-07';}
 ];
 cases.forEach(fn=>{const a=report();fn(a);assert.equal(Gate.assess(data,a).release_eligible_races,0);});
});
test('a lock proposal refuses to create results, retrospective ranks, or any selection without explicitly approved ranks and final fields',()=>{
 const approval={explicit_user_approval:true,approved_at_utc:'2026-10-31T00:15:00Z',ranks:[7]};
 assert.throws(()=>Lock.prepare(data,List,null,approval,'2026-10-31T00:20:00Z'),/Cannot lock/);
 assert.throws(()=>Lock.prepare(data,List,report(),{...approval,explicit_user_approval:false},'2026-10-31T00:20:00Z'),/Explicit/);
 const x=Lock.prepare(data,List,report(),approval,'2026-10-31T00:20:00Z');
 assert.equal(x.status,'UNPUBLISHED_NOT_IN_FORWARD_RECORD');
 assert.equal(x.selected_count,1);
 assert.deepEqual(x.selections.map(s=>[s.rank,s.horse,s.race_id]),[[7,'Satono Glow',raceId]]);
 assert.equal(x.independently_verified,false);
 assert.equal(x.github_commit_proof,null);
 assert.throws(()=>Lock.prepare(data,List,report(),approval,'2026-10-31T05:00:01Z'),/Refusing post-jump/);
 assert.throws(()=>Lock.prepare(data,List,report(),{...approval,ranks:[1,7]},'2026-10-31T00:20:00Z'),/Cannot lock/);
});
test('the official archived field mismatch diagnostic is never used as attestation or input to lock proposals',()=>{
 const audit=require('./audits/2026-10-31-postrace-review.json');
 assert.equal(audit.mismatches.length,7);
 assert.equal(audit.summary.archived_pre_race_scenario.raw_model_leader_wins,7);
 const fs=require('node:fs');
 for(const path of ['./field-gate.js','./lock-proposal.js','./model.js'])
  assert.doesNotMatch(fs.readFileSync(require('node:path').join(__dirname,path),'utf8'),/require\(.+postrace-review|fetch\(.+postrace-review/);
});
