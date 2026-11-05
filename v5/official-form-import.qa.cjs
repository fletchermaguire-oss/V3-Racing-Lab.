'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const P=require('./official-form-import.js');
const M=require('./model.js');
const A=require('./cards/2026-11-07/ascot-research.json');
const R=require('./cards/2026-11-07/rosehill-research.json');
const AS=require('./cards/2026-11-07/ascot-scenarios.json');
const RS=require('./cards/2026-11-07/rosehill-scenarios.json');
test('Heavy10 is a real race result, while starred trials never become race wins',()=>{
 const form=[
 '## Testville: Western Australian Turf Club Saturday, 07 November 2026',
 '**Rail Position:** True',
 '**Track Condition:** Soft 5',
 '**FinalFields Last Published:** Thu 05-Nov-26 1:13PM AEDT',
 '| Race 1 - 1:00PM SAMPLE RACE (1200 METRES) |',
 '| No | Last 10 | Horse | Trainer | Jockey | Barrier | Weight |',
 '| 1 | 1 | ALPHA | Trainer A | Rider A | 2 | 56kg |',
 '| 2 | | BETA | Trainer B | Rider B | 4 | 56kg |',
 '| 1 ALPHA 3 year old bay colt **Sire:** Alpha (AUS) |',
 '| **Trainer:** **Trainer A** **Record:** 1:1-0-0 **Track:** 1:1-0-0 **Dist:** 1:1-0-0 **Good:** 0:0-0-0 **Soft:** 0:0-0-0 **Heavy:** 1:1-0-0 |',
 '| 1 of 10 | **TEST 03Oct26** 1200m Heavy10 BM72 $100,000 1:10.23 (600m 35.00), 1.22L, 3rd@800m |',
 '| ***T**1 of 8* | ***TEST 21Oct26** 900m Good4 2Y-TRL $000 0:55.00, 0.1L |',
 '| 2 BETA 3 year old brown colt **Sire:** Beta (AUS) |',
 '| SCRATCHED |'
 ].join('\n');
 const d=P.importForm(form,{date:'2026-11-07',cutoff_date:'2026-11-05',meeting:'TEST',venue:'Testville',source_url:'https://example.org/form',expected_races:1,expected_acceptors:2,scratchings:[{race:1,number:2}]});
 assert.equal(d.import_audit.heavy10_lines_recognized,1);
 assert.equal(d.import_audit.historical_form_lines,1);
 assert.match(d.runners[0].form,/\(H\), BM72/);
 assert(!d.runners[0].form.includes('21/10/2026'));
 assert.match(d.runners[1].status,/^SCRATCHED/);
 assert.equal(d.runners[1].form,'');
 assert.equal(d.publication.approved,false);
});
test('real dated source imports: 228 accepted entries, published scratchings, Heavy10 and complete race inventory',()=>{
 assert.equal(A.date,'2026-11-07');assert.equal(R.date,'2026-11-07');
 assert.equal(A.runners.length,95);assert.equal(R.runners.length,133);
 assert.equal(A.races.length,10);assert.equal(R.races.length,10);
 assert.equal(A.import_audit.historical_form_lines,429);
 assert.equal(R.import_audit.historical_form_lines,541);
 assert.equal(A.import_audit.heavy10_lines_recognized,1);
 assert.equal(R.import_audit.heavy10_lines_recognized,7);
 assert.equal(A.import_audit.published_scratchings,0);
 assert.equal(R.import_audit.published_scratchings,6);
 assert.equal(A.import_audit.unactivated_emergencies,0);
 assert.equal(R.import_audit.unactivated_emergencies,5);
 assert.equal(A.import_audit.active_accepted,95);
 assert.equal(R.import_audit.active_accepted,122);
 assert.equal(A.source_import.going_report,'Soft 5');
 assert.equal(R.source_import.going_report,'Soft 6');
 assert.equal(A.publication.approved,false);
 assert.equal(R.publication.approved,false);
 assert.equal(A.import_audit.all_final_starters_verified,false);
 assert.equal(R.import_audit.all_final_starters_verified,false);
 for(const d of [A,R]){
  assert.equal(new Set(d.runners.map(x=>x.id)).size,d.runners.length);
  assert(d.runners.every(x=>x.race_id.startsWith('2026-11-07_')));
  assert(d.runners.filter(x=>!x.status.startsWith('SCRATCHED')).every(x=>/Career \d+-\d+-\d+/.test(x.statistics)));
 }
 const silent=R.runners.find(x=>x.horse==='SILENT INTENT');
 assert.match(silent.form,/3\/10\/2026 FLEM 1000m \(H\), LISTED: 3\/6/);
 assert.equal(M.calculate(R,{ROSEHILL:'Soft 6'}).records.find(x=>x.id===silent.id).form_audit.accepted,1);
});
test('shadow model has exact complete field total, never marked certified',()=>{
 for(const [d,sc] of [[A,AS],[R,RS]]){
  assert.equal(sc.meeting,d.races[0].meeting);
  assert.equal(sc.model_version,M.VERSION);
  assert.equal(sc.publication_approved,false);
  assert.equal(sc.calibration_established,false);
  assert.equal(sc.final_starters_verified,false);
  for(const variant of sc.scenarios){
   const b=M.calculate(d,{[sc.meeting]:variant.going});
   assert.equal(b.records.length,d.import_audit.active_accepted);
   assert.equal(variant.races.length,10);
   for(const r of variant.races){
    const a=b.records.filter(x=>x.race_id===r.race_id).sort((x,y)=>y.p-x.p);
    assert.equal(r.model_pct,a[0].p);
    assert.equal(r.leader,a[0].horse);
    assert.equal(r.field,a.length);
    assert.equal(+a.reduce((s,x)=>s+x.p,0).toFixed(2),100);
   }
  }
 }
});
test('no post-cutoff form records; Saturday source remains a research gate',()=>{
 for(const d of [A,R])for(const h of d.runners){
  for(const l of h.form.split('\n').filter(Boolean)){
   const m=l.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
   assert(m,h.horse+': '+l);
   const iso=m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0');
   assert(iso<d.saved_at,h.horse+' leaked future race date');
  }
 }
});
