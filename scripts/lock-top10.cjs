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
if (!Array.isArray(entries) || entries.length < 10) throw Error('Need at least ten explicit pre-race selections');
const seen = new Set();
const valid = entries.map(r=>{
  if (!r.meeting || !Number.isInteger(Number(r.race)) || !r.horse || !r.model || !Number.isFinite(Number(r.predicted_win_pct)) || Number(r.predicted_win_pct)<=0 || Number(r.predicted_win_pct)>100) throw Error('Invalid selection: missing meeting, race, horse, model or probability');
  const key = `${r.meeting}|${r.race}`;
  if (seen.has(key)) throw Error(`Duplicate race selection ${key}`);
  seen.add(key);
  return {date:p.date,meeting:r.meeting,race:Number(r.race),horse:r.horse,model:r.model,predicted_win_pct:Number(r.predicted_win_pct),reliability:r.reliability ?? null,warning_flags:r.warning_flags ?? []};
}).sort((a,b)=>b.predicted_win_pct-a.predicted_win_pct||a.meeting.localeCompare(b.meeting)||a.race-b.race);
const top10 = valid.slice(0,10);
const destination = path.join(root, 'locked-selections', `${p.date}.json`);
if (fs.existsSync(destination)) { console.log(`Already locked: ${destination}. No overwrite.`); process.exit(0); }
const snapshot = {schema_version:1,date:p.date,locked_at_utc:now.toISOString(),lock_time_zone:'Australia/Brisbane',model_source:'published-board.json',source_sha256:crypto.createHash('sha256').update(fs.readFileSync(boardFile)).digest('hex'),status:'LOCKED',retrospective:false,selections:top10};
if (dry) {console.log(JSON.stringify(snapshot,null,2));process.exit(0);}
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});
console.log(`Locked ${top10.length} selections to ${destination}`);
