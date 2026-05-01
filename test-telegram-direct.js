import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
  process.exit(1);
}

if (!chatId) {
  console.error('❌ TELEGRAM_CHAT_ID not found in .env file');
  process.exit(1);
}

console.log('🚀 Testing Telegram Notification (Direct Send - No Database)\n');

const bot = new TelegramBot(token, { polling: false });

const escapeMarkdown = (text) => {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

const testNotifications = [
  {
    type: '🎓 Kelas',
    orderId: 'BELAJAR-TEST-123456',
    amount: '150000',
    code: 'BELAJAR-TEST-123456',
    paymentType: 'qris',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '081234567890',
    details: '\n📋 Detail Kelas:\nNama Siswa: John Doe\nKelas: Belajar Menggambar\nJadwal: 10:00 - 12:00'
  },
  {
    type: '📚 Sketchbook',
    orderId: 'SKET-TEST-789012',
    amount: '75000',
    code: 'SK-ABC123',
    paymentType: 'bank_transfer',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerPhone: '081298765432',
    details: ''
  },
  {
    type: '📖 Grasp Guide',
    orderId: 'GG-TEST-345678',
    amount: '50000',
    code: 'GG-XYZ789',
    paymentType: 'gopay',
    customerName: 'Bob Wilson',
    customerEmail: 'bob@example.com',
    customerPhone: '081234509876',
    details: ''
  }
];

async function sendTestNotification(testData) {
  const amount = parseFloat(testData.amount).toLocaleString('id-ID');
  const customerName = escapeMarkdown(testData.customerName);
  const customerEmail = escapeMarkdown(testData.customerEmail);
  const customerPhone = escapeMarkdown(testData.customerPhone);
  const paymentType = escapeMarkdown(testData.paymentType);
  
  const message = `
🎉 *PEMBAYARAN BERHASIL!*

${testData.type}
━━━━━━━━━━━━━━━━━━━━
💳 *Order ID:* \`${testData.orderId}\`
💰 *Nominal:* Rp ${amount}
🔑 *Kode Akses:* \`${testData.code}\`
💳 *Metode:* ${paymentType}
✅ *Status:* LUNAS
${testData.details}

👤 *Data Pemesan:*
━━━━━━━━━━━━━━━━━━━━
📛 Nama: ${customerName}
📧 Email: ${customerEmail}
📱 No HP: ${customerPhone}

⏰ ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
  `.trim();

  try {
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    console.log(`✅ Sent: ${testData.type} - ${testData.orderId}`);
  } catch (error) {
    console.error(`❌ Failed to send ${testData.type}:`, error.message);
  }
}

async function runTests() {
  console.log('📤 Sending test notifications...\n');
  
  const testType = process.argv[2];
  
  if (testType === 'class' || testType === 'kelas') {
    await sendTestNotification(testNotifications[0]);
  } else if (testType === 'sketchbook' || testType === 'sket') {
    await sendTestNotification(testNotifications[1]);
  } else if (testType === 'guide' || testType === 'gg') {
    await sendTestNotification(testNotifications[2]);
  } else if (testType === 'all') {
    for (const test of testNotifications) {
      await sendTestNotification(test);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } else {
    console.log('Usage:');
    console.log('  node test-telegram-direct.js class      # Test kelas notification');
    console.log('  node test-telegram-direct.js sketchbook # Test sketchbook notification');
    console.log('  node test-telegram-direct.js guide      # Test grasp guide notification');
    console.log('  node test-telegram-direct.js all        # Test all notifications');
    console.log('');
    console.log('Sending default (class) notification...\n');
    await sendTestNotification(testNotifications[0]);
  }
  
  console.log('\n✨ Test complete! Check your Telegram.');
}

runTests();
