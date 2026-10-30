'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {parseOfficial}=require('../netlify/functions/v5-official.js');
const State=require('./site-state.js'),Data=require('./research.json');
const Official=require('./official-snapshot-20261030.json');
const Checkpoint=require('./shortlists/2026-10-30-independent-top10.json');
const copy=x=>JSON.parse(JSON.stringify(x));
function html(meeting,count,trs,going='Good 4'){
 const club={RANDWICK:'Australian Turf Club',FLEMINGTON:'Victoria Racing Club',
  ASCOT:'Western Australian Turf Club'}[meeting];
 return '<html><body><h2>Saturday, 31 October 2026 '+club+'</h2>'+
  '<p><b>Track Condition:</b> '+going+'<br><b>Scratchings Last Published:</b> Fri 30-Oct-26 8:10AM AEDT</p>'+
  '<p><strong>Total Scratchings :</strong> '+count+'</p>'+
  '<h3>Scratchings</h3><table>'+trs+'</table>'+
  '<h3>Late Scratchings</h3><table><tr><td>There are no late scratchings</td></tr></table>'+
  ('<p>Source worksheet and meeting field metadata.</p>'.repeat(15))+'</body></html>';
}
const line=(race,horse,blank=false)=>'<tr><td>'+(blank?' ':('Race '+race+':'))+
 '</td><td>'+horse+' (30/10 0810)</td></tr>';
