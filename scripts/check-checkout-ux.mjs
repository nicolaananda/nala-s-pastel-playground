import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [form, midtrans] = await Promise.all([
  readFile(new URL('../src/components/CheckoutForm.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/midtrans.ts', import.meta.url), 'utf8'),
]);

assert.match(form, /paymentPending\.current/);
assert.match(form, /orderId: orderId\.current/);
assert.match(form, /Data Anda tetap tersimpan/);
assert.match(form, /role="alert"/);
assert.match(form, /Langkah 1 dari 2/);
assert.match(midtrans, /request\.orderId \|\|/);
console.log('checkout UX checks passed');
