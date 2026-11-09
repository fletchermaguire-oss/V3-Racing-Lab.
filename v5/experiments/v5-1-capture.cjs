'use strict';
/*
 * Experimental pre-race snapshot CLI.
 * Usage:
 *   node v5/experiments/v5-1-capture.cjs CONFIG.json OUTPUT.json
 * Always uses current clock time; refuses overwrites and backdated capture.
 * Creates UNVERIFIED draft only, never authenticates an independent GitHub commit.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const Packet=require('./v5-1-prospective-packet.cjs');
const read=p=>JSON.parse(fs.readFileSync(path.resolve(p),'utf8'));
function capture(configPath,outputPath,nowUtc=new Date().toISOString()){
 assert(configPath&&outputPath&&/\.json$/.test(outputPath),'JSON config and output are mandatory');
 const config=read(configPath);
 assert.equal(config.schema,'v5-1-capture-config/v1');
 assert.equal(config.mode,'PRE_RACE_DRAFT');
 assert(Array.isArray(config.cards)&&config.cards.length>0,'card research paths required');
 assert(typeof config.official_file==='string'&&typeof config.start_times_file==='string','official and start time files required');
 const cards=config.cards.map(x=>({
  meeting:x.meeting,
  research:read(path.resolve(path.dirname(configPath),x.research_file)),
  going:x.going
 }));
 const official=read(path.resolve(path.dirname(configPath),config.official_file));
 const times=read(path.resolve(path.dirname(configPath),config.start_times_file));
 assert.equal(times.schema,'v5-1-sourced-start-times/v1');
 assert.equal(times.date,official.date);
 const packet=Packet.run({cards,official,raceStartSources:times.races,mode:'PRE_RACE_DRAFT',createdAtUtc:nowUtc});
 const integrity=Packet.verifyIntegrity(packet);
 assert.equal(integrity.integrity_valid,true);
 fs.writeFileSync(path.resolve(outputPath),JSON.stringify(packet,null,2)+'\n',{flag:'wx',encoding:'utf8'});
 return {output:path.resolve(outputPath),status:packet.status,packet_sha256:packet.packet_sha256,
  race_count:packet.race_count,
  full_meeting_coverage:!packet.blockers.includes('INCOMPLETE_MEETING_COVERAGE'),
  warnings:packet.blockers,
  notice:'File is an unverified pre-race DRAFT. Commit to GitHub before the race and independently verify the exact historical commit contents and timestamp. Do not count as a certified forward forecast.'};
}
if(require.main===module){
 try{
  const output=capture(process.argv[2],process.argv[3]);
  process.stdout.write(JSON.stringify(output,null,2)+'\n');
 }catch(e){process.stderr.write(String(e)+'\n');process.exitCode=1;}
}
module.exports={capture};
