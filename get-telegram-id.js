
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

console.log('🕵️‍♂️  Telegram Chat ID Finder');
console.log('=============================');

if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN is missing in .env');
    console.log('👉 Please set it in your .env file first.');
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log(`✅ Bot started! (@${token.split(':')[0]}...)`);
console.log('👉 Please send a message (e.g., "Hi") to your bot in Telegram now.');
console.log('⏳ Waiting for message...');

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.username;
    const firstName = msg.chat.first_name;

    console.log('\n📨 Message received!');
    console.log('------------------------------------------------');
    console.log(`👤 Name: ${firstName} ${msg.chat.last_name || ''}`);
    console.log(`🏷️  Username: @${username}`);
    console.log(`🆔 Chat ID: ${chatId}  <-- COPY THIS!`);
    console.log('------------------------------------------------');
    console.log('\n✅ Now add this line to your .env file on the server:');
    console.log(`TELEGRAM_CHAT_ID=${chatId}`);
    console.log('\nThen restart your server.');

    process.exit(0);
});

// Handle errors
bot.on('polling_error', (error) => {
    console.error(`❌ Polling error: ${error.code}`);
    console.error(error.message);
    process.exit(1);
});
