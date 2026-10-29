'use strict';
/* Published probabilities are not regenerated during a 31 October research-only release. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8');
const raw=JSON.parse(fs.readFileSync('v5/research.json','utf8'));
const board=JSON.parse(fs.readFileSync('published-board.json','utf8'));
assert(html.includes('window.RacingLabApp'), 'Original homepage/engine missing');
assert(html.includes('/v5/reader.js'), 'V5 reader missing');
assert.equal(raw.schema,'racing-lab-v5-research/2026-10-29','Snapshot schema mismatch');
assert.equal(raw.date,'2026-10-31','Wrong research date');
assert.equal(raw.publication.approved,false,'Research must not publish predictions');
assert.equal(raw.races.length,29,'All 29 races required');
assert.equal(raw.runners.length,408,'All 408 PDF entries required');
assert.equal(raw.runners.filter(x=>x.original_pick).length,19,'Must preserve 19 qualitative leaders');
assert(!raw.runners.some(x=>Object.hasOwn(x,'win_probability')),'Do not publish unapproved win percentages');
assert.notEqual(board.publication?.status,'APPROVED','Stale previous meeting marked as approved');
assert(fs.existsSync('v5/reader.css')&&fs.existsSync('v5/reader.js'),'Missing V5 resources');
console.log('PASS: Original racing interface preserved; 29 races; 408 runners; 19 original selections; read-only Good4 research. No forecasts approved.');
