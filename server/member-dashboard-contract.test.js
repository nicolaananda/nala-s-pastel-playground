import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('./member-routes.js',import.meta.url),'utf8');
for(const field of ['courses','overall_progress','point_balance','latest_artwork','recommendation','reminders'])assert.match(source,new RegExp(field),`dashboard contract missing ${field}`);
assert.match(source,/member_learning_path_courses/);
assert.match(source,/progress_percent/);
console.log('member dashboard contract: PASS');
