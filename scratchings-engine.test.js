const assert=require('node:assert/strict');const e=require('./scratchings-engine.js');
const f=[{name:'Alpha',p:50},{name:'Beta',p:30},{name:'Gamma',p:20}];
const r=e.update(f,['Beta']);assert.deepEqual(r.runners.map(x=>x.p),[71.4286,28.5714]);assert.equal(r.modelRerun,false);assert.equal(r.paceReassessed,false);
assert.throws(()=>e.update(f,['Wrong']));assert.throws(()=>e.update(f,['Alpha','Beta','Gamma']));
assert.deepEqual(e.verify({raceId:'R1',scratchings:['Beta'],sourceUrl:'https://example.org/scratchings',asOf:'2026-10-31T00:00:00Z'},'R1',f.map(x=>x.name)),['Beta']);
assert.throws(()=>e.verify({raceId:'R2',scratchings:['Beta']},'R1',f.map(x=>x.name)));
console.log('All scratching-engine tests passed');
