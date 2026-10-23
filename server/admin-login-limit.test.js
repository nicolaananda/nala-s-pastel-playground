import assert from 'node:assert/strict';import {adminLoginLimit} from './admin-login-limit.js';
let time=0;const limit=adminLoginLimit({now:()=>time,maximum:2,windowMs:1000});
function hit(ip){let status=200;limit({ip},{status(n){status=n;return this},set(){},json(){}},()=>{});return status}
assert.equal(hit('a'),200);assert.equal(hit('a'),200);assert.equal(hit('a'),429);assert.equal(hit('b'),200);time=1000;assert.equal(hit('a'),200);console.log('PASS login rate limit and expiry');
