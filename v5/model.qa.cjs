'use strict';
/* Run: node --test v5/model.qa.cjs. Fixtures are mathematical test data,
 * not real racing predictions, results, or evidence of historical accuracy. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const M=require('./model.js');
const D=require('./research.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const probabilities=b=>b.records.map(x=>({id:x.id,p:x.p,p_exact:x.p_exact,rank:x.rank})).sort((a,b)=>a.id.localeCompare(b.id));
function fixture(){
 return {
  date:'2027-02-13',saved_at:'2027-02-12',
  expected_inventory:{races:2,runners:5},
  races:[{id:'2027-02-13_TEST_R01',meeting:'TEST',race:1,distance_m:1200},
         {id:'2027-02-13_TEST_R02',meeting:'TEST',race:2,distance_m:1400}],
  runners:[0,1,2,3,4].map(i=>({
   id:'h'+i,race_id:i<3?'2027-02-13_TEST_R01':'2027-02-13_TEST_R02',horse:'Test '+i,
   status:'Declared',barrier:i<3?i+1:i-2,weight_kg:56,
   statistics:'Career 2-3-10; course 1-1-4; distance 1-2-5; Good 2-1-6; Soft 0-2-4; Heavy 0-0-0',
   form:'30/1/2027 TEST 1200m (G), BM72: 2/10, PDF margin 0.5L',
   historical_map:'Settled 4th 800m (30/1/2027)',
   risks:'Test scenario uncertainty; not real evidence.'
  }))
 };
}
function near(actual,expected,tolerance=1e-9){assert.ok(Math.abs(actual-expected)<=tolerance,actual+' != '+expected);}
const B=M.board(D);

test('all 408 source entries are audited; 396 draft rows and 12 exclusions; every scenario totals 100',()=>{
 assert.equal(B.sourceCount,408);assert.equal(B.raceCount,29);
 assert.equal(B.activeCount,396);assert.equal(B.excludedCount,12);
 assert.equal(B.baseline.runnerAudit.length,408);assert.equal(B.model_variants.length,8);
 for(const s of B.scenarios){
  assert.equal(s.records.length,396);assert.equal(s.excluded.length,12);
  assert.equal(s.races.length,29);
  for(const r of s.races){
   assert.equal(r.status,'MODELLED_PROVISIONAL');assert.equal(r.sum,100);
   const rows=s.records.filter(h=>h.race_id===r.id);
   near(rows.reduce((n,x)=>n+x.p,0),100,1e-9);
   near(rows.reduce((n,x)=>n+x.p_exact,0),100,1e-9);
   assert.equal(rows.length,r.field);
   assert.ok(rows.every(x=>Number.isFinite(x.p)&&x.p>0&&x.p<100&&Number.isFinite(x.fair_odds)&&x.fair_odds>1));
   assert.ok(rows.every(x=>Object.values(x.features).every(Number.isFinite)));
   assert.ok(rows.every(x=>Array.isArray(x.input_issues)&&Array.isArray(x.positive_drivers)&&Array.isArray(x.negative_drivers)));
  }
 }
 assert.equal(B.baseline.records.some(x=>B.baseline.excluded.some(y=>y.id===x.id)),false);
 assert.equal(B.publication_blocked,true);
 assert.equal(B.calibration_status,'NOT_ESTABLISHED');
});
test('prices, original picks, and horse names cannot change probabilities or shortlist membership',()=>{
 const d=clone(D);d.market_audit=[];d.market_benchmarks=[];
 d.runners.forEach(h=>{h.horse='Renamed '+h.id;h.original_pick=!h.original_pick;h.decimal_odds=1.01;});
 const b=M.board(d);
 assert.deepEqual(probabilities(B.baseline),probabilities(b.baseline));
 assert.deepEqual(B.top15.map(x=>x.id),b.top15.map(x=>x.id));
 assert.deepEqual(B.baseline.records.map(x=>x.quality_flags),b.baseline.records.map(x=>x.quality_flags));
 assert.equal(B.publication_blocked,b.publication_blocked);
 const huge=clone(D);huge.market_audit=[{race_id:D.races[0].id,horse:D.runners[0].horse,decimal_odds:Infinity}];
 assert.equal(M.board(huge).marketAudit[0].severity,'INVALID_QUOTE');
});
test('Top 5/10/15 share a probability-first order without an elite override',()=>{
 assert.equal(B.leaders.length,29);
 assert.equal(B.top15.length,15);
 assert.deepEqual(B.top5.map(x=>x.id),B.top15.slice(0,5).map(x=>x.id));
 assert.deepEqual(B.top10.map(x=>x.id),B.top15.slice(0,10).map(x=>x.id));
 for(let i=1;i<B.leaders.length;i++)assert.ok(B.leaders[i-1].p_exact>=B.leaders[i].p_exact);
 for(const x of B.leaders){
  assert.equal(x.rank,1);
  assert.equal(x.p_exact,Math.max(...B.baseline.records.filter(y=>y.race_id===x.race_id).map(y=>y.p_exact)));
 }
 for(const x of B.robustLeaders){
  assert.equal(x.robust_floor,Math.max(...B.baseline.records.filter(y=>y.race_id===x.race_id).map(y=>y.robust_floor)));
  assert.equal(x.rank_scenarios.length,B.scenarios.length);
  assert.equal(x.scenario_probabilities.length,B.scenarios.length);
 }
});
test('date and field inventory are dynamic, and a manifest catches incomplete cards',()=>{
 const d=fixture(),b=M.board(d);
 assert.equal(b.date,'2027-02-13');assert.equal(b.raceCount,2);assert.equal(b.sourceCount,5);
 const bad=clone(d);bad.runners.pop();assert.throws(()=>M.board(bad),/Expected runner count/);
 const fewer=clone(d);delete fewer.expected_inventory;fewer.runners.pop();assert.equal(M.board(fewer).sourceCount,4);
});
test('wider winning margin helps rather than being treated as a beaten margin',()=>{
 const d=fixture();
 d.runners[0].form='30/1/2027 TEST 1200m (G), OPEN Group G1: 1/10, PDF margin 0.1L';
 const before=M.calculate(d,'Good 4');
 d.runners[0].form=d.runners[0].form.replace('0.1L','5L');
 const after=M.calculate(d,'Good 4');
 const a=before.records.find(x=>x.id==='h0'),b=after.records.find(x=>x.id==='h0');
 assert.ok(b.p_exact>a.p_exact);assert.ok(b.features.recency>a.features.recency);
 assert.ok(b.features.class>a.features.class,'Stronger Group 1 winning margin improves graded performance evidence');
});
test('larger losing margins hurt; a better maiden performance improves the class contribution',()=>{
 const d=fixture();d.runners[0].form='30/1/2027 TEST 1200m (G), MDN: 8/10, PDF margin 8L';
 const weak=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 d.runners[0].form='30/1/2027 TEST 1200m (G), MDN: 1/10, PDF margin 2L';
 const strong=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.ok(strong.features.class>weak.features.class);assert.ok(strong.p_exact>weak.p_exact);
 d.runners[0].form='30/1/2027 TEST 1200m (G), MDN: 2/10, PDF margin 0.2L';
 const close=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 d.runners[0].form=d.runners[0].form.replace('0.2L','12L');
 const far=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.ok(far.p_exact<close.p_exact);
});
test('race-day, later, and snapshot-day results cannot leak into form features',()=>{
 const d=fixture(),before=M.calculate(d,'Good 4');
 ['12/2/2027','13/2/2027','14/2/2027'].forEach(date=>{
  d.runners[0].form+='\n'+date+' TEST 1200m (G), OPEN Group G1: 1/10, PDF margin 10L';
 });
 const after=M.calculate(d,'Good 4');
 assert.deepEqual(probabilities(before),probabilities(after));
 assert.equal(after.records.find(x=>x.id==='h0').form_audit.ignored_future,3);
});
test('invalid dates and impossible form rows are flagged; repeated starts do not inflate evidence',()=>{
 const d=fixture(),before=M.calculate(d,'Good 4');
 d.runners[0].form+='\n'+d.runners[0].form;
 let after=M.calculate(d,'Good 4');
 assert.deepEqual(probabilities(before),probabilities(after));
 assert.equal(after.records.find(x=>x.id==='h0').form_audit.duplicates,1);
 d.runners[0].form+='\n31/2/2027 TEST 1200m (G), MDN: 1/10, PDF margin 1L\n29/1/2027 TEST 1200m (G), MDN: 11/10, PDF margin 1L';
 after=M.calculate(d,'Good 4');
 assert.equal(after.records.find(x=>x.id==='h0').form_audit.invalid,2);
 assert.deepEqual(probabilities(before),probabilities(after));
 d.runners[0].form+='\n30/1/2027 TEST 1200m (G), BM72: 1/10, PDF margin 1L';
 const conflict=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.equal(conflict.form_audit.accepted,0);
 assert.ok(conflict.input_issues.some(x=>x.startsWith('CONFLICTING_START')));
});
test('impossible or conflicting statistics are never converted into a positive record',()=>{
 const d=fixture();d.runners[0].statistics='Career 8-4-10; Good 0-0-0';
 let x=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.equal(x.features.career,0);assert.equal(x.features.surface,0);
 assert.ok(x.input_issues.includes('INVALID_CAREER_COUNTS'));
 d.runners[0].statistics='Career 2-3-10; Career 7-0-10';
 x=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.equal(x.features.career,0);assert.ok(x.input_issues.includes('CONFLICTING_CAREER_COUNTS'));
});
test('official starts:wins-seconds-thirds and legacy wins-other-places-starts have consistent meaning',()=>{
 const d=fixture();d.runners[0].statistics='Career 10:2-3-1; Good 6:2-1-0';
 const official=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 d.runners[0].statistics='Career 2-4-10; Good 2-1-6';
 const legacy=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.deepEqual(official.features,legacy.features);
});
test('null and blank weight/barrier values are missing, never zero-kilogram advantages',()=>{
 const d=fixture();d.runners[0].weight_kg='';d.runners[0].barrier=null;
 const x=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.equal(x.features.weight,0);assert.equal(x.features.barrier,0);
 assert.ok(x.input_issues.includes('MISSING_OR_INVALID_WEIGHT'));
 assert.ok(x.input_issues.includes('MISSING_OR_INVALID_BARRIER'));
});
test('scratched runners and unactivated emergencies are excluded without removing their audit records',()=>{
 const d=fixture();d.runners[0].status='Emergency';d.runners[3].status='Withdrawn';
 let b=M.board(d);assert.equal(b.excludedCount,2);assert.equal(b.baseline.runnerAudit.length,5);
 assert.ok(!b.baseline.records.some(x=>x.id==='h0'||x.id==='h3'));
 assert.equal(b.baseline.races.find(x=>x.id===d.races[1].id).status,'NO_CONTEST');
 d.runners[0].emergency_activated=true;b=M.board(d);
 assert.ok(b.baseline.records.some(x=>x.id==='h0'));
 assert.equal(b.baseline.records.find(x=>x.id==='h0').status,'ACTIVE_UNVERIFIED');
 assert.equal(b.publication_blocked,true);
});
test('unknown field status remains conditional and is never marked officially verified',()=>{
 const d=fixture();d.runners.forEach(h=>{h.status='Thursday listed; not verified';});
 let b=M.board(d);assert.equal(b.activeCount,5);
 assert.ok(b.baseline.races.every(r=>!r.field_verified));assert.equal(b.publication_blocked,true);
 d.runners.forEach(h=>{h.status='ACTIVE_VERIFIED';});d.races.forEach(r=>{r.field_verified=true;});
 b=M.board(d);assert.ok(b.baseline.races.every(r=>r.field_verified));
 assert.equal(b.publication_blocked,true);assert.equal(b.calibration_status,'NOT_ESTABLISHED');
});
test('duplicate IDs, duplicate races, orphan records, impossible dates and unsupported going fail closed',()=>{
 const cases=[
  d=>{d.runners[1].id=d.runners[0].id;},
  d=>{d.runners[1].horse='  '+d.runners[0].horse.toUpperCase()+'  ';},
  d=>{d.races[1].id=d.races[0].id;},
  d=>{d.runners[0].race_id='missing';},
  d=>{d.date='2027-02-30';},
  d=>{d.races[0].distance_m=0;},
  d=>{d.races[0].id='2026-01-01_TEST_R01';}
 ];
 for(const mutate of cases){const d=fixture();mutate(d);assert.throws(()=>M.board(d));}
 assert.throws(()=>M.calculate(fixture(),'Sfot 5'),/Unsupported/);
 assert.throws(()=>M.calculate(fixture(),{TEST:'Heavy 4'}),/Unsupported/);
});
test('input reordering, deterministic ties and repeated calls preserve every runner probability',()=>{
 const d=fixture(),before=M.board(d);const initial=clone(d);
 const reversed=clone(d);reversed.runners.reverse();reversed.races.reverse();
 const after=M.board(reversed);
 assert.deepEqual(probabilities(before.baseline),probabilities(after.baseline));
 assert.deepEqual(before.top10.map(x=>x.id),after.top10.map(x=>x.id));
 assert.deepEqual(d,initial,'Model mutated source data');
 assert.deepEqual(probabilities(before.baseline),probabilities(M.board(d).baseline));
 const rows=before.baseline.records.filter(x=>x.race_id===d.races[0].id);
 assert.equal(rows[0].p,33.34);assert.equal(rows[0].id,'h0');
 assert.equal(rows.reduce((s,x)=>s+x.p,0),100);
});
test('going is explicit per race or meeting; Heavy uses Heavy records, and missing scenarios cannot silently become Good',()=>{
 const d=fixture();d.runners[0].statistics=d.runners[0].statistics.replace('Heavy 0-0-0','Heavy 1-0-1');
 const heavy=M.calculate(d,'Heavy 8').records.find(x=>x.id==='h0');
 const good=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.ok(heavy.features.surface>good.features.surface);
 const mixed=M.calculate(d,{[d.races[0].id]:'Heavy 8',default:'Soft 5'});
 assert.equal(mixed.races[0].going,'Heavy 8');assert.equal(mixed.races[1].going,'Soft 5');
 assert.throws(()=>M.calculate(d,{}),/Missing explicit going/);
});
test('simulator samples the same complete race distribution reproducibly and conserves all runs',()=>{
 const rows=B.baseline.records.filter(x=>x.race_id===D.races[0].id),a=M.simulateWinners(rows,50000,'qa');
 assert.equal(a.rows.reduce((s,x)=>s+x.sim_wins,0),50000);
 for(const x of a.rows){
  const p=x.model_p/100,sd=Math.sqrt(p*(1-p)/50000)*100;
  assert.ok(Math.abs(x.sim_win_pct-x.model_p)<6*sd+0.02);
 }
 assert.deepEqual(M.simulateWinners(rows,1000,'same'),M.simulateWinners(rows,1000,'same'));
 assert.throws(()=>M.simulateWinners(rows,0));
 assert.throws(()=>M.simulateWinners(rows.slice(1),100));
 assert.throws(()=>M.simulateWinners(B.baseline.records,100));
});
test('two- and three-leg calculations use the same model rows and enforce separate races',()=>{
 const ids=B.leaders.slice(0,3).map(x=>x.id),two=M.multi(B,ids.slice(0,2)),three=M.multi(B,ids);
 near(two.baseline_joint_pct,B.leaders[0].p*B.leaders[1].p/100);
 assert.ok(three.baseline_joint_pct<=two.baseline_joint_pct);
 assert.equal(three.scenarios.length,B.scenarios.length);
 const sameRace=B.baseline.records.filter(x=>x.race_id===B.leaders[0].race_id).slice(0,2).map(x=>x.id);
 assert.throws(()=>M.multi(B,sameRace));assert.throws(()=>M.multi(B,[ids[0],ids[0]]));
 assert.throws(()=>M.multi(B,[ids[0],B.baseline.excluded[0].id]));
 assert.throws(()=>M.multi(Object.assign({},B,{version:'stale'}),ids));
});
function frozenFixture(){
 const race='test-race';
 return {
  forecasts:[{race_id:race,model_version:M.VERSION,field_revision:'r1',publication_frozen:true,publication_approved:true,
   snapshot_at_utc:'2027-02-13T01:00:00Z',frozen_at_utc:'2027-02-13T01:01:00Z',race_at_utc:'2027-02-13T02:00:00Z',
   freeze_proof_url:'https://example.test/frozen',rows:[{id:'a',race_id:race,p:60},{id:'b',race_id:race,p:40}]}],
  results:[{race_id:race,verified:true,official_url:'https://example.test/results',field_revision:'r1',active_runner_ids:['a','b'],winner_runner_id:'a'}]
 };
}
test('frozen historical diagnostics compute known Brier/log-loss without claiming fitted calibration',()=>{
 const f=frozenFixture(),r=M.evaluateFrozen(f.forecasts,f.results);
 assert.equal(r.races,1);near(r.mean_multiclass_brier,.32);near(r.mean_log_loss,-Math.log(.6));
 assert.equal(r.top1_hit_rate,1);assert.equal(r.calibration_fitted,false);
 assert.equal(r.reliability.reduce((s,x)=>s+x.count,0),2);
});
test('post-race snapshots, unapproved rows, duplicate versions and changed fields are excluded from calibration',()=>{
 const mutations=[
  f=>{f.forecasts[0].snapshot_at_utc='2027-02-13T03:00:00Z';},
  f=>{f.forecasts[0].frozen_at_utc='2027-02-13T03:00:00Z';},
  f=>{f.forecasts[0].publication_approved=false;},
  f=>{f.forecasts[0].freeze_proof_url='';},
  f=>{f.forecasts.push(clone(f.forecasts[0]));},
  f=>{f.results.push(clone(f.results[0]));},
  f=>{f.results[0].active_runner_ids=['a','missing'];},
  f=>{f.results[0].field_revision='other';},
  f=>{f.results[0].verified=false;},
  f=>{f.forecasts[0].rows[0].p=-1;},
  f=>{f.forecasts[0].snapshot_at_utc='2027-02-30T01:00:00Z';}
 ];
 for(const mutate of mutations){
  const f=frozenFixture();mutate(f);const r=M.evaluateFrozen(f.forecasts,f.results);
  assert.equal(r.races,0);assert.equal(r.status,'NO_VERIFIED_BACKTEST');assert.equal(r.mean_log_loss,null);
 }
});
test('browser and Node use the same model; V3 layout and historical results remain unchanged',()=>{
 const context={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'model.js'),'utf8'),context);
 const browser=context.window.RacingLabV5Model.board(fixture());
 assert.deepEqual(JSON.parse(JSON.stringify(probabilities(browser.baseline))),probabilities(M.board(fixture()).baseline));
 const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(html.includes('window.RacingLabApp'));
 assert.ok(html.includes('/v5/reader.js'));
 assert.equal(Object.isFrozen(M.CONFIG),true);assert.equal(Object.isFrozen(M.CONFIG.weights),true);
});

test('L5 class labels reward proven high-class form without invented historical-opponent ratings',()=>{
 const d=fixture();
 d.runners[0].form='30/1/2027 TEST 1200m (G), OPEN Group G1: 2/12, PDF margin 0.2L';
 d.runners[1].form='30/1/2027 TEST 1200m (G), MDN: 1/12, PDF margin 1.5L';
 d.runners[2].form='30/1/2027 TEST 1200m (G), BM68: 1/12, PDF margin 1L';
 const b=M.calculate(d,'Good 4'),a=b.records.find(x=>x.id==='h0'),m=b.records.find(x=>x.id==='h1');
 assert.ok(a.grade_quality>m.grade_quality,'A narrow G1 placing outranks a maiden win on class');
 assert.ok(a.opposition_class_edge>m.opposition_class_edge);
 assert.ok(a.features.class>m.features.class);
 assert.ok(a.p_exact>m.p_exact,'Qualified elite performance should be correctly compared with low-level opposition');
 assert.equal(M.historicalRaceLevel('unparseable grade'),null);
 assert.equal(M.classQuality([]),0);
});
test('L5 opponent class edge reacts to an opposing runner form change',()=>{
 const d=fixture();
 d.runners[0].form='30/1/2027 TEST 1200m (G), OPEN Group G1: 1/12, PDF margin 0.6L';
 d.runners[1].form='30/1/2027 TEST 1200m (G), MDN: 1/12, PDF margin 1L';
 d.runners[2].form='30/1/2027 TEST 1200m (G), BM68: 2/12, PDF margin 0.5L';
 const before=M.calculate(d,'Good 4'),a=before.records.find(x=>x.id==='h0');
 d.runners[1].form='30/1/2027 TEST 1200m (G), OPEN Group G1: 1/12, PDF margin 1L';
 const after=M.calculate(d,'Good 4'),b=after.records.find(x=>x.id==='h0');
 assert.ok(b.opposition_class_anchor>a.opposition_class_anchor);
 assert.ok(b.opposition_class_edge<a.opposition_class_edge);
 assert.ok(b.p_exact<a.p_exact,'A stronger rival reduces the contender win share');
});
test('L5 changes remain market-blind, preserve all race sums and expose strength context',()=>{
 const b=M.board(D,{going:{RANDWICK:'Good 4',FLEMINGTON:'Good 4',ASCOT:'Soft 5'}});
 assert.equal(b.baseline.races.length,29);assert.ok(b.baseline.races.every(x=>x.sum===100));
 for(const r of b.baseline.records){
  assert.ok(Number.isFinite(r.opposition_class_anchor));
  assert.ok(Number.isFinite(r.opposition_class_edge));
  assert.ok(Number.isFinite(r.grade_quality));
 }
 const sheza=b.baseline.records.find(x=>x.horse==='Sheza Alibi');
 assert.equal(sheza.rank,1);
 assert.ok(sheza.p>25,'The high-grade record must be represented, without name-specific promotion');
 const w=b.baseline.records.find(x=>x.horse==='Western Miss');
 assert.ok(sheza.p>w.p,'Cross-race model order now reflects stronger G1 evidence on this dossier');
});

test('October 24 archived Friday prose form is parsed without allowing future starts',()=>{
 const d=fixture();
 d.runners[0].form='Previous Friday source-snapshot race form (not refreshed against Saturday): '+
 '2nd of 12 30/1/2027 CAULFIELD Margin 0.2 Lengths Distance 1200m SOT G RST OPEN Group G1 Race Foo Prize $10,000 '+
 ' | 1st of 9 15/1/2027 FLEMINGTON Margin 2.8 Lengths Distance 1400m SOT S RST OPEN Group G3 Race Bar Prize $5,000';
 d.runners[0].statistics='Career: 3-2-6; Good: 2-1-4; Soft: 1-1-2';
 const before=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.equal(before.form_audit.accepted,2);
 assert.equal(before.input_issues.includes('MISSING_PARSEABLE_RECENT_FORM'),false);
 assert.ok(before.grade_quality>0);
 assert.ok(before.features.career>0);
 d.runners[0].form+=' | 1st of 12 13/2/2027 RANDWICK Margin 10 Lengths Distance 1200m SOT G RST OPEN Group G1 Race Future Prize $1';
 const after=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.equal(after.form_audit.ignored_future,1);
 assert.equal(after.p_exact,before.p_exact);
});
test('non-snapshot prose cannot smuggle dated wins into parsed form',()=>{
 const d=fixture();
 d.runners[0].form='Rumour: 1st of 12 30/1/2027 RANDWICK Margin 10 Lengths Distance 1200m SOT G RST OPEN Group G1 Race fabricated';
 const x=M.calculate(d,'Good 4').records.find(x=>x.id==='h0');
 assert.equal(x.form_audit.accepted,0);
 assert.equal(x.grade_quality,0);
});
