import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluate,matrix} from '../dist/index.js';
const policy={hosts:['mcp.example:443'],origins:['https://app.example']};
test('native and approved browser',()=>{assert.deepEqual(evaluate(policy,{host:'MCP.EXAMPLE:443'}),{allowed:true});assert.equal(evaluate(policy,{host:'mcp.example:443',origin:'https://app.example'}).allowed,true)});
test('host and origin independent',()=>{const m=matrix(policy,'mcp.example:443','https://app.example');assert.deepEqual(m.invalidHost,{allowed:false,status:403,reason:'host'});assert.deepEqual(m.invalidOrigin,{allowed:false,status:403,reason:'origin'});assert.equal(m.nullOrigin.allowed,false)});
test('reject malformed and missing headers',()=>{for(const host of [undefined,'mcp.example:443,other','user@mcp.example:443','mcp.example:443/path'])assert.equal(evaluate(policy,{host}).allowed,false);for(const origin of ['', 'https://app.example/', 'http://app.example'])assert.equal(evaluate(policy,{host:'mcp.example:443',origin}).allowed,false)});
test('invalid configuration fails closed',()=>{assert.throws(()=>evaluate({hosts:[],origins:[]},{}));assert.throws(()=>evaluate({hosts:['mcp.example'],origins:['*']},{}))});
test('empty origin allowlist accepts only absent origin',()=>{const p={hosts:['mcp.example'],origins:[]};assert.equal(evaluate(p,{host:'mcp.example'}).allowed,true);assert.equal(evaluate(p,{host:'mcp.example',origin:'https://app.example'}).allowed,false)});
