import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import midtransClient from 'midtrans-client';
import axios from 'axios';
import { db, initDatabase } from './db.js';
import TelegramBot from 'node-telegram-bot-api';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS configuration - allow requests from production domain
const allowedOrigins = [
  'https://artstudionala.com',
  'https://www.artstudionala.com',
  'http://localhost:8080',
  'http://localhost:5173',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow all in development, restrict in production if needed
    }
  },
  credentials: true,
}));
app.use(express.json());

const normalizeCode = (code = '') =>
  code.trim().toUpperCase();

// Initialize Midtrans Snap
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Debug endpoint to check Midtrans configuration
app.get('/api/midtrans/debug', (req, res) => {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  const clientKey = process.env.MIDTRANS_CLIENT_KEY;
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  res.json({
    configured: {
      serverKey: !!serverKey,
      clientKey: !!clientKey,
      isProduction: !!process.env.MIDTRANS_IS_PRODUCTION
    },
    environment: isProduction ? 'production' : 'sandbox',
    serverKeyPreview: serverKey ? `${serverKey.substring(0, 20)}...` : 'NOT SET',
    serverKeyLength: serverKey ? serverKey.length : 0,
    serverKeyFormat: serverKey ? (
      serverKey.startsWith('SB-Mid-server-') ? 'sandbox' :
        serverKey.startsWith('Mid-server-') ? 'production' :
          'invalid'
    ) : 'not configured',
    warning: !serverKey || !clientKey ?
      'Midtrans credentials are not properly configured' :
      (isProduction && serverKey.startsWith('SB-Mid-server-')) ?
        'Using sandbox key but IS_PRODUCTION is true' :
        (!isProduction && serverKey.startsWith('Mid-server-') && !serverKey.startsWith('SB-Mid-server-')) ?
          'Using production key but IS_PRODUCTION is false' :
          null
  });
});

// Midtrans Payment Link Endpoint
app.post('/api/midtrans/create-payment-link', async (req, res) => {
  try {
    // Check if Midtrans is configured
    if (!process.env.MIDTRANS_SERVER_KEY) {
      console.error('❌ MIDTRANS_SERVER_KEY is not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway is not configured. Please contact administrator.',
        error_code: 'MIDTRANS_NOT_CONFIGURED'
      });
    }

    const parameter = {
      ...req.body,
      enabled_payments: ["qris", "gopay", "other_qris"]
    };

    // Validate required fields
    if (!parameter.transaction_details || !parameter.customer_details) {
      console.warn('⚠️  Missing required fields in payment request');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: transaction_details and customer_details',
        error_code: 'INVALID_REQUEST'
      });
    }

    // Log payment request (without sensitive data)
    console.log('💳 Creating payment link:', {
      order_id: parameter.transaction_details?.order_id,
      amount: parameter.transaction_details?.gross_amount,
      customer: parameter.customer_details?.email
    });

    // Create transaction
    const transaction = await snap.createTransaction(parameter);

    console.log('✅ Payment link created successfully:', transaction.token);

    res.json({
      success: true,
      payment_url: transaction.redirect_url,
      order_id: parameter.transaction_details.order_id,
      token: transaction.token,
    });
  } catch (error) {
    // Enhanced error logging
    console.error('❌ Midtrans API Error:', {
      message: error.message,
      httpStatusCode: error.httpStatusCode,
      ApiResponse: error.ApiResponse
    });

    // Check for authentication error (401)
    if (error.httpStatusCode === 401) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway authentication failed. Please contact administrator.',
        error_code: 'MIDTRANS_AUTH_FAILED',
        details: error.ApiResponse?.error_messages || ['Invalid or expired API credentials']
      });
    }

    // Return generic error for other cases
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment link',
      error_code: 'MIDTRANS_ERROR',
      details: error.ApiResponse?.error_messages || [error.message]
    });
  }
});

// Persist Grasp Guide access codes
app.post('/api/grasp-guide/access-code', async (req, res) => {
  try {
    const { transactionId, orderId, code, customer } = req.body;

    if (!transactionId || !orderId || !code) {
      return res.status(400).json({
        message: 'transactionId, orderId, and code are required',
      });
    }

    await db.saveAccessCode({
      transactionId,
      orderId,
      code: normalizeCode(code),
      customer,
      source: 'manual',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Save access code error:', error);
    res.status(500).json({
      message: 'Failed to save access code',
      error: error.message,
    });
  }
});

app.post('/api/grasp-guide/verify-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        message: 'code is required',
      });
    }

    const normalized = normalizeCode(code);
    const row = await db.findCodeByCode(normalized);

    if (!row) {
      return res.status(404).json({
        valid: false,
        message: 'Kode tidak ditemukan',
      });
    }

    const record = db.rowToJson(row);

    res.json({
      valid: true,
      record,
    });
  } catch (error) {
    console.error('Verify access code error:', error);
    res.status(500).json({
      message: 'Failed to verify access code',
      error: error.message,
    });
  }
});

