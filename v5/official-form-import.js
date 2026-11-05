'use strict';
/* Racing Australia FreeFields pre-race FORM markdown -> dated V5 research.
 * Fail closed on source inventory mismatch; Heavy 10 is a single going token.
 * No prices, future starts, trials, or results enter the probability engine.
 * The generated card is NEVER an approved race-day field or pick.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.RacingLabOfficialFormImport=api;
})(typeof window!=='undefined'?window:globalThis,function(){
'use strict';
const MONTH={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
const MONTH_NAMES=Object.keys(MONTH);
const e=x=>String(x||'').trim();
function dateFromRace(t){
 const m=e(t).match(/^(\d{1,2})([A-Z][a-z]{2})(\d{2})$/);
 if(!m||!MONTH[m[2]])return null;
 const iso='20'+m[3]+'-'+String(MONTH[m[2]]).padStart(2,'0')+'-'+m[1].padStart(2,'0');
 return Number.isFinite(Date.parse(iso+'T00:00:00Z'))?{iso:iso,au:Number(m[1])+'/'+MONTH[m[2]]+'/20'+m[3]}:null;
}
function stats(b,label){
 const x=b.match(new RegExp('\\*\\*'+label+':\\*\\*\\s*(\\d+):(\\d+)-(\\d+)-(\\d+)','i'));
 if(!x)return null;
 const n=+x[1],w=+x[2],p=+x[3]+ +x[4];
 if(w+p>n)throw Error('Impossible '+label+' record');
 return {n:n,w:w,p:p,model:w+'-'+p+'-'+n};
}
function labelClass(t){
 const x=e(t).toUpperCase();
 const g=x.match(/\bG([123])\b/);if(g)return 'OPEN Group G'+g[1];
 if(/\bLR\b|\bLISTED\b/.test(x))return 'LISTED';
 const bm=x.match(/\bBM-?(\d+)\b/);if(bm)return 'BM'+bm[1];
 const cl=x.match(/\bCL([1-6])\b/);if(cl)return 'CL'+cl[1];
 if(/\bMDN\b|\bMAIDEN\b/.test(x))return 'MAIDEN';
 return 'OPEN'; // Unknown grade: reviewed separately; avoid assumed G1.
}
function importForm(markdown,opts){
 const o=opts||{},date=e(o.date),meeting=e(o.meeting).toUpperCase(),cutoff=e(o.cutoff_date||date);
 if(!/^\d{4}-\d\d-\d\d$/.test(date)||!/^\d{4}-\d\d-\d\d$/.test(cutoff)||cutoff>date||
   !/^[A-Z][A-Z ]{2,30}$/.test(meeting)||!/^https:\/\//.test(e(o.source_url)))
  throw Error('Dated meeting, pre-race cutoff and HTTPS official source are mandatory');
 const s=e(markdown).replace(/\u00a0/g,' ').replace(/\r/g,'');
 if(!s.includes('**FinalFields Last Published:**')||!s.includes('**Track Condition:**'))
  throw Error('Not an official dated final-fields FORM sheet');
 const venue=o.venue||({ROSEHILL:'Rosehill',FLEMINGTON:'Flemington',ASCOT:'Ascot'}[meeting]);
 if(!new RegExp('^## '+venue+':','i').test(s))throw Error('Wrong official meeting: '+meeting);
 const report=s.match(/\*\*Track Condition:\*\*\s*([^\n]+)/),rail=s.match(/\*\*Rail Position:\*\*\s*([^\n]+)/),
  published=s.match(/\*\*FinalFields Last Published:\*\*\s*([^\n]+)/),dateM=s.match(/^(?:## )?[^:\n]+:.*?(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s*(\d{2}) ([A-Za-z]+) (\d{4})/m);
 if(!dateM||dateM[3]+'-'+String(MONTH[dateM[2].slice(0,3)]||0).padStart(2,'0')+'-'+dateM[1]!==date)throw Error('Official sheet race date does not match requested meeting');
 const chunks=s.split(/(?=^\| Race \d+ -)/m).slice(1), expectedRaces=Number(o.expected_races),expectedEntries=Number(o.expected_acceptors);
 if(!chunks.length||Number.isFinite(expectedRaces)&&chunks.length!==expectedRaces)throw Error('Incomplete official race inventory');
 const card={schema:'racing-lab-official-form-research/v1',date:date,saved_at:cutoff,publication:{approved:false,status:'RESEARCH_ONLY',model_probabilities_published:false},
  source_import:{source:e(o.source_url),source_published:e(published&&published[1]),source_checked_at:e(o.source_checked_at),source_date:date,going_report:e(report&&report[1]),rail:e(rail&&rail[1]),parser:'v5/official-form-import.js',notes:'No race-day starter certification or empirical probability calibration'},
  races:[],runners:[],expected_inventory:{races:chunks.length,runners:Number.isFinite(expectedEntries)?expectedEntries:0}};
 const scratches=new Map((o.scratchings||[]).map(x=>[+x.race+':'+x.number,true]));
 let futureExcluded=0,invalid=0,heavy10=0,sourceLines=0;
 for(const chunk of chunks){
  const head=chunk.match(/^\| Race (\d+) - (\d{1,2}:\d\d(?:AM|PM))\s+([^(]+?)\s+\((\d+) METRES\)/);
  if(!head)throw Error('Invalid official race header');
  const n=+head[1],rid=date+'_'+meeting+'_R'+String(n).padStart(2,'0');
  if(card.races.some(r=>r.id===rid))throw Error('Duplicate race '+n);
  const entries=[...chunk.matchAll(/^\|\s*(\d+e?)\s*\|\s*([^|\n]*)\|\s*([^|\n]*)\|\s*([^|\n]*)\|\s*([^|\n]*)\|\s*(\d+)\s*\|\s*([\d.]+)kg/gm)];
  const markers=[...chunk.matchAll(/^\|\s*(\d{1,2})\s+([^\n]+?)\s+\d+\s+year old\b/gm)];
  if(!entries.length||entries.length!==markers.length)throw Error('Runner detail/count mismatch race '+n+': '+entries.length+'/'+markers.length);
  const blocks=new Map(markers.map((m,i)=>[+m[1],chunk.slice(m.index,i+1<markers.length?markers[i+1].index:chunk.length)]));
  card.races.push({id:rid,meeting:meeting,race:n,title:e(head[3]),distance_m:+head[4],
   local_start:head[2],field_count:entries.length,field_verified:false,going_verified:false,
   source_notes:'Official accepted field ('+e(published&&published[1])+'); not final starters. '+e(report&&report[1])+' and rail '+e(rail&&rail[1])+'.'});
  for(const row of entries){
   const no=+row[1].replace('e',''),horse=e(row[3]),block=blocks.get(no);
   if(!block||!horse)throw Error('Runner details missing '+rid+' #'+no);
   const forms=[],mapped=[],savedDates=new Set(),trials=[];
   // The anchored result pattern deliberately excludes starred "T" trial lines.
   const lines=/\|\s*(\d+)\s+of\s+(\d+)\s*\|\s*\*{0,4}([A-Z][A-Z .]+?)\s+(\d{1,2}[A-Za-z]{3}\d{2})\*{0,4}\s+(\d+)m\s+(Good\d|Soft\d|Heavy\d{1,2}|Synth)\s+([^|]*)/g;
   for(const m of block.matchAll(lines)){
    const when=dateFromRace(m[4]);if(!when){invalid++;continue;}
    if(when.iso>=cutoff){futureExcluded++;continue;}
    const surface=m[6][0].toUpperCase();if(surface==='S'&&m[6]==='Synth')continue;
    if(m[6]==='Heavy10')heavy10++;
    const rest=m[7],cls=e(rest.split(/\s+\$\d/)[0]),key=when.iso;
    const margin=rest.match(/\b\d:\d\d\.\d{2}\s*(?:\([^)]*\))?,\s*([\d.]+)L/)?.[1]||
                  rest.match(/,\s*([\d.]+)L(?:,|\s+\$|\s*$)/)?.[1];
    if(margin===undefined){invalid++;continue;}
    if(savedDates.has(key))throw Error('Conflicting historical start on '+key+' for '+horse);
    savedDates.add(key);sourceLines++;
    forms.push(when.au+' '+e(m[3])+' '+Number(m[5])+'m ('+surface+'), '+labelClass(cls)+': '+Number(m[1])+'/'+Number(m[2])+', PDF margin '+Number(margin)+'L');
    const pos=rest.match(/\b(\d+)(st|nd|rd|th)@800m/);
    if(pos)mapped.push('Settled '+pos[1]+pos[2]+' 800m ('+when.au+')');
   }
   const isScratch=scratches.has(n+':'+no);
   const ss={Career:stats(block,'Record'),course:stats(block,'Track'),distance:stats(block,'Dist'),Good:stats(block,'Good'),Soft:stats(block,'Soft'),Heavy:stats(block,'Heavy')};
   if(!ss.Career&&!isScratch)throw Error('Career record missing for active entrant '+horse);
   const note=block.match(/\*\*Gear Changes:\*\*\s*([^|]+)/);
   const isReserve=row[1].endsWith('e');
   const status=isScratch?'SCRATCHED - official as of '+e(o.source_checked_at):isReserve?'EMERGENCY - unactivated':'ACCEPTED_NOT_FINAL';
   card.runners.push({id:rid+'_'+String(no).padStart(2,'0'),race_id:rid,horse:horse,tab:no,barrier:Number(row[6]),
    weight_kg:Number(row[7]),trainer:e(row[4]),jockey:e(row[5]),status:status,
    statistics:Object.entries(ss).map(([k,v])=>k+' '+(v?v.model:'0-0-0')).join('; '),
    form:forms.join('\n'),historical_map:mapped.join('; '),gear_source_notes:note?[e(note[1])]:[],
    source:{url:e(o.source_url),published:e(published&&published[1]),cutoff:cutoff},
    strengths:'Official past race statistics and dated finishes; '+forms.length+' completed runs parsed.',
    risks:'Pre-final fields; unknown current bias, pace and trainer intent; V5 estimates uncalibrated.'});
  }
 }
 if(!card.runners.length||(Number.isFinite(expectedEntries)&&card.runners.length!==expectedEntries))throw Error('Official form importer did not reconcile acceptance inventory '+card.runners.length+' != '+expectedEntries);
 if(scratches.size!==card.runners.filter(r=>r.status.startsWith('SCRATCHED')).length)throw Error('Unmatched official scratching declarations');
 if(!card.races.every((r,i)=>r.race===i+1))throw Error('Race order invalid');
 card.import_audit={entries:card.runners.length,listed_races:card.races.length,active_accepted:card.runners.filter(r=>r.status==='ACCEPTED_NOT_FINAL').length,
  published_scratchings:scratches.size,unactivated_emergencies:card.runners.filter(r=>r.status.startsWith('EMERGENCY')).length,
  historical_form_lines:sourceLines,heavy10_lines_recognized:heavy10,unparseable_historical_lines:invalid,
  future_or_same_day_lines_excluded:futureExcluded,official_going:e(report&&report[1]),rail:e(rail&&rail[1]),all_final_starters_verified:false};
 return card;
}
return Object.freeze({importForm,dateFromRace});
});
