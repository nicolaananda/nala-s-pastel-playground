import assert from 'node:assert/strict';
import express from 'express';
import {createMemberAdminRouter} from './member-admin.js';
let constraint='member_courses_slug_key';
const app=express();app.use(express.json());app.use(createMemberAdminRouter({pool:{query:async()=>{throw Object.assign(Error('private database detail'),{code:'23505',constraint})}},privateDir:'/tmp/nala-test',allowedOrigins:['https://member.test']}));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
try{for(const method of ['POST','PUT']){const r=await fetch(`http://127.0.0.1:${server.address().port}/courses${method==='PUT'?'/1':''}`,{method,headers:{Origin:'https://member.test','Content-Type':'application/json'},body:JSON.stringify({title:'Kelas',slug:'kelas',status:'draft',sortOrder:0})});assert.equal(r.status,409);assert.match((await r.json()).message,/Slug.*sudah digunakan/)}console.log('PASS course slug conflict POST/PUT');}finally{await new Promise(r=>server.close(r))}