// RajaOngkir Shipping Cost Calculation
app.post('/api/shipping/calculate', async (req, res) => {
  try {
    const { origin, destination, weight, courier } = req.body;

    // Validate required fields
    if (!origin || !destination || !weight || !courier) {
      return res.status(400).json({
        message: 'Missing required fields: origin, destination, weight, courier'
      });
    }

    // Check if RajaOngkir API key is set
    if (!process.env.RAJAONGKIR_API_KEY) {
      // Return fallback estimated costs
      return res.json(getFallbackShippingCost(courier));
    }

    // Call RajaOngkir API
    const response = await axios.post(
      'https://api.rajaongkir.com/starter/cost',
      {
        origin,
        destination,
        weight,
        courier,
      },
      {
        headers: {
          key: process.env.RAJAONGKIR_API_KEY,
        },
      }
    );

    // Parse response
    const result = response.data.rajaongkir.results[0];
    const costs = result.costs.map((cost) => ({
      service: cost.service,
      description: cost.description,
      cost: cost.cost[0].value,
      etd: cost.cost[0].etd,
    }));

    res.json({
      courier: result.code,
      costs,
    });
  } catch (error) {
    console.error('RajaOngkir error:', error.response?.data || error.message);

    // Return fallback if API fails
    const fallback = getFallbackShippingCost(req.body.courier || 'jne');
    res.json(fallback);
  }
});

// Get cities (for city search/autocomplete)
app.get('/api/shipping/cities', async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({ message: 'Search parameter is required' });
    }

    // Check if RajaOngkir API key is set
    if (!process.env.RAJAONGKIR_API_KEY) {
      return res.status(503).json({
        message: 'RajaOngkir API key not configured'
      });
    }

    // Call RajaOngkir API to get cities
    const response = await axios.get(
      `https://api.rajaongkir.com/starter/city?q=${encodeURIComponent(search)}`,
      {
        headers: {
          key: process.env.RAJAONGKIR_API_KEY,
        },
      }
    );

    const cities = response.data.rajaongkir.results.map((city) => ({
      city_id: city.city_id,
      city_name: `${city.city_name}, ${city.province}`,
      province: city.province,
    }));

    res.json(cities);
  } catch (error) {
    console.error('RajaOngkir cities error:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// Fallback shipping cost function
function getFallbackShippingCost(courier) {
  const baseCosts = {
    jne: [
      { service: 'REG', description: 'JNE Reguler', cost: 15000, etd: '2-3 hari' },
      { service: 'OKE', description: 'JNE OKE', cost: 20000, etd: '1-2 hari' },
      { service: 'YES', description: 'JNE YES', cost: 30000, etd: '1 hari' },
    ],
    tiki: [
      { service: 'REG', description: 'TIKI Reguler', cost: 18000, etd: '2-3 hari' },
      { service: 'ECO', description: 'TIKI ECO', cost: 25000, etd: '1-2 hari' },
    ],
    pos: [
      { service: 'Paket Kilat Khusus', description: 'POS Kilat Khusus', cost: 20000, etd: '1-2 hari' },
      { service: 'Paketpos', description: 'POS Reguler', cost: 12000, etd: '3-5 hari' },
    ],
  };

  return {
    courier: courier || 'jne',
    costs: baseCosts[courier] || baseCosts.jne,
  };
}

// Midtrans Notification Webhook
app.post('/api/midtrans/notification', async (req, res) => {
  try {
    const notification = req.body;

    // Verify signature key (optional but recommended)
    // const signatureKey = notification.signature_key;
    // const calculatedSignature = sha512(notification.order_id + notification.status_code + notification.gross_amount + process.env.MIDTRANS_SERVER_KEY);
    // if (signatureKey !== calculatedSignature) return res.status(403).json({ message: 'Invalid signature' });

    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const orderId = notification.order_id;
    const transactionId = notification.transaction_id;

    console.log(`Received notification for order ${orderId}: ${transactionStatus}`);

    if (transactionStatus == 'capture') {
      if (fraudStatus == 'challenge') {
        // TODO: Handle challenge
      } else if (fraudStatus == 'accept') {
        await handleSuccessTransaction(orderId, transactionId, notification);
      }
    } else if (transactionStatus == 'settlement') {
      await handleSuccessTransaction(orderId, transactionId, notification);
    } else if (
      transactionStatus == 'cancel' ||
      transactionStatus == 'deny' ||
      transactionStatus == 'expire'
    ) {
      // TODO: Handle failure
    } else if (transactionStatus == 'pending') {
      // TODO: Handle pending
    }

    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook failed', error: error.message });
  }
});

// Telegram Bot Configuration

// Initialize Telegram Bot
const initTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN not set - notifications will not be sent');
    return null;
  }
  return new TelegramBot(token, { polling: false }); // No polling needed for sending
};

const telegramBot = initTelegramBot();

