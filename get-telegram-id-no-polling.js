import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
  console.log('👉 Please add TELEGRAM_BOT_TOKEN to your .env file');
  process.exit(1);
}

console.log('🤖 Fetching updates from Telegram...\n');
console.log('👉 Make sure you have sent a message to your bot first!\n');

async function getChatId() {
  try {
    const response = await axios.get(
      `https://api.telegram.org/bot${token}/getUpdates`
    );

    const updates = response.data.result;

    if (updates.length === 0) {
      console.log('❌ No messages found!');
      console.log('👉 Please send a message (e.g., "/start" or "Hi") to your bot first');
      console.log('👉 Then run this script again\n');
      return;
    }

    console.log('✅ Found messages!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const uniqueChats = new Map();

    updates.forEach((update) => {
      const chat = update.message?.chat || update.callback_query?.message?.chat;
      if (chat) {
        uniqueChats.set(chat.id, chat);
      }
    });

    uniqueChats.forEach((chat) => {
      console.log(`📱 Chat Type: ${chat.type}`);
      console.log(`👤 Name: ${chat.first_name || ''} ${chat.last_name || ''}`);
      if (chat.username) console.log(`🔗 Username: @${chat.username}`);
      if (chat.title) console.log(`📢 Group: ${chat.title}`);
      console.log(`\n🎯 CHAT ID: ${chat.id}`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    });

    console.log('📝 Add this to your .env file:\n');
    const firstChatId = Array.from(uniqueChats.keys())[0];
    console.log(`TELEGRAM_CHAT_ID=${firstChatId}\n`);

    if (uniqueChats.size > 1) {
      console.log('💡 Multiple chats found. You can use any of the Chat IDs above.');
    }

  } catch (error) {
    if (error.response?.status === 401) {
      console.error('❌ Invalid bot token!');
      console.error('👉 Please check your TELEGRAM_BOT_TOKEN in .env file');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

getChatId();
