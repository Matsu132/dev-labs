import ts from 'typescript';
import {readdir,readFile,realpath,stat} from 'node:fs/promises';
import path from 'node:path';
export type SymbolLocation={name:string;kind:string;line:number;endLine:number};
export type GraphNode={id:string;symbols:string[];locations?:SymbolLocation[]};
export type GraphEdge={from:string;to:string;kind:'import'|'export'|'dynamic'|'require';typeOnly:boolean};
export type CodeGraph={nodes:GraphNode[];edges:GraphEdge[];cycles:string[][];unresolved:{from:string;specifier:string}[]};
const excluded=new Set(['node_modules','.git','.next','dist','build','coverage','out','.turbo','.cache']);
const source=/\.(?:[cm]?ts|tsx|[cm]?js|jsx)$/i;
const slash=(s:string)=>s.split(path.sep).join('/');
export async function buildGraph(directory:string):Promise<CodeGraph>{
 const root=await realpath(directory);const files=new Map<string,string>();const packageFiles=new Set<string>();let total=0;let visited=0;
 async function walk(dir:string){
  for(const item of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
   if(++visited>20000)throw Error('Directory entry limit exceeded');
   if(item.name.startsWith('.')||excluded.has(item.name)||item.isSymbolicLink())continue;
   const full=path.join(dir,item.name);
   if(item.isDirectory()){await walk(full);continue;}
   if(!item.isFile())continue;
   if(item.name==='package.json'){packageFiles.add(full);continue;}
   if(!source.test(item.name)||/\.d\.[cm]?ts$/.test(item.name))continue;
   const size=(await stat(full)).size;total+=size;
   if(files.size>=500||size>1024*1024||total>20*1024*1024)throw Error('Source scan limit exceeded (500 files, 1 MiB/file, 20 MiB total)');
   files.set(full,await readFile(full,'utf8'));
  }
 }
 await walk(root);
 const id=(full:string)=>slash(path.relative(root,full));
 let options:ts.CompilerOptions={module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,allowJs:true};
 // Read only a plain root config, without following extends or plugins.
 const configFile=path.join(root,'tsconfig.json');
 try{const actual=await realpath(configFile);if(actual===configFile&&(await stat(actual)).size<=1024*1024){const parsed=ts.parseConfigFileTextToJson(actual,await readFile(actual,'utf8'));if(parsed.error)throw Error('Invalid tsconfig.json');const converted=ts.convertCompilerOptionsFromJson(parsed.config?.compilerOptions??{},root);if(converted.errors.length)throw Error('Invalid compilerOptions');options={...options,...converted.options};}}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
 // Expose package entry-point metadata only in directories containing scanned source.
 const dirs=new Set<string>([root]);for(const f of files.keys()){let d=path.dirname(f);while(!dirs.has(d)){dirs.add(d);d=path.dirname(d);}}
 const metadata=new Map<string,string>();
 let metadataBytes=0;
 for(const file of packageFiles){
  if(!dirs.has(path.dirname(file)))continue;
  const size=(await stat(file)).size;
  if(size>1024*1024||metadataBytes+size>20*1024*1024)throw Error('Package metadata scan limit exceeded (1 MiB/file, 20 MiB total)');
  metadata.set(file,await readFile(file,'utf8'));
  metadataBytes+=size;
 }
 const host:ts.ModuleResolutionHost={
  fileExists:f=>files.has(path.resolve(f))||metadata.has(path.resolve(f)),
  readFile:f=>files.get(path.resolve(f))??metadata.get(path.resolve(f)),
  directoryExists:d=>dirs.has(path.resolve(d)),
  getCurrentDirectory:()=>root,
  useCaseSensitiveFileNames:true,
 };
 const nodes:GraphNode[]=[];const edges:GraphEdge[]=[];const unresolved:CodeGraph['unresolved']=[];const seen=new Set<string>();const missing=new Set<string>();
 for(const [full,content] of files){
  const ast=ts.createSourceFile(full,content,ts.ScriptTarget.Latest,true);
  const symbols=new Set<string>();const locations:SymbolLocation[]=[];
  function locate(name:string,n:ts.Node){symbols.add(name);if(locations.length<2000)locations.push({name,kind:ts.SyntaxKind[n.kind],line:ast.getLineAndCharacterOfPosition(n.getStart(ast)).line+1,endLine:ast.getLineAndCharacterOfPosition(n.end).line+1});}
  function add(spec:string,kind:GraphEdge['kind'],typeOnly=false){
   const resolved=ts.resolveModuleName(spec,full,options,host).resolvedModule?.resolvedFileName;
   if(!resolved||!files.has(path.resolve(resolved))){if(spec.startsWith('.')||spec.startsWith('/')||options.paths&&Object.keys(options.paths).some(k=>k.includes('*')?spec.startsWith(k.split('*')[0]):k===spec)){const key=JSON.stringify([id(full),spec]);if(!missing.has(key)){missing.add(key);unresolved.push({from:id(full),specifier:spec});}}return;}
   const edge={from:id(full),to:id(path.resolve(resolved)),kind,typeOnly};const key=JSON.stringify(edge);
   if(!seen.has(key)){if(edges.length>=10000)throw Error('Edge limit exceeded');seen.add(key);edges.push(edge);}
  }
  function visit(n:ts.Node){
   if((ts.isFunctionDeclaration(n)||ts.isClassDeclaration(n)||ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)||ts.isEnumDeclaration(n))&&n.name)locate(n.name.text,n);
   if(ts.isVariableDeclaration(n)&&ts.isIdentifier(n.name)&&n.initializer&&(ts.isArrowFunction(n.initializer)||ts.isFunctionExpression(n.initializer)))locate(n.name.text,n);
   if(ts.isImportDeclaration(n)&&ts.isStringLiteralLike(n.moduleSpecifier)){const clause=n.importClause;const named=clause?.namedBindings;add(n.moduleSpecifier.text,'import',!!clause&&(clause.isTypeOnly||(!clause.name&&!!named&&ts.isNamedImports(named)&&named.elements.length>0&&named.elements.every(x=>x.isTypeOnly))));}
   if(ts.isExportDeclaration(n)&&n.moduleSpecifier&&ts.isStringLiteralLike(n.moduleSpecifier))add(n.moduleSpecifier.text,'export',n.isTypeOnly||!!(n.exportClause&&ts.isNamedExports(n.exportClause)&&n.exportClause.elements.length>0&&n.exportClause.elements.every(x=>x.isTypeOnly)));
   if(ts.isImportEqualsDeclaration(n)&&ts.isExternalModuleReference(n.moduleReference)&&n.moduleReference.expression&&ts.isStringLiteralLike(n.moduleReference.expression))add(n.moduleReference.expression.text,'require',n.isTypeOnly);
   if(ts.isImportTypeNode(n)&&ts.isLiteralTypeNode(n.argument)&&ts.isStringLiteralLike(n.argument.literal)){
    add(n.argument.literal.text,'import',true);
   }
   if(ts.isCallExpression(n)){
    const [specifier]=n.arguments;
    if(specifier&&ts.isStringLiteralLike(specifier)){
     if(n.expression.kind===ts.SyntaxKind.ImportKeyword&&n.arguments.length<=2)add(specifier.text,'dynamic');
     else if(n.arguments.length===1&&ts.isIdentifier(n.expression)&&n.expression.text==='require')add(specifier.text,'require');
    }
   }
   ts.forEachChild(n,visit);
  }
  visit(ast);nodes.push({id:id(full),symbols:[...symbols].sort(),locations});
 }
 nodes.sort((a,b)=>a.id.localeCompare(b.id));edges.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
 return {nodes,edges,cycles:findCycles(nodes.map(n=>n.id),edges.filter(e=>!e.typeOnly)),unresolved};
}
/** Strongly connected components, including self-imports. Type-only edges are excluded by caller. */
export function findCycles(ids:string[],edges:GraphEdge[]):string[][]{
 const adj=new Map(ids.map(id=>[id,[] as string[]]));for(const e of edges)adj.get(e.from)?.push(e.to);
 const indexes=new Map<string,number>(),low=new Map<string,number>(),on=new Set<string>(),stack:string[]=[],groups:string[][]=[];let next=0;
 function visit(v:string){indexes.set(v,next);low.set(v,next++);stack.push(v);on.add(v);
  for(const w of adj.get(v)??[]){if(!adj.has(w))continue;if(!indexes.has(w)){visit(w);low.set(v,Math.min(low.get(v)!,low.get(w)!));}else if(on.has(w))low.set(v,Math.min(low.get(v)!,indexes.get(w)!));}
  if(low.get(v)===indexes.get(v)){const group:string[]=[];let w:string;do{w=stack.pop()!;on.delete(w);group.push(w);}while(w!==v);if(group.length>1||(adj.get(v)??[]).includes(v))groups.push(group.sort());}
 }
 for(const id of ids)if(!indexes.has(id))visit(id);return groups.sort((a,b)=>a[0].localeCompare(b[0]));
}
export {renderHtml} from './render.js';
