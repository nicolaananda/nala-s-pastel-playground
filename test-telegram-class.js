
import axios from 'axios';

const API_URL = process.argv[2] || 'http://localhost:3001';

async function testTelegramNotification() {
    console.log('🚀 Testing Telegram Notification for Class Registration...');
    console.log(`🎯 Target URL: ${API_URL}`);

    // Mock Midtrans Notification Payload
    // Transaction ID and Order ID must be unique-ish to ensure it processes
    const timestamp = Date.now();
    const orderId = `BELAJAR-TEST-${timestamp}`;
    const transactionId = `TRX-${timestamp}`;

    const payload = {
        transaction_status: 'settlement',
        order_id: orderId,
        transaction_id: transactionId,
        gross_amount: '150000.00',
        fraud_status: 'accept',
        payment_type: 'qris',
        transaction_time: new Date().toISOString(),
        item_details: [
            {
                id: 'CLASS-001',
                price: 150000,
                quantity: 1,
                name: 'Belajar Menggambar'
            }
        ],
        customer_details: {
            first_name: 'Test',
            last_name: 'Siswa',
            email: 'test.siswa@example.com',
            phone: '081234567890'
        },
        // Custom fields often used for passing metadata
        custom_field1: 'Nama Siswa: Test Siswa',
        custom_field2: 'Kelas: Belajar Menggambar',
        custom_field3: 'Jadwal: 10:00 - 12:00'
    };

    try {
        console.log(`📡 Sending webhook to ${API_URL}/api/midtrans/notification`);
        console.log(`📦 Payload Order ID: ${orderId}`);

        const response = await axios.post(`${API_URL}/api/midtrans/notification`, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = response.data;

        console.log(`📥 Response Status: ${response.status}`);

        // Check if response is HTML (Frontend) instead of JSON (Backend)
        if (typeof data === 'string' && data.trim().startsWith('<!doctype html>')) {
            console.error('\n❌ CRITICAL: Received HTML instead of JSON!');
            console.error('👉 You are hitting the FRONTEND application, not the BACKEND API.');
            console.error('👉 Please check which port your Backend Server (Express/Node) is running on.');
            console.error(`👉 Try running: node test-telegram-class.js http://localhost:YOUR_BACKEND_PORT`);
            return;
        }

        console.log(`📄 Response Body:`, data);

        if (response.status === 200) {
            console.log('\n✅ Webhook accepted!');
            console.log('👀 Check the server logs to see if Telegram message was sent to @noabsen13');
        } else {
            console.error('\n❌ Webhook failed or rejected.');
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error(`\n❌ Could not connect to ${API_URL}`);
            console.error('👉 Is the server running? Check port and try again.');
        } else {
            console.error('\n❌ Error:', error.message);
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', error.response.data);
            }
        }
    }
}

testTelegramNotification();
