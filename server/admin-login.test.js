import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';import crypto from 'node:crypto';
import {hashPassword,verifyPassword,validPassword} from './member-auth.js';
const source=fs.readFileSync(new URL('./index.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf("app.post('/api/admin/login'"),source.indexOf("app.post('/api/admin/logout'"));
let handler,issued=0,cookies=0,enabled=true;
const passwordHash=await hashPassword('teacher-test-password');
const context={Buffer,adminLoginLimit:()=>()=>{},app:{post:(_path,_limit,fn)=>handler=fn},adminEmail:'owner@example.test',isAdminPasswordValid:p=>p==='owner-test-password',validPassword,verifyPassword,pool:{query:async()=>({rows:enabled?[{password_hash:passwordHash}]:[]})},ADMIN_SESSION_TTL_MS:10000,crypto,signSession:JSON.stringify,adminSessions:{issue:async()=>issued++},setAdminCookie:()=>cookies++,db:{logAdminAction:async()=>{}},console};
vm.createContext(context);vm.runInContext(code,context);
async function login(email,password,want){let status=200;await handler({body:{email,password}},{status(n){status=n;return this},json(){}});assert.equal(status,want)}
await login('teacher@example.test','wrong-password',401);assert.equal(issued,0);assert.equal(cookies,0);
await login('teacher@example.test','teacher-test-password',200);assert.equal(issued,1);
enabled=false;await login('teacher@example.test','teacher-test-password',401);assert.equal(issued,1);
await login('owner@example.test','owner-test-password',200);assert.equal(issued,2);
await login('teacher@example.test',{},401);
console.log('PASS actual login handler: hashed teacher password, disabled account, owner and invalid inputs');
