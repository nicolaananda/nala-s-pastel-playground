import test from 'node:test';
import assert from 'node:assert/strict';
import {percentageVoucherAmount} from './member-db.js';

test('percentage vouchers round down to whole rupiah',()=>{
  assert.equal(percentageVoucherAmount(30000,25),22500);
  assert.equal(percentageVoucherAmount(9999,10),8999);
});