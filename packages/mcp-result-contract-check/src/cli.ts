import {readFileSync} from 'node:fs';
import {checkResult} from './index.js';
try {
  const [schemaPath,resultPath] = process.argv.slice(2);
  if (!schemaPath || !resultPath) throw new Error('Usage: check <schema.json|-> <result.json>');
  const findings = checkResult(schemaPath === '-' ? undefined : JSON.parse(readFileSync(schemaPath,'utf8')),JSON.parse(readFileSync(resultPath,'utf8')));
  console.log(JSON.stringify({findings},null,2));
  process.exitCode = findings.some(f=>f.severity === 'error') ? 1 : 0;
} catch { console.error('Invalid arguments or unreadable JSON input'); process.exitCode=2; }
