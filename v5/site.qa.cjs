'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const M=require('./model.js'),State=require('./site-state.js'),D=require('./research.json');
const clone=x=>JSON.parse(JSON.stringify(x));
const view=C=>C.board.baseline.records.map(x=>[x.id,x.p]);
function evidence(){return {status:'LIVE_RESEARCH_ONLY',publication_approved:false,truncated:false,as_of:'2026-10-30T02:00:00Z',records:D.runners.map(h=>({fields:{fld4BGD5iAcZcGfaN:h.race_id,fldll7dYIGf28MAKA:h.horse,fldsSdoQPBOyW0AOJ:h.status}}))};}
test('original homepage, rankings, simulations and multis consume the same formula rows',()=>{
 const C=State.create(D),B=M.board(D,{going:C.going}),legacy=C.legacySnapshot();
 assert.equal(legacy.records.length,B.activeCount);
 for(const row of legacy.records){const model=B.baseline.records.find(x=>x.id===row.modelId);assert.equal(row.p,model.p);assert.equal(row.p_exact,model.p_exact);}
 assert.deepEqual(C.board.top15.map(x=>x.id),B.top15.map(x=>x.id));
 const ids=B.top5.slice(0,3).map(x=>x.id);assert.deepEqual(C.multi(ids),M.multi(B,ids));
 const r=B.baseline.races[0];assert.deepEqual(C.simulate(r.id,10000,'shared'),M.simulateWinners(B.baseline.records.filter(x=>x.race_id===r.id),10000,'shared'));
 assert.equal(D.publication.approved,false);assert.equal(legacy.publication.approved,false);
});
test('per-meeting scenario changes update the shared board without changing other meeting baselines',()=>{
 const C=State.create(D),before=C.revision,rows=view(C);let notifications=0;C.subscribe(()=>notifications++);
 C.setGoing('RANDWICK','Soft 5');assert.equal(notifications,1);assert.notEqual(C.revision,before);
 const expected=M.board(D,{going:C.going});assert.deepEqual(view(C),expected.baseline.records.map(x=>[x.id,x.p]));
 assert.deepEqual(view(C).filter(([id])=>id.includes('_FLEMINGTON_')),rows.filter(([id])=>id.includes('_FLEMINGTON_')));
 const key=C.revision;assert.throws(()=>C.setGoing('RANDWICK','typo'));assert.equal(C.revision,key);
});
test('a local scratching reruns the formula, excludes every consumer, restores exactly, and cannot reinstate a source scratch',()=>{
 const C=State.create(D),before=view(C),key=C.revision,h=C.board.top5[0],other=C.board.leaders.find(x=>x.race_id!==h.race_id);
 C.setLocalScratch(h.id,true);assert.equal(C.localScratchCount,1);assert.equal(C.rows(h.race_id).some(x=>x.id===h.id),false);
 assert.equal(C.legacySnapshot().records.some(x=>x.modelId===h.id),false);assert.throws(()=>C.multi([h.id,other.id]));
 assert.equal(C.simulate(h.race_id,10000,'scratch').rows.some(x=>x.id===h.id),false);
 assert.equal(C.board.baseline.races.find(x=>x.id===h.race_id).sum,100);
 C.setLocalScratch(h.id,false);assert.deepEqual(view(C),before);assert.equal(C.revision,key);
 const scratched=C.board.baseline.excluded[0];assert.throws(()=>C.setLocalScratch(scratched.id,true));
});
test('live status updates are atomic and invalidate stale selections and distributions',()=>{
 const C=State.create(D),h=C.board.top5[0],q=evidence();q.records.find(x=>x.fields.fldll7dYIGf28MAKA===h.horse&&x.fields.fld4BGD5iAcZcGfaN===h.race_id).fields.fldsSdoQPBOyW0AOJ='SCRATCHED';
 C.applyEvidence(q);assert.equal(C.rows(h.race_id).some(x=>x.id===h.id),false);assert.equal(C.live.as_of,q.as_of);
 const before=view(C),key=C.revision;const bad=clone(q);bad.records[1]=clone(bad.records[0]);assert.throws(()=>C.applyEvidence(bad));assert.equal(C.revision,key);assert.deepEqual(view(C),before);
 const short=clone(q);short.records.pop();assert.throws(()=>C.applyEvidence(short));
 const stale=clone(q);stale.as_of='2026-10-29T01:00:00Z';assert.throws(()=>C.applyEvidence(stale));
 const restore=evidence();restore.as_of='2026-10-30T03:00:00Z';C.applyEvidence(restore);assert.equal(C.rows(h.race_id).some(x=>x.id===h.id),false,'generic listed state must not reinstate a source scratch');
});
test('saved multi selections reject excluded runners, duplicate races, and another card date',()=>{
 const C=State.create(D),storage=new Map(),window={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
 vm.runInNewContext(fs.readFileSync(require.resolve('./workshop.js'),'utf8'),{window});
 const race=C.rows(C.board.top5[0].race_id),other=C.board.leaders.find(x=>x.race_id!==race[0].race_id),excluded=C.board.baseline.excluded[0];
 storage.set('racing-lab-v5-multi:'+D.date,JSON.stringify([race[0].id,race[1].id,excluded.id,other.id]));
 const S={multiSize:3};window.RacingLabWorkshop.sanitizeMulti(C,S);assert.deepEqual(Array.from(S.multi),[race[0].id,other.id]);
 C.setLocalScratch(race[0].id,true);window.RacingLabWorkshop.sanitizeMulti(C,S);assert.deepEqual(Array.from(S.multi),[other.id]);
});
test('both entrypoints load the shared model before views and retired scoring is absent',()=>{
 for(const file of ['index.html','v5/index.html']){const html=fs.readFileSync(require.resolve('../'+file),'utf8');assert.ok(html.indexOf('/v5/model.js')<html.indexOf('/v5/site-state.js'));assert.ok(html.indexOf('/v5/site-state.js')<html.indexOf('/v5/dashboard.js'));}
 const workshop=fs.readFileSync(require.resolve('./workshop.js'),'utf8');assert.equal(workshop.includes('gradeScore'),false);assert.equal(workshop.includes('Math.random'),false);
 const dashboard=fs.readFileSync(require.resolve('./dashboard.js'),'utf8');assert.ok(dashboard.includes('C.board.leaders'));assert.equal(dashboard.includes('original_pick'),false);
 const root=fs.readFileSync(require.resolve('../index.html'),'utf8');assert.equal(/<script[^>]+src="[^"]*racing-lab-hybrid-pro\.js/.test(root),false);assert.ok(root.includes('/v5/legacy-theme.css'));
});
test('going and local exclusions persist across both entrypoints without carrying into a different source snapshot',()=>{
 const memory=new Map(),storage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},C=State.create(D,{storage});
 const id=C.board.top5[0].id;C.setGoing('RANDWICK','Soft 5');C.setLocalScratch(id,true);
 const restored=State.create(D,{storage});assert.equal(restored.going.RANDWICK,'Soft 5');assert.equal(restored.isLocalScratch(id),true);assert.deepEqual(view(restored),view(C));
 const changed=clone(D);changed.saved_at='2026-10-30';const fresh=State.create(changed,{storage});assert.equal(fresh.going.RANDWICK,'Good 4');assert.equal(fresh.localScratchCount,0);
});

