import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const files=await Promise.all(['member-db.js','member-routes.js','member-phase7.js'].map(name=>fs.readFile(new URL(`./${name}`,import.meta.url),'utf8')));
const migration=await fs.readFile(new URL('./migrations/012-member-admin-course-grants.sql',import.meta.url),'utf8');

test('revoked course grants are excluded from every entitlement query',()=>{
  for(const source of files){
    const queries=source.match(/(?:EXISTS\(SELECT 1 FROM member_course_grants|SELECT max\(g\.expires_at\))[\s\S]{0,180}/g)||[];
    assert.ok(queries.length);
    for(const query of queries)assert.match(query,/revoked_at IS NULL/);
  }
});

test('migration preserves exact-one-source and restricts revocation metadata',()=>{
  assert.match(migration,/num_nonnulls\(source_order_id,source_voucher_redemption_id,source_admin_id\)=1/);
  assert.match(migration,/source_admin_id IS NULL OR char_length\(grant_reason\) BETWEEN 2 AND 500/);
  assert.match(migration,/source_admin_id IS NOT NULL AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND char_length\(revoke_reason\) BETWEEN 2 AND 500/);
});
