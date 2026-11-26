import {createHash} from 'node:crypto';
type Json = null | boolean | number | string | Json[] | {[key:string]:Json};
function canonical(value:Json):string {
 if(value===null || typeof value!=='object')return JSON.stringify(value);
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';
 return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}';
}
export type ToolPin={server:string;name:string;digest:string};
/** Pin the entire JSON tool declaration, not just its name or annotations. */
export function pinTool(server:string,tool:Json):ToolPin {
 if(!server || !tool || typeof tool!=='object'||Array.isArray(tool)||typeof tool.name!=='string'||!tool.name)throw new Error('Invalid tool identity');
 return {server,name:tool.name,digest:createHash('sha256').update(canonical([server,tool])).digest('hex')};
}
/** Exact server identity and declaration must match an independently approved pin. */
export function matchesPin(pin:ToolPin,server:string,tool:Json):boolean {
 const actual=pinTool(server,tool);
 return pin.server===actual.server&&pin.name===actual.name&&pin.digest===actual.digest;
}
