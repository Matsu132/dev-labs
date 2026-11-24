import {matrix} from '../dist/index.js';
console.log(JSON.stringify(matrix({hosts:['mcp.example'],origins:['https://app.example']},'mcp.example','https://app.example'),null,2));
