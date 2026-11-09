'use strict';
/* Explicit future-card staging. Dry run by default; no deploy or public board write. */
const fs=require('node:fs'),path=require('node:path');
const Source=require('../v5/formula-source-integrity.cjs');
function stage({checkout,cardPath,goingPath,write=false}={}){
 if(!checkout||!cardPath||!goingPath)throw Error('Checkout, research card, and track scenario required');
 const root=path.resolve(checkout),cardFile=path.resolve(root,cardPath),goingFile=path.resolve(root,goingPath);
 if(!cardFile.startsWith(root+path.sep)||!goingFile.startsWith(root+path.sep))throw Error('Card inputs must be inside the checkout');
 const card=JSON.parse(fs.readFileSync(cardFile,'utf8')),going=JSON.parse(fs.readFileSync(goingFile,'utf8'));
 const check=Source.check({card,going});
 if(!check.ok)throw Error('Invalid new Saturday card: '+check.issues.join('; '));
 const expected=path.join(root,'v5/cards',card.date,'research.json');
 if(cardFile!==expected)throw Error('New source must be dated v5/cards/YYYY-MM-DD/research.json');
 const target=path.join(root,'v5/active-card.js');
 if(!fs.existsSync(target))throw Error('Existing active-card.js not found');
 const newCard={
  date:card.date,research_url:'/v5/cards/'+card.date+'/research.json',
  going,live_refresh:false,source_label:'Provisional research only — final starters unverified'
 };
 const source="/* Explicit dated V5 research input; old 31 Oct archive available with ?card=2026-10-31. */\n"+
  "(function(root){'use strict';const archived=root.location&&/[?&]card=2026-10-31(?:&|$)/.test(root.location.search||'');\n"+
  "const card=archived?{date:'2026-10-31',research_url:'/v5/research.json',live_refresh:false}:"+JSON.stringify(newCard)+";\n"+
  "if(typeof module==='object'&&module.exports)module.exports=card;else root.RacingLabV5Card=Object.freeze(card);\n"+
  "})(typeof window==='undefined'?globalThis:window);\n";
 const previous=fs.readFileSync(target,'utf8'),changed=previous!==source;
 if(write&&changed)fs.writeFileSync(target,source,'utf8');
 return {status:write?'STAGED_LOCAL_NOT_DEPLOYED':'DRY_RUN_ONLY',date:card.date,
  candidate:newCard,change_needed:changed,original_archive_preserved:true,
  results_modified:false,calibration_established:false,publication_approved:false};
}
if(require.main===module){
 const [checkout,cardPath,goingPath]=process.argv.slice(2);
 try{console.log(JSON.stringify(stage({checkout,cardPath,goingPath,write:process.argv.includes('--apply')}),null,2));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
module.exports={stage};
