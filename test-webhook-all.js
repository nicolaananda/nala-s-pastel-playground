// Test webhook nala untuk semua jenis order: BAJU, BOOK, BELAJAR, SKET, GG
//
// Usage:
//   node test-webhook-all.js <type> [api_url]
//
// Examples:
//   node test-webhook-all.js baju                                # default ke http://localhost:3001
//   node test-webhook-all.js book https://api.artstudionala.com
//   node test-webhook-all.js belajar
//   node test-webhook-all.js sket
//   node test-webhook-all.js gg
//
// Hasil sukses: Telegram terkirim ke chat IDs di env, code dibuat di DB nala.

import axios from 'axios';

const TYPE = (process.argv[2] || '').toLowerCase();
const API_URL = process.argv[3] || 'http://localhost:3001';

const PRESETS = {
  baju: {
    prefix: 'BAJU-',
    amount: '140000.00',
    item: { id: 'baju-nala', name: 'Baju Artstudio Nala (dewasa - L)' },
    custom_field1: 'Produk: Baju Artstudio Nala',
    custom_field2: 'Kategori: dewasa | Size: L | Qty: 1',
    custom_field3: 'Alamat: Jl. Test No. 1, Jakarta, DKI Jakarta 12345',
  },
  book: {
    prefix: 'BOOK-',
    amount: '150000.00',
    item: { id: 'tips-trik-juara-1-lomba-mewarnai', name: 'Tips & Trik Juara 1 Lomba Mewarnai' },
  },
  belajar: {
    prefix: 'BELAJAR-',
    amount: '150000.00',
    item: { id: 'coloring-silky-crayon', name: 'Coloring Silky Crayon' },
    custom_field1: 'Anak: Test Anak (2018-01-01)',
    custom_field2: 'IG: @testuser | WA: 081234567890',
    custom_field3: 'Kelas: Coloring Silky Crayon | Hari: Kamis, 14.00 WIB',
  },
  sket: {
    prefix: 'SKET-',
    amount: '75000.00',
    item: { id: 'sketchbook-anime', name: 'Sketchbook Anime' },
  },
  gg: {
    prefix: 'GG-',
    amount: '50000.00',
    item: { id: 'grasp-guide-digital', name: 'Grasp Guide Digital' },
  },
};

if (!PRESETS[TYPE]) {
  console.error('❌ Tipe tidak valid. Pilih salah satu:', Object.keys(PRESETS).join(', '));
  console.error('\nUsage: node test-webhook-all.js <type> [api_url]');
  process.exit(1);
}

const preset = PRESETS[TYPE];

async function run() {
  const timestamp = Date.now();
  const orderId = `${preset.prefix}TEST-${timestamp}`;
  const transactionId = `TRX-${timestamp}`;

  const payload = {
    transaction_status: 'settlement',
    order_id: orderId,
    transaction_id: transactionId,
    gross_amount: preset.amount,
    fraud_status: 'accept',
    payment_type: 'qris',
    transaction_time: new Date().toISOString(),
    item_details: [
      {
        id: preset.item.id,
        price: parseInt(preset.amount),
        quantity: 1,
        name: preset.item.name,
      },
    ],
    customer_details: {
      first_name: 'Test',
      last_name: 'User',
      email: 'test.user@example.com',
      phone: '081234567890',
    },
    ...(preset.custom_field1 ? { custom_field1: preset.custom_field1 } : {}),
    ...(preset.custom_field2 ? { custom_field2: preset.custom_field2 } : {}),
    ...(preset.custom_field3 ? { custom_field3: preset.custom_field3 } : {}),
  };

  console.log('🚀 Test webhook nala');
  console.log(`   Type    : ${TYPE.toUpperCase()}`);
  console.log(`   Target  : ${API_URL}/api/midtrans/notification`);
  console.log(`   OrderID : ${orderId}`);
  console.log(`   Amount  : Rp ${parseInt(preset.amount).toLocaleString('id-ID')}`);

  try {
    const response = await axios.post(`${API_URL}/api/midtrans/notification`, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const data = response.data;

    if (typeof data === 'string' && data.trim().startsWith('<!doctype html>')) {
      console.error('\n❌ CRITICAL: Got HTML, bukan JSON.');
      console.error('   Kamu mengarah ke frontend, bukan ke backend API.');
      console.error('   Pakai port backend (default 3001) atau domain api.artstudionala.com');
      process.exit(1);
    }

    console.log(`\n📥 Status  : ${response.status}`);
    console.log(`📄 Body    :`, data);

    if (response.status === 200) {
      console.log('\n✅ Webhook diterima nala.');
      console.log('👀 Cek log server nala untuk:');
      console.log('   - "Generated/Saved code <CODE> for order"');
      console.log('   - "Telegram notification sent to <chatId>"');
      console.log(`   - Telegram chat: harus muncul pesan untuk order ${orderId}`);
    } else {
      console.error('\n❌ Webhook ditolak.');
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error(`\n❌ Tidak bisa connect ke ${API_URL}`);
      console.error('   Pastikan backend nala running, atau ganti URL via arg ke-2.');
    } else {
      console.error('\n❌ Error:', error.message);
      if (error.response) {
        console.error('   Status:', error.response.status);
        console.error('   Data  :', error.response.data);
      }
    }
    process.exit(1);
  }
}

run();
