'use strict';
// V5 Tuesday form-source QA only. No unverified selection can pass this gate.
const fs=require('node:fs'),assert=require('node:assert/strict');
const date='2026-11-03';
const files=[['FLEMINGTON',165],['RANDWICK',168]];
const names=new Set(),ids=new Set(),raceIDs=new Set();let total=0,unassigned=0;
for(const [meeting,expected] of files){
 const path='v5/racecards/'+date+'-'+meeting.toLowerCase()+'.json';
 const d=JSON.parse(fs.readFileSync(path,'utf8'));
 assert.equal(d.date,date);assert.equal(d.meeting,meeting);
 assert.equal(d.schema,'racing-lab-v5-feature-form-source/v1');
 assert.equal(d.publication_approved,false);
 assert.equal(d.final_starters_verified,false);
 assert.equal(d.model_probabilities_published,false);
 assert.equal(d.races.length,10);assert.equal(d.runners.length,expected);
 assert.deepEqual(d.expected_inventory,{races:10,runners:expected});
 for(const race of d.races){
  assert.equal(race.meeting,meeting);assert.equal(race.id,date+'_'+meeting+'_R'+String(race.race).padStart(2,'0'));
  assert.equal(race.field_verified,false);assert(!raceIDs.has(race.id));raceIDs.add(race.id);
  const horses=d.runners.filter(h=>h.race_id===race.id);
  assert.equal(horses.length,race.listed_count);
  for(const [i,h] of horses.entries()){
   assert.equal(h.tab,i+1);assert.equal(h.id,race.id+'_'+String(h.tab).padStart(2,'0'));
   assert(h.horse&&h.trainer&&h.weight_kg>0&&h.barrier>0);
   assert.equal(h.status,'PDF_LISTED_UNVERIFIED');assert.equal(h.model_ready,false);
   assert(!Object.hasOwn(h,'win_probability'));assert(!Object.hasOwn(h,'p'));
   assert(!ids.has(h.id));ids.add(h.id);
   const key=race.id+'|'+h.horse.toUpperCase().replace(/[^A-Z0-9]/g,'');
   assert(!names.has(key));names.add(key);
   if(!h.jockey)unassigned++;
  }
 }
 total+=d.runners.length;
}
assert.equal(total,333);assert.equal(raceIDs.size,20);assert.equal(unassigned,21);
const snapshot=JSON.parse(fs.readFileSync('v5/research.json','utf8'));
assert.equal(snapshot.date,'2026-10-31');assert.equal(snapshot.runners.length,408);
const checklist=['confirmed final starters and emergency promotion','official scratchings','verified rail and track going','runner-form chronology and statistics','gear, trainer and stewards checks','independent research shortlist','calibration/uncertainty review'];
console.log('PASS 3 Nov source intake: 20 races; '+total+' PDF-listed runners; '+unassigned+' unassigned jockeys. 31 Oct historical board preserved.');
console.log('RESEARCH ONLY. Still needed: '+checklist.join('; '));
