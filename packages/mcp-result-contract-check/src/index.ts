import { Ajv2020 } from 'ajv/dist/2020.js';
import { isDeepStrictEqual } from 'node:util';
export type Finding = { severity: 'error' | 'warning'; code: string; path?: string };
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export function checkResult(schema: unknown, result: unknown): Finding[] {
  const findings: Finding[] = [];
  if (!record(result) || !Array.isArray(result.content) || (result.isError !== undefined && typeof result.isError !== 'boolean')) return [{severity:'error',code:'INVALID_RESULT'}];
  if (result.content.some((b: unknown) => !record(b) || typeof b.type !== 'string' || (b.type === 'text' && typeof b.text !== 'string'))) findings.push({severity:'error',code:'INVALID_CONTENT'});
  if (result.isError === true) return findings;
  const present = Object.hasOwn(result,'structuredContent');
  if (schema !== undefined) {
    if (!present) findings.push({severity:'error',code:'MISSING_STRUCTURED_CONTENT'});
    try {
      if (!record(schema) && typeof schema !== 'boolean') throw new Error('Invalid schema');
      const validate = new Ajv2020({allErrors:true,strict:true}).compile(schema);
      if ('$async' in validate && validate.$async === true) throw new Error('Async schemas are not supported');
      if (present && !validate(result.structuredContent)) for (const e of validate.errors ?? []) findings.push({severity:'error',code:'SCHEMA_'+e.keyword,path:e.instancePath});
    } catch { findings.push({severity:'error',code:'INVALID_OR_UNSUPPORTED_SCHEMA'}); }
  }
  if (present && !result.content.some((b: unknown) => {
    if (!record(b) || b.type !== 'text' || typeof b.text !== 'string') return false;
    try { return isDeepStrictEqual(JSON.parse(b.text),result.structuredContent); } catch { return false; }
  })) findings.push({severity:'warning',code:'MISSING_MATCHING_TEXT_FALLBACK'});
  return findings;
}
