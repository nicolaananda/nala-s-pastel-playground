import { initDatabase, db } from './db.js';

// Test database connection and operations
const testDatabase = async () => {
  try {
    console.log('🔄 Testing database connection...\n');

    // Initialize database
    await initDatabase();
    console.log('✅ Database connection successful\n');

    // Test: Save a test code
    console.log('🔄 Testing save operation...');
    const testCode = await db.saveAccessCode({
      transactionId: 'test-transaction-' + Date.now(),
      orderId: 'test-order-' + Date.now(),
      code: 'GG-TEST01',
      customer: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+6281234567890',
      },
      source: 'test',
    });
    console.log('✅ Save operation successful:', testCode.code);

    // Test: Find by code
    console.log('\n🔄 Testing find by code...');
    const found = await db.findCodeByCode('GG-TEST01');
    console.log('✅ Find by code successful:', found ? found.code : 'Not found');

    // Test: Get all
    console.log('\n🔄 Testing get all...');
    const all = await db.getAllAccessCodes();
    console.log(`✅ Get all successful: ${all.length} records found`);

    console.log('\n✨ All database tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
};

testDatabase();