function publishedSheet(meeting,additional=[],going='Good 4'){
 const rows=Object.entries(Official.scratchings).filter(([race])=>race.startsWith(meeting+'_R'))
  .flatMap(([race,names])=>names.map(horse=>[Number(race.split('_R')[1]),horse]))
  .concat(additional);
 return parseOfficial(meeting,html(meeting,rows.length,rows.map(([race,horse])=>line(race,'1 '+horse)).join(''),going));
}
function sheets(){
 return {
  schema:'racing-lab-official-sheets/v1',status:'OFFICIAL_SHEETS_RECONCILED',
  race_date:'2026-10-31',publication_approved:false,final_fields_verified:false,
  observed_at:'2026-10-30T09:42:00Z',
  meetings:[
   publishedSheet('RANDWICK'),
   publishedSheet('FLEMINGTON',[[5,'ESTREMO'],[9,'GENEROSITY']]),
   publishedSheet('ASCOT',[],'Soft 5')
  ]
 };
}
test('parse official same-day scratching table, source publication time, country suffix and provisional track grade',()=>{
 const x=parseOfficial('RANDWICK',html('RANDWICK',2,
  line(5,'1 MEDATSU (NZ)')+line(5,'3 BARRENGARRY',true)));
 assert.equal(x.source_last_published,'Fri 30-Oct-26 8:10AM AEDT');
 assert.equal(x.track_going,'Good 4');
 assert.equal(x.scratched_total,2);
 assert.deepEqual(x.scratchings.RANDWICK_R05,['MEDATSU (NZ)','BARRENGARRY']);
 assert.equal(x.confirmed_final_starters,false);
});
test('an incomplete, foreign, malformed, duplicate, or count-conflicting official sheet is rejected',()=>{
 assert.throws(()=>parseOfficial('RANDWICK','<html>tiny</html>'),/Missing official sheet/);
 assert.throws(()=>parseOfficial('RANDWICK',html('RANDWICK',2,line(8,'12 BARRENGARRY'))),/count\/detail mismatch/);
 assert.throws(()=>parseOfficial('RANDWICK',html('RANDWICK',2,
  line(8,'12 BARRENGARRY')+line(8,'12 BARRENGARRY',true))),/Duplicate official/);
 assert.throws(()=>parseOfficial('RANDWICK',html('FLEMINGTON',0,'')),/meeting name mismatch/);
 assert.throws(()=>parseOfficial('RANDWICK',html('RANDWICK',1,line(8,'12 BARRENGARRY'))
  .replace('31 October 2026','7 November 2026')),/meeting\/date/);
 assert.throws(()=>parseOfficial('RANDWICK',html('RANDWICK',1,line(8,'12 BARRENGARRY'))
  .replace('Scratchings Last Published:', 'Unpublished:')),/publication timestamp/);
});
test('atomic official scratchings apply to every consumer and preserve archived ranked names',()=>{
 const C=State.create(State.applyOfficialOverlay(Data,Official),{going:Official.going,checkpoint:Checkpoint});
 const initial=C.board.activeCount,picks=C.curated.entries.map(x=>x.horse);
 C.applyOfficialSheets(sheets());
 assert.equal(C.board.activeCount,initial-1,'Generosity is newly scratched; Estremo was an unactivated emergency and already excluded');
 assert.equal(C.board.baseline.records.some(x=>x.horse==='Estremo'&&x.meeting==='FLEMINGTON'),false);
 assert.equal(C.board.baseline.records.some(x=>x.horse==='Generosity'&&x.meeting==='FLEMINGTON'&&x.race===9),false);
 assert.deepEqual(C.curated.entries.map(x=>x.horse),picks);
 assert.equal(C.official.matched_scratchings,sheets().meetings.reduce((n,m)=>n+m.scratched_total,0));
 assert.equal(C.official.final_fields_verified,false);
 assert.equal(C.board.publication_blocked,true);
 assert.ok(C.researchHistory.every(x=>x.approval===undefined||x.approval==='RESEARCH_ONLY'));
});
test('official change to Soft track preserves selected manual scenario while updating underlying source',()=>{
 const C=State.create(State.applyOfficialOverlay(Data,Official),{going:Official.going,checkpoint:Checkpoint});
 C.setGoing('FLEMINGTON','Heavy 8');
 const x=sheets();x.meetings.find(s=>s.meeting==='FLEMINGTON').track_going='Soft 5';
 C.applyOfficialSheets(x);
 assert.equal(C.going.FLEMINGTON,'Heavy 8','Explicit scenario should not be silently overwritten by official going');
 assert.equal(C.officialGoing.FLEMINGTON,'Soft 5');
 assert.equal(C.curated.entries.find(r=>r.horse==='Lady Shenandoah').race_day_assessment,'CONDITIONAL_REVIEW');
});
test('unknown official runner, replay, incomplete meetings and mismatched date leave board unchanged',()=>{
 const C=State.create(State.applyOfficialOverlay(Data,Official),{going:Official.going,checkpoint:Checkpoint});
 const before=C.revision,rows=C.board.baseline.records.map(r=>[r.id,r.p]);
 const cases=[
  x=>{x.meetings.pop();},
  x=>{x.race_date='2026-11-07';},
  x=>{x.meetings[0].scratchings.RANDWICK_R08=['NOT A HORSE'];},
  x=>{x.meetings[0].scratched_total=2;},
  x=>{x.meetings[1].track_going='Not verified';},
  x=>{x.meetings[0].source_last_published='';}
 ];
 for(const mutate of cases){
  const s=sheets();mutate(s);assert.throws(()=>C.applyOfficialSheets(s));
  assert.equal(C.revision,before);assert.deepEqual(C.board.baseline.records.map(r=>[r.id,r.p]),rows);
 }
 C.applyOfficialSheets(sheets());
 assert.throws(()=>C.applyOfficialSheets(sheets()),/Stale or invalid/);
});


test('late scratching table is included in counted official field reconciliation',()=>{
 const doc=html('FLEMINGTON',2,line(5,'1 PERICLES')).replace(
  '<tr><td>There are no late scratchings</td></tr>',
  line(9,'2 GENEROSITY'));
 const sheet=parseOfficial('FLEMINGTON',doc);
 assert.equal(sheet.scratched_total,2);
 assert.deepEqual(sheet.scratchings.FLEMINGTON_R05,['PERICLES']);
 assert.deepEqual(sheet.scratchings.FLEMINGTON_R09,['GENEROSITY']);
 const invalid=html('FLEMINGTON',2,line(9,'2 GENEROSITY')).replace(
  '<tr><td>There are no late scratchings</td></tr>',line(9,'2 GENEROSITY'));
 assert.throws(()=>parseOfficial('FLEMINGTON',invalid),/Duplicate official/);
});


