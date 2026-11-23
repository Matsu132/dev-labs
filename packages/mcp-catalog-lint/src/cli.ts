#!/usr/bin/env node
import {readFile} from 'node:fs/promises';
import {lintCatalog} from './lint.js';
const file=process.argv[2];
if(!file){console.error('Usage: node dist/cli.js <catalog.json>');process.exit(2);}
try {
  const data=JSON.parse(await readFile(file,'utf8'));
  const findings=lintCatalog(data);
  for(const f of findings)console.log(`${f.code} ${f.path}: ${f.message}`);
  if(!findings.length)console.log('Catalog lint passed');
  process.exitCode=findings.length?1:0;
} catch(e) {console.error('Unable to parse catalog:',e instanceof Error?e.message:String(e));process.exitCode=2;}
