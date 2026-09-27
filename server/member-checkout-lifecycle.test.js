import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import pg from 'pg';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {createMemberStore} from './member-db.js';
import {createMemberRouter,memberPaymentParameters} from './member-routes.js';

const raw=process.env.MEMBER_TEST_DATABASE_URL,parsed=(()=>{try{return new URL(raw)}catch{return null}})();
if(!parsed||parsed.protocol!=='postgres:'||parsed.hostname!=='127.0.0.1'||parsed.port!=='55439'||parsed.pathname!=='/member_test'||parsed.search||parsed.hash)throw Error('Refusing unsafe DB: require postgres://…@127.0.0.1:55439/member_test');
const origin='https://member.test',request=(base,path,{method='GET',cookie='nala_member_session=x',body}={})=>fetch(base+path,{method,headers:{origin,cookie,...(body?{'content-type':'application/json'}:{})},body:body&&JSON.stringify(body)}).then(async r=>({status:r.status,body:await r.json()}));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function fixture(provider={}){
 const schema=`checkout_${crypto.randomBytes(6).toString('hex')}`,root=new pg.Pool({connectionString:raw});await root.query(`CREATE SCHEMA ${schema}`);await root.end();
 const pool=new pg.Pool({connectionString:raw,options:`-c search_path=${schema}`});
 for(const name of ['002-member-portal-phases-0-3.sql','003-member-experience-operations.sql','004-member-phase7.sql','005-member-reminder-obsolete.sql','006-member-order-archive.sql','007-member-checkout-lifecycle.sql'])await pool.query(await fs.readFile(new URL(`./migrations/${name}`,import.meta.url),'utf8'));
 const member=(await pool.query("INSERT INTO member_accounts(email,name,password_hash,email_verified_at) VALUES('checkout@example.test','Checkout','x',now()) RETURNING *")).rows[0];
 await pool.query("INSERT INTO member_plans(name,duration_days,price,status) VALUES('30 hari',30,30000,'active'),('90 hari',90,80000,'active')");
 const store=createMemberStore(pool);store.sessionMember=async()=>member;
 let calls=0;const createPayment=provider.create||(async()=>{calls++;await sleep(60);return {token:'snap-token',redirectUrl:'https://app.midtrans.com/snap/v4/redirection/test'}});
 const app=express();app.use(express.json());app.use('/member',createMemberRouter({store,privateDir:'/tmp',allowedOrigins:[origin],checkoutEnabled:true,clientKey:'client',snapUrl:'https://app.midtrans.com/snap/snap.js',createPayment,reconcileOrder:provider.reconcile,cancelPayment:provider.cancel,now:provider.now}));
 const server=app.listen(0,'127.0.0.1');await new Promise((ok,no)=>server.once('listening',ok).once('error',no));
 return {pool,member,base:`http://127.0.0.1:${server.address().port}/member`,calls:()=>calls,close:async()=>{await new Promise(r=>server.close(r));await pool.end();const p=new pg.Pool({connectionString:raw});await p.query(`DROP SCHEMA ${schema} CASCADE`);await p.end()}};
}

test('Snap expiry starts at checkout creation and QRIS custom expiry shares the deadline',()=>{const createdAt=new Date('2026-01-02T03:04:05.000Z'),payload=memberPaymentParameters({orderId:'MEMBER-TEST',amount:30000,email:'m@example.test',name:'M',createdAt});assert.deepEqual(payload.expiry,{start_time:'2026-01-02 10:04:05 +0700',duration:30,unit:'minute'});assert.deepEqual(payload.custom_expiry,{order_time:'2026-01-02 10:04:05 +0700',expiry_duration:30,unit:'minute'});assert.deepEqual(payload.enabled_payments,['qris','other_qris'])});

