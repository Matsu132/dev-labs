import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,mkdir,rm,symlink} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {buildGraph,renderHtml} from '../dist/index.js';
async function fixture(t,files){const root=await mkdtemp(path.join(tmpdir(),'codegraph-'));t.after(()=>rm(root,{recursive:true,force:true}));for(const [name,content] of Object.entries(files)){const f=path.join(root,name);await mkdir(path.dirname(f),{recursive:true});await writeFile(f,content);}return root;}
test('ESM .js specifier, symbols, dynamic and export edges',async t=>{const root=await fixture(t,{'a.ts':"import {b} from './b.js'; export {b} from './b.js'; const load=()=>import('./b.js');",'b.ts':'export function b(){}'});const g=await buildGraph(root);assert.deepEqual(g.nodes.map(n=>n.id),['a.ts','b.ts']);assert.deepEqual(g.nodes[0].symbols,['load']);assert.deepEqual(g.edges.map(e=>e.kind).sort(),['dynamic','export','import']);});
test('cycles and type-only exclusion',async t=>{const g=await buildGraph(await fixture(t,{'a.ts':"import './b';",'b.ts':"import './a'; import type {C} from './c';",'c.ts':"import type {} from './b'; export type C=string;"}));assert.deepEqual(g.cycles,[['a.ts','b.ts']]);assert.equal(g.edges.filter(e=>e.typeOnly).length,2);});
test('root tsconfig path alias',async t=>{const g=await buildGraph(await fixture(t,{'tsconfig.json':JSON.stringify({compilerOptions:{baseUrl:'.',paths:{'@/*':['src/*']}}}),'a.ts':"import '@/b';",'src/b.ts':'export const b=1;'}));assert.equal(g.edges[0]?.to,'src/b.ts');});
test('ignores generated directories and symlinks',async t=>{const root=await fixture(t,{'a.ts':"import './missing'; import 'external';",'node_modules/x/index.ts':'','dist/a.ts':'','.git/x.ts':''});await symlink(path.join(root,'a.ts'),path.join(root,'linked.ts'));const g=await buildGraph(root);assert.equal(g.nodes.length,1);assert.deepEqual(g.unresolved,[{from:'a.ts',specifier:'./missing'}]);});
test('HTML escapes script terminators and contains local UI',()=>{const html=renderHtml({nodes:[{id:'</script><img src=x onerror=alert(1)>',symbols:[]}],edges:[],cycles:[],unresolved:[]});assert.ok(!html.includes('</script><img'));assert.match(html,/Codegraph Viewer/);assert.match(html,/Content-Security-Policy/);assert.match(html,/Export JSON/);});
test('empty graph',async t=>{const g=await buildGraph(await fixture(t,{}));assert.deepEqual(g,{nodes:[],edges:[],cycles:[],unresolved:[]});});

test('local package metadata resolves directory require to scanned source only',async t=>{
 const root=await fixture(t,{
  'a.cjs':"require('./lib'); require('./ignored');",
  'lib/package.json':'{"main":"entry.js"}',
  'lib/entry.js':'module.exports = 1;',
  'ignored/package.json':'{"main":"dist/entry.js"}',
  'ignored/other.js':'',
  'ignored/dist/entry.js':'module.exports = 2;',
 });
 const g=await buildGraph(root);
 assert.deepEqual(g.edges,[{from:'a.cjs',to:'lib/entry.js',kind:'require',typeOnly:false}]);
 assert.deepEqual(g.unresolved,[{from:'a.cjs',specifier:'./ignored'}]);
});

test('dynamic import options keep resolved and unresolved literals',async t=>{
 const root=await fixture(t,{
  'a.ts':"import('./b.js', {}); import('./missing.js', {}); import(name, {}); require('./b.js', {});",
  'b.ts':"import './a';",
 });
 const g=await buildGraph(root);
 assert.deepEqual(g.edges.filter(e=>e.from==='a.ts'),[{from:'a.ts',to:'b.ts',kind:'dynamic',typeOnly:false}]);
 assert.deepEqual(g.unresolved,[{from:'a.ts',specifier:'./missing.js'}]);
 assert.deepEqual(g.cycles,[['a.ts','b.ts']]);
});

test('import type expressions add type-only dependencies without runtime cycles',async t=>{
 const root=await fixture(t,{
  'a.ts':"export type X = import('./b').X; export type Y = typeof import('./missing');",
  'b.ts':"import './a'; export type X = string;",
 });
 const g=await buildGraph(root);
 assert.deepEqual(g.edges.filter(e=>e.from==='a.ts'),[{from:'a.ts',to:'b.ts',kind:'import',typeOnly:true}]);
 assert.deepEqual(g.unresolved,[{from:'a.ts',specifier:'./missing'}]);
 assert.deepEqual(g.cycles,[]);
});
