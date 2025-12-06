import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Simulate Midtrans webhook notification
const simulateWebhook = async () => {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  const orderId = `ORDER-TEST-${Date.now()}`;
  const transactionId = `TRANS-TEST-${Date.now()}`;

  console.log('🔄 Simulating Midtrans webhook...\n');
  console.log(`Order ID: ${orderId}`);
  console.log(`Transaction ID: ${transactionId}\n`);

  // Simulate successful payment webhook
  const webhookPayload = {
    transaction_time: new Date().toISOString(),
    transaction_status: 'settlement',
    transaction_id: transactionId,
    status_message: 'midtrans payment notification',
    status_code: '200',
    signature_key: 'test-signature',
    payment_type: 'qris',
    order_id: orderId,
    merchant_id: 'G123456789',
    gross_amount: '5000.00',
    fraud_status: 'accept',
    currency: 'IDR',
    customer_details: {
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test.customer@example.com',
      phone: '+6281234567890',
    },
  };

  try {
    console.log('📤 Sending webhook to:', `${baseUrl}/api/midtrans/notification`);
    const response = await axios.post(
      `${baseUrl}/api/midtrans/notification`,
      webhookPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Webhook response:', response.status, response.data);
    console.log('\n⏳ Waiting 2 seconds for code generation...\n');
    
    // Wait a bit for code to be generated
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if code was generated
    console.log('🔍 Checking if code was generated...\n');
    const codeResponse = await axios.get(
      `${baseUrl}/api/transaction/${orderId}/code`
    );

    if (codeResponse.data.code) {
      console.log('✅ SUCCESS! Code generated:');
      console.log(`   Code: ${codeResponse.data.code}`);
      console.log(`   Order ID: ${orderId}`);
      console.log(`   Transaction ID: ${transactionId}`);
      console.log('\n📊 Check database to verify:');
      console.log(`   SELECT * FROM grasp_guide_access WHERE order_id = '${orderId}';`);
    } else {
      console.log('❌ Code not found in response:', codeResponse.data);
    }
  } catch (error) {
    if (error.response) {
      console.error('❌ Error response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('❌ No response received. Is server running?');
      console.error('   Start server with: npm run dev:server');
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
};

simulateWebhook();

