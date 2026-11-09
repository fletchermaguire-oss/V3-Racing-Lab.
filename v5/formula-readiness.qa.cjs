'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Input=require('./formula-source-integrity.cjs'),Gate=require('./release-gate-hardened.cjs'),Ready=require('./future-card-preflight.cjs');
function card(){
 const date='2026-11-14',races=[1,2].map(n=>({id:date+'_TEST_R0'+n,meeting:'TEST',race:n,distance_m:1200}));
 const runners=[0,1,2,3,4].map(i=>({id:'test-runner-'+i,race_id:races[i<3?0:1].id,horse:'Test '+i,
  status:'Declared',form:'10/11/2026 TEST 1200m (G), BM72: 2/10, PDF margin 0.5L'}));
 return {date,saved_at:'2026-11-13',races,runners,expected_inventory:{races:2,runners:5},publication:{approved:false}};
}
const going={TEST:'Good 4'};
test('explicit going, no fallback to Good 4',()=>{
 assert.equal(Input.check({card:card(),going}).ok,true);
 assert(Input.check({card:card(),going:{}}).issues.includes('NO_VERIFIED_GOING:TEST'));
});
test('date and inventory mismatch detected',()=>{
 let x=card();x.runners.pop();assert(Input.check({card:x,going}).issues.includes('EXPECTED_INVENTORY_MISMATCH'));
 x=card();x.runners[0].id=x.runners[1].id;assert(Input.check({card:x,going}).issues.includes('ORPHAN_DUPLICATE_RUNNER'));
});
test('result leakage blocked',()=>{
 const x=card();x.runners[0].finish_position=1;
 assert(Input.check({card:x,going}).issues.includes('POSTRACE_DATA_IN_SOURCE'));
});
test('run no model when source incomplete',()=>{
 const out=Ready.checkResearch({card:card(),going:{},model:{board:()=>{throw Error('should not run')}}});
 assert.equal(out.status,'BLOCKED_INCOMPLETE_SOURCE');
});
test('one independent main selection per race and properly normalized fields',()=>{
 const x=card(),mock={board:()=>({version:'V5-L5',sourceCount:5,activeCount:5,excludedCount:0,
  baseline:{races:x.races,records:x.runners.map((h,i)=>({...h,p_exact:[40,35,25,60,40][i]}))}})};
 const out=Ready.checkResearch({card:x,going,model:mock});
 assert.equal(out.status,'RESEARCH_ONLY_READY');
 assert.equal(out.top5.length,2);assert.equal(out.top5[0].horse,'Test 3');
});
test('invalid full-field probability fails model QA',()=>{
 const x=card(),bad={board:()=>({version:'V5-L5',sourceCount:5,activeCount:5,excludedCount:0,
  baseline:{races:x.races,records:x.runners.map((h,i)=>({...h,p_exact:25}))}})};
 assert.equal(Ready.checkResearch({card:x,going,model:bad}).status,'BLOCKED_MODEL_QA');
});
test('impossible dates and timezones fail strict release gate',()=>{
 assert.equal(Gate.parseStamp('2026-02-30T00:00:00Z'),null);
 assert.equal(Gate.parseStamp('2026-11-14T10:00:00+15:00'),null);
 assert.equal(Gate.validDate('2026-02-30'),false);
});
test('legacy publishing and future release gates are wired',()=>{
 const fs=require('node:fs');
 assert.match(fs.readFileSync('build-v5.js','utf8'),/LEGACY_BUILD_DISABLED/);
 assert.match(fs.readFileSync('scripts/v5-safe-build.cjs','utf8'),/release-gate-hardened/);
});

test('future-card staging never writes on a dry run or changes archives',()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const stage=require('../scripts/stage-current-card.cjs').stage;
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'v5-future-test-'));
 try{
  const x=card(),dir=path.join(root,'v5/cards',x.date);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'research.json'),JSON.stringify(x));
  fs.writeFileSync(path.join(dir,'going.json'),JSON.stringify(going));
  fs.writeFileSync(path.join(root,'v5/active-card.js'),'preserve original');
  const r=stage({checkout:root,cardPath:'v5/cards/'+x.date+'/research.json',
   goingPath:'v5/cards/'+x.date+'/going.json'});
  assert.equal(r.status,'DRY_RUN_ONLY');assert.equal(r.change_needed,true);
  assert.equal(fs.readFileSync(path.join(root,'v5/active-card.js'),'utf8'),'preserve original');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