test('old source publications, disappearing prior scratchings and same-time conflicting names are rejected',()=>{
 const C=State.create(State.applyOfficialOverlay(Data,Official),{going:Official.going,checkpoint:Checkpoint});
 const initial=C.revision;
 let old=sheets();old.meetings[0].source_last_published='Thu 29-Oct-26 8:10AM AEDT';
 assert.throws(()=>C.applyOfficialSheets(old),/older published/);
 let missing=sheets();
 const r=Object.keys(missing.meetings[0].scratchings)[0];
 missing.meetings[0].scratchings[r].pop();missing.meetings[0].scratched_total--;
 assert.throws(()=>C.applyOfficialSheets(missing),/Previously confirmed/);
 let future=sheets();future.meetings[0].source_last_published='Sat 31-Oct-26 8:10AM AEDT';
 assert.throws(()=>C.applyOfficialSheets(future),/future or older/);
 assert.equal(C.revision,initial);
 C.applyOfficialSheets(sheets());
 const unchanged=sheets();unchanged.observed_at='2026-10-30T09:47:00Z';
 const after=C.revision;let updates=0;C.subscribe(()=>updates++);
 C.applyOfficialSheets(unchanged);
 assert.equal(C.revision,after);
 assert.equal(updates,0,'unchanged published feed must not reset simulator');
 assert.equal(C.official.observed_at,'2026-10-30T09:47:00Z','no-op still advances request watermark');
 const delayed=sheets();delayed.observed_at='2026-10-30T09:46:00Z';
 assert.throws(()=>C.applyOfficialSheets(delayed),/Stale or invalid/);
 const conflict=sheets();conflict.observed_at='2026-10-30T09:50:00Z';
 conflict.meetings[0].scratchings.RANDWICK_R08.push('SHEZA ALIBI');
 conflict.meetings[0].scratched_total++;
 assert.throws(()=>C.applyOfficialSheets(conflict),/Conflicting official/);
 assert.equal(C.revision,after);
});
test('published track grade can change without a newer scratching publication',()=>{
 const C=State.create(State.applyOfficialOverlay(Data,Official),{going:Official.going,checkpoint:Checkpoint});
 C.applyOfficialSheets(sheets());
 const revised=sheets();revised.observed_at='2026-10-30T09:48:00Z';
 revised.meetings[0].track_going='Soft 5';
 C.applyOfficialSheets(revised);
 assert.equal(C.officialGoing.RANDWICK,'Soft 5');
 assert.equal(C.going.RANDWICK,'Soft 5');
});


test('feed failures and recovery remain status-only, independently tracked without restarting simulator',()=>{
 const C=State.create(State.applyOfficialOverlay(Data,Official),{going:Official.going,checkpoint:Checkpoint});
 const initial=C.revision;let rerenders=0,statusUpdates=0;
 C.subscribe((_,event)=>{if(event&&event.statusOnly)statusUpdates++;else rerenders++;});
 C.reportError('Official update unavailable; saved field retained: timeout');
 C.reportError('Saved board retained: Airtable timeout');
 C.reportError('Official update unavailable; saved field retained: timeout');
 assert.equal(statusUpdates,2);
 assert.equal(rerenders,0);
 assert.equal(C.revision,initial);
 assert.match(C.error,/Official update/);assert.match(C.error,/Airtable/);
 C.applyOfficialSheets(sheets());
 assert.equal(rerenders,1,'a real field revision can rebuild the simulator');
 assert.doesNotMatch(C.error,/Official update/);
 assert.match(C.error,/Airtable/,'one feed recovery must not hide another feed failure');
 const latest=C.revision;
 C.reportError('Official update unavailable; saved field retained: connection');
 const newRequest=sheets();newRequest.observed_at='2026-10-30T09:49:00Z';
 C.applyOfficialSheets(newRequest);
 assert.equal(C.revision,latest);
 assert.equal(rerenders,1,'unchanged official recovery must not remount the simulator');
 assert.doesNotMatch(C.error,/Official update/);
 assert.match(C.error,/Airtable/);
});
