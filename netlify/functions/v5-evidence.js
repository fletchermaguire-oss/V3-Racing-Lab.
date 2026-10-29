/* Racing Lab V5 – secure read-only Airtable runner research for current meeting.
 * This endpoint is optional; static /v5/research.json remains the verified fallback.
 * Requires Netlify environment variables AIRTABLE_PAT or AIRTABLE_TOKEN and AIRTABLE_BASE_ID.
 */
const BASE='appEBALFjxF1Uxqfj',TABLE='tblgd0S8yuysxmsVk';
const TODAY=/^2026-10-31_(RANDWICK|FLEMINGTON|ASCOT)_R\d\d$/;
exports.handler=async function(event){
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const send=(code,obj)=>({statusCode:code,headers,body:JSON.stringify(obj)});
if(event.httpMethod!=='GET')return send(405,{error:'GET only'});
const token=process.env.AIRTABLE_PAT||process.env.AIRTABLE_TOKEN;
const base=process.env.AIRTABLE_BASE_ID||BASE;
if(!token)return send(503,{status:'STATIC_FALLBACK',error:'Live evidence credentials not configured'});
let records=[],offset='',page=0;
try{
while(page<20){
const url=new URL('https://api.airtable.com/v0/'+encodeURIComponent(base)+'/'+TABLE);
url.searchParams.set('pageSize','100');
url.searchParams.set('returnFieldsByFieldId','true');
for(const f of ['fld4BGD5iAcZcGfaN','fldll7dYIGf28MAKA','fldsSdoQPBOyW0AOJ','fldgSikt2WARtdwk8','fldb2TMkMV0aeCuTQ','fldwVqrxsNeuNQiLP','fldj14UmWVhZY8Mgi','fldoYxB5oh5AuF56e','fldddV1wq9EL0f2zy'])url.searchParams.append('fields[]',f);
if(offset)url.searchParams.set('offset',offset);
const response=await fetch(url.toString(),{headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(10000)});
if(!response.ok)throw Error('Airtable status '+response.status);
const obj=await response.json();
records.push(...(obj.records||[]).filter(x=>TODAY.test(x.fields?.fld4BGD5iAcZcGfaN||'')));
page++;offset=obj.offset||'';if(!offset)break;
await new Promise(resolve=>setTimeout(resolve,230));
}
return send(200,{status:'LIVE_RESEARCH_ONLY',as_of:new Date().toISOString(),records:records.map(x=>({id:x.id,fields:x.fields})),truncated:!!offset,publication_approved:false,calibrated:false});
}catch(e){return send(503,{status:'STATIC_FALLBACK',error:'Airtable evidence unavailable',details:String(e.message).slice(0,100)});}
};