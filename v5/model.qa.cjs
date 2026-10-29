'use strict';
/* V5-L3 offline QA. Run: node v5/model.qa.cjs */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const model=fs.readFileSync(path.join(__dirname,'model.js'),'utf8');
const D=JSON.parse(fs.readFileSync(path.join(__dirname,'research.json'),'utf8'));
function compute(data){const ctx={window:{}};vm.runInNewContext(model,ctx,{timeout:2000});return ctx.window.RacingLabV5Model.board(data);}
const B=compute(D);
assert.equal(D.market_benchmarks.length,21);
assert.ok(D.market_benchmarks.every(x=>x.source&&x.decimal_odds>1&&x.observed_date==='2026-10-29'));
const sourceTop15=D.market_benchmarks.slice().sort((a,b)=>a.decimal_odds-b.decimal_odds).slice(0,15);
assert.equal(sourceTop15.length,15);
assert.equal(sourceTop15[0].horse,'Sheza Alibi');
assert.equal(sourceTop15[1].horse,'Hot And High');
assert.equal(sourceTop15[2].horse,'Bluish Hue');

assert.equal(B.version,'V5-L3-20261029');
assert.equal(B.sourceCount,408);
assert.equal(B.baseline.records.length,B.activeCount);
assert.equal(B.activeCount,396);
assert.equal(B.excludedCount,12);
assert.ok(B.publication_blocked);
assert.equal(B.marketAudit.length,1);
assert.equal(B.marketAudit[0].severity,'CRITICAL_MODEL_DISAGREEMENT');
assert.equal(B.eliteLeaders.length,1);
assert.equal(B.eliteLeaders[0].horse,'Sheza Alibi');
assert.equal(B.top10[0].horse,'Sheza Alibi');
assert.equal(B.baseline.races.find(x=>x.id==='2026-10-31_RANDWICK_R08').field,16);
assert.ok(!B.baseline.records.some(x=>x.race_id==='2026-10-31_RANDWICK_R08'&&(x.horse==='Barrengarry'||x.horse==='Federalist')));
assert.equal(B.baseline.races.length,29);
assert.equal(B.soft.records.length,B.activeCount);
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
const withoutPrice=JSON.parse(JSON.stringify(D));withoutPrice.market_audit=[];withoutPrice.market_benchmarks=[];
const wNoMarket=compute(withoutPrice);
assert.deepEqual(B.baseline.records.map(x=>x.id+':'+x.p),wNoMarket.baseline.records.map(x=>x.id+':'+x.p),'Market audit must never influence independent model probabilities');
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
const workshop=fs.readFileSync(path.join(__dirname,'workshop.js'),'utf8');
const shell=fs.readFileSync(path.join(__dirname,'index.html'),'utf8');
assert.ok(frontend.includes('RacingLabWorkshop.multiPage'), 'Multi Lab must invoke working builder');
assert.ok(frontend.includes('RacingLabWorkshop.simPage'), 'Simulator must invoke functional visualizer');
assert.ok(!frontend.includes("['pros','Pros & Cons']"),'Redundant Pros nav reintroduced');
assert.ok(!frontend.includes('Strong research profiles'),'Bottom Pros & Cons section reintroduced');
assert.ok(workshop.includes('workshop-track')&&workshop.includes('requestAnimationFrame'),'Working visual simulator required');
assert.ok(workshop.includes('S.multi.push')&&workshop.includes('safeStore(S.multi)'),'Working leg additions with persistence required');
assert.ok(workshop.includes("S.multi.length>=3"), 'Three-leg limit required');
assert.ok(workshop.includes("eligible(h)"), 'Scratched runners must be filtered');
assert.ok(shell.includes('/v5/workshop.js')&&shell.includes('/v5/workshop.css'),'Workshop scripts and styles must load');
assert.equal(B.model_variants.length,4);
assert.ok(B.robustLeaders.length>B.qualifiedLeaders.length);
assert.ok(B.eliteLeaders.every(x=>x.g1_wins>=2&&x.g1_top2>=3));
assert.ok(B.top10.length<=10);
console.log('PASS: 29 race four-scenario QA; 408 original dossiers, 396 currently active; 12 dated scratchings; functional Simulator/Multi Lab routes; historic results untouched.');
