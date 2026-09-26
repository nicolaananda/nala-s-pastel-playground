import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('admin session prefers its dedicated secret and production cookies are secure',()=>{
  const source=fs.readFileSync(new URL('./index.js',import.meta.url),'utf8');
  assert.match(source,/const adminSecret = process\.env\.ADMIN_SESSION_SECRET \|\| process\.env\.JWT_SECRET/);
  assert.match(source,/secure: process\.env\.NODE_ENV === 'production'/);
});