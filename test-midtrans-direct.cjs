#!/usr/bin/env node

/**
 * Test Midtrans Server Key Directly
 * Tidak perlu database connection
 * 
 * Usage:
 *   node test-midtrans-direct.js
 *   node test-midtrans-direct.js YOUR_SERVER_KEY
 */

require('dotenv').config();
const https = require('https');

const SERVER_KEY = process.argv[2] || process.env.MIDTRANS_SERVER_KEY;
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

console.log(colors.cyan + colors.bright);
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║        🧪 MIDTRANS KEY DIRECT TEST 🧪                    ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log(colors.reset + '\n');

// Check Server Key
if (!SERVER_KEY) {
  log(colors.red, '❌ MIDTRANS_SERVER_KEY tidak ditemukan!');
  log(colors.yellow, '\n💡 Cara test:');
  log(colors.yellow, '   1. Set di .env: MIDTRANS_SERVER_KEY=your-key');
  log(colors.yellow, '   2. Atau jalankan: node test-midtrans-direct.js YOUR_SERVER_KEY');
  process.exit(1);
}

// Display key info
log(colors.blue, '🔑 Server Key Info:');
log(colors.blue, '   Preview:', SERVER_KEY.substring(0, 25) + '...');
log(colors.blue, '   Length:', SERVER_KEY.length, 'characters');

const isSandbox = SERVER_KEY.startsWith('SB-Mid-server-');
const isProduction = SERVER_KEY.startsWith('Mid-server-') && !isSandbox;

if (!isSandbox && !isProduction) {
  log(colors.red, '   Format: ❌ INVALID');
  log(colors.yellow, '\n✅ Format yang benar:');
  log(colors.yellow, '   Sandbox:    SB-Mid-server-xxxxxxxxxxxxx');
  log(colors.yellow, '   Production: Mid-server-xxxxxxxxxxxxx');
  process.exit(1);
}

log(colors.green, '   Format: ✅ Valid');
log(colors.blue, '   Type:', isSandbox ? 'Sandbox' : 'Production');

// Environment check
if (IS_PRODUCTION && isSandbox) {
  log(colors.yellow, '\n⚠️  WARNING: MIDTRANS_IS_PRODUCTION=true tapi key adalah Sandbox!');
} else if (!IS_PRODUCTION && isProduction) {
  log(colors.yellow, '\n⚠️  WARNING: MIDTRANS_IS_PRODUCTION=false tapi key adalah Production!');
}

// Test API
console.log('\n' + colors.cyan + '─'.repeat(60) + colors.reset);
log(colors.blue, '🌐 Testing Midtrans API...\n');

const host = isSandbox ? 'app.sandbox.midtrans.com' : 'app.midtrans.com';
const orderId = `TEST-${Date.now()}`;

const postData = JSON.stringify({
  transaction_details: {
    order_id: orderId,
    gross_amount: 10000
  },
  item_details: [{
    id: 'TEST_ITEM',
    price: 10000,
    quantity: 1,
    name: 'Test Item'
  }],
  customer_details: {
    first_name: 'Test',
    last_name: 'User',
    email: 'test@example.com',
    phone: '08123456789'
  }
});

const auth = Buffer.from(SERVER_KEY + ':').toString('base64');

log(colors.blue, '   Target:', `https://${host}/snap/v1/transactions`);
log(colors.blue, '   Order ID:', orderId);
log(colors.blue, '   Auth:', `Basic ${auth.substring(0, 30)}...`);

const options = {
  hostname: host,
  port: 443,
  path: '/snap/v1/transactions',
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Basic ${auth}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n' + colors.bright + '📥 API Response:' + colors.reset);
    log(colors.blue, '   Status:', res.statusCode, res.statusMessage);
    
    try {
      const parsed = JSON.parse(data);
      console.log(colors.blue + '   Body:' + colors.reset);
      console.log(JSON.stringify(parsed, null, 2));
      
      if (res.statusCode === 201 && parsed.token) {
        console.log('\n' + colors.green + colors.bright + '═'.repeat(60) + colors.reset);
        log(colors.green, colors.bright, '🎉 SUCCESS! Server Key VALID dan berfungsi!');
        console.log(colors.green + colors.bright + '═'.repeat(60) + colors.reset);
        log(colors.green, '\n✅ Snap Token:', parsed.token.substring(0, 40) + '...');
        log(colors.green, '✅ Payment URL:', parsed.redirect_url);
        log(colors.green, '\n💡 Server Key ini siap digunakan untuk production!');
        process.exit(0);
      } else if (res.statusCode === 401) {
        console.log('\n' + colors.red + colors.bright + '═'.repeat(60) + colors.reset);
        log(colors.red, colors.bright, '❌ AUTHENTICATION FAILED!');
        console.log(colors.red + colors.bright + '═'.repeat(60) + colors.reset);
        log(colors.red, '\nServer Key TIDAK VALID atau SALAH!');
        log(colors.yellow, '\n📋 Error dari Midtrans:');
        if (parsed.error_messages) {
          parsed.error_messages.forEach(msg => {
            log(colors.yellow, '   •', msg);
          });
        }
        log(colors.yellow, '\n💡 Solusi:');
        log(colors.yellow, '   1. Buka Midtrans Dashboard');
        log(colors.yellow, '      Sandbox: https://dashboard.sandbox.midtrans.com/');
        log(colors.yellow, '      Production: https://dashboard.midtrans.com/');
        log(colors.yellow, '   2. Menu: Settings → Access Keys');
        log(colors.yellow, '   3. Copy Server Key yang LENGKAP');
        log(colors.yellow, '   4. Pastikan tidak ada spasi di awal/akhir');
        log(colors.yellow, '   5. Update .env dengan key yang baru');
        log(colors.yellow, '   6. Restart aplikasi');
        process.exit(1);
      } else {
        log(colors.yellow, '\n⚠️  Unexpected response status:', res.statusCode);
        process.exit(1);
      }
    } catch (e) {
      log(colors.red, '\n❌ Error parsing response:', e.message);
      log(colors.yellow, 'Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.log('\n' + colors.red + colors.bright + '═'.repeat(60) + colors.reset);
  log(colors.red, colors.bright, '❌ CONNECTION ERROR!');
  console.log(colors.red + colors.bright + '═'.repeat(60) + colors.reset);
  log(colors.red, '\nError:', error.message);
  log(colors.yellow, '\n💡 Kemungkinan penyebab:');
  log(colors.yellow, '   1. Tidak ada koneksi internet');
  log(colors.yellow, '   2. Firewall memblokir koneksi ke Midtrans');
  log(colors.yellow, '   3. Midtrans API sedang down');
  process.exit(1);
});

req.write(postData);
req.end();
