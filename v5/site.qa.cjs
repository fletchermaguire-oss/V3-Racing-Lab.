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
function officialController(){return State.create(State.applyOfficialOverlay(D,Official),{going:Official.going});}
test('official Friday overlay and fixed-scenario win-first reconcile whole fields and abstain rather than pad',()=>{
 const before=clone(D),adjusted=State.applyOfficialOverlay(D,Official),C=State.create(adjusted,{going:Official.going}),b=C.board;
 assert.deepEqual(D,before,'official overlay must never mutate the saved source');
 assert.equal(b.sourceCount,408);assert.equal(b.activeCount,372);assert.equal(b.excludedCount,36);
 assert.equal(b.raceCount,29);assert.ok(b.baseline.races.every(r=>r.sum===100));
 assert.equal(adjusted.publication.approved,false);
 assert.ok(b.baseline.excluded.some(x=>x.horse==='Noahquintilly'));
 assert.ok(b.baseline.excluded.some(x=>x.horse==='Whateley'));
 assert.ok(b.baseline.excluded.some(x=>x.horse==='Perisher'&&x.race_id.endsWith('R09')));
 assert.ok(b.baseline.records.some(x=>x.horse==='Amarone'&&x.race_id.endsWith('R02')));
 assert.equal(b.winFirst.status,'RESEARCH_ONLY_UNCALIBRATED');
 assert.equal(b.winFirst.priority.length,3);assert.equal(b.winFirst.review.length,6);
 assert.equal(b.winFirst.avoid.length,20);
 assert.equal(b.winFirst.researchCandidates.length,9);
 assert.equal(b.winFirst.top15.length,9,'The Top 15 cannot be padded with unsupported choices');
 assert.deepEqual(b.winFirst.top5,b.winFirst.top10.slice(0,5));
 assert.deepEqual(b.winFirst.top10,b.winFirst.top15.slice(0,10));
 assert.equal(b.winFirst.priority.some(x=>x.race_id.endsWith('_ASCOT_R06')),false);
 const flip=b.winFirst.avoid.find(x=>x.race_id.endsWith('_ASCOT_R06'));
 assert.equal(flip.good4,'Aurum Belle');assert.equal(flip.soft5,'Afireofgidgeecoals');
 assert.ok(b.winFirst.review.some(x=>x.horse==='Sheza Alibi'&&x.reasons.includes('WIDE_CLASS_OR_GOING_SENSITIVITY')));
 assert.ok(b.winFirst.priority.every(x=>x.dated_starts>=3&&x.min_gap>=4&&x.completeness>=0.78));
 assert.ok(b.winFirst.priority.every(x=>!b.baseline.excluded.some(y=>y.id===x.runner_id)));
});
test('changing Good 4 to Soft 5 never swaps win-first selections, although raw race leaders may change',()=>{
 const C=officialController(),ids=()=>C.board.winFirst.researchCandidates.map(x=>x.runner_id),initial=ids();
 C.setGoing('ASCOT','Good 4');assert.deepEqual(ids(),initial);
 C.setGoing('RANDWICK','Soft 5');assert.deepEqual(ids(),initial);
 C.setGoing('FLEMINGTON','Soft 5');assert.deepEqual(ids(),initial);
 C.setGoing('ASCOT','Soft 5');assert.deepEqual(ids(),initial);
 assert.equal(new Set(C.board.winFirst.byRace.map(x=>x.race_id)).size,29);
 assert.equal(C.board.winFirst.byRace.length,29);
 C.setGoing('ASCOT','Heavy 8');
 assert.ok(C.board.winFirst.priority.every(x=>x.meeting!=='ASCOT'),'Heavy cannot inherit a Good 4 / Soft 5 priority label');
 assert.ok(C.board.winFirst.avoid.some(x=>x.reasons.includes('TRACK_GRADE_OUTSIDE_TESTED_GOOD4_SOFT5')));
});
test('scratchings invalidate affected selections; invalid overlays preserve the source',()=>{
 const C=officialController(),pick=C.board.winFirst.priority[0],old=C.revision;
 C.setLocalScratch(pick.runner_id,true);
 assert.notEqual(C.revision,old);
 assert.equal(C.board.baseline.records.some(x=>x.id===pick.runner_id),false);
 assert.equal(C.board.winFirst.priority.some(x=>x.runner_id===pick.runner_id),false);
 assert.equal(C.board.baseline.races.find(x=>x.id===pick.race_id).sum,100);
 const invalid=clone(Official);invalid.scratchings.RANDWICK_R02.push('Unknown Horse');
 assert.throws(()=>State.applyOfficialOverlay(D,invalid),/unknown runner/i);
 const duplicate=clone(Official);duplicate.scratchings.RANDWICK_R02.push('WHATELEY');
 assert.throws(()=>State.applyOfficialOverlay(D,duplicate),/duplicates/i);
 const wrong=clone(Official);wrong.race_date='2026-11-07';
 assert.throws(()=>State.applyOfficialOverlay(D,wrong),/date mismatch/i);
});
test('entrypoints consume the screened board and Multi Lab auto-use cannot draw from raw leaders',()=>{
 const dashboard=fs.readFileSync(require.resolve('./dashboard.js'),'utf8');
 const workshop=fs.readFileSync(require.resolve('./workshop.js'),'utf8');
 assert.ok(dashboard.includes("topMode:'WIN_FIRST'"));
 assert.ok(dashboard.includes("C.board.winFirst.priority.map"));
 assert.ok(dashboard.includes("C.board.winFirst.review.filter"));
 assert.ok(workshop.includes("B.winFirst.priority.slice(0,S.multiSize)"));
 assert.equal(workshop.includes("B.leaders.slice(0,S.multiSize)"),false);
});
test('loading the date-matched overlay is fail-closed, and applies the saved Friday official scenario',async()=>{
 const seen=[],fetcher=async(path)=>{seen.push(path);return {ok:true,json:async()=>path.endsWith('.json')&&path.includes('official-snapshot')?clone(Official):clone(D)};};
 const C=await State.load(fetcher);
 assert.deepEqual(seen,['/v5/research.json','/v5/official-snapshot-20261030.json']);
 assert.equal(C.board.activeCount,372);
 assert.equal(C.going.ASCOT,'Soft 5');
 assert.equal(C.board.winFirst.priority.length,3);
});


test('every update explains leader moves, and the live board never silently swaps a shortlist horse on going changes',()=>{
 const C=officialController(),ids=()=>C.board.winFirst.priority.map(x=>x.runner_id);
 const before=ids();C.setGoing('ASCOT','Good 4');
 assert.deepEqual(ids(),before);
 assert.equal(C.lastChange.reason,'TRACK_GOING_ASCOT');
 assert.equal(C.lastChange.changed_selections.length,0);
 assert.ok(C.lastChange.raw_leader_changes.length>=1);
 const h=C.board.winFirst.priority[0];
 C.setLocalScratch(h.runner_id,true);
 assert.equal(C.lastChange.reason,'LOCAL_SCRATCHING');
 assert.ok(C.lastChange.changed_selections.some(x=>x.race_id===h.race_id));
 assert.ok(!C.board.winFirst.priority.some(x=>x.runner_id===h.runner_id));
});
