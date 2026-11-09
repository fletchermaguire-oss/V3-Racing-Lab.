'use strict';
/*
 * Replays only saved 5 Nov form and 7 Nov morning official declarations.
 * No results imported, no retrospective candidate promotion.
 * Rosehill + Ascot only because matching Flemington form is unavailable.
 */
const Shortlist=require('./v5-1-reliability-shortlist.cjs');
const Official=require('../cards/2026-11-07/official-final.json');
const Rose=require('../cards/2026-11-07/rosehill-research.json');
const Ascot=require('../cards/2026-11-07/ascot-research.json');
function run(){
 return Shortlist.build([{meeting:'ROSEHILL',research:Rose,going:'Good 4'},
  {meeting:'ASCOT',research:Ascot,going:'Good 4'}],Official);
}
if(require.main===module)process.stdout.write(JSON.stringify(run(),null,2)+'\n');
module.exports={run};
