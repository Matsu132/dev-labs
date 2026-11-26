import {test} from 'node:test';import assert from 'node:assert/strict';import {GraphQuery,resultEnvelope} from '../dist/query.js';
const edge=(from,to,typeOnly=false)=>({from,to,kind:'import',typeOnly});
const g={nodes:[{id:'a.ts',symbols:['main'],locations:[{name:'main',kind:'FunctionDeclaration',line:3,endLine:7}]},{id:'b.ts',symbols:['helper']},{id:'c.ts',symbols:[]},{id:'type.ts',symbols:[]}],edges:[edge('a.ts','b.ts'),edge('b.ts','c.ts'),edge('a.ts','type.ts',true)],cycles:[],unresolved:[]};
test('search ranks exact symbol and reports source range',()=>{const q=new GraphQuery(g);assert.deepEqual(q.search('main').matches[0],{file:'a.ts',symbol:'main',kind:'FunctionDeclaration',line:3,endLine:7,score:100});assert.equal(q.search('ts',1).nextOffset,1);});
test('impact walks reverse edges with bounded results',()=>{const q=new GraphQuery(g);const r=q.neighborhood(['c.ts'],'dependents',2,2);assert.deepEqual(r.files.map(x=>x.file),['c.ts','b.ts']);assert.equal(r.total,3);assert.equal(r.truncated,true);});
test('type-only edges excluded by default',()=>{const q=new GraphQuery(g);assert.equal(q.neighborhood(['a.ts'],'dependencies').total,3);assert.equal(q.neighborhood(['a.ts'],'dependencies',2,25,true).total,4);});
test('unknown paths rejected and limits enforced',()=>{const q=new GraphQuery(g);assert.throws(()=>q.inspect('../secret'));assert.throws(()=>q.neighborhood(['a.ts'],'both',5));assert.throws(()=>q.search('x',41));});
test('overview and inspect return deterministic summaries',()=>{const q=new GraphQuery(g);assert.equal(q.overview().files,4);assert.equal(q.inspect('a.ts').dependencies.total,2);});
test('response budget uses bytes',()=>{assert.equal(resultEnvelope({x:'あ'.repeat(100)},100).isError,true);assert.deepEqual(resultEnvelope({x:1}).structuredContent,{x:1});});

test('context traces a deterministic shortest path from the seed',()=>{
 const result=new GraphQuery(g).neighborhood(['c.ts'],'dependents');
 assert.deepEqual(result.files.map(({file,distance,via})=>({file,distance,via})),[
  {file:'c.ts',distance:0,via:null},
  {file:'b.ts',distance:1,via:'c.ts'},
  {file:'a.ts',distance:2,via:'b.ts'},
 ]);
});
