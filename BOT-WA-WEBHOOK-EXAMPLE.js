/**
 * CONTOH KODE UNTUK BOT-WA WEBHOOK HANDLER
 * 
 * Copy kode ini ke webhook handler bot-wa Anda
 * Update URL server nala sesuai kebutuhan
 */

const axios = require('axios'); // atau import axios from 'axios' jika ES6

// URL server nala webhook
const NALA_WEBHOOK_URL = 'https://api.artstudionala.com/api/midtrans/notification';
// Atau jika server nala di server yang sama:
// const NALA_WEBHOOK_URL = 'http://localhost:3001/api/midtrans/notification';

/**
 * Cek apakah transaksi untuk nala berdasarkan order_id
 */
function isNalaTransaction(orderId) {
  if (!orderId) return false;
  
  // Pattern order_id untuk nala:
  // - CLASS-xxx untuk class registration
  // - GG-xxx untuk Grasp Guide
  // - GRASP-xxx untuk Grasp Guide (alternatif)
  return orderId.includes('CLASS-') || 
         orderId.includes('GG-') || 
         orderId.includes('GRASP-');
}

/**
 * Forward webhook ke server nala
 */
async function forwardToNala(notification) {
  try {
    console.log(`[Webhook Forward] Forwarding to nala: ${notification.order_id}`);
    
    const response = await axios.post(NALA_WEBHOOK_URL, notification, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds
    });

    console.log(`[Webhook Forward] ✅ Success: ${notification.order_id} - Status: ${response.status}`);
    return { success: true, status: response.status };
  } catch (error) {
    console.error(`[Webhook Forward] ❌ Error: ${notification.order_id}`, error.message);
    if (error.response) {
      console.error(`[Webhook Forward] Response: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, error: error.message };
  }
}

/**
 * CONTOH PENGGUNAAN DI WEBHOOK HANDLER BOT-WA
 * 
 * app.post('/webhook/midtrans', async (req, res) => {
 *   try {
 *     const notification = req.body;
 *     const orderId = notification.order_id || '';
 *     
 *     // 1. Process untuk bot-wa (existing logic)
 *     await processBotWaNotification(notification);
 *     
 *     // 2. Forward ke nala jika order_id untuk nala
 *     if (isNalaTransaction(orderId)) {
 *       // Forward async (tidak blocking response)
 *       forwardToNala(notification).catch(err => {
 *         console.error('[Webhook] Forward failed:', err);
 *       });
 *     }
 *     
 *     // 3. Return response ke Midtrans
 *     res.status(200).json({ status: 'OK' });
 *   } catch (error) {
 *     console.error('[Webhook] Error:', error);
 *     res.status(500).json({ status: 'ERROR', message: error.message });
 *   }
 * });
 */

// Export untuk digunakan
module.exports = {
  isNalaTransaction,
  forwardToNala,
};

// Atau jika ES6:
// export { isNalaTransaction, forwardToNala };

