import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createMemberRouter} from './member-routes.js';

test('checkout capability defaults disabled and reflects active plan config',async()=>{
 const queries=[];
 const store={query:async sql=>{queries.push(sql);return {rows:[{id:7,name:'Kelas 45 hari',price:45000,durationDays:45}]}}};
 const app=express();app.use('/member',createMemberRouter({store,privateDir:'/tmp',allowedOrigins:[]}));
 const server=app.listen(0,'127.0.0.1');await new Promise((ok,no)=>server.once('listening',ok).once('error',no));
 try{const response=await fetch(`http://127.0.0.1:${server.address().port}/member/checkout-capability`),body=await response.json();assert.equal(response.status,200);assert.deepEqual(body,{enabled:false,plans:[{id:7,name:'Kelas 45 hari',price:45000,durationDays:45}]});assert.match(queries[0],/status='active'/)}finally{await new Promise(ok=>server.close(ok))}
});
