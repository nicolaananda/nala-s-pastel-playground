// Diagnosa Telegram di server nala
//
// Jalankan di server nala (pakai cwd yang sama dengan pm2 nala-eng):
//   node test-telegram-diag.js
//
// Script ini:
// 1. Tampilkan cwd & path .env yang dipakai
// 2. Cek TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID di env
// 3. Coba initialize bot
// 4. Coba kirim pesan test ke setiap chat ID di TELEGRAM_CHAT_ID
//
// Output akan jelas-jelas kasih tahu di langkah mana yang gagal.

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import TelegramBot from 'node-telegram-bot-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Telegram Diagnostic Tool\n');
console.log('=== 1. Environment ===');
console.log('cwd          :', process.cwd());
console.log('script dir   :', __dirname);

// dotenv default: cari .env di cwd
dotenv.config();

const possibleEnvPaths = [
  path.join(process.cwd(), '.env'),
  path.join(__dirname, '.env'),
  path.join(__dirname, 'server', '.env'),
];

console.log('\n=== 2. .env file detection ===');
for (const p of possibleEnvPaths) {
  console.log(`${existsSync(p) ? '✅' : '❌'} ${p}`);
}

console.log('\n=== 3. Required vars ===');
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatIdConfig = process.env.TELEGRAM_CHAT_ID;

console.log('TELEGRAM_BOT_TOKEN :', token ? `${token.slice(0, 8)}...${token.slice(-6)} (${token.length} chars)` : '❌ NOT SET');
console.log('TELEGRAM_CHAT_ID   :', chatIdConfig || '❌ NOT SET');

if (!token) {
  console.error('\n❌ TELEGRAM_BOT_TOKEN tidak ke-set. Cek apakah .env ada di cwd yang benar.');
  process.exit(1);
}
if (!chatIdConfig) {
  console.error('\n❌ TELEGRAM_CHAT_ID tidak ke-set.');
  process.exit(1);
}

const chatIds = chatIdConfig.split(',').map(id => id.trim()).filter(Boolean);
console.log('Parsed chat IDs    :', chatIds);

console.log('\n=== 4. Bot init ===');
let bot;
try {
  bot = new TelegramBot(token, { polling: false });
  console.log('✅ TelegramBot instance created');
} catch (err) {
  console.error('❌ Failed to create bot:', err.message);
  process.exit(1);
}

console.log('\n=== 5. getMe (validasi token) ===');
try {
  const me = await bot.getMe();
  console.log(`✅ Bot OK: @${me.username} (id=${me.id})`);
} catch (err) {
  console.error('❌ getMe failed:', err.message);
  console.error('   Token tidak valid, atau token sedang dipakai instance lain dengan polling.');
  process.exit(1);
}

console.log('\n=== 6. Kirim test message ke setiap chat ID ===');
const message = [
  '🔧 <b>Telegram Diagnostic Test</b>',
  '',
  `Time: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
  `Server: ${process.platform} ${process.arch}`,
  `Node: ${process.version}`,
  '',
  'Kalau pesan ini muncul, konfigurasi bot &amp; chat ID benar.',
].join('\n');

let allOk = true;
for (const chatId of chatIds) {
  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML', disable_web_page_preview: true });
    console.log(`✅ Sent to ${chatId}`);
  } catch (err) {
    allOk = false;
    console.error(`❌ Failed to send to ${chatId}:`);
    console.error(`   ${err.message}`);
    if (err.response?.body) {
      console.error('   Response:', JSON.stringify(err.response.body));
    }
  }
}

console.log('\n=== Result ===');
if (allOk) {
  console.log('✅ Semua chat ID menerima pesan. Konfigurasi OK.');
  console.log('   Kalau notif via webhook tetap silent, masalahnya ada di flow handleSuccessTransaction.');
} else {
  console.log('❌ Ada chat ID yang gagal.');
  console.log('   - "chat not found": user belum klik /start ke bot.');
  console.log('   - "Forbidden: bot was blocked": user blok bot.');
  console.log('   - "Conflict: terminated by other getUpdates": bot conflict (Opsi 1: bot baru).');
}
