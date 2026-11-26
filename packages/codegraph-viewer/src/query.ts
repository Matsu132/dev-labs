import type {CodeGraph,GraphNode,GraphEdge} from './index.js';
const MAX=40;
function bounded(value:number,max=MAX){if(!Number.isInteger(value)||value<1||value>max)throw Error('Invalid limit');return value;}
const ordered=(a:string,b:string)=>a<b?-1:a>b?1:0;
export class GraphQuery{
 private nodes:Map<string,GraphNode>;
 private outgoing=new Map<string,GraphEdge[]>();
 private incoming=new Map<string,GraphEdge[]>();
 constructor(private graph:CodeGraph){
  this.nodes=new Map(graph.nodes.map(n=>[n.id,n]));
  for(const e of graph.edges){const out=this.outgoing.get(e.from)??[];out.push(e);this.outgoing.set(e.from,out);const inc=this.incoming.get(e.to)??[];inc.push(e);this.incoming.set(e.to,inc);}
 }
 overview(limit=12){bounded(limit);const dirs=new Map<string,number>();for(const n of this.nodes.values()){const dir=n.id.includes('/')?n.id.split('/')[0]:'.';dirs.set(dir,(dirs.get(dir)??0)+1);}
 const ranked=[...this.nodes.keys()].map(file=>({file,dependencies:new Set((this.outgoing.get(file)??[]).map(e=>e.to)).size,dependents:new Set((this.incoming.get(file)??[]).map(e=>e.from)).size})).sort((a,b)=>b.dependents-a.dependents||b.dependencies-a.dependencies||ordered(a.file,b.file));
 return {files:this.nodes.size,edges:this.graph.edges.length,cycleGroups:this.graph.cycles.length,unresolvedImports:this.graph.unresolved.length,directories:[...dirs].sort((a,b)=>b[1]-a[1]||ordered(a[0],b[0])).slice(0,limit).map(([directory,files])=>({directory,files})),hubs:ranked.slice(0,limit),scope:'static file dependencies; not a runtime call graph'};}
 search(query:string,limit=15,offset=0){bounded(limit);if(!query.trim()||query.length>200||!Number.isInteger(offset)||offset<0||offset>50000)throw Error('Invalid query');
 const q=query.trim().toLowerCase();const rows:{file:string;symbol?:string;kind?:string;line?:number;endLine?:number;score:number}[]=[];
 for(const n of this.nodes.values()){
  const file=n.id.toLowerCase();if(file.includes(q))rows.push({file:n.id,score:file===q?120: file.split('/').at(-1)===q?110:50});
  for(const s of n.locations??n.symbols.map(name=>({name,kind:undefined,line:undefined,endLine:undefined}))){const name=s.name.toLowerCase();if(name.includes(q))rows.push({file:n.id,symbol:s.name,kind:s.kind,line:s.line,endLine:s.endLine,score:name===q?100:name.startsWith(q)?80:60});}
 }
 rows.sort((a,b)=>b.score-a.score||ordered(a.file,b.file)||ordered(a.symbol??'',b.symbol??'')||(a.line??0)-(b.line??0));
 return {total:rows.length,offset,nextOffset:offset+limit<rows.length?offset+limit:null,matches:rows.slice(offset,offset+limit)};}
 inspect(file:string,limit=20){bounded(limit);const n=this.nodes.get(file);if(!n)throw Error('Unknown indexed file; use search first');
 const list=(edges:GraphEdge[],key:'from'|'to')=>{const grouped=new Map<string,{file:string;kinds:string[];typeOnly:boolean}>();for(const e of edges){const id=e[key];const v=grouped.get(id)??{file:id,kinds:[],typeOnly:true};if(!v.kinds.includes(e.kind))v.kinds.push(e.kind);v.typeOnly&&=e.typeOnly;grouped.set(id,v);}const all=[...grouped.values()].sort((a,b)=>ordered(a.file,b.file));return {total:all.length,items:all.slice(0,limit)};};
 return {file,symbolCount:n.symbols.length,locations:(n.locations??[]).slice(0,limit),symbols:n.symbols.slice(0,limit),dependencies:list(this.outgoing.get(file)??[],'to'),dependents:list(this.incoming.get(file)??[],'from'),cycle:this.graph.cycles.some(c=>c.includes(file)),unresolved:this.graph.unresolved.filter(e=>e.from===file).slice(0,limit)};}
 neighborhood(files:string[],direction:'dependencies'|'dependents'|'both'='both',depth=2,limit=25,includeTypes=false){
 bounded(depth,4);bounded(limit);if(!files.length||files.length>5||files.some(f=>!this.nodes.has(f)))throw Error('Unknown indexed file or invalid seeds');
 const distance=new Map<string,number>();
 const predecessor=new Map<string,string>();
 const queue=[...new Set(files)].sort(ordered);for(const f of queue)distance.set(f,0);
 for(let i=0;i<queue.length;i++){const file=queue[i],d=distance.get(file)!;if(d>=depth)continue;const neighbors=new Set<string>();if(direction!=='dependents')for(const e of this.outgoing.get(file)??[])if(includeTypes||!e.typeOnly)neighbors.add(e.to);if(direction!=='dependencies')for(const e of this.incoming.get(file)??[])if(includeTypes||!e.typeOnly)neighbors.add(e.from);for(const next of [...neighbors].sort(ordered))if(!distance.has(next)){distance.set(next,d+1);predecessor.set(next,file);queue.push(next);}}
 const ranked=queue.slice(0,limit);const selected=new Set(ranked);const links=this.graph.edges.filter(e=>selected.has(e.from)&&selected.has(e.to)&&(includeTypes||!e.typeOnly));return {seeds:files,direction,depth,total:queue.length,truncated:queue.length>limit,files:ranked.map(file=>({file,distance:distance.get(file),via:predecessor.get(file)??null,symbols:this.nodes.get(file)!.symbols.slice(0,5)})),edgeCount:links.length,edges:links.slice(0,80).map(e=>[e.from,e.to,e.kind,e.typeOnly]),edgesTruncated:links.length>80,scope:'static candidates; inspect source before editing'};}
 diagnostics(limit=15){bounded(limit);return {cycleGroups:this.graph.cycles.length,cycles:this.graph.cycles.slice(0,limit).map(c=>({size:c.length,files:c.slice(0,limit),truncated:c.length>limit})),unresolvedCount:this.graph.unresolved.length,unresolved:this.graph.unresolved.slice(0,limit)};}
}
/** Enforce a UTF-8 response budget even for long file paths or identifiers. */
export function resultEnvelope(data:Record<string,unknown>,budget=16384){
 const text=JSON.stringify(data);if(Buffer.byteLength(text)>budget)return {content:[{type:'text' as const,text:'Result exceeds response budget. Retry with a lower limit or depth.'}],isError:true as const};
 return {content:[{type:'text' as const,text}],structuredContent:data};
}
