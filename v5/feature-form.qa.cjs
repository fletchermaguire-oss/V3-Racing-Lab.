'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const Model=require('./model.js'),State=require('./site-state.js'),Curated=require('./curated.js');
const Card=require('./active-card.js'),D=require('./cards/2026-11-03/research.json');
const B=Model.board(D),clone=x=>JSON.parse(JSON.stringify(x));
test('both PDF inventories reconcile, with valid provenance for every detailed horse',()=>{
 assert.equal(D.date,'2026-11-03');assert.equal(D.races.length,20);assert.equal(D.runners.length,333);
 assert.deepEqual(D.source_import.sources.map(s=>[s.meeting,s.pages,s.races,s.runners]),[['RANDWICK',89,10,168],['FLEMINGTON',82,10,165]]);
 assert.equal(new Set(D.runners.map(h=>h.id)).size,333);
 for(const r of D.races){
  const field=D.runners.filter(h=>h.race_id===r.id);
  assert.equal(field.length,r.field_count);
  assert.deepEqual(field.map(h=>h.tab),Array.from({length:field.length},(_,i)=>i+1));
  assert.ok(!r.field_verified);
 }
 for(const h of D.runners){
  const s=D.source_import.sources.find(s=>s.file===h.source.file);
  assert.equal(h.source.sha256,s.sha256);assert.ok(h.source.pages.length>0,h.horse);
  assert.ok(h.source.pages.every(p=>p>=1&&p<=s.pages),h.horse);
  assert.ok(h.source_detail.includes(h.horse.toUpperCase()),h.horse);
 }
});
test('foreign Group form does not swallow later race headers, and nonstandard results are retained without scoring',()=>{
 for(const horse of ['Trustyourinstinct','James J Braddock']){
  const h=D.runners.find(h=>h.horse===horse),m=B.baseline.records.find(x=>x.id===h.id);
  assert.equal(h.historical_starts.length,5);assert.ok(m.form_audit.accepted>=3);
  assert.ok(h.historical_starts.every(r=>r.venue.length<45));
  assert.ok(h.historical_starts.some(r=>/Group G[123]/.test(r.race_class)));
 }
 const k=D.runners.find(h=>h.horse==='Kairos Louie');
 assert.ok(k.historical_starts.some(r=>r.finish===99&&r.used_in_model===false));
 assert.equal(k.form.includes('99/9'),false);assert.ok(k.risks.includes('non-standard finish code'));
});
test('supported dated starts reconcile with the model; trials stay distinct and do not create wins',()=>{
 for(const h of D.runners){
  const row=B.baseline.records.find(x=>x.id===h.id);
  assert.equal(row.form_audit.accepted,h.historical_starts.filter(x=>x.used_in_model).length,h.horse);
  assert.equal(row.form_audit.invalid,0,h.horse);
  assert.ok(h.historical_starts.every(r=>r.date<D.saved_at));
  assert.ok(h.trials.every(t=>t.used_in_model===false&&t.date<D.saved_at));
 }
 const jet=D.runners.find(h=>h.horse==='Jetsetter');
 assert.equal(jet.career.starts,0);assert.equal(jet.form,'');assert.ok(jet.trials.some(t=>t.finish===1));
 assert.ok(jet.gear_source_notes.some(x=>x.includes('FIRST TIME')));
});
test('all 333 entries receive conditional estimates and each of 200 race scenarios totals exactly 100',()=>{
 assert.equal(B.sourceCount,333);assert.equal(B.activeCount,333);assert.equal(B.scenarios.length,10);
 assert.equal(B.publication_blocked,true);assert.equal(B.calibration_status,'NOT_ESTABLISHED');
 for(const scenario of B.scenarios){
  assert.equal(scenario.records.length,333);
  for(const race of scenario.races){assert.equal(race.sum,100);assert.equal(race.field_verified,false);}
 }
 assert.equal(new Set(B.top15.map(h=>h.race_id)).size,15);
 const first=D.races.find(r=>r.id==='2026-11-03_FLEMINGTON_R01');
 assert.equal(first.unraced_count,8);assert.ok(first.source_flags.includes('UNRACED_RIVALS_NOT_RATED_FROM_TRIALS'));
});
test('cross-entries are flagged without silently resolving starter status or removing the other dossier',()=>{
 const cross=D.cross_entries.find(x=>x.horse==='Man Of Worth');
 assert.equal(cross.race_ids.length,2);
 for(const id of cross.race_ids){
  const h=D.runners.find(h=>h.horse===cross.horse&&h.race_id===id);
  assert.ok(h.cross_entries.length===1);assert.equal(h.status,'PDF_LISTED_UNVERIFIED');
 }
});
test('prices, gear commentary and trial winners cannot change any V5 score',()=>{
 const next=clone(D);next.runners.forEach(h=>{h.trials=[];h.gear_source_notes=['invented advantage'];h.source_commentary='price $1.01';h.decimal_odds=1.01;h.source_detail='removed for independence test';});
 assert.deepEqual(Model.calculate(next,'Good 4').records.map(h=>[h.id,h.p]),B.baseline.records.map(h=>[h.id,h.p]));
});
function freshLoader(card){
 const window={RacingLabV5Model:Model,RacingLabV5Curated:Curated,RacingLabV5Card:card};
 vm.runInNewContext(fs.readFileSync(require.resolve('./site-state.js'),'utf8'),{window});
 return window.RacingLabV5State;
}
test('selected PDF card loads without old scratching, shortlist or Airtable requests',async()=>{
 const calls=[],loader=freshLoader(Card);
 const C=await loader.load(async url=>{calls.push(url);assert.equal(url,Card.research_url);return {ok:true,json:async()=>D};});
 assert.deepEqual(calls,[Card.research_url]);assert.equal(C.data.date,D.date);assert.equal(C.board.raceCount,20);assert.equal(C.curated,null);
 await assert.rejects(freshLoader(Card).load(async()=>({ok:true,json:async()=>require('./research.json')})),/wrong race date/);
 await assert.rejects(freshLoader({...Card,research_url:'https://other.test/card.json'}).load(),/Invalid dated/);
});
test('generated analysis matches the source hash, whole-field model and ten scenario calculations',()=>{
 const A=require('./cards/2026-11-03/analysis.json');
 assert.equal(A.research_sha256,crypto.createHash('sha256').update(fs.readFileSync(require.resolve('./cards/2026-11-03/research.json'))).digest('hex'));
 assert.equal(A.coefficients_changed,false);assert.equal(A.publication_approved,false);
 assert.equal(A.records.length,333);assert.equal(A.scenarios.length,10);
 assert.equal(A.field_gate.final_fields_approved,false);
 assert.deepEqual(A.records.map(h=>[h.id,h.p]),B.baseline.records.map(h=>[h.id,h.p]));
 assert.ok(A.races.every(r=>r.top_three.length===3&&r.top_three.every(h=>h.assessment.pros&&h.assessment.cons)));
});
