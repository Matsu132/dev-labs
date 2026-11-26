#!/usr/bin/env node
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {buildGraph,renderHtml} from './index.js';
const args=process.argv.slice(2);
if(args.includes('--help')||args.length>2){console.log('Usage: codegraph-viewer [source-directory] [output.html|output.json]');process.exitCode=args.length>2?1:0;}
else{try{const root=args[0]??'.';const output=path.resolve(args[1]??'codegraph.html');if(!/\.(html|json)$/i.test(output))throw Error('Output must end in .html or .json');const graph=await buildGraph(root);await writeFile(output,output.endsWith('.json')?JSON.stringify(graph,null,2):renderHtml(graph),{flag:'wx',mode:0o600});console.log('Wrote '+output+' ('+graph.nodes.length+' files, '+graph.edges.length+' edges)');}catch(e){console.error(e instanceof Error?e.message:'Graph generation failed');process.exitCode=1;}}
