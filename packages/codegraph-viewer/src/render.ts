import type {CodeGraph} from './index.js';
export function renderHtml(graph:CodeGraph):string{
 // Escape data before inserting it into an inert script element; all visible labels use textContent.
 const data=JSON.stringify(graph).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Codegraph Viewer</title>
<style>${styles}</style>
</head>
<body>
<header>
 <div><h1>Codegraph Viewer</h1><p id="summary" role="status"></p></div>
 <div class="actions"><button id="reset">Reset view</button><button id="download">Export JSON</button></div>
</header>
<main>
 <section class="panel" aria-labelledby="graph-title">
  <h2 id="graph-title">Dependency graph</h2>
  <div class="controls">
   <label class="search">Search files or symbols<input id="search" type="search" placeholder="e.g. broker.ts"></label>
   <div class="filters">
    <label><input id="types" type="checkbox" checked> Type-only edges</label>
    <label><input id="cycles" type="checkbox"> Cycles only</label>
    <label><input id="focus-only" type="checkbox" disabled> Selected file and neighbors</label>
   </div>
   <label class="zoom">Zoom <input id="zoom" type="range" min="50" max="200" value="100"><output id="zoom-value" for="zoom">100%</output></label>
  </div>
  <p class="legend">Arrows point to dependencies · Dashed lines are type-only imports · Amber outlines mark cycle members</p>
  <p id="empty" hidden>No files match the current filters.</p>
  <div id="viewport" tabindex="0" role="region" aria-label="Scrollable dependency graph">
   <svg id="graph" role="group" aria-label="File dependency graph"></svg>
  </div>
 </section>
 <aside class="panel" aria-labelledby="details-title">
  <h2 id="details-title">File details</h2>
  <div id="details"></div>
  <details><summary>All unresolved local imports</summary><div id="unresolved"></div></details>
 </aside>
</main>
<script type="application/json" id="data">${data}</script>
<script>${script}</script>
</body>
</html>`;
}

const styles = `
:root {
 color-scheme: light dark;
 font: 16px/1.5 system-ui, sans-serif;
 --surface: #fff; --bg: #eef3f6; --ink: #142736; --muted: #466172;
 --line: #bfd0da; --accent: #00636a; --cycle: #965005;
 --selected: #d9f3ef; --action: #fff;
}
@media (prefers-color-scheme: dark) {
 :root {
  --surface: #14242d; --bg: #0d1921; --ink: #e9f3f7; --muted: #adc3ce;
  --line: #4c6574; --accent: #7addd4; --cycle: #ffc275;
  --selected: #1b3d42; --action: #102229;
 }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); }
