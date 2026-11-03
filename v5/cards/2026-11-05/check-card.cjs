'use strict';
/* Source-only Oaks Day import reconciliation and optional V5 model-output QA. */
const assert=require('node:assert/strict'),fs=require('node:fs');
const path=require('node:path'),crypto=require('node:crypto');
const D=require('./research.json');
const root=path.join(__dirname,'..','..','..');
const original=path.join(__dirname,'research.json');
const sourceSha='192a7b461e6fdc62e0babf6c87b80ebe31f2d8c0ac2d03e847794f12fcde27ce';
assert.equal(D.schema,'racing-lab-v5-feature-form/v1');
assert.equal(D.date,'2026-11-05');assert.equal(D.saved_at,'2026-11-03');
assert.equal(D.publication.approved,false);
assert.equal(D.publication.model_probabilities_published,false);
assert.equal(D.source_import.sources.length,1);
const S=D.source_import.sources[0];
assert.equal(S.sha256,sourceSha);
assert.deepEqual([S.pages,S.races,S.runners,S.meeting],[79,9,149,'FLEMINGTON']);
assert.deepEqual(D.expected_inventory,{races:9,runners:149});
assert.equal(D.races.length,9);assert.equal(D.runners.length,149);
assert.equal(D.cross_entries.length,0);
assert.deepEqual(D.races.map(x=>[x.race,x.distance_m,x.field_count]),[
 [1,1700,20],[2,1400,15],[3,1600,13],[4,1600,12],[5,1800,19],
 [6,1600,20],[7,1100,16],[8,2500,20],[9,1000,14]
]);
const ids=new Set();
for(const r of D.races){
 assert.equal(r.field_verified,false);
 assert.ok(r.race_class&&r.race_class.trim());
 assert.ok(r.scheduled_local.startsWith('2026-11-05T'));
 const runners=D.runners.filter(h=>h.race_id===r.id);
 assert.equal(runners.length,r.field_count);
 assert.deepEqual(runners.map(h=>h.tab),Array.from({length:r.field_count},(_,i)=>i+1));
}
let starts=0,supported=0,trials=0,sectionals=0,blankJockey=0;
for(const h of D.runners){
 assert.ok(!ids.has(h.id));ids.add(h.id);
 assert.equal(h.status,'PDF_LISTED_UNVERIFIED');
 assert.equal(h.original_pick,false);
 assert.equal(h.source.file,'469539.pdf');assert.equal(h.source.sha256,sourceSha);
 assert.ok(h.source.pages.every(x=>Number.isInteger(x)&&x>=1&&x<=79));
 assert.ok(h.source_detail.includes(h.horse.toUpperCase()),h.horse);
 assert.ok(typeof h.form==='string'&&typeof h.statistics==='string');
 assert.ok(h.statistics.includes('Career '+h.career.wins+'-'+h.career.other_places+'-'+h.career.starts));
 for(const s of h.historical_starts){
  assert.ok(s.date<D.saved_at&&s.date<D.date,'Post-snapshot form '+h.horse);
  assert.ok(typeof s.used_in_model==='boolean');starts++;
  if(s.used_in_model)supported++;
 }
 for(const t of h.trials){assert.equal(t.used_in_model,false);assert.ok(t.date<D.date);trials++;}
 for(const s of h.sectional_evidence){assert.equal(s.horse_specific,false);sectionals++;}
 if(!h.jockey.trim())blankJockey++;
}
assert.deepEqual({starts,supported,trials,sectionals,blankJockey},
 {starts:708,supported:691,trials:217,sectionals:701,blankJockey:10});
if(process.argv.includes('--with-analysis')){
 const A=require('./analysis.json');
 assert.equal(A.schema,'racing-lab-v5-feature-form-analysis/v1');
 assert.equal(A.date,D.date);
 assert.equal(A.as_of,D.saved_at);
 assert.equal(A.research_sha256,crypto.createHash('sha256').update(fs.readFileSync(original)).digest('hex'));
 assert.equal(A.model_version,'V5-L5-CANDIDATE-20261030');
 assert.equal(A.race_count,9);assert.equal(A.source_count,149);assert.equal(A.modelled_count,149);
 assert.equal(A.records.length,149);
 assert.equal(A.scenarios.length,10);
 assert.equal(A.publication_approved,false);assert.equal(A.calibrated,false);
 assert.equal(A.independent_shortlist_created,false);
 assert.equal(A.field_gate.final_fields_approved,false);
 for(const r of A.races){
  assert.equal(r.sum,100,'Race probabilities must sum 100: '+r.id);
  assert.equal(r.field_verified,false);
  assert.ok(r.top_three.length===3);
 }
 for(const variant of A.scenarios){
  assert.equal(variant.records.length,149);
  assert.equal(variant.races.length,9);
  assert.ok(variant.races.every(r=>r.total_pct===100));
 }
}
console.log(JSON.stringify({date:D.date,races:D.races.length,pdf_runners:D.runners.length,
 supported_starts:supported,excluded_starts:starts-supported,trials,invalid_horse_specific_sectionals:0,
 sectionals,blank_jockeys:blankJockey,analysis_verified:process.argv.includes('--with-analysis'),
 site_or_selection_published:false},null,2));
