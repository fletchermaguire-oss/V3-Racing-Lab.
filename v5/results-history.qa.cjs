'use strict';
/* Immutable historical scorekeeping contract. All results are independently
 * matched to named finishers; NOT a genuine V5 pre-race-locked record. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const archive=require('../results-history.json');
const rows=archive.records;
const complete=r=>r.verified===true&&!r.scratched&&r.result_status!=='SCRATCHED'&&Number.isInteger(r.finish_position)&&r.finish_position>0;
const dateRanks=(n)=>[...new Set(rows.map(r=>r.date))].flatMap(date=>rows.filter(r=>r.date===date)
 .slice().sort((a,b)=>Number(b.predicted_win_pct||0)-Number(a.predicted_win_pct||0)||a.meeting.localeCompare(b.meeting)||a.race-b.race).slice(0,n));
const count=arr=>({finished:arr.filter(complete).length,wins:arr.filter(r=>complete(r)&&r.finish_position===1).length});
test('archived October 17 and October 24 historical results have no unfinished starters',()=>{
 assert.equal(rows.length,49);
 assert.deepEqual(count(rows),{finished:47,wins:16});
 assert.equal(rows.filter(r=>r.scratched&&r.result_status==='SCRATCHED').length,2);
 assert.equal(rows.filter(r=>!complete(r)&&!r.scratched).length,0);
 assert.deepEqual(count(rows.filter(r=>r.date==='2026-10-17')),{finished:28,wins:7});
 assert.deepEqual(count(rows.filter(r=>r.date==='2026-10-24')),{finished:19,wins:9});
});
test('Top 10 35% and all-races 34% remain different, explicitly retrospective cohorts',()=>{
 assert.deepEqual(count(dateRanks(10)),{finished:20,wins:7});
 assert.deepEqual(count(dateRanks(5)),{finished:10,wins:3});
 assert.equal(archive.notes.includes('not prospective V5 calibration'),true);
});
test('the nine confirmed 24 October winners match horse and venue; two 17 Oct scratchings never count as losses',()=>{
 for(const [horse,meeting,race] of [
  ['Exo Velocity','Randwick',1],['Ocean Tsunami','Randwick',2],['Lindermann','Randwick',6],
  ['Lazzura','Randwick',8],['Buggsy','Flemington',2],['True Rebel','Flemington',3],
  ["Surfin' Bird",'Flemington',6],['Juja Kibo','Flemington',7],
  ['Cosmic Crusader','Flemington',8]
 ]){
  const matching=rows.filter(r=>r.date==='2026-10-24'&&r.meeting===meeting&&r.race===race&&r.horse===horse);
  assert.equal(matching.length,1,horse);assert.ok(complete(matching[0]));assert.equal(matching[0].finish_position,1);
  assert.ok(matching[0].result_source.startsWith('https://'));
 }
 assert.deepEqual(rows.filter(r=>r.scratched).map(r=>r.horse).sort(),['Gold Medallist','Juja Kibo']);
 assert.ok(rows.filter(r=>r.scratched).every(r=>r.finish_position===null&&!r.verified));
});
test('Results UI names retrospective denominators clearly, and never calls scratchings pending or losses',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','results.html'),'utf8');
 assert.match(html,/Reconstructed Top 10/);
 assert.match(html,/All model race leaders/);
 assert.match(html,/historicalTop10/);
 assert.match(html,/historicalAll/);
 assert.match(html,/SCRATCHED · did not start/);
 assert.match(html,/r\.scratched!==true/);
 assert.match(html,/not V5 forward predictions/);
 assert.match(html,/function rankedByDay/);
});


const publishedV5=require('./shortlists/2026-10-31-results.json');
const savedV5=require('./shortlists/current.json');
const strictForward=require('./prospective-record.json');
test('31 October published research finishes are horse-and-race matched and keep all original 15 ranks',()=>{
 const d=publishedV5,original=savedV5.entries;
 assert.equal(d.schema,'racing-lab-31-oct-reviewed-shortlist-results/v1');
 assert.equal(d.date,'2026-10-31');
 assert.equal(d.status,'COMPLETE_SAVED_SHORTLIST_RESULT_AUDIT');
 assert.equal(d.strict_forward_lock_verified,false);
 assert.equal(d.retrospective_rank_adjustments,false);
 assert.equal(d.results.length,15);
 assert.deepEqual(d.results.map(x=>[x.rank,x.horse,x.meeting,x.race,x.model_pct]),
  original.map(x=>[x.rank,x.horse,x.meeting,x.race,x.model_pct]));
 const seenRaces=new Set(),seenNames=new Set();
 for(const r of d.results){
  assert.ok(Number.isInteger(r.finish_position)&&r.finish_position>=1,r.horse);
  assert.equal(r.result_status,'FINISHED_VERIFIED',r.horse);
  assert.equal(r.won,r.finish_position===1,r.horse);
  assert.ok(Number.isFinite(r.model_separation_pp),r.horse);
  assert.ok(r.source_url.startsWith('https://www.theking.zone/racing/2026-10-31/'),r.horse);
  assert.ok(r.corroboration_url.startsWith('https://'),r.horse);
  assert.ok(!seenNames.has(r.horse)&&!seenRaces.has(r.race_id),r.horse);
  seenNames.add(r.horse);seenRaces.add(r.race_id);
 }
});
test('31 October Top 5/10/15 published scores are 3/5, 4/10 and 4/15, with zero after-race additions',()=>{
 const d=publishedV5;
 assert.deepEqual(d.cohorts.map(c=>[c.top_n,c.completed,c.wins,c.top_three_finishes]),
  [[5,5,3,3],[10,10,4,6],[15,15,4,8]]);
 assert.deepEqual(d.results.filter(r=>r.won).map(r=>r.horse),
  ['Regal Ambition','Western Miss','Lady Shenandoah','Hot And High']);
 assert.equal(d.results.find(r=>r.horse==='Sheza Alibi').finish_position,11);
 assert.equal(d.results.find(r=>r.horse==='Satono Glow').finish_position,13);
 assert.equal(d.results.find(r=>r.horse==='Bridal Waltz').finish_position,16);
 assert.equal(d.results.find(r=>r.horse==='Afireofgidgeecoals').finish_position,2);
 assert.equal(d.results.find(r=>r.horse==='In Confidence').finish_position,3);
 assert.equal(rows.length,49,'unchanged retrospective historical file');
 assert.equal(strictForward.independent_freeze_verified,false);
 assert.equal(strictForward.locked_selections.length,0);
 assert.equal(strictForward.official_results.length,0);
});
test('results UI displays V5 published picks above historical reconstructions, without inventing forward certification',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','results.html'),'utf8');
 assert.ok(html.indexOf('id="reviewed-results"')>0);
 assert.ok(html.indexOf('id="reviewed-results"')<html.indexOf('Reconstructed historical selections'));
 assert.match(html,/v5\/shortlists\/2026-10-31-results\.json/);
 assert.match(html,/function validateReviewed/);
 assert.match(html,/function renderReviewed/);
 assert.match(html,/id="reviewed5"/);
 assert.match(html,/id="reviewed10"/);
 assert.match(html,/id="reviewed15"/);
 assert.match(html,/model_separation_pp/);
 assert.match(html,/strict independent forward-lock certification remains separate/);
});
