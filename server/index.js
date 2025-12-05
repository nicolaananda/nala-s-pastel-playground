import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import midtransClient from 'midtrans-client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATABASE_PATH = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure database file exists with default structure
if (!fs.existsSync(DATABASE_PATH)) {
  fs.writeFileSync(
    DATABASE_PATH,
    JSON.stringify({ graspGuideAccess: [] }, null, 2),
    'utf-8'
  );
}

const readDatabase = async () => {
  const file = await fs.promises.readFile(DATABASE_PATH, 'utf-8');
  return JSON.parse(file);
};

const writeDatabase = async (data) => {
  await fs.promises.writeFile(
    DATABASE_PATH,
    JSON.stringify(data, null, 2),
    'utf-8'
  );
};

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

// Midtrans Payment Link Endpoint
app.post('/api/midtrans/create-payment-link', async (req, res) => {
  try {
    const parameter = {
      ...req.body,
      enabled_payments: ["qris"]
    };

    // Validate required fields
    if (!parameter.transaction_details || !parameter.customer_details) {
      return res.status(400).json({
        message: 'Missing required fields: transaction_details and customer_details'
      });
    }

    // Create transaction
    const transaction = await snap.createTransaction(parameter);

    res.json({
      payment_url: transaction.redirect_url,
      order_id: parameter.transaction_details.order_id,
      token: transaction.token,
    });
  } catch (error) {
    console.error('Midtrans error:', error);
    res.status(500).json({
      message: error.message || 'Failed to create payment link',
      error: error.ApiResponse || error.message
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

    const database = await readDatabase();
    database.graspGuideAccess = database.graspGuideAccess || [];

    const record = {
      transactionId,
      orderId,
      code: normalizeCode(code),
      customer,
      savedAt: new Date().toISOString(),
    };

    const existingIndex = database.graspGuideAccess.findIndex(
      (entry) => entry.transactionId === transactionId
    );

    if (existingIndex >= 0) {
      database.graspGuideAccess[existingIndex] = record;
    } else {
      database.graspGuideAccess.push(record);
    }

    await writeDatabase(database);

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

    const database = await readDatabase();
    const normalized = normalizeCode(code);
    const record = database.graspGuideAccess?.find(
      (entry) => entry.code === normalized
    );

    if (!record) {
      return res.status(404).json({
        valid: false,
        message: 'Kode tidak ditemukan',
      });
    }

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

const handleSuccessTransaction = async (orderId, transactionId, notification) => {
  const database = await readDatabase();
  database.graspGuideAccess = database.graspGuideAccess || [];

  // Check if code already exists for this transaction
  const existingRecord = database.graspGuideAccess.find(
    (entry) => entry.orderId === orderId || entry.transactionId === transactionId
  );

  if (existingRecord) {
    console.log(`Code already exists for order ${orderId}`);
    return;
  }

  // Generate new code
  const randomPart = Math.random().toString(36).slice(-6).toUpperCase();
  const code = `GG-${randomPart}`;

  const record = {
    transactionId,
    orderId,
    code: normalizeCode(code),
    customer: {
      email: notification.email || '',
    },
    savedAt: new Date().toISOString(),
    source: 'webhook'
  };

  database.graspGuideAccess.push(record);
  await writeDatabase(database);
  console.log(`Generated code ${code} for order ${orderId}`);
};

// Get Code by Order ID (for client polling)
app.get('/api/transaction/:orderId/code', async (req, res) => {
  try {
    const { orderId } = req.params;
    const database = await readDatabase();

    const record = database.graspGuideAccess?.find(
      (entry) => entry.orderId === orderId
    );

    if (!record) {
      return res.status(404).json({ message: 'Code not found or payment not yet settled' });
    }

    res.json({
      code: record.code,
      transactionId: record.transactionId
    });
  } catch (error) {
    console.error('Get code error:', error);
    res.status(500).json({ message: 'Failed to fetch code' });
  }
});

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

