'use strict';
/* Reproducible PDF-card calculation; no archived forecasts or coefficients change. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const Model=require('../v5/model.js'),State=require('../v5/site-state.js');
const Human=require('../v5/horse-analysis.js'),Field=require('../v5/field-gate.js');
function build(file){
 const bytes=fs.readFileSync(file),data=JSON.parse(bytes),controller=State.create(data),board=controller.board;
 if(data.schema!=='racing-lab-v5-feature-form/v1')throw Error('A dated Feature Form card is required');
 if(board.activeCount!==data.runners.length)throw Error('Every listed PDF runner must be reconciled');
 const raw=new Map(data.runners.map(h=>[h.id,h]));
 const races=board.baseline.races.map(summary=>{
  const race=data.races.find(r=>r.id===summary.id);
  const rows=board.baseline.records.filter(h=>h.race_id===summary.id);
  if(summary.sum!==100||rows.length!==race.field_count)throw Error('Whole-field mismatch: '+summary.id);
  return {...summary,source_flags:race.source_flags,unraced_count:race.unraced_count,
   cross_entered_count:race.cross_entered_count,
   top_three:rows.slice(0,3).map(h=>({runner_id:h.id,horse:h.horse,model_pct:h.p,
    separation_pp:h.gap,scenario_range:h.model_range,
    assessment:Human.analysis(raw.get(h.id),race,h,controller.going[race.meeting],null)}))};
 });
 const result={schema:'racing-lab-v5-feature-form-analysis/v1',date:data.date,as_of:data.saved_at,
  research_sha256:crypto.createHash('sha256').update(bytes).digest('hex'),model_version:Model.VERSION,
  coefficients_changed:false,config:Model.CONFIG,market_blind:true,publication_approved:false,
  calibrated:false,independent_shortlist_created:false,baseline_going:controller.going,
  source_count:board.sourceCount,race_count:board.raceCount,modelled_count:board.activeCount,
  sources:data.source_import.sources,cross_entries:data.cross_entries,
  field_gate:Field.assess(data,null),races,records:board.baseline.records,
  model_leaders:board.leaders.map(h=>({runner_id:h.id,horse:h.horse,race_id:h.race_id,
   model_pct:h.p,separation_pp:h.gap,scenario_range:h.model_range,
   quality_flags:h.quality_flags,source_flags:data.races.find(r=>r.id===h.race_id).source_flags})),
  win_first:board.winFirst,
  scenarios:board.scenarios.map((s,i)=>({label:board.model_variants[i],
   races:s.races.map(r=>({race_id:r.id,total_pct:r.sum,leader:r.leader,model_pct:r.top_p})),
   records:s.records.map(h=>({runner_id:h.id,race_id:h.race_id,rank:h.rank,model_pct:h.p}))})),
  limitations:[
   'PDF-listed entries do not establish current starters, reserve priority or scratchings.',
   'Good 4 is a comparison scenario, not a verified current track observation.',
   'Percentages are experimental, uncalibrated conditional estimates. Scenario ranges are not confidence intervals.',
   'First starters have no race form; trials remain visible but are not scored as race wins.',
   'Unsupported foreign going codes, jump races and nonstandard finish codes remain in source detail and are excluded from recent-start scoring.',
   'Published race Sec Time is not a horse-specific adjusted sectional.',
   'Prices, gear prose, trainer comments and trial times are not scoring inputs.',
   'The 31 October selections, results, official overlay and model coefficients are preserved.'
  ]};
 const output=path.join(path.dirname(file),'analysis.json');
 fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
 return {date:data.date,races:board.raceCount,runners:board.activeCount,scenarios:board.scenarios.length,
  priorities:board.winFirst.priority.length,review_only:board.winFirst.review.length,
  cross_entered_horses:data.cross_entries.length,output};
}
if(require.main===module)console.log(JSON.stringify(build(process.argv[2]||'v5/cards/2026-11-03/research.json'),null,2));
module.exports={build};
