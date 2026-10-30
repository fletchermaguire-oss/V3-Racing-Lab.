/* Public official scratching sheets, read-only. Fail closed if ANY sheet is
 * unavailable, renamed, truncated, or fails its own published scratch count.
 * This is a live observed snapshot, NOT final field/emergency certification.
 * Runs only when a deployed Netlify function is invoked; no background polling.
 */
'use strict';
const EVENT_DATE='2026-10-31';
const URLS=Object.freeze({
 RANDWICK:'https://mdata.racingnsw.com.au/FreeFields/Scratchings.aspx?Key=2026Oct31%2CNSW%2CRoyal+Randwick',
 FLEMINGTON:'https://www.racingaustralia.horse/FreeFields/Scratchings.aspx?Key=2026Oct31%2CVIC%2CFlemington',
 ASCOT:'https://www.racingaustralia.horse/FreeFields/Scratchings.aspx?Key=2026Oct31%2CWA%2CAscot'
});
const unescapeHtml=s=>String(s).replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
 .replace(/&#(?:x([0-9a-f]+)|([0-9]+));/gi,(_,x,d)=>String.fromCodePoint(parseInt(x||d,x?16:10)))
 .replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const canonical=s=>String(s).toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
function parseOfficial(meeting,html){
 if(!Object.hasOwn(URLS,meeting)||typeof html!=='string'||html.length<500)throw Error('Missing official sheet body: '+meeting);
 const pageText=unescapeHtml(html),dateMatch=/(?:Saturday,?\s+31\s*October\s*2026|Saturday\s+31Oct2026)/i;
 if(!dateMatch.test(pageText))throw Error('Unverified meeting/date: '+meeting);
 const named=meeting==='RANDWICK'?'Australian Turf Club':meeting==='FLEMINGTON'?'Victoria Racing Club':'Western Australian Turf Club';
 if(!pageText.includes(named))throw Error('Official meeting name mismatch: '+meeting);
 const go=pageText.match(/\bTrack Condition\s*:\s*((?:Good\s*[34]|Soft\s*[567]|Heavy\s*(?:8|9|10)))\b/i)
  ||pageText.match(/\bTrack Rating\s*:\s*((?:Good\s*[34]|Soft\s*[567]|Heavy\s*(?:8|9|10)))\b/i);
 const count=pageText.match(/\bTotal Scratchings\s*:\s*(\d{1,3})\b/i),
  publication=pageText.match(/\bScratchings Last Published\s*:\s*((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}-[A-Za-z]{3}-\d{2}\s+[\d:]+(?:AM|PM)\s+[A-Z]{3,4})\b/i);
 if(!go||!count||!publication)throw Error('Missing official grade, scratching tally or publication timestamp: '+meeting);
 const grade=go[1].replace(/\s+/g,' ').replace(/^([A-Za-z])([a-z]+)/,(_,a,b)=>a.toUpperCase()+b.toLowerCase());
 const scratchings={},unknown=[],seen=new Set();
 for(const section of ['Scratchings','Late Scratchings']){
  const header=new RegExp('<h([1-6])\\b[^>]*>\\s*'+section+'\\s*<\\/h\\1\\s*>','i');
  const hm=header.exec(html);
  if(!hm)throw Error('Official '+section+' section missing: '+meeting);
  const after=html.slice(hm.index+hm[0].length),table=/<table\b[^>]*>([\s\S]*?)<\/table\s*>/i.exec(after);
  if(!table)throw Error('Official '+section+' table missing: '+meeting);
  const rows=Array.from(table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr\s*>/gi));
  let current=0;
  for(const row of rows){
   const cells=Array.from(row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td\s*>/gi)).map(x=>unescapeHtml(x[1]));
   if(!cells.length)continue;
   const prefix=cells.join(' '),race=prefix.match(/\bRace\s*(\d{1,2})\s*:/i);
   if(race)current=+race[1];
   const last=cells[cells.length-1];
   const horse=last.match(/^\s*\d{1,2}\s*e?\s+(.+?)\s+\(\d{1,2}\/\d{1,2}\s+[\d:]{3,6}[A-Z]*\)\s*$/i);
   if(!horse){
    if(!/There are no (?:late )?scratchings|^-$|^\s*$/i.test(last))unknown.push(last);
    continue;
   }
   if(current<1||current>(meeting==='FLEMINGTON'?9:10))throw Error('Scratched runner has invalid race: '+meeting+' '+current);
   const name=horse[1].trim(),id=meeting+'_R'+String(current).padStart(2,'0'),key=id+'|'+canonical(name);
   if(seen.has(key))throw Error('Duplicate official scratched runner: '+key);
   seen.add(key);(scratchings[id]||(scratchings[id]=[])).push(name);
  }
 }
 const parsed=Array.from(seen).length;
 if(parsed!==+count[1]||unknown.length)throw Error('Official scratching count/detail mismatch for '+meeting+': '+parsed+'/'+count[1]);
 return {meeting:meeting,source_url:URLS[meeting],source_last_published:publication[1],track_going:grade,
  scratched_total:parsed,scratchings:scratchings,confirmed_final_starters:false,emergencies_confirmed:false};
}
async function handler(event,context){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 const send=(statusCode,obj)=>({statusCode,headers,body:JSON.stringify(obj)});
 if(event.httpMethod!=='GET')return send(405,{error:'GET only'});
 try{
  const results=await Promise.all(Object.entries(URLS).map(async([meeting,url])=>{
   const response=await fetch(url,{headers:{Accept:'text/html'},signal:AbortSignal.timeout(12000)});
   if(!response.ok)throw Error('Official sheet unavailable: '+meeting+' HTTP '+response.status);
   return parseOfficial(meeting,await response.text());
  }));
  return send(200,{schema:'racing-lab-official-sheets/v1',race_date:EVENT_DATE,
   status:'OFFICIAL_SHEETS_RECONCILED',observed_at:new Date().toISOString(),
   publication_approved:false,final_fields_verified:false,
   notice:'Source-published scratching sheets and track grades only. Late scratches and emergency activations require further verification.',
   meetings:results});
 }catch(e){
  return send(503,{status:'OFFICIAL_REFRESH_FAILED',error:String(e.message).slice(0,220),
   notice:'Saved source remains in place; never silently substitute unverified scratchings.'});
 }
}
exports.handler=handler;
exports.parseOfficial=parseOfficial;
exports.OFFICIAL_URLS=URLS;
