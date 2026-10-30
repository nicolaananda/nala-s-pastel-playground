import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('points migration enforces fixed awards and idempotency',()=>{
 const sql=fs.readFileSync(new URL('./migrations/028-member-points.sql',import.meta.url),'utf8');
 assert.match(sql,/15,'video_purchase'/);
 assert.match(sql,/10,'first_submission'/);
 assert.match(sql,/UNIQUE \(kind, source_type, source_id\)/);
 assert.match(sql,/UNIQUE INDEX member_point_ledger_first_submission_once/);
 assert.match(sql,/kind IN \([^)]*'redemption'/);
});