header { padding: 1.25rem clamp(1rem, 3vw, 2rem); background: var(--surface); border-bottom: 1px solid var(--line); }
header, .actions, .filters, .zoom { display: flex; align-items: center; flex-wrap: wrap; gap: .5rem 1rem; }
header { justify-content: space-between; }
h1, h2, h3, p { margin: 0; }
h1 { font-size: clamp(1.5rem, 3vw, 2rem); letter-spacing: -.035em; }
h2 { font-size: 1.1rem; margin-bottom: .75rem; }
h3 { font: 600 .9rem/1.5 ui-monospace, monospace; margin-bottom: 1rem; }
p, .legend { color: var(--muted); }
main { display: grid; grid-template-columns: minmax(0, 1fr); gap: 1rem; padding: clamp(.75rem, 2vw, 1.5rem); }
@media (min-width: 960px) {
 main { grid-template-columns: minmax(0, 1fr) minmax(17rem, 25%); align-items: start; }
 aside { max-height: 82vh; overflow: auto; }
}
.panel { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; padding: 1rem; min-width: 0; }
.controls { display: grid; gap: .65rem; }
.search { display: grid; grid-template-columns: minmax(0, 1fr); gap: .25rem; max-width: 26rem; }
label, .legend { font-size: .875rem; }
.filters label { display: flex; align-items: center; gap: .5rem; min-height: 44px; }
input { accent-color: var(--accent); }
button, input { font: inherit; }
button, input[type=search] {
 border: 1px solid var(--line); background: var(--surface); color: var(--ink);
 border-radius: 8px; min-height: 44px; padding: .5rem .8rem; min-width: 0;
}
button, summary, .node { cursor: pointer; }
button:hover { background: var(--selected); }
#download { background: var(--accent); color: var(--action); border-color: var(--accent); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.zoom { min-height: 44px; }
#zoom-value { min-width: 3.5rem; font-variant-numeric: tabular-nums; }
.legend, #empty { margin: .75rem 0; }
#viewport { overflow: auto; max-height: 68vh; border: 1px solid var(--line); border-radius: 9px; background: var(--bg); }
svg { display: block; background-image: radial-gradient(var(--line) 1px, transparent 1px); background-size: 16px 16px; }
.node rect { fill: var(--surface); stroke: var(--accent); stroke-width: 1.5; }
.node.cycle rect { stroke: var(--cycle); stroke-width: 2; }
.node:hover rect, .node.selected rect { fill: var(--selected); }
.node.selected rect { stroke-width: 4; }
.node text { fill: var(--ink); font: 13px ui-monospace, monospace; pointer-events: none; }
.edge { stroke: var(--muted); stroke-width: 1.3; fill: none; opacity: .65; }
.edge.type { stroke-dasharray: 5 4; }
.edge.focus { stroke: var(--accent); stroke-width: 2.5; opacity: 1; }
aside { overflow-wrap: anywhere; }
aside ul { padding-left: 1.25rem; margin: .4rem 0 1rem; }
aside li + li { margin-top: .5rem; }
aside button { max-width: 100%; overflow-wrap: anywhere; text-align: left; }
aside details { margin-top: 1rem; border-top: 1px solid var(--line); }
aside summary { padding: .65rem 0; min-height: 44px; }
`;

const script = `
'use strict';
const data=JSON.parse(document.getElementById('data').textContent);
const $=id=>document.getElementById(id), svg=$('graph'), ns='http://www.w3.org/2000/svg';
const byId=new Map(data.nodes.map(n=>[n.id,n])), cyclic=new Set(data.cycles.flat());let selected=null;
const nodeElements=new Map();
function el(tag,attrs={},text){const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;}
function html(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
function showDetails(){const d=$('details');d.replaceChildren();if(!selected){d.textContent='Select a node to see dependencies and symbols.';return;}const n=byId.get(selected);d.append(html('h3',selected));
const locations=n.locations?.map(s=>s.name+' · L'+s.line+(s.endLine>s.line?'–'+s.endLine:''))??n.symbols;
const missing=data.unresolved.filter(e=>e.from===selected).map(e=>e.specifier);for(const [label,items] of [['Symbols',locations],['Unresolved imports',missing],['Dependencies',data.edges.filter(e=>e.from===selected).map(e=>e.to)],['Dependents',data.edges.filter(e=>e.to===selected).map(e=>e.from)]]){d.append(html('strong',label));const list=html('ul');for(const value of new Set(items)){const li=html('li');if(label==='Dependencies'||label==='Dependents'){const b=html('button',value);b.onclick=()=>{selected=value;$('search').value='';$('cycles').checked=false;draw();revealNode(value,true);};li.append(b);}else li.textContent=value;list.append(li);}if(!items.length)list.append(html('li','None'));d.append(list);}}
function revealNode(id,focus=false){
 const node=nodeElements.get(id);
 if(!node)return;
 if(focus)node.focus({preventScroll:true});
 const view=$('viewport'), frame=view.getBoundingClientRect(), rect=node.getBoundingClientRect();
 if(rect.left<frame.left||rect.right>frame.right) view.scrollLeft+=rect.left-frame.left-(frame.width-rect.width)/2;
 if(rect.top<frame.top||rect.bottom>frame.bottom) view.scrollTop+=rect.top-frame.top-(frame.height-rect.height)/2;
}
function draw(){const q=$('search').value.toLowerCase().trim(), only=$('cycles').checked, showTypes=$('types').checked;
const matches=new Set(data.nodes.filter(n=>(!only||cyclic.has(n.id))&&(!q||n.id.toLowerCase().includes(q)||n.symbols.some(s=>s.toLowerCase().includes(q)))).map(n=>n.id));
const focusOnly=$('focus-only').checked&&selected!==null;
const eligibleEdges=data.edges.filter(e=>showTypes||!e.typeOnly);
if(focusOnly){
 const neighborhood=new Set([selected]);
 for(const e of eligibleEdges){
  if(e.from===selected)neighborhood.add(e.to);
  if(e.to===selected)neighborhood.add(e.from);
 }
 for(const id of matches)if(!neighborhood.has(id))matches.delete(id);
}else if(q){
 const seeds=new Set(matches);
 for(const e of eligibleEdges){
  if(seeds.has(e.from)&&(!only||cyclic.has(e.to)))matches.add(e.to);
  if(seeds.has(e.to)&&(!only||cyclic.has(e.from)))matches.add(e.from);
 }
}
const nodes=data.nodes.filter(n=>matches.has(n.id));const edges=eligibleEdges.filter(e=>matches.has(e.from)&&matches.has(e.to));
$('empty').hidden=nodes.length>0;
$('viewport').hidden=nodes.length===0;
nodeElements.clear();const pos=new Map();const cols=Math.max(1,Math.ceil(Math.sqrt(nodes.length/1.6))), w=Math.max(500,cols*260+24), h=Math.max(260,Math.ceil(nodes.length/cols)*100+40);
nodes.forEach((n,i)=>pos.set(n.id,{x:20+i%cols*260,y:24+Math.floor(i/cols)*100}));svg.replaceChildren();svg.setAttribute('viewBox','0 0 '+w+' '+h);const scale=Number($('zoom').value)/100;svg.setAttribute('width',String(w*scale));svg.setAttribute('height',String(h*scale));
const defs=el('defs'),marker=el('marker',{id:'arrow',markerWidth:8,markerHeight:8,refX:7,refY:3,orient:'auto',markerUnits:'userSpaceOnUse'});marker.append(el('path',{d:'M0 0 L7 3 L0 6 Z',fill:'var(--muted)'}));defs.append(marker);svg.append(defs);
for(const e of edges){const a=pos.get(e.from),b=pos.get(e.to);const x=a.x+110,y=a.y+48,tx=b.x+110,ty=b.y;const d=e.from===e.to?'M'+(a.x+220)+' '+(a.y+20)+' c45 -45 45 65 0 15':'M'+x+' '+y+' C'+x+' '+(y+30)+' '+tx+' '+(ty-30)+' '+tx+' '+ty;const line=el('path',{d,class:'edge'+(e.typeOnly?' type':'')+(selected===e.from||selected===e.to?' focus':''),'marker-end':'url(#arrow)'});line.append(el('title',{},e.from+' → '+e.to+' ('+e.kind+')'));svg.append(line);}
for(const n of nodes){const p=pos.get(n.id),g=el('g',{class:'node'+(cyclic.has(n.id)?' cycle':'')+(selected===n.id?' selected':''),tabindex:0,role:'button','aria-label':n.id+(cyclic.has(n.id)?', in a dependency cycle':''),'aria-pressed':selected===n.id,transform:'translate('+p.x+' '+p.y+')'});g.append(el('rect',{width:220,height:48,rx:8}),el('text',{x:10,y:19},n.id.length>24?'…'+n.id.slice(-23):n.id),el('text',{x:10,y:36},n.symbols.length+' symbols'+(cyclic.has(n.id)?' · cycle':'')),el('title',{},n.id));const select=()=>{
 const restoreFocus=document.activeElement===g;
 selected=n.id;
 draw();
 revealNode(n.id,restoreFocus);
};g.addEventListener('click',select);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});svg.append(g);nodeElements.set(n.id,g);}
$('summary').textContent=data.nodes.length+' files · '+data.edges.length+' edges · '+data.cycles.length+' cycle groups · '+nodes.length+' visible';
$('focus-only').disabled=selected===null;
showDetails();}
$('zoom').addEventListener('input',()=>{
 const scale=Number($('zoom').value)/100;
 const {width,height}=svg.viewBox.baseVal;
 svg.setAttribute('width',String(width*scale));
 svg.setAttribute('height',String(height*scale));
 $('zoom-value').value=$('zoom').value+'%';
});
for(const id of ['search','types','cycles','focus-only'])$(id).addEventListener('input',draw);
$('reset').onclick=()=>{selected=null;$('focus-only').checked=false;$('search').value='';$('types').checked=true;$('cycles').checked=false;$('zoom').value='100';$('zoom-value').value='100%';draw();};
$('download').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=html('a');a.href=url;a.download='codegraph.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
const list=html('ul');for(const e of data.unresolved)list.append(html('li',e.from+' → '+e.specifier));if(!data.unresolved.length)list.append(html('li','None'));$('unresolved').append(list);draw();
`;
