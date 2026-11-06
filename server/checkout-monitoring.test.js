import assert from 'node:assert/strict';
import test from 'node:test';
import { checkoutSettlementEvent, sanitizeCheckoutEvent } from './checkout-monitoring.js';

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
