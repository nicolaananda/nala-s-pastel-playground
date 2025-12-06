import { db, initDatabase } from './db.js';

// Test direct database insertion (simulate webhook)
const testDirectInsert = async () => {
  try {
    console.log('🔄 Testing direct database insertion...\n');

    // Initialize database
    await initDatabase();

    const orderId = `ORDER-TEST-${Date.now()}`;
    const transactionId = `TRANS-TEST-${Date.now()}`;
    const randomPart = Math.random().toString(36).slice(-6).toUpperCase();
    const code = `GG-${randomPart}`;

    console.log('📝 Test data:');
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   Code: ${code}\n`);

    // Check if already exists
    const existing = await db.findCodeByOrderId(orderId);
    if (existing) {
      console.log('⚠️  Code already exists for this order ID');
      console.log('   Existing code:', existing.code);
      return;
    }

    // Insert directly to database (simulate webhook)
    console.log('💾 Inserting to database...');
    const result = await db.saveAccessCode({
      transactionId,
      orderId,
      code,
      customer: {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test.customer@example.com',
        phone: '+6281234567890',
      },
      source: 'test-webhook',
    });

    console.log('✅ Successfully inserted!\n');
    console.log('📊 Record details:');
    console.log(`   ID: ${result.id}`);
    console.log(`   Code: ${result.code}`);
    console.log(`   Order ID: ${result.order_id}`);
    console.log(`   Transaction ID: ${result.transaction_id}`);
    console.log(`   Customer: ${result.customer_first_name} ${result.customer_last_name}`);
    console.log(`   Email: ${result.customer_email}`);
    console.log(`   Created: ${result.created_at}\n`);

    // Verify by fetching
    console.log('🔍 Verifying by fetching...');
    const fetched = await db.findCodeByOrderId(orderId);
    if (fetched && fetched.code === code) {
      console.log('✅ Verification successful! Code found in database.\n');
      console.log('📋 SQL Query to check in pgAdmin:');
      console.log(`   SELECT * FROM grasp_guide_access WHERE order_id = '${orderId}';`);
    } else {
      console.log('❌ Verification failed!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

testDirectInsert();

