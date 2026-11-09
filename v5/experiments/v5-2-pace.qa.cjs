'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const Pace=require('./compare-v5-2-pace.cjs');
const Base=require('./model-v5-1.cjs');
const Candidate=require('./model-v5-2-pace.cjs');
test('pace candidate remains experimental and same full-field chance normalization applies',()=>{
 assert.notEqual(Candidate.VERSION,Base.VERSION);
 assert.deepEqual(Candidate.CONFIG,Base.CONFIG);
 const x=Pace.compare();
 assert.equal(x.release_decision,'REJECT_NOT_ENOUGH_WIN_RATE_GAIN');
 assert.equal(x.history.races,71);
 assert.equal(x.november_seventh.races,20);
 assert.equal(x.history.leader_changes,0);
 assert.equal(x.november_seventh.leader_changes,0);
 assert.equal(x.history.base_top1,x.history.pace_top1);
 assert.equal(x.november_seventh.base_top1,x.november_seventh.pace_top1);
});
test('replaying actual dated form shows no rank gain and slightly worse 7 Nov score',()=>{
 const x=Pace.compare();
 assert(x.history.pace_brier<=x.history.base_brier);
 assert(x.november_seventh.pace_brier>=x.november_seventh.base_brier);
 assert(x.november_seventh.pace_logloss>=x.november_seventh.base_logloss);
 const asc=x.groups.find(g=>g.date==='2026-11-07/ASCOT/FULL');
 assert(asc);
 assert(asc.pace_candidate.multiclass_brier>asc.baseline.multiclass_brier);
});
