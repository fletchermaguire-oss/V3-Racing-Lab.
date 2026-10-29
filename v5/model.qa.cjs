'use strict';
/* V5-L1 offline QA. Run: node v5/model.qa.cjs */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const model=fs.readFileSync(path.join(__dirname,'model.js'),'utf8');
const D=JSON.parse(fs.readFileSync(path.join(__dirname,'research.json'),'utf8'));
function compute(data){const ctx={window:{}};vm.runInNewContext(model,ctx,{timeout:2000});return ctx.window.RacingLabV5Model.board(data);}
const B=compute(D);
assert.equal(B.version,'V5-L1-20261029');
assert.equal(B.baseline.records.length,408);
assert.equal(B.baseline.races.length,29);
assert.equal(B.soft.records.length,408);
assert.equal(B.soft.races.length,29);
assert.equal(B.robustLeaders.length,29);
for(const scenario of [B.baseline,B.soft]){
  for(const r of scenario.races){
    assert.equal(r.sum,100,'Incorrect whole-field race sum: '+r.id);
    const runners=scenario.records.filter(x=>x.race_id===r.id);
    assert.equal(runners.length,r.field);
    assert.equal(runners[0].rank,1);
    assert.ok(runners.every(x=>Number.isFinite(x.p)&&x.p>0&&Number.isFinite(x.model_score)));
  }
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
assert.ok(frontend.includes('V5-L1'));
assert.ok(frontend.includes('ROBUST'));
console.log('PASS V5-L1: 29 races / 408 runners, Good and Soft totals 100%, saved picks independent, stale Randwick weather guarded.');
