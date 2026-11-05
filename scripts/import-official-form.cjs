'use strict';
const fs=require('node:fs'),path=require('node:path');
const Import=require('../v5/official-form-import.js'),Model=require('../v5/model.js');
const [sourceFile,optionsFile]=process.argv.slice(2);
if(!sourceFile||!optionsFile)throw Error('Usage: npm run card:import-official -- <form.md> <options.json>');
const c=JSON.parse(fs.readFileSync(optionsFile,'utf8'));
const d=Import.importForm(fs.readFileSync(sourceFile,'utf8'),c);
const dir=path.join('v5','cards',d.date),name=d.races[0].meeting.toLowerCase();
const a=path.join(dir,name+'-research.json'),b=path.join(dir,name+'-scenarios.json');
fs.mkdirSync(dir,{recursive:true});
if((fs.existsSync(a)||fs.existsSync(b))&&!c.allow_replace_research_only)throw Error('Existing dated research: explicit replace approval required');
const going=d.source_import.going_report,goings=[...new Set([going,...(c.compare_going||[])])];
const scenarios=goings.map(g=>{
 const x=Model.calculate(d,{[d.races[0].meeting]:g});
 return {going:g,races:d.races.map(r=>{
  const list=x.records.filter(h=>h.race_id===r.id).sort((a,b)=>b.p-a.p);
  if(list.length<2||Math.abs(list.reduce((s,h)=>s+h.p,0)-100)>1e-6)throw Error('Missing 100% full-field probabilities: '+r.id);
  return {race:r.race,race_id:r.id,title:r.title,field:list.length,leader:list[0].horse,model_pct:list[0].p,
   top:list.slice(0,5).map(h=>({horse:h.horse,runner_id:h.id,model_pct:h.p,form_starts:h.form_audit.accepted,completeness:h.completeness}))};
 }),records:x.records.map(h=>({race_id:h.race_id,runner_id:h.id,horse:h.horse,model_pct:h.p,form_starts:h.form_audit.accepted}))};
});
const shadow={schema:'racing-lab-official-form-shadow-scenarios/v1',date:d.date,meeting:d.races[0].meeting,model_version:Model.VERSION,
source:d.source_import,import_audit:d.import_audit,status:'RESEARCH_ONLY',final_starters_verified:false,
calibration_established:false,publication_approved:false,scenarios,
limitations:['Uncalibrated scenario estimates','Soft 5/6/7 share V5 soft category','Trials not scored as races','Final starters unverified']};
fs.writeFileSync(a,JSON.stringify(d,null,2)+'\n');
fs.writeFileSync(b,JSON.stringify(shadow,null,2)+'\n');
console.log(JSON.stringify({research:a,shadow:b,runners:d.runners.length,starts:d.import_audit.historical_form_lines,publication_approved:false}));
