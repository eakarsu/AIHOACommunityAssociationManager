'use strict';
// Wave 36C: deterministic, labelled fallback over the caller's own records. No provider call is made here.
function hasProviderKey(env){ return Boolean((env.OPENROUTER_API_KEY||env.OPENAI_API_KEY||'').trim()); }
function filterRecords(records, q){ const s=(q.search||'').toLowerCase(); return (records||[]).filter(r=>{
  if(s && !Object.values(r).join(' ').toLowerCase().includes(s)) return false;
  if(q.status && String(r.status||'')!==String(q.status)) return false;
  if(q.priority && String(r.priority||'')!==String(q.priority)) return false;
  return true; }); }
function csvCell(v){ const s=v===null||v===undefined?'':String(v); return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function toCsv(records){ if(!records||!records.length) return 'id,title,status,priority,owner\n'; const cols=Object.keys(records[0]); return [cols.join(','),...records.map(r=>cols.map(c=>csvCell(r[c])).join(','))].join('\n')+'\n'; }
function toJson(records){ return JSON.stringify(records||[],null,2); }
const FEATURES = {
  maintenancePrioritySummary: (rows)=>[{label:'Total requests',value:rows.length},{label:'Open',value:rows.filter(r=>String(r.status||'open').toLowerCase()==='open').length},{label:'High priority',value:rows.filter(r=>String(r.priority||'').toLowerCase()==='high').length}],
  violationAgingSummary: (rows)=>[{label:'Total records',value:rows.length},{label:'Open violations',value:rows.filter(r=>String(r.status||'').toLowerCase().includes('open')).length},{label:'Closed',value:rows.filter(r=>String(r.status||'').toLowerCase().includes('clos')).length}],
  vendorWorkloadSummary: (rows)=>[{label:'Total assignments',value:rows.length},{label:'Distinct categories',value:new Set(rows.map(r=>r.category).filter(Boolean)).size},{label:'Unassigned',value:rows.filter(r=>!r.vendor&&!r.vendor_id).length}]
};
function runFeature(name, records){ const f=FEATURES[name]; if(!f) return null; const rows=records||[]; return { feature:name, aiGenerated:false, source:'deterministic-fallback', providerAvailable:hasProviderKey(process.env), sections:f(rows), recordCount:rows.length }; }
module.exports={hasProviderKey,filterRecords,toCsv,toJson,runFeature,FEATURES};
