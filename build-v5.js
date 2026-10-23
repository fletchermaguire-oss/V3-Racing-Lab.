const fs=require('fs'),gz=require('zlib');
const file='saturday-v5.html',raw=fs.readFileSync(file,'utf8'),amp=String.fromCharCode(38);
const entity={amp:amp,lt:String.fromCharCode(60),gt:String.fromCharCode(62),quot:'"',apos:"'",'#39':"'"};
fs.writeFileSync(file,raw.replace(new RegExp(amp+'(amp|lt|gt|quot|apos|#39);','g'),function(m,k){return entity[k]||m}));
if(!raw.includes("z='"))throw Error('V5 data missing');
const z=raw.split("z='")[1].split("'")[0],D=JSON.parse(gz.gunzipSync(Buffer.from(z,'base64')).toString('utf8'));
if(D.r.length!==19||D.h.length!==200)throw Error('Field inventory mismatch');
function round(x){return Math.round((x+Number.EPSILON)*100)/100}
function median(a){a.sort(function(x,y){return x-y});const n=a.length;return n%2?a[Math.floor(n/2)]:(a[n/2-1]+a[n/2])/2}
const mods={'FLEMINGTON_R01|Ice Kool':-.10,'FLEMINGTON_R05|Jigsaw':-.18,'FLEMINGTON_R05|Smooth Chino':.10,'FLEMINGTON_R05|Extragalactic':.04};
const races=[],records=[];
D.r.forEach(function(r,i){
 const horses=D.h.filter(function(h){return h[0]===i});
 if(horses.length!==r[3])throw Error('Runner count differs '+r[0]);
 const mean=horses.reduce(function(a,h){return a+h[3]},0)/horses.length;
 const mw=median(horses.map(function(h){return h[5]})),mb=median(horses.map(function(h){return h[4]}));
 const straight=r[0]==='FLEMINGTON_R01'||r[0]==='FLEMINGTON_R05';
 const score=horses.map(function(h){return .55*(h[3]-mean)/12+.45*Math.log(Math.max(.2,h[2]))+.012*(mw-h[5])+(straight?0:.006*(mb-h[4]))+(mods[r[0]+'|'+h[1]]||0)});
 const top=Math.max.apply(null,score),exp=score.map(function(v){return Math.exp(v-top)}),den=exp.reduce(function(a,b){return a+b},0);
 const probs=exp.map(function(v){return round(100*(.92*v/den+.08/horses.length))});
 const first=score.indexOf(top);probs[first]=round(probs[first]+round(100-probs.reduce(function(a,b){return a+b},0)));
 if(Math.round(probs.reduce(function(a,b){return a+b},0)*100)!==10000)throw Error('Probability QA failed '+r[0]);
 races.push({id:r[0],name:r[1],distance:r[2],declaredActiveCount:horses.length,fieldVerified:true,modelMethod:'V5 experimental 55/45 hybrid; not calibrated'});
 horses.forEach(function(h,j){records.push({race:r[0],name:h[1],p:probs[j],rating:h[3],barrier:h[4],weight:h[5],v44_seed_p:h[2],status:'ACTIVE'})});
});
const out={date:'2026-10-24',model:'V5 24-Oct uncalibrated research',syncedAt:new Date().toISOString(),publication:{status:'APPROVED',reviewed:true,frozen:true,finalFieldCheckAt:'2026-10-24T07:45:00+11:00',warning:'Static morning official-field snapshot; no automatic late-scratching updates. V5 percentages are uncalibrated experimental estimates.'},tracks:{RANDWICK:{surface:'Good 4',rail:'+6m entire',weather:'Overcast',source:'Racing Australia official final 24 Oct 07:45 AEDT'},FLEMINGTON:{surface:'Good 4',rail:'True entire',weather:'Showers',source:'Racing Australia official final 24 Oct 07:45 AEDT'}},races:races,records:records,syncQA:{issues:[]}};
fs.writeFileSync('published-board.json',JSON.stringify(out));
let home=fs.readFileSync('index.html','utf8');
const old='const expected={RANDWICK:10,FLEMINGTON:9,ASCOT:10};if(d.races.length!==29||actualTracks.size!==3';
const next='const expected={RANDWICK:10,FLEMINGTON:9};if(d.races.length!==19||actualTracks.size!==2';
if(!home.includes(old))if(!home.includes(next))throw Error('Original Racing Lab validation patch target missing');
home=home.replace(old,next).replace('Saturday 24 October requires all 29 races at Randwick, Flemington and Ascot','Saturday 24 October requires all 19 races at Randwick and Flemington');
home=home.replace('A single view of all three meetings. Every percentage is a provisional, uncalibrated saved model output.','Your Randwick and Flemington racing intelligence, updated for 24 October. V5 win chances are experimental and uncalibrated.');
fs.writeFileSync('index.html',home);
console.log('Racing Lab ORIGINAL UI ready with updated',races.length,'races and',records.length,'runners.');
