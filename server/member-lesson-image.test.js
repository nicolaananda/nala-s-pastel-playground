import assert from 'node:assert/strict';
import express from 'express';
import {createMemberAdminRouter} from './member-admin.js';
const writes=[];
const app=express();app.use(express.json());app.use(createMemberAdminRouter({pool:{query:async(sql,args)=>{writes.push({sql,args});return {rows:[{id:'1'}]}}},privateDir:'/tmp/nala-image-test',allowedOrigins:['https://member.example.test']}));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
try{const base=`http://127.0.0.1:${server.address().port}`;for(const method of ['POST','PUT']){writes.length=0;const data={chapterId:'1',title:'Gojo',sortOrder:0,imageUrl:'https://images.example.test/gojo.webp'};const send=body=>fetch(base+'/lessons'+(method==='PUT'?'/1':''),{method,headers:{'Content-Type':'application/json',Origin:'https://member.example.test'},body:JSON.stringify(body)});assert.equal((await send(data)).status,200+(method==='POST'?1:0));assert.ok(writes.some(x=>x.sql.includes('image_url')&&x.args.includes(data.imageUrl)),'lesson image must persist');writes.length=0;assert.equal((await send({...data,imageUrl:'javascript:alert(1)'})).status,400);assert.equal(writes.length,0,'invalid URL must not write');}console.log('PASS lesson image create/update and unsafe URL rejection');}finally{await new Promise(r=>server.close(r));}
