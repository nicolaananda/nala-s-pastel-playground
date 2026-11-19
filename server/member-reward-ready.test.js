import assert from 'node:assert/strict';
import pg from 'pg';import express from 'express';import fs from 'node:fs/promises';
import {createRewardAdminRouter} from './member-rewards.js';
const url=new URL(process.env.REWARD_TEST_URL||'postgres://postgres:synthetic-only@127.0.0.1:55439/nala_reward_test');
assert.equal(url.hostname,'127.0.0.1');assert.equal(url.port,'55439');assert.equal(url.pathname,'/nala_reward_test');
const pool=new pg.Pool({connectionString:url.href});
await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
await pool.query(`CREATE TABLE member_accounts(id bigint PRIMARY KEY); CREATE TABLE member_point_ledger(id bigint GENERATED ALWAYS AS IDENTITY,member_id bigint,points integer,kind text CHECK(kind IN ('manual')),source_type text CHECK(source_type IN ('admin_adjustment')),source_id text,reason text,actor text)`);
await pool.query(await fs.readFile(new URL('./migrations/029-member-rewards.sql',import.meta.url),'utf8'));
const migration=await fs.readFile(new URL('./migrations/031-reward-ready.sql',import.meta.url),'utf8');await pool.query(migration);await pool.query(migration);
await pool.query(`INSERT INTO member_accounts VALUES(1);INSERT INTO member_rewards(name,point_cost,stock)VALUES('Squishy',50,0);INSERT INTO member_reward_redemptions(member_id,reward_id,reward_name,point_cost,idempotency_key,status)VALUES(1,1,'Squishy',50,'fixture-001','preparing'),(1,1,'Squishy',50,'fixture-002','preparing')`);
const app=express();app.use(express.json());app.use((req,res,next)=>{req.admin={role:'owner',email:'fixture@example.test'};next()});app.use(createRewardAdminRouter({pool}));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const post=async(id,status)=>fetch(`http://127.0.0.1:${server.address().port}/redemptions/${id}/status`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});
try{assert.equal((await post(1,'ready')).status,200);assert.equal((await post(1,'ready')).status,409);const result=await Promise.all([post(1,'fulfilled'),post(1,'cancelled')]);assert.deepEqual(result.map(r=>r.status).sort(),[200,409]);assert.equal((await post(1,'preparing')).status,409);assert.equal((await post(2,'ready')).status,200);assert.equal((await post(2,'cancelled')).status,200);assert.equal((await post(2,'cancelled')).status,409);const refunds=await pool.query(`SELECT count(*)::int n FROM member_point_ledger WHERE kind='redemption_refund' AND source_id='2'`);assert.equal(refunds.rows[0].n,1);console.log('PASS migration repeat, ready transition, competing fulfillment/cancel, terminal rejection and exactly-once refund');}finally{await new Promise(r=>server.close(r));await pool.end()}
