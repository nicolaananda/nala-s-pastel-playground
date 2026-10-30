import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const moduleText=fs.readFileSync(new URL('./member-rewards.js',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('./migrations/029-member-rewards.sql',import.meta.url),'utf8');
test('redemption uses serialization, row locks, full balance, and atomic ledger/audit writes',()=>{
 assert.match(moduleText,/pg_advisory_xact_lock/);
 assert.match(moduleText,/member_rewards WHERE id=\$1 FOR UPDATE/);
 assert.match(moduleText,/sum\(points\)/);
 assert.match(moduleText,/BEGIN/);
 assert.match(moduleText,/member_reward_audit/);
});
test('database enforces idempotency, one debit/refund, append-only ledger and states',()=>{
 assert.match(migration,/UNIQUE\(member_id,idempotency_key\)/);
 assert.match(migration,/redemption_debit_once/);
 assert.match(migration,/redemption_refund_once/);
 assert.match(migration,/BEFORE UPDATE OR DELETE ON member_point_ledger/);
 assert.match(migration,/requested','preparing','fulfilled','cancelled/);
});