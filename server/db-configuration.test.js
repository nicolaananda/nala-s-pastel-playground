import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('production database configuration has no checked-in credential fallback', () => {
  for (const file of ['server/db.js', 'server/create-db.js']) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /DB_(?:HOST|NAME|USER|PASSWORD)\s*\|\|/);
    assert.match(source, /Missing (?:production )?database configuration/);
  }
});