#!/usr/bin/env node

/**
 * Midtrans Server Key Tester
 * 
 * Script ini untuk test apakah Server Key Midtrans valid atau tidak
 * 
 * Usage:
 *   node test-midtrans-key.js
 * 
 * Atau dengan custom key:
 *   node test-midtrans-key.js SB-Mid-server-xxxxxxxxxxxxx
 */

require('dotenv').config();
const https = require('https');

// Ambil server key dari argument atau environment variable
const SERVER_KEY = process.argv[2] || process.env.MIDTRANS_SERVER_KEY;
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Warna untuk console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color + args.join(' ') + colors.reset);
}

function logSection(title) {
  console.log('\n' + colors.bright + colors.cyan + '═'.repeat(60) + colors.reset);
  console.log(colors.bright + colors.cyan + ` ${title}` + colors.reset);
  console.log(colors.bright + colors.cyan + '═'.repeat(60) + colors.reset);
}

// Validasi Server Key Format
function validateServerKeyFormat(key) {
  logSection('🔍 VALIDASI FORMAT SERVER KEY');
  
  if (!key) {
    log(colors.red, '❌ Server Key tidak ditemukan!');
    log(colors.yellow, '\n💡 Solusi:');
    log(colors.yellow, '   1. Set environment variable MIDTRANS_SERVER_KEY di .env');
    log(colors.yellow, '   2. Atau jalankan: node test-midtrans-key.js YOUR_SERVER_KEY');
    return false;
  }

  log(colors.blue, '📋 Server Key:', key.substring(0, 25) + '...');
  log(colors.blue, '📏 Panjang:', key.length, 'karakter');
  
  const isSandbox = key.startsWith('SB-Mid-server-');
  const isProduction = key.startsWith('Mid-server-') && !isSandbox;
  
  if (!isSandbox && !isProduction) {
    log(colors.red, '❌ Format Server Key SALAH!');
    log(colors.yellow, '\n✅ Format yang benar:');
    log(colors.yellow, '   Sandbox:    SB-Mid-server-xxxxxxxxxxxxx');
    log(colors.yellow, '   Production: Mid-server-xxxxxxxxxxxxx');
    return false;
  }
  
  log(colors.green, '✅ Format Server Key valid');
  log(colors.blue, '🌍 Environment:', isSandbox ? 'SANDBOX (Testing)' : 'PRODUCTION');
  
  // Cek konsistensi dengan environment variable
  if (IS_PRODUCTION && isSandbox) {
    log(colors.yellow, '⚠️  WARNING: MIDTRANS_IS_PRODUCTION=true tapi key adalah Sandbox!');
    log(colors.yellow, '   Set MIDTRANS_IS_PRODUCTION=false untuk Sandbox');
  } else if (!IS_PRODUCTION && isProduction) {
    log(colors.yellow, '⚠️  WARNING: MIDTRANS_IS_PRODUCTION=false tapi key adalah Production!');
    log(colors.yellow, '   Set MIDTRANS_IS_PRODUCTION=true untuk Production');
  }
  
  return true;
}

// Test koneksi ke Midtrans API
function testMidtransConnection(serverKey) {
  logSection('🔌 TEST KONEKSI KE MIDTRANS API');
  
  return new Promise((resolve) => {
    const isSandbox = serverKey.startsWith('SB-Mid-server-');
    const host = isSandbox ? 'app.sandbox.midtrans.com' : 'app.midtrans.com';
    const orderId = `TEST-${Date.now()}`;
    
    const postData = JSON.stringify({
      transaction_details: {
        order_id: orderId,
        gross_amount: 10000
      },
      item_details: [
        {
          id: 'TEST_ITEM',
          price: 10000,
          quantity: 1,
          name: 'Test Item'
        }
      ],
      customer_details: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: '08123456789'
      }
    });
    
    const auth = Buffer.from(serverKey + ':').toString('base64');
    
    log(colors.blue, '🌐 Target:', `https://${host}/snap/v1/transactions`);
    log(colors.blue, '🔐 Auth:', `Basic ${auth.substring(0, 30)}...`);
    log(colors.blue, '📦 Order ID:', orderId);
    
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
        console.log('\n' + colors.bright + '📥 Response:' + colors.reset);
        console.log(colors.blue + '   Status:', res.statusCode, res.statusMessage + colors.reset);
        
        try {
          const parsed = JSON.parse(data);
          console.log(colors.blue + '   Body:', JSON.stringify(parsed, null, 2) + colors.reset);
          
          if (res.statusCode === 201 && parsed.token) {
            log(colors.green, '\n✅ SUCCESS! Server Key VALID dan berfungsi dengan baik');
            log(colors.green, '✅ Snap Token:', parsed.token.substring(0, 30) + '...');
            log(colors.green, '✅ Redirect URL:', parsed.redirect_url);
            resolve(true);
          } else if (res.statusCode === 401) {
            log(colors.red, '\n❌ GAGAL! Server Key TIDAK VALID atau SALAH');
            log(colors.yellow, '\n💡 Solusi:');
            log(colors.yellow, '   1. Buka Midtrans Dashboard:', isSandbox ? 'https://dashboard.sandbox.midtrans.com/' : 'https://dashboard.midtrans.com/');
            log(colors.yellow, '   2. Menu: Settings → Access Keys');
            log(colors.yellow, '   3. Copy Server Key yang benar');
            log(colors.yellow, '   4. Update file .env dengan key yang baru');
            log(colors.yellow, '   5. Restart aplikasi');
            resolve(false);
          } else {
            log(colors.yellow, '\n⚠️  Response tidak sesuai expected (bukan 201 Created)');
            resolve(false);
          }
        } catch (e) {
          log(colors.red, '\n❌ Error parsing response:', e.message);
          log(colors.yellow, 'Raw response:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      log(colors.red, '\n❌ Connection Error:', error.message);
      log(colors.yellow, '\n💡 Kemungkinan penyebab:');
      log(colors.yellow, '   1. Tidak ada koneksi internet');
      log(colors.yellow, '   2. Firewall memblokir koneksi ke Midtrans');
      log(colors.yellow, '   3. Midtrans API sedang down');
      resolve(false);
    });
    
    req.write(postData);
    req.end();
  });
}

// Main function
async function main() {
  console.log(colors.bright + colors.cyan);
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║          🧪 MIDTRANS SERVER KEY TESTER 🧪                ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  // Step 1: Validate format
  const isFormatValid = validateServerKeyFormat(SERVER_KEY);
  if (!isFormatValid) {
    process.exit(1);
  }
  
  // Step 2: Test connection
  const isConnectionValid = await testMidtransConnection(SERVER_KEY);
  
  // Final summary
  logSection('📊 SUMMARY');
  console.log('');
  console.log('  Format Check:     ', isFormatValid ? colors.green + '✅ PASS' : colors.red + '❌ FAIL', colors.reset);
  console.log('  Connection Test:  ', isConnectionValid ? colors.green + '✅ PASS' : colors.red + '❌ FAIL', colors.reset);
  console.log('');
  
  if (isFormatValid && isConnectionValid) {
    log(colors.green, colors.bright, '🎉 SEMUA TEST BERHASIL! Server Key siap digunakan.');
  } else {
    log(colors.red, colors.bright, '⚠️  ADA MASALAH! Silakan perbaiki error di atas.');
    process.exit(1);
  }
  
  console.log('\n' + colors.cyan + '═'.repeat(60) + colors.reset + '\n');
}

// Run main function
main().catch(error => {
  log(colors.red, '❌ Unexpected error:', error.message);
  process.exit(1);
});
