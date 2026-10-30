const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const boardFile = path.join(root, 'published-board.json');
const board = JSON.parse(fs.readFileSync(boardFile, 'utf8'));
const p = board.publication || {};
const now = new Date();
const brisbane = new Intl.DateTimeFormat('en-CA', {timeZone:'Australia/Brisbane',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
const fields = Object.fromEntries(brisbane.map(x=>[x.type,x.value]));
const day = `${fields.year}-${fields.month}-${fields.day}`;
const dry = process.argv.includes('--dry-run');
if (fields.weekday !== 'Sat' && !dry) throw Error('Refusing to lock outside Brisbane Saturday');
if (p.status !== 'PUBLISHED' || p.reviewed !== true || p.frozen !== true) throw Error('Board not published, reviewed and frozen; no lock created');
if (p.date !== day && !dry) throw Error(`Board date ${p.date} does not match Brisbane Saturday ${day}`);
if (!p.date || !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) throw Error('Missing valid publication.date');
const entries = board.selections;
if (!Array.isArray(entries) || entries.length !== 10) throw Error('Exactly ten independently ranked, explicit pre-race selections required');
const finalFieldAt = p.finalFieldCheckAt;
if (typeof finalFieldAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(finalFieldAt) ||
    !Number.isFinite(Date.parse(finalFieldAt)) || Date.parse(finalFieldAt) > now.getTime() ||
    Date.parse(finalFieldAt) < Date.parse(p.date+'T00:00:00+10:00'))
  throw Error('Independently verified race-day final field check required before locking');
if (now.getTime() < Date.parse(p.date+'T00:00:00Z') && !dry)
  throw Error('Ascot scratching deadline (10:00 Brisbane) has not closed; refusing early multi-meeting lock');
if (!Array.isArray(board.races) || !board.races.length ||
    !Array.isArray(board.records) || board.races.some(r=>r.fieldVerified!==true))
  throw Error('All official race fields must be independently verified before locking');
const seen = new Set(), ranks = new Set();
const valid = entries.map(r=>{
  if (!r.meeting || !Number.isInteger(Number(r.race)) || !r.horse || !r.model || !Number.isFinite(Number(r.predicted_win_pct)) || Number(r.predicted_win_pct)<=0 || Number(r.predicted_win_pct)>100) throw Error('Invalid selection: missing meeting, race, horse, model or probability');
  const key = `${r.meeting}|${r.race}`;
  if (seen.has(key)) throw Error(`Duplicate race selection ${key}`);
  if (!Number.isSafeInteger(r.rank) || r.rank < 1 || r.rank > 10 || ranks.has(r.rank))
    throw Error('Duplicate or missing independent research rank');
  const raceId = `${r.meeting}_R${String(r.race).padStart(2,'0')}`;
  const race = board.races.find(x=>x.id===raceId);
  const starters = board.records.filter(x=>x.race===raceId && x.status==='ACTIVE');
  if (!race || race.fieldVerified!==true || starters.length!==race.declaredActiveCount ||
      starters.filter(x=>x.name===r.horse).length!==1)
    throw Error('Selected runner not independently verified in final active field: '+key);
  if (typeof r.race_at_utc!=='string' || !/^\d{4}-\d{2}-\d{2}T\d\d:\d\d:\d\dZ$/.test(r.race_at_utc) ||
      !Number.isFinite(Date.parse(r.race_at_utc)) || Date.parse(r.race_at_utc)<=now.getTime() ||
      !/^https:\/\//.test(r.race_start_source||''))
    throw Error('Verified future race start and independent source required for '+key);
  seen.add(key);ranks.add(r.rank);
  return {date:p.date,rank:r.rank,meeting:r.meeting,race:Number(r.race),horse:r.horse,model:r.model,
    predicted_win_pct:Number(r.predicted_win_pct),reliability:r.reliability ?? null,
    warning_flags:r.warning_flags ?? [],race_at_utc:r.race_at_utc,race_start_source:r.race_start_source};
}).sort((a,b)=>a.rank-b.rank);
if (ranks.size!==10) throw Error('Independent Top 10 has incomplete rank coverage');
const top10 = valid;
const destination = path.join(root, 'locked-selections', `${p.date}.json`);
if (fs.existsSync(destination)) { console.log(`Already locked: ${destination}. No overwrite.`); process.exit(0); }
const snapshot = {schema_version:1,date:p.date,locked_at_utc:now.toISOString(),lock_time_zone:'Australia/Brisbane',model_source:'published-board.json',source_sha256:crypto.createHash('sha256').update(fs.readFileSync(boardFile)).digest('hex'),status:'LOCKED',retrospective:false,selections:top10};
if (dry) {console.log(JSON.stringify(snapshot,null,2));process.exit(0);}
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
console.log(`Locked ${top10.length} selections to ${destination}`);