const Official=require('./official-snapshot-20261030.json');
test('30 October official overlay reconciles scratchings and provisional emergencies without approving forecasts',()=>{
 const input=clone(D),next=State.applyOfficialOverlay(input,Official);
 assert.deepEqual(input,D,'Friday overlay mutated original dossiers');
 assert.equal(next.official_check_at,'2026-10-30');
 assert.equal(next.publication.approved,false);
 const C=State.create(next,{going:Official.going});
 assert.equal(C.going.ASCOT,'Soft 5');assert.equal(C.going.RANDWICK,'Good 4');
 assert.equal(C.board.sourceCount,408);
 assert.equal(C.board.activeCount,372);
 assert.equal(C.board.excludedCount,36);
 assert.equal(C.board.raceCount,29);
 assert.ok(C.board.baseline.races.every(r=>r.sum===100));
 assert.equal(C.board.baseline.records.find(r=>r.horse==='Sheza Alibi').p,18.42);
 assert.ok(C.board.baseline.excluded.some(r=>r.horse==='Compensation'&&r.race_id.endsWith('_RANDWICK_R10')));
 assert.ok(C.board.baseline.excluded.some(r=>r.horse==='Noahquintilly'));
 assert.ok(C.board.baseline.records.some(r=>r.horse==='Brutal Elegance'));
 assert.ok(C.board.baseline.excluded.some(r=>r.horse==='Ziggy Rose'));
});
test('overlay rejects unknown, duplicated, or scratched emergency promotions atomically',()=>{
 const unknown=clone(Official);unknown.scratchings.RANDWICK_R10.push('NOT A HORSE');
 assert.throws(()=>State.applyOfficialOverlay(D,unknown),/unknown runner/i);
 const duplicate=clone(Official);duplicate.scratchings.RANDWICK_R10.push('Compensation');
 assert.throws(()=>State.applyOfficialOverlay(D,duplicate),/duplicates a runner/i);
 const wrongDate=clone(Official);wrongDate.race_date='2026-11-07';
 assert.throws(()=>State.applyOfficialOverlay(D,wrongDate),/date mismatch/i);
 const promoted=clone(Official);promoted.emergency_order.RANDWICK_R02.push('WHATELEY');
 assert.throws(()=>State.applyOfficialOverlay(D,promoted),/duplicates a runner|scratched runner/i);
});
test('win-first is selective, reproducible, and never changes runner probabilities',()=>{
 const raw=State.create(D).board,corrected=State.create(State.applyOfficialOverlay(D,Official),{going:Official.going}).board;
 const s=corrected.winFirst;
 assert.equal(s.priority.length,6);
 assert.equal(s.review.length,4);
 assert.equal(s.avoid.length,19);
 assert.equal(s.top15.length,10,'A Top 15 must not invent five qualifying picks');
 assert.equal(s.researchCandidates.length,10);
 assert.ok(s.priority.some(r=>r.horse==='Sheza Alibi'));
 assert.ok(s.review.some(r=>r.horse==='In Confidence'&&r.context_review.includes('FITNESS_AFTER_BREAK')));
 assert.ok(s.review.some(r=>r.horse==='Anthracite'&&r.context_review.includes('SHORT_BACKUP')));
 assert.ok(s.avoid.some(r=>r.horse==='Linchpin'&&r.screen_reasons.includes('NO_FIELD_SEPARATION')));
 assert.ok(s.avoid.some(r=>r.horse==='Perisher'));
 assert.equal(corrected.top15.length,15,'Raw Top 15 remains available unchanged');
 assert.deepEqual(corrected.top15.map(x=>x.id),corrected.leaders.slice(0,15).map(x=>x.id));
 assert.equal(s.rules.minimumGapPp,4);
 const rerun=M.winFirstScreen(corrected.leaders);
 assert.deepEqual(s,rerun,'Screen must be deterministic');
 const newPrice=clone(D);newPrice.market_audit=[{race_id:D.races[0].id,horse:'UNKNOWN',decimal_odds:1.01}];
 newPrice.runners.forEach(x=>{x.original_pick=!x.original_pick;});
 assert.deepEqual(M.board(newPrice).winFirst.researchCandidates.map(x=>x.runner_id),
  raw.winFirst.researchCandidates.map(x=>x.runner_id),'Neither price nor old pick may determine selection eligibility');
});
test('win-first shortlist is invalidated when track or scratch assumptions change',()=>{
 const D30=State.applyOfficialOverlay(D,Official),C=State.create(D30,{going:Official.going});
 const baseline=C.board.winFirst.researchCandidates.map(x=>[x.runner_id,x.model_pct]);
 C.setGoing('ASCOT','Good 4');
 assert.notDeepEqual(C.board.winFirst.researchCandidates.map(x=>[x.runner_id,x.model_pct]),baseline);
 const old=C.board.winFirst.priority[0],modelId=old.runner_id;
 C.setLocalScratch(modelId,true);
 assert.equal(C.board.winFirst.researchCandidates.some(x=>x.runner_id===modelId),false);
 assert.equal(C.board.baseline.races.find(x=>x.id===old.race_id).sum,100);
});
