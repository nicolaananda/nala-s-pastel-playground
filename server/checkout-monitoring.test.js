import assert from 'node:assert/strict';
import test from 'node:test';
import { checkoutFunnelSummary, checkoutSettlementEvent, recordCheckoutEvent, sanitizeCheckoutEvent } from './checkout-monitoring.js';

test('checkout events retain only allowlisted non-PII fields', () => {
  const event=sanitizeCheckoutEvent({event:'shipping_failed',route:'/buku/:slug',bookSlug:'juaralomba',reason:'network'});
  assert.deepEqual(Object.keys(event),['event','route','bookSlug','reason','timestamp']);
  assert.equal(sanitizeCheckoutEvent({...event,email:'x@example.com'}),null);
  assert.equal(sanitizeCheckoutEvent({...event,bookSlug:'secret-order-id'}),null);
});

test('settlement outcomes are coarse', () => {
  assert.equal(checkoutSettlementEvent('settlement'),'settlement_succeeded');
  assert.equal(checkoutSettlementEvent('deny'),'settlement_failed');
  assert.equal(checkoutSettlementEvent('pending'),null);
});

test('persistence writes only aggregate-safe fields', async () => {
  let values;
  await recordCheckoutEvent({query:async(_sql,input)=>{values=input}}, {event:'checkout_opened',route:'/buku/:slug',bookSlug:'juaralomba',reason:'none'});
  assert.deepEqual(values,['checkout_opened','/buku/:slug','juaralomba','none']);
});

test('seven-day events are included in the thirty-day summary', async () => {
  let sql;
  const pool={query:async statement=>{sql=statement;return {rows:[
    {days:7,bookSlug:'juaralomba',event:'checkout_opened',count:2},
    {days:30,bookSlug:'juaralomba',event:'checkout_opened',count:2},
    {days:30,bookSlug:'juaralomba',event:'settlement_succeeded',count:1},
  ]}}};
  const result=await checkoutFunnelSummary(pool);
  assert.match(sql,/VALUES \(7\), \(30\)/);
  assert.deepEqual(result.periods[0].books[0].events,{checkout_opened:2});
  assert.deepEqual(result.periods[1].books[0].events,{checkout_opened:2,settlement_succeeded:1});
});
