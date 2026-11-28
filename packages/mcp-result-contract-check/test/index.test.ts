import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkResult} from '../src/index.js';
const schema={type:'object',properties:{ok:{type:'boolean'}},required:['ok']};
test('matching result',()=>assert.deepEqual(checkResult(schema,{content:[{type:'text',text:'{"ok":true}'}],structuredContent:{ok:true}}),[]));
test('missing structured result',()=>assert.equal(checkResult(schema,{content:[]})[0].code,'MISSING_STRUCTURED_CONTENT'));
test('schema mismatch',()=>assert.ok(checkResult(schema,{content:[],structuredContent:{ok:1}}).some(f=>f.code==='SCHEMA_type')));
test('error result bypasses success schema',()=>assert.deepEqual(checkResult(schema,{content:[{type:'text',text:'failed'}],isError:true}),[]));
test('null structured result',()=>assert.deepEqual(checkResult({type:'null'},{content:[{type:'text',text:'null'}],structuredContent:null}),[]));
test('invalid result',()=>assert.equal(checkResult(schema,null)[0].code,'INVALID_RESULT'));
test('fallback mismatch',()=>assert.equal(checkResult(undefined,{content:[],structuredContent:{}})[0].severity,'warning'));
test('invalid schema',()=>assert.ok(checkResult({type:'invalid'},{content:[],structuredContent:{}}).some(f=>f.code==='INVALID_OR_UNSUPPORTED_SCHEMA')));
test('async schema rejects both matching and mismatching results',()=> {
  for (const ok of [true, 1]) {
    const findings = checkResult({...schema,$async:true},{content:[{type:'text',text:JSON.stringify({ok})}],structuredContent:{ok}});
    assert.deepEqual(findings,[{severity:'error',code:'INVALID_OR_UNSUPPORTED_SCHEMA'}]);
  }
});
