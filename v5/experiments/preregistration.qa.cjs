'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const p=require('./2026-11-07-shadow-preregistration.json');
const sha=file=>{
 const b=fs.readFileSync(path.join(__dirname,'..','..',file));
 return crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex');
};
test('next Saturday challenger is registered in advance with exact immutable model blobs',()=>{
 assert.equal(p.schema,'racing-lab-shadow-pre-registration/v1');
 assert.equal(p.race_date,'2026-11-07');assert.equal(p.registered_date,'2026-11-03');
 assert.deepEqual(p.meetings,['FLEMINGTON','ROSEHILL']);
 assert.equal(sha(p.original.path),p.original.git_blob_sha);
 assert.equal(sha(p.challenger.path),p.challenger.git_blob_sha);
 assert.equal(p.challenger.selected_fixed_strength,.30);
 assert.equal(p.challenger.min_historical_settling_coverage,.70);
 assert.equal(p.challenger.early_settling_fraction_max,.34);
 assert.equal(p.original.market_blind,true);
 assert.equal(p.challenger.results_permitted_as_predictor,false);
 assert.equal(p.ready_to_publish,false);assert.equal(p.calibrated,false);
 assert.equal(p.pre_jump_forecasts_locked,false);assert.equal(p.frozen_results_count,0);
 assert.ok(p.before_any_race.some(x=>/before scheduled jump/.test(x)));
 assert.ok(p.before_any_race.some(x=>/horse_specific/.test(x)));
 assert.ok(p.score_after.metrics.includes('multiclass_brier'));
});
