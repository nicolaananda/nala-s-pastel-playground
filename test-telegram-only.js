
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const targetChatId = '@noabsen13'; // Use the username or chat ID you want to test

console.log('🚀 Testing Telegram Bot Direct Message...');

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is missing in .env');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: false });

async function sendTestMessage() {
    try {
        console.log(`📡 Sending test message to ${targetChatId}...`);

        // Simulate the message structure from the app
        const amount = "150.000";
        const message = `
🎉 *TEST MESSAGE: Pembayaran Kelas Berhasil!*

🆔 Order ID: \`TEST-BELAJAR-DIRECT\`
💰 Nominal: Rp ${amount}

📋 *Detail Pendaftaran*:
Nama Siswa: Test Siswa
Kelas: Belajar Menggambar
Jadwal: 10:00 - 12:00

👤 *Pemesan*:
Nama: Test User
Email: test@example.com

✅ Status: LUNAS (test)
    `.trim();

        await bot.sendMessage(targetChatId, message, { parse_mode: 'Markdown' });
        console.log(`✅ SUCCESS! Message sent to ${targetChatId}`);

    } catch (error) {
        console.error('❌ FAILED to send message:', error.message);
        if (error.response && error.response.body) {
            console.error('Title:', error.response.body.description);
        }
    }
}

sendTestMessage();