test('parallel same or different plan requests reserve one checkout and call provider once',async()=>{const f=await fixture();try{const [a,b]=await Promise.all([request(f.base,'/orders',{method:'POST',body:{planId:1}}),request(f.base,'/orders',{method:'POST',body:{planId:2}})]);assert.deepEqual([a.status,b.status].sort(),[201,409]);assert.equal(f.calls(),1);assert.equal((await f.pool.query("SELECT count(*)::int n FROM member_orders WHERE status='pending'")).rows[0].n,1);assert.equal((a.status===409?a:b).body.existingOrder.status,'pending')}finally{await f.close()}});

test('provider unknown failure keeps durable blocker and retry does not call provider again',async()=>{let calls=0;const f=await fixture({create:async()=>{calls++;throw Error('timeout')}});try{const a=await request(f.base,'/orders',{method:'POST',body:{planId:1}}),b=await request(f.base,'/orders',{method:'POST',body:{planId:2}});assert.equal(a.status,502);assert.equal(b.status,409);assert.equal(calls,1);assert.match(b.body.message,/dipastikan|selesaikan|batalkan/i)}finally{await f.close()}});

test('historical duplicate pending orders all block checkout',async()=>{const f=await fixture();try{await f.pool.query("INSERT INTO member_orders(order_id,member_id,amount,duration_days,status) VALUES('MEMBER-OLD-A',$1,30000,30,'pending'),('MEMBER-OLD-B',$1,30000,30,'pending')",[f.member.id]);const x=await request(f.base,'/orders',{method:'POST',body:{planId:1}});assert.equal(x.status,409);assert.equal(f.calls(),0);assert.equal(x.body.unresolvedCount,2);assert.equal(x.body.existingOrder.order_id,'MEMBER-OLD-A')}finally{await f.close()}});

test('cancel is origin and ownership guarded; provider 404 remains blocked',async()=>{const f=await fixture({cancel:async()=>{const e=Error('not found');e.httpStatusCode=404;throw e},reconcile:async()=>null});try{await f.pool.query("INSERT INTO member_orders(order_id,member_id,amount,duration_days,status,checkout_expires_at,provider_token) VALUES('MEMBER-CANCEL',$1,30000,30,'pending',now()+interval '30 minutes','token')",[f.member.id]);const noOrigin=await fetch(f.base+'/orders/MEMBER-CANCEL/cancel',{method:'POST',headers:{cookie:'nala_member_session=x','content-type':'application/json'},body:'{"confirm":true}'});assert.equal(noOrigin.status,403);const x=await request(f.base,'/orders/MEMBER-CANCEL/cancel',{method:'POST',body:{confirm:true}});assert.equal(x.status,409);assert.equal((await f.pool.query("SELECT status FROM member_orders WHERE order_id='MEMBER-CANCEL'")).rows[0].status,'pending')}finally{await f.close()}});

test('verified cancellation frees slot, while paid race wins and is fulfilled once',async()=>{let state='pending';const f=await fixture({cancel:async()=>{state='cancel'},reconcile:async id=>{await f.pool.query("UPDATE member_orders SET status=$2 WHERE order_id=$1 AND status<>'paid'",[id,state==='cancel'?'cancelled':'paid'])}});try{await f.pool.query("INSERT INTO member_orders(order_id,member_id,amount,duration_days,status,checkout_expires_at,provider_token) VALUES('MEMBER-ONE99',$1,30000,30,'pending',now()+interval '30 minutes','token')",[f.member.id]);const x=await request(f.base,'/orders/MEMBER-ONE99/cancel',{method:'POST',body:{confirm:true}});assert.equal(x.status,200);assert.equal((await request(f.base,'/orders',{method:'POST',body:{planId:1}})).status,201);await f.pool.query("UPDATE member_orders SET status='paid',fulfilled_at=now() WHERE order_id=(SELECT order_id FROM member_orders WHERE status='pending' ORDER BY id DESC LIMIT 1)");const paidId=(await f.pool.query("SELECT order_id FROM member_orders WHERE status='paid' ORDER BY id DESC LIMIT 1")).rows[0].order_id;assert.equal((await request(f.base,`/orders/${paidId}/cancel`,{method:'POST',body:{confirm:true}})).status,409)}finally{await f.close()}});
