import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs/promises';
import pg from 'pg';
import {createMemberStore,settleMemberOrder} from './member-db.js';
import {createMemberRouter} from './member-routes.js';
import {createMemberAdminRouter} from './member-admin.js';

const raw=process.env.MEMBER_TEST_DATABASE_URL,parsed=(()=>{try{return new URL(raw)}catch{return null}})();
if(!parsed||parsed.protocol!=='postgres:'||parsed.hostname!=='127.0.0.1'||parsed.port!=='55439'||parsed.pathname!=='/member_test'||parsed.search||parsed.hash)throw Error('Refusing unsafe DB: require postgres://…@127.0.0.1:55439/member_test');
const origin='https://member.test';
const request=async(base,path,{method='GET',cookie,body,requestOrigin=origin}={})=>{const r=await fetch(base+path,{method,headers:{origin:requestOrigin,...(cookie?{cookie}:{}),...(body?{'content-type':'application/json'}:{})},body:body&&JSON.stringify(body)});return {status:r.status,body:await r.json().catch(()=>null)}};

test('admin order archive is fail-closed, race-safe, restorable, filtered, and audited once',async()=>{
 const schema=`member_archive_${crypto.randomBytes(8).toString('hex')}`,root=new pg.Pool({connectionString:raw});await root.query(`CREATE SCHEMA ${schema}`);await root.end();
 const pool=new pg.Pool({connectionString:raw,options:`-c search_path=${schema}`}),store=createMemberStore(pool),audits=[];let server;
 try{
  for(const name of ['002-member-portal-phases-0-3.sql','003-member-experience-operations.sql','004-member-phase7.sql','005-member-reminder-obsolete.sql','006-member-order-archive.sql','007-member-checkout-lifecycle.sql','008-member-course-entitlements.sql'])await pool.query(await fs.readFile(new URL(`./migrations/${name}`,import.meta.url),'utf8'));
  const member=(await pool.query("INSERT INTO member_accounts(email,name,password_hash,email_verified_at,membership_expires_at) VALUES('archive@example.test','Archive Test','x',now(),now()+interval '10 days') RETURNING id,membership_expires_at")).rows[0];
  const add=async(id,status='pending')=>pool.query('INSERT INTO member_orders(order_id,member_id,amount,duration_days,status) VALUES($1,$2,30000,30,$3)',[id,member.id,status]);
  for(const [id,status] of [['MEMBER-TERMINAL','expired'],['MEMBER-PENDING','pending'],['MEMBER-40400','pending'],['MEMBER-TIMEOUT','pending'],['MEMBER-PAID1','paid'],['MEMBER-RACE1','pending']])await add(id,status);
  const provider={
   'MEMBER-TERMINAL':async()=>({order_id:'MEMBER-TERMINAL',gross_amount:'30000',transaction_status:'expire'}),
   'MEMBER-PENDING':async({cancelled})=>({order_id:'MEMBER-PENDING',gross_amount:'30000',transaction_status:cancelled?'cancel':'pending'}),
   'MEMBER-40400':async()=>{throw Object.assign(Error('not found'),{httpStatusCode:404})},
   'MEMBER-TIMEOUT':async()=>{throw Error('timeout')},
   'MEMBER-PAID1':async()=>({order_id:'MEMBER-PAID1',gross_amount:'30000',transaction_status:'settlement'}),
   'MEMBER-RACE1':async({cancelled})=>cancelled?({order_id:'MEMBER-RACE1',gross_amount:'30000',transaction_status:'settlement',status_code:'200',payment_type:'qris',transaction_id:'race-tx',settlement_time:'2026-09-26 12:00:00 +0000'}):({order_id:'MEMBER-RACE1',gross_amount:'30000',transaction_status:'pending'})
  },cancelled=new Set();
  const providerStatus=id=>provider[id]({cancelled:cancelled.has(id)}),cancelProvider=async id=>{cancelled.add(id);return providerStatus(id)};
  const app=express();app.use(express.json());
  const admin=(req,res,next)=>req.headers.cookie==='role=admin'?(req.admin={email:'admin@example.test'},next()):res.status(req.headers.cookie?403:401).json({message:'Admin login required'});
  app.use('/api/admin/member',admin,createMemberAdminRouter({pool,privateDir:'/tmp',allowedOrigins:[origin],providerStatus,cancelProvider,settleProviderOrder:async status=>settleMemberOrder(store,{orderId:status.order_id,amount:status.gross_amount,transactionId:status.transaction_id,paymentType:status.payment_type,paidAt:new Date('2026-09-26T12:00:00Z')}),audit:async(req,action,type,id,details)=>audits.push({action,type,id,details})}));
  app.use('/api/member',createMemberRouter({store:{...store,sessionMember:async()=>({id:member.id})},privateDir:'/tmp',allowedOrigins:[origin]}));
  server=app.listen(0,'127.0.0.1');await new Promise((ok,no)=>server.once('listening',ok).once('error',no));const base=`http://127.0.0.1:${server.address().port}`,archive=id=>request(base,`/api/admin/member/orders/${id}/archive`,{method:'POST',cookie:'role=admin',body:{confirm:true,reason:'Pesanan uji tidak dibayar'}});
  assert.equal((await request(base,'/api/admin/member/orders/MEMBER-TERMINAL/archive',{method:'POST',body:{confirm:true,reason:'Pesanan uji'}})).status,401);
  assert.equal((await request(base,'/api/admin/member/orders/MEMBER-TERMINAL/archive',{method:'POST',cookie:'role=member',body:{confirm:true,reason:'Pesanan uji'}})).status,403);
  assert.equal((await request(base,'/api/admin/member/orders/MEMBER-TERMINAL/archive',{method:'POST',cookie:'role=admin',requestOrigin:'https://evil.test',body:{confirm:true,reason:'Pesanan uji'}})).status,403);
  assert.equal((await request(base,'/api/admin/member/orders/MEMBER-TERMINAL/archive',{method:'POST',cookie:'role=admin',body:{confirm:false,reason:''}})).status,400);
  assert.equal((await archive('MEMBER-PAID1')).status,409);
  assert.equal((await archive('MEMBER-40400')).status,409);
  assert.equal((await archive('MEMBER-TIMEOUT')).status,503);
  assert.equal((await archive('MEMBER-PENDING')).status,200);
  assert.equal((await archive('MEMBER-TERMINAL')).status,200);
  assert.equal((await archive('MEMBER-TERMINAL')).body.alreadyArchived,true);
  assert.equal((await archive('MEMBER-RACE1')).status,409);
  const race=(await pool.query("SELECT status,archived_at FROM member_orders WHERE order_id='MEMBER-RACE1'")).rows[0];assert.equal(race.status,'paid');assert.equal(race.archived_at,null);
  const expires=(await pool.query('SELECT membership_expires_at FROM member_accounts WHERE id=$1',[member.id])).rows[0].membership_expires_at;assert.ok(expires>member.membership_expires_at);
  const active=await request(base,`/api/admin/member/members/${member.id}?orders=active`,{cookie:'role=admin'}),archived=await request(base,`/api/admin/member/members/${member.id}?orders=archived`,{cookie:'role=admin'});assert.ok(active.body.orders.every(x=>!x.archived_at));assert.deepEqual(new Set(archived.body.orders.map(x=>x.order_id)),new Set(['MEMBER-PENDING','MEMBER-TERMINAL']));
  const memberOrders=await request(base,'/api/member/orders',{cookie:'nala_member_session=yes'});assert.equal(memberOrders.status,200);assert.ok(memberOrders.body.orders.every(x=>!x.archived_at));
  const memberArchive=await request(base,'/api/member/orders?archived=true',{cookie:'nala_member_session=yes'});assert.equal(memberArchive.status,200);assert.equal(memberArchive.body.orders.length,2);
  assert.equal((await request(base,'/api/admin/member/orders/MEMBER-TERMINAL/restore',{method:'POST',cookie:'role=admin',body:{confirm:true,reason:'Pulihkan riwayat'}})).status,200);
  const restored=(await pool.query("SELECT status,archived_at FROM member_orders WHERE order_id='MEMBER-TERMINAL'")).rows[0];assert.equal(restored.status,'expired');assert.equal(restored.archived_at,null);
  assert.equal(audits.filter(x=>x.action==='archive_order'&&x.id==='MEMBER-TERMINAL').length,1);assert.equal(audits.filter(x=>x.action==='restore_order'&&x.id==='MEMBER-TERMINAL').length,1);
 }finally{if(server)await new Promise(ok=>server.close(ok));await pool.end();const cleanup=new pg.Pool({connectionString:raw});await cleanup.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await cleanup.end()}
});
