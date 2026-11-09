'use strict';
/*
 * Explicit post-race scoring of an archived pre-race packet.
 * Does NOT independently verify the original GitHub commit or mark the race
 * as a certified prospective forecast.
 *
 * node v5/experiments/v5-1-score-from-files.cjs PACKET.json RESULTS.json REPORT.json
 */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const Scorer=require('./v5-1-results-score.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
function score(packetPath,resultsPath,reportPath){
 assert(packetPath&&resultsPath&&reportPath,'packet, results and report paths required');
 assert(/\.json$/.test(reportPath),'report file must be JSON');
 const packet=read(packetPath),results=read(resultsPath);
 const report=Scorer.evaluate(packet,results);
 fs.writeFileSync(path.resolve(reportPath),JSON.stringify(report,null,2)+'\n',{flag:'wx',encoding:'utf8'});
 return {report:path.resolve(reportPath),status:report.status,
  paired_races:report.field_matched_races,excluded_races:report.excluded_races.length,
  original_top1_wins:report.paired_summary.baseline.top1_wins,
  candidate_top1_wins:report.paired_summary.candidate.top1_wins,
  forward_verified:false,
  note:'Cannot certify a forward win record without independent GitHub proof before jump.'};
}
if(require.main===module){
 try{process.stdout.write(JSON.stringify(score(process.argv[2],process.argv[3],process.argv[4]),null,2)+'\n');}
 catch(e){process.stderr.write(String(e)+'\n');process.exitCode=1;}
}
module.exports={score};
