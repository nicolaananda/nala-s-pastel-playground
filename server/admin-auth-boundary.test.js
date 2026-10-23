import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('./index.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('const requireAdmin ='),source.indexOf('const adminBoundary='));
let valid=true,enabled=true,session={email:'teacher@example.test'};
const context={parseCookies:()=>({nala_admin_session:'token'}),verifySession:()=>session,ADMIN_COOKIE_NAME:'nala_admin_session',adminEmail:'owner@example.test',adminSessions:{valid:async()=>valid},pool:{query:async()=>({rows:[{enabled}]})}};
vm.createContext(context);vm.runInContext(code+';globalThis.guard=requireAdmin;',context);
async function check(url,want){let outcome,identity;const req={headers:{cookie:'x'},originalUrl:url};await context.guard(req,{status(n){outcome=n;return this},json(){}},error=>{if(error)throw error;outcome=200;identity=req.admin});assert.equal(outcome,want,url);return identity}
assert.equal((await check('/api/admin/member/courses',200)).role,'teacher');
for(const path of ['/api/admin/content','/api/admin/member-program/config','/api/admin/audit'])await check(path,403);
await check('/api/admin/me',200);await check('/api/admin/logout-all',200);
enabled=false;await check('/api/admin/member/courses',401);enabled=true;
valid=false;await check('/api/admin/me',401);valid=true;
session={email:'owner@example.test'};assert.equal((await check('/api/admin/content',200)).role,'owner');
session=null;await check('/api/admin/me',401);
console.log('PASS actual admin middleware: owner, teacher boundaries, disabled account, revoked session');
