'use strict';
/* Experimental, source-frozen pace shadow for the 5 Nov Flemington PDF.
 * Reweight a field WITHOUT claiming to rerun model feature/score engineering.
 * The sole nonzero coefficient is the 0.30 historical-settling challenger
 * preregistered separately at v5/experiments/2026-11-07-shadow-preregistration.json.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const analysis=require('./analysis.json');
const speed=require('./pace-speedmap-source-20261103.json');
const SCRATCHES=Object.freeze({
  1:['Grand Omaha'],4:['Snitzel Dancer','Miss Hades'],
  5:['Haaracaine'],7:['Parcae'],9:['Pallaton']
});
const T=analysis.config.temperature,U=analysis.config.uniformReserve,STRENGTH=.30;
const canonical=s=>String(s).normalize('NFKD').toUpperCase().replace(/\([^)]*\)/g,'').replace(/[^A-Z0-9]/g,'');
const round2=x=>+x.toFixed(2);
function pace(rows){
  const known=rows.filter(x=>Number.isFinite(x.settle_fraction)&&x.settle_fraction>=0&&x.settle_fraction<=1);
  const front=known.filter(x=>x.settle_fraction<=.34).length,coverage=known.length/rows.length;
  const direction=coverage<.70?0:front>=4?1:front<=1&&rows.length>=8?-1:0;
  return {status:coverage<.70?'INSUFFICIENT_EVIDENCE':direction===1?'MULTIPLE_EARLY_LEADERS':direction===-1?'LONE_OR_NO_LEADER':'NEUTRAL_CONTEST',front,known:known.length,coverage:+coverage.toFixed(4),direction};
}
function calculate(rows,scenario,excluded,adjust){
  const n0=rows.length,remaining=rows.filter(x=>!excluded.includes(x.horse)),n=remaining.length;
  assert.ok(n>=2);
  const sum=rows.reduce((a,x)=>a+scenario.get(x.id),0);
  assert.ok(sum>99.8&&sum<100.2,'Unknown incomplete saved scenario');
  const status=pace(remaining);
  const scored=remaining.map(x=>{
    const original=(scenario.get(x.id)/sum);
    const base=(original-U/n0)/(1-U);
    assert.ok(base>0&&Number.isFinite(base),'Original probability cannot be inverted');
    const f=x.settle_fraction;
    const modifier=adjust&&Number.isFinite(f)?STRENGTH*status.direction*(f-.5):0;
    return {id:x.id,horse:x.horse,tab:+x.id.slice(-2),historical_settle_fraction:f??null,
      original_pct:round2(scenario.get(x.id)),raw:base*Math.exp(modifier/T)};
  });
  const total=scored.reduce((a,x)=>a+x.raw,0);
  const out=scored.map(x=>({runner_id:x.id,horse:x.horse,tab:x.tab,
    original_pdf_pct:x.original_pct,historical_settle_fraction:x.historical_settle_fraction,
    conditional_pct_exact:100*((1-U)*x.raw/total+U/n)}))
    .sort((a,b)=>b.conditional_pct_exact-a.conditional_pct_exact||a.runner_id.localeCompare(b.runner_id));
  assert.ok(Math.abs(out.reduce((a,x)=>a+x.conditional_pct_exact,0)-100)<1e-9);
  return {pace:status,full_field_count:n0,conditional_field_count:n,
    standings:out.map((x,i)=>({...x,rank:i+1,conditional_pct:round2(x.conditional_pct_exact)}))};
}
function build(){
  assert.equal(analysis.date,'2026-11-05');assert.equal(analysis.model_version,'V5-L5-CANDIDATE-20261030');
  assert.equal(analysis.calibrated,false);assert.equal(analysis.publication_approved,false);
  assert.equal(speed.schema,'racing-lab-v5-speedmap-source/v1');
  assert.equal(speed.race_coverage.length,9);assert.equal(T,.78);assert.equal(U,.15);
  const scenarios={Good4:new Map(analysis.records.map(x=>[x.id,x.p_exact])),
    Soft5:new Map(analysis.scenarios.find(x=>x.label==='Soft 5; base class').records.map(x=>[x.runner_id,x.model_pct]))};
  const races=analysis.races.map(r=>{
    const rows=analysis.records.filter(x=>x.race_id===r.id),excluded=SCRATCHES[r.race]||[];
    assert.equal(rows.length,r.field);
    for(const horse of excluded)assert.equal(rows.filter(x=>x.horse===horse).length,1);
    const source=speed.race_coverage.find(x=>x.race_id===r.id);
    assert.ok(source&&source.url.startsWith('https://'));
    const sourceIds=new Set(source.runners.map(x=>x.runner_id));
    const active=rows.filter(x=>!excluded.includes(x.horse));
    assert.equal(sourceIds.size,active.length);
    for(const row of active)assert.ok(sourceIds.has(row.id),'Unmatched pace/speed source '+row.horse);
    const outputs={};
    for(const [name,sc] of Object.entries(scenarios)){
      const original=calculate(rows,sc,[],false),
        fullPace=calculate(rows,sc,[],true),
        scratchedBase=calculate(rows,sc,excluded,false),
        scratchedPace=calculate(rows,sc,excluded,true);
      assert.deepEqual(scratchedBase.pace,scratchedPace.pace);
      outputs[name]={original_pdf:original.standings,
        full_pdf_pace:fullPace.standings,
        scratch_exclusions_only:scratchedBase.standings,
        scratch_plus_pace:scratchedPace.standings,
        pace_rule:scratchedPace.pace};
    }
    return {race_id:r.id,race_number:r.race,title:r.title,
      pdf_listed:r.field,listed_scratchings:excluded,listed_active:active.length,
      speedmap_url:source.url,numerical_aes_coverage:source.aes_numeric,
      numerical_afs_coverage:source.afs_numeric,
      field_verified:false,
      caveat:r.race===8?'Oaks emergencies in the twenty-entry PDF not yet reconciled; no provisional 16-runner field assumed.':
        r.race===3?'Buccleuch still listed but two-day backup doubtful after 3 Nov seventh; no speculative scratching.':
        r.race===4?'Gold Medallist raced 3 Nov; current starter status not finally attested.':
        r.race===7?'Fovea and Sanctuary raced 3 Nov; final starter status not attested.':'',
      scenarios:outputs};
  });
  assert.equal(races.reduce((s,x)=>s+x.listed_active,0),143);
  return {
    schema:'racing-lab-v5-conditional-pace-shadow/v1',
    race_date:'2026-11-05',
    as_of_date:'2026-11-03',
    status:'PROVISIONAL_RESEARCH_NOT_FINAL_RECALCULATION',
    source_analysis_path:'v5/cards/2026-11-05/analysis.json',
    source_analysis_research_sha256:analysis.research_sha256,
    external_speedmap_path:'v5/cards/2026-11-05/pace-speedmap-source-20261103.json',
    historical_pace_reference:'v5/experiments/pace-map-shadow.cjs',
    pace_reference_commit:'279ab33dc47669498b723d9a53176f0f42197ac4',
    model_version:analysis.model_version,
    market_blind:true,calibrated:false,publication_approved:false,site_deployed:false,
    method:{
      label:'EXACT_ORIGINAL_L5_SCORES_INVERTED_WITH_UNIFORM_RESERVE; REMOVALS_AND_PREDECLARED_PACE_SHADOW',
      not_fresh_engine_rebuild:true,
      original_temperature:T,original_uniform_reserve:U,pace_strength:STRENGTH,
      historical_fraction_threshold:.34,min_history_coverage:.70,
      pressure_min_early_leaders:4,solo_max_early_leaders:1,solo_min_field:8,
      no_afs_aes_coefficient:true,
      explanation:'Recover prior field softmax shares from original exact p; exclude six publicly listed scratches; apply frozen 0.30 * pace_direction * (historical_settle_fraction - 0.5) in original logit units; renormalise all active entries with original reserve. No field-dependent features are recomputed.'
    },
    racing_and_sports_listed_scratchings_source:'https://www.racingandsports.com.au/form-guide/thoroughbred/australia/flemington/2026-11-05',
    unresolved:['Tuesday starters / short-turnaround acceptances not confirmed on Thursday','Official final starters and emergencies not verified','Thursday going and straight lane pattern not verified','31 October and 3 November results are not input into the original saved pre-race form score','Pace coefficient based on retrospective exploratory study, not out-of-sample calibrated'],
    races
  };
}
if(require.main===module){
 const data=build();const dest=process.argv[2]||'v5/cards/2026-11-05/pace-conditional-20261103.json';
 fs.writeFileSync(dest,JSON.stringify(data,null,2)+'\n');
 const summary=data.races.map(r=>({race:r.race_number,field:r.listed_active,pace:r.scenarios.Good4.pace_rule,
  good4_top:r.scenarios.Good4.scratch_plus_pace.slice(0,3).map(x=>[x.horse,x.conditional_pct]),
  soft5_top:r.scenarios.Soft5.scratch_plus_pace.slice(0,3).map(x=>[x.horse,x.conditional_pct])}));
 process.stdout.write(JSON.stringify(summary,null,2)+'\n');
}
module.exports={build,calculate,pace,SCRATCHES};
