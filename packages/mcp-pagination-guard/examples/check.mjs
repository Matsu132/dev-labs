import {collectCatalog} from '../dist/index.js';
const tools=await collectCatalog(async cursor=>cursor===undefined?{items:[{name:'search'}],nextCursor:'opaque'}:{items:[{name:'execute'}]},tool=>tool.name);
console.log(tools);
