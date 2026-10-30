'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('./audit-flat-races.cjs');
test('whole-field audit detects near-uniform racing chances without altering production formula',()=>{
 const a=A.output;
 assert.equal(a.fields.races,29);
 assert.ok(a.fields.active>300);
 assert.equal(a.retrospectiveOnly.races,49);
 assert.equal(a.retrospectiveOnly.sensitivity.length,12);
 assert.ok(a.flatRaces.every(r=>r.minPct>0&&r.topPct>r.secondPct));
 const baseline=a.retrospectiveOnly.sensitivity.find(x=>x.temperature===.78&&x.uniformReserve===.15);
 assert.ok(baseline&&Number.isFinite(baseline.brier)&&Number.isFinite(baseline.logLoss));
 console.log('V5_FLAT_AUDIT_REPORT '+JSON.stringify(a));
});
