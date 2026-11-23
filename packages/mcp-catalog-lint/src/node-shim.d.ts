declare module 'node:fs/promises' { export function readFile(path: string, encoding: string): Promise<string>; }
declare const process: {argv:string[];exit(code:number):never;exitCode:number|undefined};
declare const console: {error(...args:unknown[]):void;log(...args:unknown[]):void};
