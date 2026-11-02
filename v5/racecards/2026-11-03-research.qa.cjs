'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const M=require('../model.js');
const d=JSON.parse(fs.readFileSync(__dirname+'/2026-11-03-research-scratchings.json','utf8'));
assert.equal(d.date,'2026-11-03');assert.equal(d.runners.length,333);assert.equal(d.races.length,20);
const o=d.official_20261102;assert.equal(o.publication_approved,false);assert.equal(o.final_starters_verified,false);
assert.equal(o.scratching_count.FLEMINGTON,13);assert.equal(o.scratching_count.RANDWICK,26);
assert.equal(d.runners.filter(h=>M.statusOf(h)==='SCRATCHED').length,39);
assert.equal(d.runners.filter(h=>M.isEligible(h)).length,294);
const good=M.board(d,{going:o.going});
const soft=M.board(d,{going:{FLEMINGTON:'Soft 5',RANDWICK:'Good 4'}});
for(const b of [good,soft]){
 assert.equal(b.raceCount,20);
 assert.equal(b.sourceCount,333);assert.equal(b.activeCount,294);
 assert.equal(b.excludedCount,39);
 assert.equal(b.baseline.races.length,20);
 for(const race of b.baseline.races){
  assert.equal(race.sum,100,'whole-field sum '+race.id);
  assert(race.field>=2);
  const leaders=b.baseline.records.filter(h=>h.race_id===race.id);
  assert.equal(leaders.length,race.field);
  assert(!leaders.some(h=>d.runners.some(x=>x.id===h.id&&M.statusOf(x)==='SCRATCHED')),'scratched selection '+race.id);
 }
}
assert.notEqual(o.official_total_including_emergencies.FLEMINGTON,152);
assert.notEqual(o.official_total_including_emergencies.RANDWICK,142);
assert.equal(d.publication.approved,false);
console.log('PASS: 3 Nov Tuesday original V5 model accepts 20 races/333 dossiers/39 Monday scratches; 294 provisional included, per-race 100% under Good 4 and Flemington Soft 5, zero certified starters.');
console.log('Top 10/Multi must NOT be certified until official final starter reconciliation and human independent research review.');
