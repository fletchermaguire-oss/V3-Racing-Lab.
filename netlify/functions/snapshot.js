'use strict';
exports.handler=async e=>{
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
 const reply=(statusCode,message)=>({statusCode,headers,body:JSON.stringify({message})});
 if(e.httpMethod!=='GET')return reply(405,'GET only');
 const {AIRTABLE_PAT,AIRTABLE_BASE_ID,PUBLISHED_FORECAST_VERSION}=process.env;
 if(!AIRTABLE_PAT||!AIRTABLE_BASE_ID||!PUBLISHED_FORECAST_VERSION)return reply(503,'Airtable live feed not configured; historical archive retained. Approved official race-day data uses published-board.json.');
 return reply(409,'Airtable forecasts are not officially field-certified for publication. Approved official race-day data uses published-board.json.');
};
