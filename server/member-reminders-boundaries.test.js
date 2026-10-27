import assert from 'node:assert/strict';
import test from 'node:test';
import {enqueueMemberReminders} from './member-reminders.js';

test('queues only H-7, H-3, H-1, and expired windows idempotently',async()=>{
 const inserted=[];
 const pool={query:async(sql,args)=>{
  if(sql.startsWith('SELECT')){
   assert.match(sql,/interval '7 days'/);assert.match(sql,/interval '3 days'/);assert.match(sql,/interval '1 day'/);
   return {rows:[
    {id:1,membership_expires_at:'2026-11-03T00:00:00Z',reminder_key:'h7'},
    {id:2,membership_expires_at:'2026-10-30T00:00:00Z',reminder_key:'h3'},
    {id:3,membership_expires_at:'2026-10-28T00:00:00Z',reminder_key:'h1'},
    {id:4,membership_expires_at:'2026-10-26T00:00:00Z',reminder_key:'expired'},
   ]};
  }
  inserted.push(args);return {rows:[]};
 }};
 assert.equal(await enqueueMemberReminders(pool,new Date('2026-10-27T00:00:00Z')),4);
 assert.deepEqual(inserted.map(x=>x[1]),['h7','h3','h1','expired']);
 assert.equal(inserted.length,4);
});
