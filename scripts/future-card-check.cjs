'use strict';
const fs=require('node:fs'),path=require('node:path');
const Model=require('../v5/model.js'),Ready=require('../v5/future-card-preflight.cjs');
const [cardPath,goingPath]=process.argv.slice(2);
if(!cardPath||!goingPath){
 console.error('Usage: npm run preflight:future-card -- v5/cards/YYYY-MM-DD/research.json v5/cards/YYYY-MM-DD/going.json');
 process.exitCode=2;
}else try{
 const card=JSON.parse(fs.readFileSync(path.resolve(cardPath),'utf8'));
 const going=JSON.parse(fs.readFileSync(path.resolve(goingPath),'utf8'));
 const report=Ready.checkResearch({card,going,model:Model});
 console.log(JSON.stringify(report,null,2));
 if(report.status!=='RESEARCH_ONLY_READY')process.exitCode=1;
}catch(err){console.error(err.stack||err.message);process.exitCode=1;}
