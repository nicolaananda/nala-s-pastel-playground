import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const s=await fs.readFile(new URL('./member-rewards.js',import.meta.url),'utf8');
for(const contract of ['/pickup-settings','/notifications','/redemptions/:id/history','cancellation_reason','fulfilled_by','ORDER BY x.created_at ASC','unread'])assert.ok(s.includes(contract),contract);
console.log('Reward operations contracts OK');
