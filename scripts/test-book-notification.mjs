import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../server/index.js', import.meta.url), 'utf8');
let saved;
let message;
const db = { savePaymentOrderDetails: async (id, data) => { saved = structuredClone(data); }, getPaymentOrderDetails: async () => saved };
const parameter = { transaction_details: { order_id: 'BOOK-test' }, customer_details: { first_name: 'Test' }, item_details: [{ id: 'book', name: 'Buku <Warna> & Seni', quantity: 2 }, { id: 'shipping', name: 'Ongkir', quantity: 1 }] };
const persist = source.slice(source.indexOf('    await db.savePaymentOrderDetails('), source.indexOf('    // Create transaction', source.indexOf('    await db.savePaymentOrderDetails(')));
await vm.runInNewContext(`(async()=>{${persist}})()`, { db, parameter });
const code = source.slice(source.indexOf('const escapeHtml ='), source.indexOf('const handleSuccessTransaction ='));
const send = vm.runInNewContext(code + ';sendTelegramNotification', { db, telegramBot: { sendMessage: async (_, text) => { message = text; } }, process: { env: { TELEGRAM_CHAT_ID: 'test' } }, console: { log() {}, warn() {}, error() {} } });
for (const item_details of [undefined, [], [{ id: 'wrong', name: 'Wrong webhook title' }]]) {
  assert.equal(await send('BOOK-test', 'test', { gross_amount: '96000', item_details }, 'TEST'), true);
  assert.match(message, /Buku &lt;Warna&gt; &amp; Seni<\/b> × 2/);
  assert.ok(!message.includes('Ongkir'));
  assert.ok(!message.includes('Wrong webhook title'));
}
saved = { first_name: 'Legacy' };
await send('BOOK-old', 'test', { gross_amount: '1', item_details: parameter.item_details }, 'TEST');
assert.match(message, /Buku &lt;Warna&gt;/);
saved = null;
assert.equal(await send('BOOK-old', 'test', { gross_amount: '1' }, 'TEST'), true);
console.log('PASS: checkout → saved details → notification; missing/empty webhook, snapshot priority, HTML escaping, shipping exclusion, legacy fallback. No network or database access.');
