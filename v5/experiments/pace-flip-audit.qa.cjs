'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const A=require('./pace-flip-audit.cjs'),P=require('./pace-map-shadow.cjs');
test('reproduces independent 91-race baseline and exact paired win differences',()=>{
 const x=A.evaluate();assert.equal(x.scope_races,91);
 assert.equal(x.days.reduce((s,d)=>s+d.baseline_hits,0),27);
 assert.equal(x.days.reduce((s,d)=>s+d.challenger_hits,0),28);
 assert.equal(x.gained_winners-x.lost_winners,1);
 assert.equal(x.leader_changes,x.gained_winners+x.lost_winners+x.switched_between_losers);
 assert.equal(x.formula_changed_in_production,false);
});
test('zero-strength pace retains original L5 exactly and insufficient history abstains',()=>{
 const rows=Array.from({length:10},(_,i)=>({id:'H'+i,horse:'Horse '+i,p_exact:10,settle_fraction:i===0?0.1:null}));
 const neutral=P.predict(rows,.30);
 assert.equal(neutral.pace.status,'INSUFFICIENT_SETTLING_EVIDENCE');
 assert.ok(neutral.rows.every(r=>Math.abs(r.probability-.1)<1e-12));
});
