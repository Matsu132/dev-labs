export interface Policy { hosts: readonly string[]; origins: readonly string[] }
export interface RequestHeaders { host?: string; origin?: string }
export type Decision = { allowed: true } | { allowed: false; status: 403; reason: 'host' | 'origin' };
function validHost(value: string): boolean {
  if (!value || /[\s/@?#\\,]/.test(value)) return false;
  try { const u = new URL('https://' + value); return !!u.hostname && !u.username && !u.password; } catch { return false; }
}
function validOrigin(value: string): boolean {
  try { const u = new URL(value); return (u.protocol === 'https:' || u.protocol === 'http:') && u.origin === value; } catch { return false; }
}
/** Pure policy evaluator for synthetic request headers; no network or middleware. */
export function evaluate(policy: Policy, headers: RequestHeaders): Decision {
  if (!policy.hosts.length || policy.hosts.some(h => !validHost(h)) || policy.origins.some(o => !validOrigin(o))) throw new Error('Invalid allowlist');
  if (!headers.host || !validHost(headers.host) || !policy.hosts.some(h => h.toLowerCase() === headers.host!.toLowerCase())) return {allowed:false,status:403,reason:'host'};
  if (headers.origin !== undefined && (!validOrigin(headers.origin) || !policy.origins.includes(headers.origin))) return {allowed:false,status:403,reason:'origin'};
  return {allowed:true};
}
export function matrix(policy: Policy, host: string, origin: string): Record<string, Decision> {
  return {
    native: evaluate(policy,{host}),
    browser: evaluate(policy,{host,origin}),
    invalidHost: evaluate(policy,{host:'untrusted.invalid'}),
    invalidOrigin: evaluate(policy,{host,origin:'https://untrusted.invalid'}),
    nullOrigin: evaluate(policy,{host,origin:'null'})
  };
}
