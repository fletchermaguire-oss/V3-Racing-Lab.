'use strict';
/* A read-only regression check: the dated shadow must be reproducible from
 * original immutable full-field V5 scores and dated speedmap source. */
const assert=require('node:assert/strict');
const source=require('./pace-speedmap-source-20261103.json');
const saved=require('./pace-conditional-20261103.json');
const rebuilt=require('./pace-conditional.cjs').build();
assert.deepStrictEqual(rebuilt,saved,'Committed conditional pace board did not reproduce');
assert.equal(saved.calibrated,false);
assert.equal(saved.publication_approved,false);
assert.equal(saved.site_deployed,false);
assert.equal(saved.method.no_afs_aes_coefficient,true);
assert.equal(saved.method.pace_strength,.3);
assert.equal(saved.races.length,9);
let checks=0,listed=0,removed=0,paceChanged=0;
const allIds=new Set();
for(const race of saved.races){
  listed+=race.pdf_listed;removed+=race.listed_scratchings.length;
  const evidence=source.race_coverage.find(x=>x.race_id===race.race_id);
  assert.ok(evidence);
  assert.equal(evidence.source_rows,race.listed_active);
  assert.equal(race.pdf_listed-race.listed_scratchings.length,race.listed_active);
  assert.equal(race.field_verified,false);
  for(const [going,s] of Object.entries(race.scenarios)){
    for(const [name,standings] of Object.entries(s)){
      if(!Array.isArray(standings))continue;
      const n=name.startsWith('scratch')?race.listed_active:race.pdf_listed;
      assert.equal(standings.length,n,race.race_id+'/'+going+'/'+name);
      assert.ok(standings.every(x=>x.conditional_pct_exact>0&&x.conditional_pct_exact<100));
      const sum=standings.reduce((acc,x)=>acc+x.conditional_pct_exact,0);
      assert.ok(Math.abs(sum-100)<1e-8,race.race_id+'/'+name+'/'+going);
      assert.equal(new Set(standings.map(x=>x.runner_id)).size,n);
      standings.forEach((x,i)=>assert.equal(x.rank,i+1));
      checks++;
    }
    const a=s.scratch_exclusions_only,b=s.scratch_plus_pace;
    assert.deepEqual(a.map(x=>x.runner_id).sort(),b.map(x=>x.runner_id).sort());
    if(s.pace_rule.direction===0){
      for(const x of a){
        const y=b.find(z=>z.runner_id===x.runner_id);
        assert.ok(Math.abs(x.conditional_pct_exact-y.conditional_pct_exact)<1e-10);
      }
    }else paceChanged++;
  }
  for(const x of race.scenarios.Good4.scratch_plus_pace){
    assert.ok(!allIds.has(x.runner_id));allIds.add(x.runner_id);
  }
}
assert.deepEqual([listed,removed,allIds.size,checks],[149,6,143,72]);
assert.ok(paceChanged>0);
const oaks=source.race_coverage.find(x=>x.race_number===8);
assert.equal(oaks.aes_numeric,2);assert.equal(oaks.afs_numeric,2);
console.log(JSON.stringify({schema:saved.schema,reproducible:true,races:9,pdf_runners:149,
  scratched:6,conditional_runners:143,whole_field_distributions:72,
  nonneutral_going_scenarios:paceChanged,source_oaks_numerical_speed_coverage:'2/20',
  calibration:false,publication:false},null,2));
