'use strict';
/* V5-L2 offline QA. Run: node v5/model.qa.cjs */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const model=fs.readFileSync(path.join(__dirname,'model.js'),'utf8');
const D=JSON.parse(fs.readFileSync(path.join(__dirname,'research.json'),'utf8'));
function compute(data){const ctx={window:{}};vm.runInNewContext(model,ctx,{timeout:2000});return ctx.window.RacingLabV5Model.board(data);}
const B=compute(D);
assert.equal(B.version,'V5-L2-20261029');
assert.equal(B.baseline.records.length,408);
assert.equal(B.baseline.races.length,29);
assert.equal(B.soft.records.length,408);
assert.equal(B.soft.races.length,29);
assert.equal(B.robustLeaders.length,29);
assert.equal(B.leaders.length,29);
assert.equal(B.screen.totalRaceCount,29);
assert.equal(B.screen.qualifiedRaceCount,B.qualifiedLeaders.length);
assert.equal(B.top10.length,Math.min(10,B.qualifiedLeaders.length));
for(const scenario of [B.baseline,B.soft,B.stress.goodClassConservative,B.stress.softClassConservative]){
  for(const r of scenario.races){
    assert.equal(r.sum,100,'Incorrect whole-field race sum: '+r.id);
    const runners=scenario.records.filter(x=>x.race_id===r.id);
    assert.equal(runners.length,r.field);
    assert.equal(runners[0].rank,1);
    assert.ok(runners.every(x=>Number.isFinite(x.p)&&x.p>0&&Number.isFinite(x.model_score)));
  }
}
// Every robust candidate is the most conservative choice of ALL runners for
// its race; a horse second in the Good 4 race must not be silently excluded.
for(const leader of B.robustLeaders){
  const field=B.baseline.records.filter(x=>x.race_id===leader.race_id);
  assert.equal(leader.robust_floor,Math.max(...field.map(x=>x.robust_floor)));
  assert.ok(leader.top1_scenarios>=0&&leader.top1_scenarios<=4);
  assert.ok(leader.completeness>=0&&leader.completeness<=1);
  assert.equal(leader.rank_scenarios.length,4);
}
assert.ok(B.robustLeaders.some(x=>x.rank!==1),
 'At least one stable alternative currently beats the Good 4 winner: regression guard');
for(const x of B.qualifiedLeaders)assert.equal(x.quality_flags.length,0);
for(const x of B.leaders){
  const field=B.baseline.records.filter(y=>y.race_id===x.race_id);
  assert.equal(x.p,Math.max(...field.map(y=>y.p)));
}
const swapped=JSON.parse(JSON.stringify(D));
swapped.runners.forEach(h=>{h.original_pick=!h.original_pick;});
const unpicked=compute(swapped);
const A=B.baseline.records.map(x=>x.id+':'+x.p.toFixed(2));
const Z=unpicked.baseline.records.map(x=>x.id+':'+x.p.toFixed(2));
assert.deepEqual(A,Z,'Qualitative original picks may never alter independent scoring');
const site=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.equal(site.includes("official:'Heavy 8'"),false,'Outdated 16 Oct Randwick official rating is appearing as current');
assert.ok(site.includes("Good 4 (working, 31 Oct)"));
const frontend=fs.readFileSync(path.join(__dirname,'dashboard.js'),'utf8');
assert.ok(frontend.includes('V5-L2'));
assert.ok(frontend.includes('ROBUST'));
assert.ok(frontend.includes('QUALIFIED'));
assert.ok(frontend.includes('riskTags'));
assert.equal(B.model_variants.length,4);
assert.ok(B.robustLeaders.length>B.qualifiedLeaders.length);
console.log('PASS V5-L2: 29 races / 408 runners, four scenario totals 100%, robust leader scans all runners, qualitative picks independent, stale Randwick weather guarded.');
