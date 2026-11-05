'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const d=require('./outcome-audit.json'),src=require('./selections.json');
const winner=race=>d.races.find(r=>r.race===race)?.winner;
const record=rows=>({wins:rows.filter(x=>winner(x.race)===x.horse).length,total:rows.length});
test('all nine official results have unique races, top-four order and result source',()=>{
 assert.equal(d.schema,'racing-lab-thursday-outcome-audit/v1');
 assert.equal(d.date,'2026-11-05');
 assert.deepEqual(d.races.map(r=>r.race),[1,2,3,4,5,6,7,8,9]);
 d.races.forEach(r=>{
  assert.equal(r.first_four.length,4);
  assert.equal(r.first_four[0],r.winner);
  assert.match(r.source_url,new RegExp('/mr/'+r.race+'$'));
  assert.equal(r.reported_going,'Good 4');
 });
});
test('published Wednesday selection names and original ranks are not rewritten',()=>{
 assert.equal(src.status,d.pre_race_published_source.original_status);
 assert.equal(src.selections.length,9);
 const names=src.selections.slice().sort((a,b)=>a.race-b.race).map(x=>[x.race,x.horse,x.rank]);
 assert.deepEqual(names,d.site.selections.map(x=>[x.race,x.horse,x.rank]));
 assert.deepEqual(record(d.site.selections),{wins:3,total:9});
 assert.equal(d.site.selections.find(x=>x.race===9).horse,'Rey Magnerio');
});
test('final chat snapshot never merged with original published site picks',()=>{
 assert.deepEqual(record(d.chat.race_leaders),{wins:2,total:9});
 assert.equal(d.chat.race_leaders.find(x=>x.race===6).horse,'Bel Mezyaan');
 assert.equal(d.chat.race_leaders.find(x=>x.race===9).horse,'Stokke');
 assert.deepEqual(record(d.chat.top10),{wins:3,total:10});
 assert.deepEqual(record(d.chat.top10.filter(x=>x.rank<=5)),{wins:1,total:5});
 assert.equal(d.chat.top10.length,10);
 assert.deepEqual(d.chat.top10.map(x=>x.rank),[1,2,3,4,5,6,7,8,9,10]);
});
test('pre-race probabilities are explicitly uncalibrated and site has none',()=>{
 assert.equal(d.pre_race_published_source.independent_calibrated_model,false);
 assert.equal(d.pre_race_chat_source.percentages_calibrated,false);
 assert.equal(d.site.selections.every(x=>x.pre_race_probability_published===false),true);
 assert.equal(d.chat.race_leaders.every(x=>x.probability_provenance==='HUMAN_ESTIMATE_UNCALIBRATED'),true);
 assert.equal(d.track.observed_race_results,'Good 4');
});
