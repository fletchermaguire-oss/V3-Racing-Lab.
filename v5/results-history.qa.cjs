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

const unified=require('../results-record.json');
function unifiedScore(a){
 const done=a.filter(r=>r.status==='FINISHED_VERIFIED'&&!r.scratched&&Number.isInteger(r.finish_position));
 const wins=done.filter(r=>r.finish_position===1).length;
 return {entries:a.length,finished:done.length,wins,scratched:a.filter(r=>r.scratched).length};
}
test('one unified results file combines every historical and published pick without overwriting the archived source',()=>{
 const all=unified.records;
 assert.equal(unified.schema,'racing-lab-unified-results/v1');
 assert.equal(all.length,74);
 assert.deepEqual(unifiedScore(all),{entries:74,finished:72,wins:27,scratched:2});
 assert.equal(new Set(all.map(r=>r.date+'|'+r.meeting+'|'+r.race)).size,74);
 assert.deepEqual([...new Set(all.map(r=>r.date))],['2026-10-17','2026-10-24','2026-10-31','2026-11-07']);
 const sourceDays=all.filter(r=>['2026-10-17','2026-10-24'].includes(r.date));
 assert.equal(sourceDays.length,archive.records.length);
 for(const original of archive.records){
  const matched=sourceDays.find(r=>r.date===original.date&&r.meeting===original.meeting.toUpperCase()&&r.race===original.race);
  assert.ok(matched,original.horse);
  assert.equal(matched.horse,original.horse);
  assert.equal(matched.finish_position,original.scratched?null:original.finish_position);
  assert.equal(matched.selection_method,'HISTORICAL_MODEL_RECONSTRUCTION');
 }
 const published=require('./shortlists/2026-10-31-results.json').results;
 for(const original of published){
  const matched=all.find(r=>r.date==='2026-10-31'&&r.rank===original.rank);
  assert.ok(matched,original.horse);
  assert.equal(matched.horse,original.horse);
  assert.equal(matched.finish_position,original.finish_position);
  assert.equal(matched.model_pct,original.model_pct);
  assert.equal(matched.model_separation_pp,original.model_separation_pp);
  assert.equal(matched.selection_method,'PUBLISHED_REVIEWED_SHORTLIST');
 }
});
test('one cumulative strike-rate for all rows and top5/10/15 by each Saturday rank, with scratchings excluded',()=>{
 const ranks=[['all',Infinity,74,72,27,2],['top5',5,20,20,10,0],
              ['top10',10,40,40,18,0],['top15',15,45,44,13,1]];
 ranks.forEach(([key,n,entries,finished,wins,scratched])=>{
  const selected=unified.records.filter(r=>r.rank<=n&&(key==='all'||unified.cohort_eligibility[r.date]?.[key]!==false)),actual=unifiedScore(selected);
  assert.deepEqual(actual,{entries,finished,wins,scratched});
  assert.equal(unified.metrics[key].wins,wins);
  assert.equal(unified.metrics[key].finished,finished);
  assert.equal(unified.metrics[key].win_rate_pct,+(100*wins/finished).toFixed(2));
 });
 assert.deepEqual(unified.metrics.by_date.map(x=>[x.date,x.finished,x.wins,x.scratched]),
 [['2026-10-17',28,7,2],['2026-10-24',19,9,0],['2026-10-31',15,4,0],['2026-11-07',10,7,0]]);
 assert.equal(archive.records.length,49);
 assert.equal(unified.cohort_eligibility['2026-11-07'].top15,false);
 const preRace=require('./cards/2026-11-07/independent-top10.json');
 const positions=[1,1,5,1,1,1,1,2,6,1];
 const nov=unified.records.filter(r=>r.date==='2026-11-07').sort((a,b)=>a.rank-b.rank);
 assert.equal(nov.length,10);
 nov.forEach((r,i)=>{
  assert.equal(r.rank,preRace.entries[i].rank);
  assert.equal(r.horse,preRace.entries[i].horse);
  assert.equal(r.race,preRace.entries[i].race);
  assert.equal(r.model_pct,preRace.entries[i].working_win_pct);
  assert.equal(r.finish_position,positions[i]);
  assert.equal(r.selection_method,'PRE_RACE_REVIEWED_ANALYST_TOP10');
  assert.equal(r.model_separation_pp,null);
 });
 assert.equal(unified.postrace_analysis.oct31.cases.length,15);
 const archivedTop15=require('./shortlists/2026-10-30-independent-top15-review.json');
 archivedTop15.entries.forEach((original,i)=>{
  const c=unified.postrace_analysis.oct31.cases[i];
  const r=unified.records.find(x=>x.date==='2026-10-31'&&x.rank===original.rank);
  assert.equal(c.horse,original.horse);
  assert.equal(c.pre_race_strength,original.reason);
  assert.equal(c.pre_race_risk,original.risk);
  assert.equal(c.finish_position,r.finish_position);
 });
 assert.equal(unified.postrace_analysis.nov7.not_model_output,true);
 assert.equal(unified.postrace_analysis.outcomes_not_forecast_inputs,true);
 const strict=require('./prospective-record.json');
 assert.equal(strict.independent_freeze_verified,false);
 assert.equal(strict.official_results.length,0);
});
test('Results UI uses one data file and one graph, not split historical and prospective results screens',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','results.html'),'utf8');
 assert.match(html,/One complete results record/);
 assert.match(html,/fetch\('\/results-record\.json'/);
 assert.match(html,/id="allCount"/);
 assert.match(html,/id="top5Count"/);
 assert.match(html,/id="top10Count"/);
 assert.match(html,/id="top15Count"/);
 assert.match(html,/function render\(/);
 assert.match(html,/model_separation_pp/);
 assert.match(html,/function factorAudit\(/);
 assert.match(html,/id="factorOctCases"/);
 assert.match(html,/cohort_eligibility/);
 assert.match(html,/selection_method/);
 assert.match(html,/reconstructed from saved model forecasts/);
 assert.doesNotMatch(html,/id="forward-record"/);
 assert.doesNotMatch(html,/id="reviewed-results"/);
 assert.doesNotMatch(html,/fetch\('\/results-history\.json'/);
 assert.doesNotMatch(html,/fetch\('\/v5\/prospective-record\.json'/);
 const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).filter(Boolean);
 assert.equal(scripts.length,1);
 assert.doesNotThrow(()=>new Function(scripts[0]));
});
