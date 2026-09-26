import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createMemberRouter,memberPaymentParameters} from './member-routes.js';

test('member checkout requests the working QRIS channel configuration',()=>{
 const payload=memberPaymentParameters({orderId:'MEMBER-TEST',amount:30000,email:'member@example.test',name:'Member'});
 assert.deepEqual(payload.enabled_payments,['qris','other_qris']);
 assert.equal(payload.transaction_details.gross_amount,30000);
});

test('checkout capability defaults disabled and reflects active plan config',async()=>{
 const queries=[];
 const store={query:async sql=>{queries.push(sql);return {rows:[{id:7,name:'Kelas 45 hari',price:45000,durationDays:45}]}}};
 const app=express();app.use('/member',createMemberRouter({store,privateDir:'/tmp',allowedOrigins:[]}));
 const server=app.listen(0,'127.0.0.1');await new Promise((ok,no)=>server.once('listening',ok).once('error',no));
 try{const response=await fetch(`http://127.0.0.1:${server.address().port}/member/checkout-capability`),body=await response.json();assert.equal(response.status,200);assert.deepEqual(body,{enabled:false,plans:[{id:7,name:'Kelas 45 hari',price:45000,durationDays:45}]});assert.match(queries[0],/status='active'/)}finally{await new Promise(ok=>server.close(ok))}
});

test('checkout exposes public Snap config and returns token contract',async()=>{
 const store={query:async sql=>sql.includes('member_plans')?{rows:[{id:1,name:'30 hari',price:30000,durationDays:30}]}:{rows:[]},sessionMember:async()=>({id:9,email:'member@example.test',name:'Member'}),createOrder:async()=>{},setOrderProvider:async()=>{}};
 const app=express();app.use(express.json());app.use('/member',createMemberRouter({store,privateDir:'/tmp',allowedOrigins:['https://member.test'],checkoutEnabled:true,clientKey:'Mid-client-public',snapUrl:'https://app.midtrans.com/snap/snap.js',createPayment:async()=>({token:'snap-token',redirectUrl:'https://app.midtrans.com/snap/v4/redirection/test'})}));
 const server=app.listen(0,'127.0.0.1');await new Promise((ok,no)=>server.once('listening',ok).once('error',no));
 try{const base=`http://127.0.0.1:${server.address().port}`,cap=await fetch(`${base}/member/checkout-capability`).then(r=>r.json());assert.equal(cap.clientKey,'Mid-client-public');assert.equal(cap.snapUrl,'https://app.midtrans.com/snap/snap.js');const response=await fetch(`${base}/member/orders`,{method:'POST',headers:{origin:'https://member.test',cookie:'nala_member_session=x','content-type':'application/json'},body:'{"planId":1}'}),body=await response.json();assert.equal(response.status,201);assert.equal(body.token,'snap-token');assert.match(body.redirectUrl,/^https:\/\/app\.midtrans\.com\//)}finally{await new Promise(ok=>server.close(ok))}
});

test('owned order status reconciliation gates membership on provider result',async()=>{
 let reconciled='';const store={sessionMember:async()=>({id:9}),getOrder:async()=>({order_id:'MEMBER-12345',status:'pending'}),query:async()=>({rows:[]})};
 const app=express();app.use(express.json());app.use('/member',createMemberRouter({store,privateDir:'/tmp',allowedOrigins:[],reconcileOrder:async id=>{reconciled=id}}));const server=app.listen(0,'127.0.0.1');await new Promise((ok,no)=>server.once('listening',ok).once('error',no));
 try{const response=await fetch(`http://127.0.0.1:${server.address().port}/member/orders/MEMBER-12345`,{headers:{cookie:'nala_member_session=x'}});assert.equal(response.status,200);assert.equal(reconciled,'MEMBER-12345')}finally{await new Promise(ok=>server.close(ok))}
});
