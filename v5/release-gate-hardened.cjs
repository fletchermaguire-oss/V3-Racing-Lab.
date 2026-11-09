'use strict';
/* V5 final release hardening. Extends, but never bypasses, the original release gate.
 * A structurally valid URL is not independent source verification.
 */
const Legacy=require('./release-gate.js');
const iso=/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
function parseStamp(s){
 if(typeof s!=='string')return null;
 const x=iso.exec(s);if(!x||+x[2]>23||+x[3]>59||+x[4]>59)return null;
 const z=x[5],offset=z==='Z'?0:(z[0]==='-'?-1:1)*(Number(z.slice(1,3))*60+Number(z.slice(4,6)));
 if(Math.abs(offset)>840)return null;
 const t=Date.parse(s);if(!Number.isFinite(t))return null;
 if(new Date(t+offset*60000).toISOString().slice(0,19)!==x[1]+'T'+x[2]+':'+x[3]+':'+x[4])return null;
 return t;
}
function validDate(s){const t=typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)?Date.parse(s+'T00:00:00Z'):NaN;return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===s;}
function assess(d,asOf){
 const original=Legacy.assess(d,asOf);
 const problems=new Set(original.blockers||[]);
 const add=s=>problems.add(s);
 if(!validDate(d.date))throw Error('Invalid proposal race date');
 const now=parseStamp(asOf);if(now===null)throw Error('Current timestamp must be valid timezone-aware ISO');
 const made=parseStamp(d.created_at);
 if(made===null||made>now)add('PROPOSAL_CREATED_AFTER_AS_OF');
 const approved=parseStamp(d.review_approved_at);
 if(d.explicit_review_approved===true&&(approved===null||approved>now))add('NO_TIMESTAMPED_REVIEW_APPROVAL');
 if(d.independent_calibration_established===true){
  const proof=d.calibration_proof||{};
  if(typeof proof.model_version!=='string'||!/^https:\/\/\S+$/.test(proof.url||'')||
     parseStamp(proof.verified_at)===null||parseStamp(proof.verified_at)>now)add('CALIBRATION_CLAIM_UNSUPPORTED');
 }
 for(const r of d.races){
  const start=parseStamp(r.start_at),reviewed=parseStamp(r.reviewed_at);
  if(start===null||now>=start)add('RACE_ALREADY_STARTED_OR_INVALID_TIME');
  for(const key of ['fields_published_at','going_published_at','checked_at','reviewed_at']){
   const t=parseStamp(r[key]);if(t===null||t>now)add('RACE_'+key.toUpperCase()+'_AFTER_AS_OF');
  }
  if(d.explicit_review_approved===true&&(approved===null||reviewed===null||approved<reviewed||approved>=start))
   add('APPROVAL_BEFORE_REVIEW_OR_AFTER_START');
  if(r.override){const timestamp=parseStamp(r.override.timestamp);if(timestamp===null||timestamp>now)add('OVERRIDE_AFTER_AS_OF');}
  if(typeof r.field_revision==='string'&&r.field_revision===d.date)add('FIELD_REVISION_NOT_DISTINCT');
 }
 const top=Array.isArray(d.top10)?d.top10:[];
 if(new Set(top.map(x=>x?.race_id)).size!==top.length)add('MULTIPLE_MAIN_SELECTIONS_SAME_RACE');
 if(top.some((x,i)=>!x||x.rank!==i+1))add('NONCONTIGUOUS_MAIN_RANKING');
 if(top.some(x=>!d.races.some(r=>r.id===x.race_id&&r.final_pick===x.runner_id)))add('SHORTLIST_DIFFERS_FROM_FINAL_PICK');
 const blockers=[...problems];
 return {...original,certified_final_release:blockers.length===0,blockers,
  hardened:true,notice:'A gate pass does not establish source authenticity or calibrated probability accuracy.'};
}
module.exports={assess,parseStamp,validDate};
