import { db, initDatabase } from './db.js';

// Generate code for missing transaction
const generateMissingCode = async () => {
  try {
    const orderId = process.argv[2];
    const transactionId = process.argv[3] || `manual-${orderId}`;
    const email = process.argv[4] || 'customer@example.com';

    if (!orderId) {
      console.error('❌ Usage: node server/generate-missing-code.js <order_id> [transaction_id] [email]');
      console.error('   Example: node server/generate-missing-code.js CLASS-1765041774621-vfzm8oth7 cdc3d5a9-bd39-4515-a536-3c161fb37ef4 customer@example.com');
      process.exit(1);
    }

    console.log('🔄 Generating code for missing transaction...\n');
    console.log(`Order ID: ${orderId}`);
    console.log(`Transaction ID: ${transactionId}`);
    console.log(`Email: ${email}\n`);

    // Initialize database
    await initDatabase();

    // Check if code already exists
    const existing = await db.findCodeByOrderId(orderId);
    if (existing) {
      console.log('✅ Code already exists!');
      console.log(`   Code: ${existing.code}`);
      console.log(`   Created: ${existing.created_at}`);
      process.exit(0);
    }

    // Generate new code
    const randomPart = Math.random().toString(36).slice(-6).toUpperCase();
    const code = `GG-${randomPart}`;

    console.log('💾 Inserting to database...');
    const result = await db.saveAccessCode({
      transactionId,
      orderId,
      code,
      customer: {
        email: email,
        firstName: 'Customer',
        lastName: '',
      },
      source: 'manual-fix',
    });

    console.log('\n✅ SUCCESS! Code generated and saved:');
    console.log(`   Code: ${result.code}`);
    console.log(`   Order ID: ${result.order_id}`);
    console.log(`   Transaction ID: ${result.transaction_id}`);
    console.log(`   Email: ${result.customer_email}`);
    console.log(`   Created: ${result.created_at}\n`);

    console.log('📋 Verify in database:');
    console.log(`   SELECT * FROM grasp_guide_access WHERE order_id = '${orderId}';`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

generateMissingCode();

