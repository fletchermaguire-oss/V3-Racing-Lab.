'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Model=require('./model.js'),State=require('./site-state.js'),Diagnostic=require('./pace-class.js');
const Research=require('./research.json'),Overlay=require('./official-latest.json');
const Replay=require('./experiments/pace-class-shadow.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));
const d=State.applyOfficialOverlay(Research,Overlay);
function horse(race,horse){return d.runners.find(h=>h.race_id===race&&h.horse===horse);}
function run(race,horseName,going='Good 4'){
 const h=horse(race,horseName);
 assert.ok(h);
 return Diagnostic.inspect(d,{race_id:race,runner_id:h.id,going});
}
test('Flemington straight and pace class research uses original pre-race form without changing horse ranks',()=>{
 const original=copy(d);
 const r6='2026-10-31_FLEMINGTON_R06';
 const a=run(r6,'The Next Episode'),b=run(r6,'Satono Glow');
 assert.equal(a.schema,'v5-pace-class-diagnostic/v1');
 assert.equal(a.pressure.evidence_coverage,1);
 assert.equal(a.pressure.status,'POTENTIAL_TEMPO_PRESSURE');
 assert.equal(a.straight.applies,true);
 assert.equal(a.straight.history.starts,1);
 assert.equal(b.straight.history.starts,2);
 assert.equal(a.stress.length,5);
 assert.equal(a.stress[0].pct,7.53);
 assert.equal(b.stress[0].pct,22.21);
 assert.equal(a.stress[0].rank,5);
 assert.ok(a.flags.includes('SELECTED_RANK_SENSITIVE_TO_UNVERIFIED_TEMPO'));
 assert.equal(a.results_in_inputs,false);
 assert.equal(a.original_selection_unchanged,true);
 assert.deepEqual(d,original);
});
test('Lady Shenandoah is clearly class-sensitive; the model still must not automatically switch to Unleeshing',()=>{
 const r=run('2026-10-31_FLEMINGTON_R08','Lady Shenandoah');
 assert.equal(r.stress.find(x=>x.key==='baseline').rank,1);
 assert.equal(r.stress.find(x=>x.key==='conservative_class').rank,2);
 assert.ok(r.flags.includes('SELECTED_RANK_SENSITIVE_TO_CLASS_ASSUMPTION'));
 assert.ok(r.flags.includes('POTENTIAL_EARLY_PACE_CONTEST'));
 assert.ok(!r.straight.applies,'Flemington mile is not the straight-course sprint');
 assert.equal(r.model_coefficients_unchanged,true);
});
test('Ascot has no archived settling evidence; no pace estimate is invented',()=>{
 const r=run('2026-10-31_ASCOT_R08','Immortal Bliss');
 assert.equal(r.pressure.known_runners,0);
 assert.equal(r.pressure.evidence_coverage,0);
 assert.equal(r.pressure.front_share,null);
 assert.equal(r.pressure.status,'INSUFFICIENT_HISTORICAL_SETTLING');
 assert.ok(r.flags.includes('HISTORICAL_PACE_EVIDENCE_INCOMPLETE'));
 assert.equal(r.stress[0].pct,r.stress.find(x=>x.key==='strong_pace').pct);
});
test('dated Flemington straight results only: post-start edits cannot inflate historical form',()=>{
 const h=copy(horse('2026-10-31_FLEMINGTON_R06','Satono Glow'));
 const orig=Diagnostic.straightStarts(h,Date.parse('2026-10-31T00:00:00Z'));
 h.form+='\n31/10/2026 FLEMINGTON 1200m (G), OPEN Group G1: 1/14, PDF margin 4.1L';
 h.form+='\n07/11/2026 FLEMINGTON 1200m (G), OPEN Group G1: 1/14, PDF margin 2.5L';
 assert.deepEqual(Diagnostic.straightStarts(h,Date.parse('2026-10-31T00:00:00Z')),orig);
 assert.equal(orig.starts,2);
});
test('no post-race winner, result or price changes score: stress diagnostic is market blind',()=>{
 const x=copy(d),r='2026-10-31_FLEMINGTON_R06',h=horse(r,'Satono Glow');
 const original=Diagnostic.inspect(x,{race_id:r,runner_id:h.id,going:'Good 4'});
 x.results=[{horse:'The Next Episode',winner:true}];
 x.runners.forEach(z=>{z.decimal_odds=1.02;z.finish_position=1;z.market_price=100;});
 assert.deepEqual(Diagnostic.inspect(x,{race_id:r,runner_id:h.id,going:'Good 4'}),original);
 assert.throws(()=>Diagnostic.inspect(x,{race_id:r,runner_id:'UNKNOWN',going:'Good 4'}),/outside this race/);
 assert.throws(()=>Diagnostic.inspect(x,{race_id:r,runner_id:h.id,going:'Bog 12'}),/Unknown going/);
});
test('shadow log-loss and Brier score all 22 unchanged-field races with fixed hypotheses only',()=>{
 const x=Replay.run();
 assert.equal(x.clean_races,22);
 assert.equal(x.excluded_field_mismatch_races.length,7);
 assert.equal(x.model_coefficients_updated,false);
 assert.equal(x.training_or_model_selection_prohibited,true);
 assert.equal(x.scenarios.length,5);
 assert.deepEqual(x.scenarios.map(v=>v.leader_wins),[7,7,7,5,5]);
 const baseline=x.scenarios[0],strong=x.scenarios[1],low=x.scenarios[3];
 assert.ok(baseline.mean_log_loss<low.mean_log_loss);
 assert.ok(strong.mean_log_loss<baseline.mean_log_loss);
 assert.ok(x.scenarios.every(v=>v.mean_multiclass_brier>0&&v.mean_log_loss>0));
 assert.ok(x.caveats.some(s=>s.includes('not a prospective test')));
});
test('production model coefficient and published 31 October outcomes remain frozen',()=>{
 const out=require('./shortlists/2026-10-31-results.json');
 assert.equal(Model.CONFIG.weights.class,0.55);
 assert.equal(Model.CONFIG.conservativeClass,0.28);
 assert.deepEqual(out.cohorts.map(x=>x.wins),[3,4,4]);
 assert.equal(out.results.find(x=>x.horse==='Satono Glow').finish_position,13);
 const fs=require('node:fs'),path=require('node:path');
 const diagnostic=fs.readFileSync(path.join(__dirname,'pace-class.js'),'utf8');
 assert.doesNotMatch(diagnostic,/postrace-review\.json|2026-10-31-results\.json|results-record\.json/);
});
