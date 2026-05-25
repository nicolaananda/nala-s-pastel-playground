import axios from 'axios';

/**
 * Forward webhook dari bot-wa ke server nala
 *
 * Gunakan ini di webhook handler bot-wa untuk forward webhook ke server nala
 * jika order_id memiliki prefix milik nala (buku, kelas, sketchbook, grasp guide).
 */

// Daftar prefix order_id milik nala yang harus diforward.
// Sumber: src/lib/midtrans.ts (BOOK-, BELAJAR-, SKET-, BAJU-, GG-, GRASP-, CLASS-).
const NALA_ORDER_PREFIXES = [
  'BOOK-',
  'BELAJAR-',
  'SKET-',
  'BAJU-',
  'GG-',
  'GRASP-',
  'CLASS-',
];

const isNalaOrderId = (orderId = '') =>
  NALA_ORDER_PREFIXES.some((prefix) => orderId.startsWith(prefix));

export const forwardToNalaWebhook = async (notification) => {
  const nalaWebhookUrl = process.env.NALA_WEBHOOK_URL || 'https://api.artstudionala.com/api/midtrans/notification';
  const orderId = notification.order_id || '';

  if (!isNalaOrderId(orderId)) {
    console.log(`[Webhook Forward] Skipping - not a nala transaction: ${orderId}`);
    return { forwarded: false, reason: 'not_nala_transaction' };
  }

  try {
    console.log(`[Webhook Forward] Forwarding to nala webhook: ${orderId}`);
    const response = await axios.post(nalaWebhookUrl, notification, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    console.log(`[Webhook Forward] Success: ${orderId} - Status: ${response.status}`);
    return { forwarded: true, status: response.status, data: response.data };
  } catch (error) {
    console.error(`[Webhook Forward] Error forwarding ${orderId}:`, error.message);
    if (error.response) {
      console.error(`[Webhook Forward] Response status: ${error.response.status}`);
      console.error(`[Webhook Forward] Response data:`, error.response.data);
    }
    return { forwarded: false, error: error.message };
  }
};

/**
 * Contoh penggunaan di bot-wa webhook handler:
 *
 * app.post('/webhook/midtrans', async (req, res) => {
 *   const notification = req.body;
 *
 *   // Process untuk bot-wa
 *   await processBotWaNotification(notification);
 *
 *   // Forward ke nala jika perlu
 *   await forwardToNalaWebhook(notification);
 *
 *   res.status(200).json({ status: 'OK' });
 * });
 */





