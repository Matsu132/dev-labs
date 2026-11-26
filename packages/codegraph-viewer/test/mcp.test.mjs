import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';import {Client} from '@modelcontextprotocol/sdk/client/index.js';import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
test('stdio MCP tool discovery, search, impact and refresh', {timeout:30000}, async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'codegraph-mcp-'));t.after(()=>rm(root,{recursive:true,force:true}));await writeFile(path.join(root,'a.ts'),"import {helper} from './b.js';\nexport function main(){return helper();}");await writeFile(path.join(root,'b.ts'),'export function helper(){return 1;}');
 const client=new Client({name:'test',version:'1.0.0'});const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../dist/mcp.js',import.meta.url)),root],stderr:'pipe'});t.after(()=>client.close());await client.connect(transport);
 assert.equal((await client.listTools()).tools.length,6);const call=async(name,args={})=>client.callTool({name,arguments:args});
 const s=await call('graph_search',{query:'main'});assert.equal(s.structuredContent.matches[0].line,2);
 const impact=await call('graph_context',{files:['b.ts'],direction:'dependents'});assert.deepEqual(impact.structuredContent.files.map(x=>x.file),['b.ts','a.ts']);
 const denied=await call('graph_inspect',{file:'../secret'});assert.equal(denied.isError,true);
 await writeFile(path.join(root,'c.ts'),'export function newlyAdded(){}');assert.equal((await call('graph_search',{query:'newlyAdded'})).structuredContent.total,0);assert.equal((await call('graph_refresh')).structuredContent.files,3);assert.equal((await call('graph_search',{query:'newlyAdded'})).structuredContent.total,1);
});
