'use strict';
/*
 * V5.1 experimental shortlist builder.
 * Strongest race-leading model probability FIRST, reliability qualification SECOND.
 * No racing results, market prices, or runner-name overrides.
 * Does not force Top 5/10/15 to full size when source evidence is inadequate.
 */
const assert=require('node:assert/strict');
const Model=require('./model-v5-1.cjs');
const Quality=require('./v5-1-evidence-gate.cjs');
const ranked=(a,b)=>b.model_pct-a.model_pct||a.race_id.localeCompare(b.race_id);
function build(cards,official){
 assert(Array.isArray(cards)&&cards.length>0,'At least one dated meeting required');
 assert(official&&typeof official.date==='string'&&Array.isArray(official.meetings),'official morning declarations required');
 const seen=new Set(),entries=[],source=[];
 for(const card of cards){
  const {meeting,research,going='Good 4'}=card;
  assert(typeof meeting==='string'&&!seen.has(meeting),'duplicate or unnamed meeting');
  seen.add(meeting);
  assert(research&&research.date===official.date,'date mismatch');
  const rec=Quality.reconcileSnapshot(research,official,meeting);
  const main=Model.calculate(rec.data,{default:going});
  const classVariants=[Model.CONFIG.weights.class,Model.CONFIG.conservativeClass];
  const goingVariants=[going,/^Soft/i.test(going)?'Good 4':'Soft 5'];
  const variants=[];
  for(const surface of goingVariants)for(const weight of classVariants){
   variants.push(Model.calculate(rec.data,{default:surface},weight));
  }
  assert.equal(variants.length,4);
  source.push({meeting,research_saved_at:research.saved_at||null,
   official_checked_at:rec.provenance.official_checked_at||null,
   active_runners:rec.provenance.activeCount,removed:rec.provenance.removed.length,
   going_assumed:going});
  for(const r of main.races){
   assert.equal(r.status,'MODELLED_PROVISIONAL');
   const field=main.records.filter(x=>x.race_id===r.id);
   const top=field.find(x=>x.rank===1);
   assert(top&&field.length===r.field,'incomplete race '+r.id);
   assert(Math.abs(field.reduce((s,x)=>s+x.p_exact,0)-100)<1e-8,'probabilities do not sum to 100 '+r.id);
   const values=variants.map((v,i)=>{
    const self=v.records.find(x=>x.id===top.id);
    const rival=v.records.find(x=>x.race_id===r.id&&x.rank===1);
    assert(self&&rival,'variant missing runner '+r.id);
    return {scenario:i,pct:self.p,rank:self.rank,leader:rival.horse};
   });
   const ps=values.map(x=>x.pct);
   const stability={leader_count:values.filter(x=>x.rank===1).length,
    probability_floor:Math.min(...ps),probability_ceiling:Math.max(...ps),
    probability_spread_pp:Number((Math.max(...ps)-Math.min(...ps)).toFixed(2)),
    scenarios:values};
   const original=rec.data.races.find(x=>x.id===r.id);
   const rating=Quality.riskScreen(top,{...r,distance_m:original.distance_m},field,stability);
   entries.push({
    date:official.date,meeting,race:r.race,race_id:r.id,horse:top.horse,
    horse_id:top.id,model_rank_in_race:1,model_pct:top.p,
    model_field_gap_pp:r.gap,model_field_size:r.field,
    screening_status:rating.screen_status,data_readiness:rating.data_readiness,
    quality_issues:rating.quality_issues,sensitivity_warnings:rating.sensitivity_warnings,
    pace_note:rating.pace_context,scenario_floor:stability.probability_floor,
    scenario_ceiling:stability.probability_ceiling,model_version:Model.VERSION,
    win_probability_calibrated:false,official_start_certified:false
   });
  }
 }
 assert.equal(entries.length,new Set(entries.map(x=>x.race_id)).size);
 const all=entries.slice().sort(ranked);
 const qualified=all.filter(x=>x.screening_status==='MODEL_LEADER_ELIGIBLE_FOR_REVIEW');
 const flagged=all.filter(x=>x.screening_status!=='MODEL_LEADER_ELIGIBLE_FOR_REVIEW');
 const tiers=Object.fromEntries([5,10,15].map(n=>[
  'top'+n,{requested:n,selected:qualified.slice(0,n),
   filled:Math.min(n,qualified.length),unfilled:Math.max(0,n-qualified.length)}
 ]));
 return {schema:'v5-1-selective-shadow-shortlist/v1',date:official.date,
  status:'EXPERIMENTAL_NOT_PUBLICATION_APPROVED',official_snapshot_only:true,
  candidate_version:Model.VERSION,model_probability_calibrated:false,
  pre_race_independently_frozen:false,publication_approved:false,
  source_meetings:source,
  full_official_meeting_coverage:official.meetings.every(x=>seen.has(x.meeting)),
  total_races:entries.length,qualified_races:qualified.length,flagged_races:flagged.length,
  ranked_all_race_leaders:all,
  tiers,flagged_for_review:flagged,
  note:'One model leader per race, sorted by chance. Screen is a review aid, not a validated winning filter. Do not fill missing shortlist positions with flagged runners.'};
}
module.exports={build};
