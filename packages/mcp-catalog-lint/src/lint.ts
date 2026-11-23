export type Finding = { code: string; path: string; message: string };
type ObjectValue = Record<string, unknown>;
const object = (v: unknown): v is ObjectValue => typeof v === 'object' && v !== null && !Array.isArray(v);
export function lintCatalog(value: unknown): Finding[] {
  const findings: Finding[] = [];
  const add = (code: string, path: string, message: string) => findings.push({code,path,message});
  if (!object(value)) return [{code:'ROOT',path:'$',message:'Expected an object containing tools, resources or prompts arrays'}];
  for (const group of ['tools','resources','prompts'] as const) {
    const items = value[group];
    if (items === undefined) continue;
    if (!Array.isArray(items)) {add('ARRAY',`$.${group}`,'Expected array');continue;}
    const names = new Set<string>();
    for (let i=0;i<items.length;i++) {
      const path=`$.${group}[${i}]`, item:unknown=items[i];
      if (!object(item)) {add('ITEM',path,'Expected object');continue;}
      if (typeof item.name !== 'string' || !item.name.trim()) add('NAME',`${path}.name`,'Non-empty name required');
      else if (names.has(item.name)) add('DUPLICATE_NAME',`${path}.name`,'Duplicate name within catalog group');
      else names.add(item.name);
      if (group==='tools') {
        if (!object(item.inputSchema) || item.inputSchema.type!=='object') add('INPUT_SCHEMA',`${path}.inputSchema`,'Expected object JSON Schema');
        if (item.outputSchema !== undefined && (!object(item.outputSchema) || item.outputSchema.type!=='object')) add('OUTPUT_SCHEMA',`${path}.outputSchema`,'Expected object JSON Schema');
      }
      if (group==='resources' && (typeof item.uri!=='string' || !item.uri.trim())) add('URI',`${path}.uri`,'Resource URI required');
    }
  }
  return findings;
}
