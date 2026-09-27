import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import {createMemberAdminRouter} from './member-admin.js';

const request=async(base,path,cookie)=>{const response=await fetch(base+path,{headers:cookie?{cookie}:{}});return {status:response.status,body:await response.json()}};

test('global admin orders validates, filters, pages, authorizes, and exposes only safe fields',async t=>{
  const calls=[],safeOrder={order_id:'MEMBER-2',member_id:'7',member_name:'Nala',member_email:'nala@example.test',plan_name:'30 hari',amount:30000,duration_days:30,status:'paid',created_at:'2026-01-02',expires_at:null,paid_at:null,archived_at:null};
  const pool={query:async(sql,values)=>{calls.push({sql,values});return /count\(\*\)/.test(sql)?{rows:[{total:1}]}:{rows:[safeOrder]}}};
  const app=express(),admin=(req,res,next)=>req.headers.cookie==='role=admin'?next():res.status(req.headers.cookie?403:401).json({message:'Admin login required'});
  app.use('/api/admin/member',admin,createMemberAdminRouter({pool,privateDir:'/tmp'}));
  const server=app.listen(0,'127.0.0.1');await new Promise((resolve,reject)=>server.once('listening',resolve).once('error',reject));t.after(()=>new Promise(resolve=>server.close(resolve)));
  const base=`http://127.0.0.1:${server.address().port}`,path='/api/admin/member/orders';
  assert.equal((await request(base,path)).status,401);
  assert.equal((await request(base,path,'role=member')).status,403);
  for(const query of ['?status=unknown','?archived=no','?page=0','?page=1.2','?limit=101',`?q=${'x'.repeat(201)}`])assert.equal((await request(base,path+query,'role=admin')).status,400,query);
  const result=await request(base,path+'?q=nala&status=paid&archived=archived&page=2&limit=1','role=admin');
  assert.equal(result.status,200);assert.deepEqual(result.body,{orders:[safeOrder],total:1,page:2,limit:1});
  assert.deepEqual(Object.keys(result.body.orders[0]),['order_id','member_id','member_name','member_email','plan_name','amount','duration_days','status','created_at','expires_at','paid_at','archived_at']);
  assert.match(calls[0].sql,/o\.order_id ILIKE \$1.*a\.name ILIKE \$1.*a\.email ILIKE \$1/);assert.match(calls[0].sql,/o\.status=\$4/);assert.match(calls[0].sql,/o\.archived_at IS NOT NULL/);assert.match(calls[0].sql,/ORDER BY o\.created_at DESC,o\.id DESC/);assert.deepEqual(calls[0].values,['%nala%',1,1,'paid']);
  assert.match(calls[1].sql,/o\.status=\$2/);assert.deepEqual(calls[1].values,['%nala%','paid']);
  for(const call of calls){const indexes=new Set([...call.sql.matchAll(/\$(\d+)/g)].map(m=>Number(m[1])));assert.deepEqual([...indexes].sort((a,b)=>a-b),call.values.map((_,i)=>i+1),'SQL parameters must be contiguous');}
  assert.ok(calls.every(call=>!call.sql.includes('provider_token')&&!call.sql.includes('provider_redirect_url')&&!call.sql.includes('provider_transaction_id')));
});
