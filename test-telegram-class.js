
import axios from 'axios';

const API_URL = 'http://localhost:3001';

async function testTelegramNotification() {
    console.log('🚀 Testing Telegram Notification for Class Registration...');

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
        console.log(`📄 Response Body:`, data);

        if (response.status === 200) {
            console.log('✅ Webhook accepted!');
            console.log('👀 Check the server logs to see if Telegram message was sent to @noabsen13');
        } else {
            console.error('❌ Webhook failed or rejected.');
        }

    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Could not connect to server. Is it running on port 3001?');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

testTelegramNotification();
