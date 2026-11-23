import test from 'node:test';import assert from 'node:assert/strict';import {lintCatalog} from '../dist/lint.js';
test('valid catalog',()=>assert.deepEqual(lintCatalog({tools:[{name:'hello',inputSchema:{type:'object'}}]}),[]));
test('duplicate tool names',()=>assert.equal(lintCatalog({tools:[{name:'a',inputSchema:{type:'object'}},{name:'a',inputSchema:{type:'object'}}]}).some(x=>x.code==='DUPLICATE_NAME'),true));
test('invalid schemas and URI',()=>assert.deepEqual(lintCatalog({tools:[{name:'x',inputSchema:{type:'array'}}],resources:[{name:'r'}]}).map(x=>x.code),['INPUT_SCHEMA','URI']));
test('invalid root',()=>assert.equal(lintCatalog(null)[0].code,'ROOT'));
