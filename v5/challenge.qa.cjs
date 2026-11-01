'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Model=require('./model.js'),Challenge=require('./challenge.js'),State=require('./site-state.js');
const Data=require('./research.json'),Overlay=require('./official-latest.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const base=State.applyOfficialOverlay(Data,Overlay);
const race=(name,number)=>'2026-10-31_'+name+'_R'+String(number).padStart(2,'0');
const runner=(name,raceId)=>base.runners.find(x=>x.race_id===raceId&&x.horse===name);
const opts=(id,main,other,going='Soft 5')=>({race_id:id,incumbent_id:runner(main,id).id,
 challenger_id:runner(other,id).id,reported_going:going,source_type:'USER_OBSERVATION',
 rain_mm:3,observed_at:'2026-10-31T09:48:00+10:00',note:'Observed rain before event; official going not certified'});
function r6(){return opts(race('FLEMINGTON',6),'Satono Glow','The Next Episode');}
function r8(){return opts(race('FLEMINGTON',8),'Lady Shenandoah','Unleeshing');}
test('a timestamped user rain challenge flags The Next Episode before R6, not a retrospective winning pick',()=>{
 const before=clone(base),x=Challenge.compare(base,Model,r6());
 assert.equal(x.schema,'racing-lab-pre-race-challenge/v1');
 assert.equal(x.status,'REASSESSMENT_REQUIRED');
 assert.deepEqual(x.flags,[
  'CHALLENGER_HAS_MATERIAL_WET_FORM_EVIDENCE',
  'CHALLENGER_RELATIVE_SCENARIO_UPLIFT',
  'CHALLENGER_RANK_IMPROVES_ON_SCENARIO'
 ]);
 assert.equal(x.incumbent.good4_pct,22.21);
 assert.equal(x.incumbent.scenario_pct,20.73);
 assert.equal(x.challenger.good4_pct,7.53);
 assert.equal(x.challenger.scenario_pct,12.75);
 assert.equal(x.relative_shift_pp,6.7);
 assert.equal(x.challenger.wet_form.wins,4);
 assert.equal(x.challenger.wet_form.starts,5);
 assert.equal(x.rankings_untouched,true);
 assert.equal(x.result_status,'NOT_USED_OR_INFERRED');
 assert.deepEqual(base,before);
});
test('the rain challenger also correctly flags Unleeshing without auto-overturning Lady Shenandoah',()=>{
 const x=Challenge.compare(base,Model,r8());
 assert.equal(x.status,'REASSESSMENT_REQUIRED');
 assert.equal(x.challenger.wet_form.wins,3);
 assert.equal(x.challenger.wet_form.starts,4);
 assert.equal(x.incumbent.wet_form.wins,0);
 assert.equal(x.incumbent.wet_form.starts,5);
 assert.equal(x.incumbent.scenario_pct,20.08);
 assert.equal(x.challenger.scenario_pct,10.98);
 assert.ok(x.flags.includes('CHALLENGER_HAS_MATERIAL_WET_FORM_EVIDENCE'));
 assert.ok(x.action.includes('do NOT auto-swap'));
 assert.equal(x.review_timing,'RACE_START_TIME_NOT_VERIFIED');
});
test('evidence validation refuses mismatched fields, scratched runners, unsupported tracks or fake official sources',()=>{
 const id=race('FLEMINGTON',6),x=r6();
 assert.throws(()=>Challenge.compare(base,Model,{...x,incumbent_id:x.challenger_id}),/different challenger/);
 const j=clone(x);j.challenger_id=runner('Lady Shenandoah',race('FLEMINGTON',8)).id;
 assert.throws(()=>Challenge.compare(base,Model,j),/same saved race/);
 j.challenger_id=x.challenger_id;j.reported_going='Bog 12';
 assert.throws(()=>Challenge.compare(base,Model,j),/Unsupported going/);
 j.reported_going='Soft 5';j.source_type='OFFICIAL_REPORT';
 assert.throws(()=>Challenge.compare(base,Model,j),/real URL/);
 j.source_url='https://racing.com/example';j.rain_mm='many';
 assert.throws(()=>Challenge.compare(base,Model,j),/Invalid rainfall/);
 const scratched=base.runners.find(h=>h.race_id===race('FLEMINGTON',5)&&/SCRATCHED/i.test(h.status));
 const k=base.runners.find(h=>h.race_id===race('FLEMINGTON',5)&&Model.isEligible(h));
 assert.ok(scratched&&k);
 assert.throws(()=>Challenge.compare(base,Model,{...x,race_id:race('FLEMINGTON',5),incumbent_id:scratched.id,challenger_id:k.id}),/included/);
});
test('a historical replay is explicitly after-race and cannot mutate archived source rank or calibrate the model',()=>{
 const a=Challenge.compare(base,Model,{...r6(),observed_at:'2026-11-01T01:00:00Z'});
 assert.equal(a.review_timing,'AFTER_RACE_DAY_HISTORICAL_REPLAY');
 assert.equal(a.model_untouched,true);
 const b=Model.calculate(base,{default:'Good 4'});
 assert.equal(b.records.find(x=>x.id===r6().incumbent_id).p,22.21);
});
test('source-grade uncertainty is visible on Soft 6, which has the same experimental surface bucket as Soft 5',()=>{
 const a=Challenge.compare(base,Model,{...r8(),reported_going:'Soft 6'});
 assert.ok(a.flags.includes('SOFT_GRADES_SHARE_AN_UNCALIBRATED_SURFACE_BUCKET'));
 assert.equal(a.incumbent.scenario_pct,20.08);
 assert.equal(a.challenger.scenario_pct,10.98);
});


test('29-race result diagnostics stay outside forecast code and preserve the actual historical Good/Soft distinction',()=>{
 const report=require('./audits/2026-10-31-postrace-review.json');
 assert.equal(report.records.length,29);
 assert.equal(report.summary.archived_pre_race_scenario.raw_model_leader_wins,7);
 assert.equal(report.summary.realized_going_scenario.raw_model_leader_wins,9);
 assert.equal(report.summary.archived_pre_race_scenario.winners_top3,17);
 assert.equal(report.summary.archived_pre_race_scenario.winners_top5,22);
 assert.equal(report.mismatches.length,7);
 assert.ok(report.mismatches.some(x=>x.meeting==='FLEMINGTON'&&x.race===6&&x.modeled_but_not_a_starter.includes('Doubt Time')));
 assert.ok(report.mismatches.some(x=>x.meeting==='ASCOT'&&x.race===6&&x.modeled_but_not_a_starter.includes('Aurum Belle')));
 assert.ok(report.mismatches.some(x=>x.meeting==='FLEMINGTON'&&x.race===3&&x.started_but_missing_from_model.includes('Girl With A Pearl')));
 assert.equal(report.recorded_result_going.FLEMINGTON,'Good 4');
 assert.equal(report.recorded_result_going.ASCOT,'Soft 5');
 const fs=require('node:fs');
 const model=fs.readFileSync(__dirname+'/model.js','utf8');
 const challenge=fs.readFileSync(__dirname+'/challenge.js','utf8');
 assert.doesNotMatch(model,/postrace-review\.json|result_winner|2026-10-31-postrace/);
 assert.doesNotMatch(challenge,/postrace-review\.json|result_winner|2026-10-31-postrace/);
});
