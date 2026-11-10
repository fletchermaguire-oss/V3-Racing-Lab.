'use strict';
/* Synthetic next-Saturday rehearsal; never creates actual 14 Nov selections.
 * Real card remains unverified and must not be published automatically.
 */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const Model=require('./model.js'),Preflight=require('./future-card-preflight.cjs');
const {stage}=require('../scripts/stage-current-card.cjs');
const day='2026-11-14';
function fixture(){
 const meetings=['TESTA','TESTB'];
 const races=meetings.map((meeting,i)=>({
  id:day+'_'+meeting+'_R0'+(i+1),meeting,race:i+1,distance_m:i===0?1200:1600
 }));
 const runners=races.flatMap((race,idx)=>[0,1,2,3].map(i=>({
  id:race.id+'_'+String(i+1).padStart(2,'0'),race_id:race.id,
  horse:'Synthetic '+race.meeting+' '+i,
  status:i===3?(idx===0?'SCRATCHED':'EMERGENCY'):'DECLARED',
  barrier:i+1,weight_kg:56+i,
  statistics:'Career 2-3-10; course 1-1-4; distance 1-2-5; Good 2-1-6; Soft 0-2-4; Heavy 0-0-0',
  form:'7/11/2026 TEST 1200m (G), BM72: 2/10, PDF margin 0.5L',
  historical_map:'Settled 4th 800m (7/11/2026)',risks:'Synthetic QA; not racing evidence'
 })));
 return {date:day,saved_at:'2026-11-11',races,runners,meetings:meetings.map(meeting=>({meeting})),
  expected_inventory:{races:races.length,runners:runners.length},publication:{approved:false}};
}
const going={TESTA:'Soft 5',TESTB:'Good 4'};
test('new Saturday explicit mixed going is used in every scenario and remains unapproved',()=>{
 const card=fixture(),preflight=Preflight.checkResearch({card,going,model:Model});
 assert.equal(preflight.status,'RESEARCH_ONLY_READY');
 const b=Model.board(card,{going});
 assert.equal(b.sourceCount,8);assert.equal(b.activeCount,6);assert.equal(b.excludedCount,2);
 assert.equal(b.baseline.races.find(r=>r.meeting==='TESTA').going,'Soft 5');
 assert.equal(b.baseline.races.find(r=>r.meeting==='TESTB').going,'Good 4');
 assert.equal(b.baseline.records.length,6);
 assert.ok(b.scenarios.every(s=>s.races.every(r=>r.sum===100)));
 assert.equal(b.publication_blocked,true);
 assert.equal(preflight.publication_approved,false);
 assert.equal(preflight.calibration_established,false);
});
test('new card missing going must fail preflight; default L5 board is NOT safe for validation',()=>{
 const card=fixture();
 assert.equal(Preflight.checkResearch({card,going:{TESTB:'Good 4'},model:Model}).status,
  'BLOCKED_INCOMPLETE_SOURCE');
 const implicit=Model.board(card); // Verify default behaviour we must not trust at publication gate.
 assert.equal(implicit.baseline.races.find(r=>r.meeting==='TESTA').going,'Good 4');
 assert.notEqual(implicit.baseline.races.find(r=>r.meeting==='TESTA').going,going.TESTA);
 const src=fs.readFileSync('scripts/v5-safe-build.cjs','utf8');
 assert.match(src,/New Saturday input\/going validation blocked/);
 assert.match(src,/r\.going,plannedGoing\[r\.meeting\]/);
});
test('future card can be staged locally, browser reads mixed going, archive route remains available',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'v5-e2e-'));
 try{
  const folder=path.join(root,'v5','cards',day),active=path.join(root,'v5','active-card.js');
  fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(active,'ORIGINAL_ARCHIVE_SELECTOR');
  fs.writeFileSync(path.join(folder,'research.json'),JSON.stringify(fixture()));
  fs.writeFileSync(path.join(folder,'going.json'),JSON.stringify(going));
  const call=write=>stage({checkout:root,cardPath:'v5/cards/'+day+'/research.json',
   goingPath:'v5/cards/'+day+'/going.json',write});
  assert.equal(call(false).status,'DRY_RUN_ONLY');
  assert.equal(fs.readFileSync(active,'utf8'),'ORIGINAL_ARCHIVE_SELECTOR');
  const staged=call(true);assert.equal(staged.status,'STAGED_LOCAL_NOT_DEPLOYED');
  const c=require(active);assert.equal(c.date,day);assert.equal(c.going.TESTA,'Soft 5');
  const src=fs.readFileSync(active,'utf8');
  const today={window:{location:{search:'?show=all'}}};
  vm.runInNewContext(src,today);assert.equal(today.window.RacingLabV5Card.date,day);
  assert.equal(today.window.RacingLabV5Card.going.TESTB,'Good 4');
  const archived={window:{location:{search:'?card=2026-10-31'}}};
  vm.runInNewContext(src,archived);
  assert.equal(archived.window.RacingLabV5Card.date,'2026-10-31');
  assert.equal(archived.window.RacingLabV5Card.research_url,'/v5/research.json');
  assert.equal(fs.readFileSync(path.join(folder,'research.json'),'utf8'),
    JSON.stringify(fixture()),'staging never modifies the research snapshot');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
test('scratching changes active inventory without rewriting research or making a tip',()=>{
 const card=fixture(),original=JSON.stringify(card),b=Model.board(card,{going});
 assert.equal(b.excludedCount,2);
 card.runners[0].status='SCRATCHED — official sheet';
 const changed=Preflight.checkResearch({card,going,model:Model});
 assert.equal(changed.status,'RESEARCH_ONLY_READY');
 const after=Model.board(card,{going});
 assert.equal(after.activeCount,b.activeCount-1);
 assert.equal(after.excludedCount,b.excludedCount+1);
 assert.equal(after.sourceCount,b.sourceCount);
 assert.equal(after.publication_blocked,true);
 assert.notEqual(JSON.stringify(card),original,'test mutated only synthetic copy');
});