const handleSuccessTransaction = async (orderId, transactionId, notification) => {
  try {
    // Check if code already exists for this transaction
    const existingByOrder = await db.findCodeByOrderId(orderId);
    const existingByTransaction = transactionId ? await db.findCodeByTransactionId(transactionId) : null;

    if (existingByOrder || existingByTransaction) {
      console.log(`Code already exists for order ${orderId}`);
      return;
    }

    // Generate new code based on order type
    const randomPart = Math.random().toString(36).slice(-6).toUpperCase();
    let code;
    let isClass = false;

    // Determine code prefix based on order ID
    if (orderId.startsWith('SKET-')) {
      code = `SK-${randomPart}`;
    } else if (orderId.startsWith('BELAJAR-')) {
      // For classes, we use the Order ID itself as the code (or generate a specific one if needed)
      // User wanted to track by BELAJAR- prefix.
      code = orderId;
      isClass = true;
    } else {
      code = `GG-${randomPart}`;
    }

    await db.saveAccessCode({
      transactionId,
      orderId,
      code: normalizeCode(code),
      customer: {
        email: notification.customer_details?.email || notification.email || '',
        firstName: notification.customer_details?.first_name || '',
        lastName: notification.customer_details?.last_name || '',
        phone: notification.customer_details?.phone || '',
      },
      source: 'webhook',
    });

    console.log(`✅ Generated/Saved code ${code} for order ${orderId}`);

    // Send Telegram Notification for Classes
    if (isClass && telegramBot) {
      const chatId = '@noabsen13'; // Target chat/channel/user
      const amount = parseFloat(notification.gross_amount).toLocaleString('id-ID');

      const customField1 = notification.custom_field1 || '-';
      const customField2 = notification.custom_field2 || '-';
      const customField3 = notification.custom_field3 || '-';

      const message = `
🎉 *Pembayaran Kelas Berhasil!*

🆔 Order ID: \`${orderId}\`
💰 Nominal: Rp ${amount}

📋 *Detail Pendaftaran*:
${customField1}
${customField2}
${customField3}

👤 *Pemesan*:
Nama: ${notification.customer_details?.first_name || ''} ${notification.customer_details?.last_name || ''}
Email: ${notification.customer_details?.email || ''}
No HP: ${notification.customer_details?.phone || ''}

✅ Status: LUNAS (${notification.transaction_status})
      `.trim();

      try {
        await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        console.log(`📨 Telegram notification sent to ${chatId}`);
      } catch (tgError) {
        console.error('❌ Failed to send Telegram notification:', tgError.message);
      }
    }

  } catch (error) {
    console.error(`❌ Error handling success transaction for order ${orderId}:`, error);
    throw error;
  }
};

// Get Code by Order ID (for client polling)
app.get('/api/transaction/:orderId/code', async (req, res) => {
  try {
    const { orderId } = req.params;
    const row = await db.findCodeByOrderId(orderId);

    if (!row) {
      return res.status(404).json({ message: 'Code not found or payment not yet settled' });
    }

    res.json({
      code: row.code,
      transactionId: row.transaction_id
    });
  } catch (error) {
    console.error('Get code error:', error);
    res.status(500).json({ message: 'Failed to fetch code' });
  }
});

// Generate missing code for a transaction (manual fix for missing codes)
app.post('/api/transaction/:orderId/generate-code', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { transactionId, customer } = req.body;

    // Check if code already exists
    const existing = await db.findCodeByOrderId(orderId);
    if (existing) {
      return res.json({
        success: true,
        message: 'Code already exists',
        code: existing.code,
        record: db.rowToJson(existing),
      });
    }

    // Generate new code
    const randomPart = Math.random().toString(36).slice(-6).toUpperCase();
    const code = `GG-${randomPart}`;

    const row = await db.saveAccessCode({
      transactionId: transactionId || `manual-${orderId}`,
      orderId,
      code: normalizeCode(code),
      customer: customer || {},
      source: 'manual-fix',
    });

    console.log(`✅ Manually generated code ${code} for order ${orderId}`);

    res.json({
      success: true,
      message: 'Code generated successfully',
      code: row.code,
      record: db.rowToJson(row),
    });
  } catch (error) {
    console.error('Generate code error:', error);
    res.status(500).json({
      message: 'Failed to generate code',
      error: error.message,
    });
  }
});

// List all transactions (for debugging/admin)
app.get('/api/admin/transactions', async (req, res) => {
  try {
    const rows = await db.getAllAccessCodes();
    const records = rows.map(row => db.rowToJson(row));
    res.json({ transactions: records, count: records.length });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database connection and schema
    await initDatabase();
    console.log('✅ Database initialized');

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 API Server running on http://localhost:${PORT}`);
      console.log(`📝 Health check: http://localhost:${PORT}/api/health`);

      // Check environment variables
      if (!process.env.MIDTRANS_SERVER_KEY) {
        console.warn('⚠️  MIDTRANS_SERVER_KEY not set - payment will not work');
      }
      if (!process.env.RAJAONGKIR_API_KEY) {
        console.warn('⚠️  RAJAONGKIR_API_KEY not set - using fallback shipping costs');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

