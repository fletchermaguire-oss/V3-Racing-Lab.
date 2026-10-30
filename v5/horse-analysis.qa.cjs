'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Analysis=require('./horse-analysis.js'),D=require('./research.json'),Official=require('./official-latest.json'),Curated=require('./shortlists/current.json');
const byName=(name,race)=>D.runners.find(h=>h.horse===name&&(!race||h.race_id.endsWith(race)));
function assess(name,raceSuffix,going,fieldSize){
 const h=byName(name,raceSuffix);assert.ok(h,name);
 const race=D.races.find(r=>r.id===h.race_id);
 const saved=Curated.entries.find(x=>x.meeting===race.meeting&&x.race===race.race&&x.horse===name);
 return Analysis.analysis(h,race,{field_size:fieldSize||12},going||Official.going[race.meeting],saved);
}
const lines=x=>x.pros.concat(x.cons).map(x=>x.title+' '+x.detail).join(' | ');
test('Group 1, course and career form become readable paragraphs rather than model contributions',()=>{
 const x=assess('Sheza Alibi','RANDWICK_R08','Good 4',16),s=lines(x);
 assert.match(s,/8 wins? from 13 starts/i);assert.match(s,/Caulfield/i);
 assert.match(s,/Group 1/i);assert.match(s,/Golden Eagle field/i);
 assert.doesNotMatch(s,/score contribution|confidence 100%|guaranteed winner/i);
});
test('untested Soft is stated as missing evidence, not a reason the runner must fail',()=>{
 const x=assess('Hot And High','ASCOT_R09','Soft 5',11);
 assert.ok(x.pros.some(y=>/7 wins? from 8 starts/i.test(y.detail)));
 assert.ok(x.unknown.some(y=>/No recorded Soft 5 sample/i.test(y)));
 assert.ok(!lines(x).includes('dislikes the surface'));
});
test('named rivals, barrier and class-change risks remain visible in natural language',()=>{
 const x=assess('Western Miss','ASCOT_R07','Soft 5',12);
 assert.match(lines(x),/barrier 10/i);
 assert.match(lines(x),/Decoration/i);
 assert.ok(x.pros.length>=2&&x.cons.length>=1);
});
test('large weights and partial foreign form are not converted to false statistical certainty',()=>{
 const rock=assess('Rock Fest','ASCOT_R10','Soft 5',14);
 assert.match(lines(rock),/61kg/i);
 const imported=assess('Amazing Journey','RANDWICK_R08','Good 4',16);
 assert.ok(imported.unknown.some(x=>/Only 1 machine-readable dated start/.test(x)));
});
test('all 408 archived dossiers produce safe prose with explicit uncertainty and no fake computed probability',()=>{
 const seen=new Set();
 D.runners.forEach(h=>{
  const race=D.races.find(r=>r.id===h.race_id),result=Analysis.analysis(h,race,null,Official.going[race.meeting],null);
  assert.ok(Array.isArray(result.pros)&&Array.isArray(result.cons)&&Array.isArray(result.unknown));
  assert.ok(result.cons.length>0);
  const content=lines(result)+' '+result.unknown.join(' ');
  assert.doesNotMatch(content,/\b(?:NaN|undefined|\[object Object\])\b/);
  assert.doesNotMatch(content,/guaranteed|lock of the day/i);
  seen.add(h.id);
 });
 assert.equal(seen.size,408);
});
