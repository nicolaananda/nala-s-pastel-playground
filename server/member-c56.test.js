import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,validateWebhookUrl,webhookSignature} from './member-milestone-c.js';
import {certificatePdf} from './member-phase7.js';

test('C6 CSV, webhook SSRF, signature, and PDF primitives',async()=>{
 assert.deepEqual(parseCsv('email,name,course_id,expires_at\n"a@b.co","A, B",1,2030-01-01'),[['email','name','course_id','expires_at'],['a@b.co','A, B','1','2030-01-01']]);
 await assert.rejects(()=>validateWebhookUrl('https://internal.example/hook',async()=>[{address:'127.0.0.1'}]),/publik/);
 assert.equal(webhookSignature('key','body'),webhookSignature('key','body'));
 const pdf=certificatePdf({display_name:'Learner',course_title:'Course',issued_at:'2026-01-01',verification_code:'abc'},'secret');
 assert.equal(pdf.subarray(0,8).toString(),'%PDF-1.4');
 assert.match(pdf.toString(),/HMAC-SHA256 [0-9a-f]{64}/);
});
