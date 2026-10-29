const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(__dirname+'/racing-lab-manual-scratch.js','utf8');
function test(state){
 const memory=new Map();memory.set('racingLab.manualScratch.v1',JSON.stringify({'board:2026-10-31|V3|3':state}));
 const localStorage={getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
 const document={readyState:'complete',head:{append:()=>{}},createElement:()=>({}),addEventListener:()=>{},querySelector:()=>null};
 const data={date:'2026-10-31',model:'V3',records:[{race:'RANDWICK_R01',name:'Alpha',p:50},{race:'RANDWICK_R01',name:'Beta',p:30},{race:'RANDWICK_R01',name:'Gamma',p:20}],races:[{id:'RANDWICK_R01'}]};
 const window={RacingLabApp:{data},DATA:data};
 const ctx={window,document,localStorage,sessionStorage:localStorage,console,location:{reload:()=>{}},setTimeout,clearTimeout,setInterval:()=>{},requestAnimationFrame:fn=>fn(),MutationObserver:class{observe(){}}};
 vm.runInNewContext(src,ctx);
 // Manually simulate a snapshot refresh without needing DOM.
 // Module exposes the state but boot only runs on DOMContentLoaded.
 return {ctx,data,localStorage};
}
const a=test({scratched:{RANDWICK_R01:['Beta']},reviewed:{}});
assert.equal(a.ctx.window.RacingLabManualScratch.has('RANDWICK_R01'),true);
assert.equal(a.ctx.window.RacingLabManualScratch.getActive('RANDWICK_R01').length,2);
assert.equal(a.data.records.reduce((sum,h)=>sum+h.p,0),100);
assert(Math.abs(a.data.records[0].p-71.4285714)<0.00001);
assert(Math.abs(a.data.records[1].p-28.5714286)<0.00001);
console.log('Syntax, initialisation, and state exposure passed. Browser boot requires DOM.');
const b=test({scratched:{},reviewed:{}});
assert.equal(b.data.records.length,3);
assert.equal(b.data.records.reduce((sum,h)=>sum+h.p,0),100);
const c=test({scratched:{RANDWICK_R01:['Unknown horse']},reviewed:{}});
assert.equal(c.data.records.length,3);
console.log('Passed: untouched original, scratch removal, conditional normalization, unmatched-name safety.');
