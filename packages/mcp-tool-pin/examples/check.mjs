import {pinTool,matchesPin} from '../dist/index.js';
const tool={name:'lookup',inputSchema:{type:'object'},annotations:{readOnlyHint:true}};
const approved=pinTool('local-approved-server',tool);
console.log(matchesPin(approved,'local-approved-server',tool));
