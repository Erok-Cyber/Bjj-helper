const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
// Compile domain modules in memory; keep the browser and network replaced by deterministic fixtures.
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {weeklyTrend,thisWeekSessions,recentSessions,validDate}=require('../src/dates.ts');
const {parseBackup,prepareBackup,mergeById,safeUrl}=require('../src/backup.ts');
const stamp='2026-10-02T12:00:00Z';
const fixture=()=>({profile:{id:'original',displayName:'Test',belt:'Blue',stripes:2,gym:'',weeklySessionGoal:3,createdAt:stamp},techniques:[{id:'technique',name:'Knee cut',category:'Pass',position:'Half Guard',giMode:'Both',notes:'',videoUrl:'',tags:[],confidence:2,drillingCount:0,createdAt:stamp,updatedAt:stamp}],sessions:[{id:'session',trainedAt:'2026-10-02',mode:'Gi',durationMin:60,rounds:4,submissions:1,taps:1,rating:4,partners:[],techniqueIds:['technique'],createdAt:stamp}],flows:[{id:'flow',name:'Test',description:'',createdAt:stamp,updatedAt:stamp,nodes:[{id:'n',position:{x:0,y:0},data:{label:'Knee cut',kind:'technique',techniqueId:'technique'}}],edges:[]}]});
test('ISO weeks, leap days and future sessions are handled consistently',()=>{
 const sessions=['2025-12-28','2025-12-29','2026-01-01','2026-01-04','2026-01-05'].map(trainedAt=>({trainedAt}));
 assert.deepEqual(weeklyTrend(sessions,'2026-01-04').at(-1),{week:'Week 1 · 2026',sessions:3});
 assert.equal(thisWeekSessions(sessions,'2026-01-04').length,3);assert.equal(recentSessions(sessions,'2026-01-04').length,3);
 assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2024-02-29'),true);
});
test('backup rejects malformed nested records and unsafe links before any write',()=>{
 for(const change of [d=>d.sessions[0].rating=8,d=>d.flows[0].nodes[0].position.x='invalid',d=>d.flows[0].edges=[{id:'e',source:'n',target:'missing'}],d=>d.techniques[0].videoUrl='javascript:alert(1)',d=>d.techniques.push(d.techniques[0])]){const d=fixture();change(d);assert.throws(()=>parseBackup(d),/Invalid backup/)}
 assert.equal(safeUrl('javascript:alert(1)'),'');assert.equal(safeUrl('https://example.org'),'https://example.org/');
});
test('cross-account import preserves relationships and can be retried without duplicates',async()=>{
 const a=await prepareBackup(fixture(),'new-owner'),b=await prepareBackup(fixture(),'new-owner');
 assert.equal(a.profile.id,'new-owner');assert.notEqual(a.techniques[0].id,'technique');assert.equal(a.techniques[0].id,b.techniques[0].id);
 assert.equal(a.sessions[0].techniqueIds[0],a.techniques[0].id);assert.equal(a.flows[0].nodes[0].data.techniqueId,a.techniques[0].id);
 assert.equal(mergeById(a.sessions,b.sessions).length,1);assert.equal(parseBackup({...fixture(),flows:[]}).flows.length,0);
});
test('autosave isolates gameplans, serializes revisions and retains failures for retry',async()=>{
 let counter=0;const timers=new Map(),calls=[];
 global.window={setTimeout:fn=>{timers.set(++counter,fn);return counter},clearTimeout:id=>timers.delete(id),addEventListener(){}};
 const storePath=require.resolve('../src/store.ts');
 require.cache[storePath]={id:storePath,filename:storePath,loaded:true,exports:{cloudUpsert:(_,flow,owner)=>new Promise((resolve,reject)=>calls.push({flow,owner,resolve,reject}))}};
 const {queueFlowSave,flowSaveState,retryFlowSaves}=require('../src/flowPersistence.ts');
 const flush=async()=>{const todo=[...timers.values()];timers.clear();todo.forEach(fn=>fn());await new Promise(setImmediate)};
 queueFlowSave({id:'a',name:'a1'},'owner');queueFlowSave({id:'b',name:'b1'},'owner');await flush();assert.equal(calls.length,2);
 queueFlowSave({id:'a',name:'a2'},'owner');await flush();assert.equal(calls.length,2);
 calls[0].resolve();await new Promise(setImmediate);assert.equal(calls.length,3);assert.equal(calls[2].flow.name,'a2');assert.equal(calls[2].owner,'owner');
 calls[1].resolve();calls[2].reject(new Error('Offline'));await new Promise(setImmediate);assert.equal(flowSaveState(),'error');
 retryFlowSaves();assert.equal(calls.length,4);assert.equal(calls[3].flow.name,'a2');calls[3].resolve();await new Promise(setImmediate);assert.equal(flowSaveState(),'saved');
});
