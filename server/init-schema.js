import { initDatabase } from './db.js';

// Initialize database schema
const init = async () => {
  try {
    console.log('🔄 Initializing database schema...');
    await initDatabase();
    console.log('✅ Database schema initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing schema:', error.message);
    console.error(error);
    process.exit(1);
  }
};

init();

