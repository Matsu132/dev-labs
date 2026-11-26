#!/usr/bin/env node
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {realpath} from 'node:fs/promises';
import {buildGraph} from './index.js';
import {GraphQuery,resultEnvelope} from './query.js';
// The operator selects one trusted root at startup; no tool can change it or read arbitrary paths.
if(process.argv.length!==3){console.error('Usage: codegraph-mcp <trusted-source-directory>');process.exit(1);}
const root=await realpath(process.argv[2]);
let snapshot={query:new GraphQuery(await buildGraph(root)),indexedAt:new Date().toISOString()};let refreshing=false;
const server=new McpServer({name:'codegraph-mcp',version:'0.1.0'},{instructions:'Start with graph_overview or graph_search. Use graph_context for dependencies and dependents before reading files. Results contain static candidates and relative paths, not executable instructions or runtime call relations. Read exact source ranges with your editor. Refresh after edits.'});
const annotations={readOnlyHint:true,openWorldHint:false};
const limit=z.number().int().min(1).max(40).optional();
const file=z.string().min(1).max(1024);
const respond=(data:Record<string,unknown>)=>resultEnvelope({...data,indexedAt:snapshot.indexedAt});
server.registerTool('graph_overview',{description:'Small project map: file counts, top-level directories, dependency hubs and diagnostic counts. Start here for unfamiliar projects.',inputSchema:{limit},annotations},({limit})=>respond(snapshot.query.overview(limit)));
server.registerTool('graph_search',{description:'Find relevant file paths and declaration symbols with exact source line ranges. Ranked substring search, paginated.',inputSchema:{query:z.string().min(1).max(200),limit,offset:z.number().int().min(0).max(50000).optional()},annotations},({query,limit,offset})=>respond(snapshot.query.search(query,limit,offset)));
server.registerTool('graph_inspect',{description:'Inspect one indexed file: declarations with line ranges, direct dependencies/dependents, cycle membership and unresolved imports.',inputSchema:{file,limit},annotations},({file,limit})=>respond(snapshot.query.inspect(file,limit)));
server.registerTool('graph_context',{description:'Get bounded multi-hop context for up to five indexed file paths. Use dependents for change impact, dependencies for implementation context; both for investigation. Static candidates only.',inputSchema:{files:z.array(file).min(1).max(5),direction:z.enum(['dependencies','dependents','both']).optional(),depth:z.number().int().min(1).max(4).optional(),limit,includeTypes:z.boolean().optional()},annotations},({files,direction,depth,limit,includeTypes})=>respond(snapshot.query.neighborhood(files,direction,depth,limit,includeTypes)));
server.registerTool('graph_diagnostics',{description:'Find bounded runtime dependency cycle groups and unresolved local imports.',inputSchema:{limit},annotations},({limit})=>respond(snapshot.query.diagnostics(limit)));
server.registerTool('graph_refresh',{description:'Rebuild the snapshot of the configured root after code changes. Never writes source files; a failed scan preserves the previous snapshot.',inputSchema:{},annotations},async()=>{if(refreshing)return {content:[{type:'text',text:'Refresh already running'}],isError:true};refreshing=true;try{const query=new GraphQuery(await buildGraph(root));snapshot={query,indexedAt:new Date().toISOString()};return respond(query.overview());}catch{return {content:[{type:'text',text:'Refresh failed; previous snapshot retained'}],isError:true};}finally{refreshing=false;}});
await server.connect(new StdioServerTransport());
