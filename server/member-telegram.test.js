import assert from 'node:assert/strict';
import test from 'node:test';
import {memberPaymentMessage,sendMemberPaymentTelegram} from './member-telegram.js';

const details={orderId:'MEMBER-123',amount:50000,paymentType:'qris',paidAt:'2026-10-27T04:46:00Z',name:'Zhyla <Admin>',email:'zhyla&mail@example.com',planName:'Paket 30 Hari',durationDays:30,expiresAt:'2026-11-26T04:46:00Z',accessMode:'legacy_all'};

test('formats and escapes member payment notification',()=>{
 const message=memberPaymentMessage(details);
 assert.match(message,/MEMBER BERHASIL BERLANGGANAN/);
 assert.match(message,/Rp 50\.000/);
 assert.match(message,/Zhyla &lt;Admin&gt;/);
 assert.match(message,/zhyla&amp;mail@example\.com/);
 assert.doesNotMatch(message,/Zhyla <Admin>/);
});

test('sends once to each configured chat',async()=>{
 const calls=[];
 const sent=await sendMemberPaymentTelegram(details,{token:'test-token',chatIds:'1, 2',fetchImpl:async(url,options)=>{calls.push({url,body:JSON.parse(options.body)});return {ok:true,status:200}}});
 assert.equal(sent,true);
 assert.equal(calls.length,2);
 assert.deepEqual(calls.map(x=>x.body.chat_id),['1','2']);
 assert.ok(calls.every(x=>x.url.endsWith('/bottest-token/sendMessage')));
});

test('does not send without credentials and reports partial failure',async()=>{
 assert.equal(await sendMemberPaymentTelegram(details,{token:'',chatIds:'1'}),false);
 let count=0;
 assert.equal(await sendMemberPaymentTelegram(details,{token:'x',chatIds:'1,2',fetchImpl:async()=>({ok:++count===1,status:500})}),false);
});
