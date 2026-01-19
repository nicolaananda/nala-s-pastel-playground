
import axios from 'axios';

// Default to localhost:3001 if not provided
const API_URL = process.argv[2] || 'http://localhost:3001';

async function testEmailNotification() {
    console.log('🚀 Testing Email Notification for Class Registration...');
    console.log(`🎯 Target URL: ${API_URL}`);

    const orderId = `BELAJAR-TEST-${Date.now()}`;
    const payload = {
        transaction_status: 'settlement',
        order_id: orderId,
        gross_amount: '150000.00',
        transaction_id: `TRANS-${Date.now()}`,
        fraud_status: 'accept',
        custom_field1: 'Nama Kelas: Basic Drawing',
        custom_field2: 'Jadwal: Sabtu, 10:00 WIB',
        custom_field3: 'Peserta: Budi Santoso',
        customer_details: {
            first_name: 'Budi',
            last_name: 'Santoso',
            email: 'nicolaanandadwiervantoro@gmail.com', // Using the target email to verify delivery
            phone: '08123456789'
        }
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
            console.error(`👉 Try running: node test-email-class.js http://localhost:YOUR_BACKEND_PORT`);
            return;
        }

        console.log(`📄 Response Body:`, data);

        if (response.status === 200) {
            console.log('\n✅ Webhook accepted!');
            console.log('👀 Check your inbox (nicolaanandadwiervantoro@gmail.com) for the notification!');
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

testEmailNotification();
