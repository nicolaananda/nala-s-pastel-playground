import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import midtransClient from 'midtrans-client';
import axios from 'axios';
import { db, initDatabase } from './db.js';
import TelegramBot from 'node-telegram-bot-api';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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
app.use(express.json({ limit: '2mb' }));

const normalizeCode = (code = '') =>
  code.trim().toUpperCase();

const ADMIN_COOKIE_NAME = 'nala_admin_session';
const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@artstudionala.com';
const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const adminSecret = process.env.JWT_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.MIDTRANS_SERVER_KEY || 'dev-admin-secret-change-me';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const parseCookies = (cookieHeader = '') => Object.fromEntries(
  cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const [name, ...rest] = cookie.split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
);

const signSession = (payload) => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', adminSecret).update(body).digest('base64url');
  return `${body}.${signature}`;
};

const verifySession = (token) => {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  const expected = crypto.createHmac('sha256', adminSecret).update(body).digest('base64url');
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  if (!payload.email || !payload.expiresAt || Date.now() > payload.expiresAt) return null;
  return payload;
};

const isAdminPasswordValid = (password) => {
  if (!password) return false;
  if (adminPasswordHash) return sha256(password) === adminPasswordHash;
  return Boolean(adminPassword) && password.length === adminPassword.length && crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));
};

const setAdminCookie = (res, token) => {
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_SESSION_TTL_MS,
    path: '/',
  });
};

const requireAdmin = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie || '');
  const session = verifySession(cookies[ADMIN_COOKIE_NAME]);
  if (!session || session.email !== adminEmail) {
    return res.status(401).json({ message: 'Admin login required' });
  }
  req.admin = { email: session.email };
  next();
};

const parseMetadata = (metadata) => {
  if (!metadata) return {};
  if (typeof metadata === 'object') return metadata;
  try {
    return JSON.parse(metadata);
  } catch {
    return {};
  }
};

const normalizeContentInput = (body) => ({
  type: String(body.type || '').trim(),
  slug: String(body.slug || '').trim(),
  title: String(body.title || '').trim(),
  description: String(body.description || ''),
  price: body.price === '' || body.price === null || body.price === undefined ? null : Number(body.price),
  imageUrl: String(body.imageUrl || '').trim(),
  fileUrl: String(body.fileUrl || '').trim(),
  metadata: parseMetadata(body.metadata),
  status: ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'draft',
  sortOrder: Number(body.sortOrder || 0),
});

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

app.get('/api/content/:type', async (req, res) => {
  try {
    const items = await db.getPublicContent(req.params.type);
    res.json({ items });
  } catch (error) {
    console.error('Get public content error:', error);
    res.status(500).json({ message: 'Failed to fetch content', error: error.message });
  }
});

app.get('/api/content/:type/:slug', async (req, res) => {
  try {
    const item = await db.getPublicContentBySlug(req.params.type, req.params.slug);
    if (!item) return res.status(404).json({ message: 'Content not found' });
    res.json({ item });
  } catch (error) {
    console.error('Get public content item error:', error);
    res.status(500).json({ message: 'Failed to fetch content item', error: error.message });
  }
});

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email !== adminEmail || !isAdminPasswordValid(password)) {
      return res.status(401).json({ message: 'Email atau password admin salah' });
    }
    const token = signSession({ email, expiresAt: Date.now() + ADMIN_SESSION_TTL_MS });
    setAdminCookie(res, token);
    await db.logAdminAction({ adminEmail: email, action: 'login', entityType: 'admin_session', details: { email } });
    res.json({ admin: { email } });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Failed to login', error: error.message });
  }
});

app.post('/api/admin/logout', requireAdmin, async (req, res) => {
  res.clearCookie(ADMIN_COOKIE_NAME, { path: '/' });
  await db.logAdminAction({ adminEmail: req.admin.email, action: 'logout', entityType: 'admin_session' });
  res.json({ success: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

app.get('/api/admin/content', requireAdmin, async (req, res) => {
  try {
    const items = await db.getAdminContent(req.query.type);
    res.json({ items });
  } catch (error) {
    console.error('Get admin content error:', error);
    res.status(500).json({ message: 'Failed to fetch admin content', error: error.message });
  }
});

app.post('/api/admin/content', requireAdmin, async (req, res) => {
  try {
    const item = normalizeContentInput(req.body);
    if (!item.type || !item.slug || !item.title) {
      return res.status(400).json({ message: 'type, slug, and title are required' });
    }
    const saved = await db.createContentItem(item);
    await db.logAdminAction({ adminEmail: req.admin.email, action: 'create', entityType: 'content_item', entityId: String(saved.id), details: saved });
    res.status(201).json({ item: saved });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({ message: 'Failed to create content', error: error.message });
  }
});

app.put('/api/admin/content/:id', requireAdmin, async (req, res) => {
  try {
    const item = normalizeContentInput(req.body);
    if (!item.type || !item.slug || !item.title) {
      return res.status(400).json({ message: 'type, slug, and title are required' });
    }
    const saved = await db.updateContentItem(req.params.id, item);
    if (!saved) return res.status(404).json({ message: 'Content not found' });
    await db.logAdminAction({ adminEmail: req.admin.email, action: 'update', entityType: 'content_item', entityId: String(saved.id), details: saved });
    res.json({ item: saved });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ message: 'Failed to update content', error: error.message });
  }
});

app.delete('/api/admin/content/:id', requireAdmin, async (req, res) => {
  try {
    const saved = await db.archiveContentItem(req.params.id);
    if (!saved) return res.status(404).json({ message: 'Content not found' });
    await db.logAdminAction({ adminEmail: req.admin.email, action: 'archive', entityType: 'content_item', entityId: String(saved.id), details: saved });
    res.json({ item: saved });
  } catch (error) {
    console.error('Archive content error:', error);
    res.status(500).json({ message: 'Failed to archive content', error: error.message });
  }
});

app.post('/api/admin/uploads', requireAdmin, async (req, res) => {
  const { url, title, type } = req.body;
  if (!url) return res.status(400).json({ message: 'url is required until R2 upload credentials are configured' });
  await db.logAdminAction({ adminEmail: req.admin.email, action: 'register_upload', entityType: 'upload', details: { url, title, type } });
  res.json({ upload: { url, title: title || '', type: type || 'external-url' } });
});

app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
  const logs = await db.getAuditLogs();
  res.json({ logs });
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

    if (!row || row.revoked_at) {
      return res.status(404).json({
        valid: false,
        message: row?.revoked_at ? 'Kode sudah dinonaktifkan' : 'Kode tidak ditemukan',
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

// Shipping (api.co.id Indonesia Expedition Cost)
// Origin: Tembalang, Kota Semarang, Jawa Tengah
const ORIGIN_VILLAGE_CODE = process.env.ORIGIN_VILLAGE_CODE || '3374101006';
const API_CO_ID_BASE = 'https://use.api.co.id';

const apiCoIdHeaders = () => {
  const key = process.env.API_CO_ID_KEY;
  if (!key) return null;
  return { 'x-api-co-id': key };
};

// Search villages (proxy ke api.co.id, untuk autocomplete alamat)
app.get('/api/shipping/villages', async (req, res) => {
  try {
    const search = (req.query.search || '').toString().trim();
    if (search.length < 2) {
      return res.json({ villages: [] });
    }

    const headers = apiCoIdHeaders();
    if (!headers) {
      console.warn('⚠️ API_CO_ID_KEY not set');
      return res.status(503).json({ message: 'Shipping API not configured', villages: [] });
    }

    const url = `${API_CO_ID_BASE}/regional/indonesia/villages?search=${encodeURIComponent(search)}`;
    const response = await axios.get(url, { headers, timeout: 10000 });
    const items = Array.isArray(response.data?.data) ? response.data.data : [];

    const villages = items.slice(0, 25).map((v) => ({
      code: v.code,
      name: v.name,
      district: v.district,
      regency: v.regency,
      province: v.province,
      label: `${v.name}, ${v.district}, ${v.regency}, ${v.province}`,
    }));

    res.json({ villages });
  } catch (error) {
    console.error('Villages search error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to search villages', villages: [] });
  }
});

// Calculate shipping cost (proxy ke api.co.id)
// Frontend kirim weight dalam gram. api.co.id baca weight dalam KG.
// Konvert: ceil(gram/1000), minimum 1kg.
app.post('/api/shipping/calculate', async (req, res) => {
  try {
    const { destinationVillageCode, weight } = req.body || {};

    if (!destinationVillageCode || typeof destinationVillageCode !== 'string') {
      return res.status(400).json({ message: 'destinationVillageCode required' });
    }
    const grams = parseInt(weight, 10);
    if (!grams || grams <= 0) {
      return res.status(400).json({ message: 'weight must be a positive integer (grams)' });
    }
    const weightKg = Math.max(1, Math.ceil(grams / 1000));

    const headers = apiCoIdHeaders();
    if (!headers) {
      return res.json(getFallbackShippingCost());
    }

    const url = new URL(`${API_CO_ID_BASE}/expedition/shipping-cost`);
    url.searchParams.set('origin_village_code', ORIGIN_VILLAGE_CODE);
    url.searchParams.set('destination_village_code', destinationVillageCode);
    url.searchParams.set('weight', String(weightKg));

    const response = await axios.get(url.toString(), { headers, timeout: 15000 });
    const couriers = Array.isArray(response.data?.data?.couriers) ? response.data.data.couriers : [];

    // Whitelist kurir yang available di Tembalang (origin nala):
    // JNE, J&T (JT), POS, AnterAja
    const ALLOWED_COURIERS = new Set(['JNE', 'JT', 'pos', 'anteraja']);

    // Override nama kurir biar konsisten (api.co.id kadang balikin "Unknown Courier" untuk POS)
    const COURIER_LABELS = {
      JNE: 'JNE Reguler',
      JT: 'J&T Express',
      pos: 'POS Indonesia',
      anteraja: 'AnterAja',
    };

    // Helper: kasih fallback ETD kalau response API kosong/"-"
    // Pseudo-random deterministik: seed dari courier_code biar konsisten
    const isEmptyEtd = (etd) => !etd || String(etd).trim() === '' || String(etd).trim() === '-';
    const validEtds = couriers
      .filter((c) => !isEmptyEtd(c.estimation))
      .map((c) => c.estimation);
    const seededPick = (key, list) => {
      if (list.length === 0) return '2-3 hari';
      let hash = 0;
      for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
      return list[Math.abs(hash) % list.length];
    };

    const costs = couriers
      .filter((c) => Number(c.price) > 0 && ALLOWED_COURIERS.has(c.courier_code))
      .map((c) => {
        const label = COURIER_LABELS[c.courier_code] || c.courier_name;
        return {
          courierCode: c.courier_code,
          courierName: label,
          service: c.courier_code,
          description: label,
          cost: Number(c.price),
          etd: isEmptyEtd(c.estimation) ? seededPick(c.courier_code, validEtds) : c.estimation,
        };
      })
      .sort((a, b) => a.cost - b.cost);

    if (costs.length === 0) {
      return res.json(getFallbackShippingCost());
    }

    res.json({ costs });
  } catch (error) {
    console.error('Shipping calculate error:', error.response?.data || error.message);
    res.json(getFallbackShippingCost());
  }
});

function getFallbackShippingCost() {
  return {
    costs: [
      { courierCode: 'JNE', courierName: 'JNE Reguler', service: 'JNE', description: 'JNE Reguler', cost: 20000, etd: '2-3 hari' },
      { courierCode: 'JT', courierName: 'J&T Express', service: 'JT', description: 'J&T Express', cost: 18000, etd: '2-3 hari' },
      { courierCode: 'pos', courierName: 'POS Indonesia', service: 'pos', description: 'POS Indonesia', cost: 17000, etd: '3-5 hari' },
      { courierCode: 'anteraja', courierName: 'AnterAja', service: 'anteraja', description: 'AnterAja', cost: 19000, etd: '2-3 hari' },
    ],
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

// Telegram Notification Helper
const escapeHtml = (text) => {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

// Parse "Key: Value | Key: Value" jadi array { label, value }
const parsePipeFields = (raw) => {
  if (!raw) return [];
  return String(raw)
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const idx = part.indexOf(':');
      if (idx === -1) return { label: '', value: part };
      return {
        label: part.slice(0, idx).trim(),
        value: part.slice(idx + 1).trim(),
      };
    });
};

const buildProductSection = (orderId, notification) => {
  const cf1 = notification.custom_field1 || '';
  const cf2 = notification.custom_field2 || '';
  const cf3 = notification.custom_field3 || '';

  if (orderId.startsWith('BELAJAR-')) {
    const lines = ['<b>🎓 Detail Kelas</b>'];
    parsePipeFields(cf3).forEach(({ label, value }) => {
      if (label) lines.push(`• <b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`);
    });
    parsePipeFields(cf1).forEach(({ label, value }) => {
      if (label) lines.push(`• <b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`);
    });
    parsePipeFields(cf2).forEach(({ label, value }) => {
      if (label) lines.push(`• <b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`);
    });
    return { title: '🎓 Kelas', body: lines.join('\n') };
  }

  if (orderId.startsWith('BAJU-')) {
    const lines = ['<b>👕 Detail Pesanan</b>'];
    parsePipeFields(cf1).forEach(({ label, value }) => {
      if (label) lines.push(`• <b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`);
    });
    parsePipeFields(cf2).forEach(({ label, value }) => {
      if (label) lines.push(`• <b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`);
    });
    parsePipeFields(cf3).forEach(({ label, value }) => {
      if (label) lines.push(`• <b>${escapeHtml(label)}:</b> ${escapeHtml(value)}`);
    });
    return { title: '👕 Baju', body: lines.join('\n') };
  }

  if (orderId.startsWith('SKET-')) {
    return { title: '📚 Sketchbook', body: '' };
  }

  if (orderId.startsWith('BOOK-')) {
    const items = Array.isArray(notification.item_details) ? notification.item_details : [];
    const productLines = items
      .filter((item) => item.id !== 'shipping')
      .map((item) => `• <b>${escapeHtml(item.name)}</b> × ${item.quantity || 1}`);
    return {
      title: '📖 Buku',
      body: productLines.length ? `<b>📖 Item Pesanan</b>\n${productLines.join('\n')}` : '',
    };
  }

  return { title: '📖 Grasp Guide', body: '' };
};

const sendTelegramNotification = async (orderId, transactionId, notification, code) => {
  if (!telegramBot) {
    console.warn('⚠️ Telegram bot not initialized - skipping notification');
    return;
  }

  const chatIdConfig = process.env.TELEGRAM_CHAT_ID;
  if (!chatIdConfig) {
    console.warn('⚠️ TELEGRAM_CHAT_ID not set - skipping notification');
    return;
  }

  const chatIds = chatIdConfig.split(',').map(id => id.trim()).filter(id => id);
  if (chatIds.length === 0) {
    console.warn('⚠️ No valid TELEGRAM_CHAT_ID found - skipping notification');
    return;
  }

  try {
    const amount = parseFloat(notification.gross_amount).toLocaleString('id-ID');
    const firstName = notification.customer_details?.first_name || '';
    const lastName = notification.customer_details?.last_name || '';
    const customerName = `${firstName} ${lastName}`.trim() || '-';
    const customerEmail = notification.customer_details?.email || '-';
    const customerPhone = notification.customer_details?.phone || '-';
    const paymentType = notification.payment_type || '-';
    const timestamp = new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const { title, body: productBody } = buildProductSection(orderId, notification);

    const sections = [];

    sections.push(`🎉 <b>PEMBAYARAN BERHASIL</b>\n${title}`);

    sections.push(
      [
        '<b>💳 Pembayaran</b>',
        `• <b>Order ID:</b> <code>${escapeHtml(orderId)}</code>`,
        `• <b>Nominal:</b> Rp ${escapeHtml(amount)}`,
        `• <b>Kode Akses:</b> <code>${escapeHtml(code)}</code>`,
        `• <b>Metode:</b> ${escapeHtml(paymentType)}`,
        `• <b>Status:</b> ✅ LUNAS`,
      ].join('\n')
    );

    if (productBody) {
      sections.push(productBody);
    }

    sections.push(
      [
        '<b>👤 Data Pemesan</b>',
        `• <b>Nama:</b> ${escapeHtml(customerName)}`,
        `• <b>Email:</b> ${escapeHtml(customerEmail)}`,
        `• <b>No HP:</b> ${escapeHtml(customerPhone)}`,
      ].join('\n')
    );

    sections.push(`🕒 <i>${escapeHtml(timestamp)} WIB</i>`);

    const message = sections.join('\n\n');

    const sendPromises = chatIds.map(chatId =>
      telegramBot.sendMessage(chatId, message, { parse_mode: 'HTML', disable_web_page_preview: true })
        .then(() => {
          console.log(`✅ Telegram notification sent to ${chatId} for order ${orderId}`);
        })
        .catch(err => {
          console.error(`❌ Failed to send to ${chatId}:`, err.message);
        })
    );

    await Promise.all(sendPromises);
  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error.message);
  }
};

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
    if (orderId.startsWith('G60-')) {
      code = `G60-${randomPart}`;
    } else if (orderId.startsWith('GRASP-')) {
      code = `GG-${randomPart}`;
    } else if (orderId.startsWith('SKET-')) {
      code = `SK-${randomPart}`;
    } else if (orderId.startsWith('BELAJAR-')) {
      // For classes, we use the Order ID itself as the code (or generate a specific one if needed)
      // User wanted to track by BELAJAR- prefix.
      code = orderId;
      isClass = true;
    } else if (orderId.startsWith('BAJU-')) {
      code = `BJ-${randomPart}`;
    } else if (orderId.startsWith('BOOK-')) {
      code = `BK-${randomPart}`;
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

    // Send Telegram Notification (Real-time for all purchases)
    await sendTelegramNotification(orderId, transactionId, notification, code);

    // Send Email Notification for Classes
    console.log(`🔍 Checking Email: isClass=${isClass}`);

    if (isClass) {
      const emailRecipient = 'nicolaanandadwiervantoro@gmail.com';
      console.log(`📧 Preparing to send email to: ${emailRecipient}`);

      const amount = parseFloat(notification.gross_amount).toLocaleString('id-ID');
      const customField1 = notification.custom_field1 || '-';
      const customField2 = notification.custom_field2 || '-';
      const customField3 = notification.custom_field3 || '-';

      const customerName = `${notification.customer_details?.first_name || ''} ${notification.customer_details?.last_name || ''}`;
      const customerEmail = notification.customer_details?.email || '';
      const customerPhone = notification.customer_details?.phone || '';

      const emailSubject = `🎉 Pembayaran Kelas Berhasil: ${orderId}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #4F46E5; padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">🎉 Pembayaran Kelas Berhasil!</h2>
          </div>
          <div style="padding: 20px;">
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid #4F46E5;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin: 5px 0;"><strong>Nominal:</strong> Rp ${amount}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: green; font-weight: bold;">LUNAS</span></p>
            </div>
            <h3 style="color: #374151; border-bottom: 1px solid #eee; padding-bottom: 10px;">📋 Detail Pendaftaran</h3>
            <ul style="color: #4B5563; line-height: 1.6;">
              <li>${customField1}</li>
              <li>${customField2}</li>
              <li>${customField3}</li>
            </ul>
            <h3 style="color: #374151; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-top: 25px;">👤 Data Pemesan</h3>
            <p style="color: #4B5563; line-height: 1.6;">
              <strong>Nama:</strong> ${customerName}<br>
              <strong>Email:</strong> ${customerEmail}<br>
              <strong>No HP:</strong> ${customerPhone}
            </p>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; color: #6B7280; font-size: 12px;">
            Email ini dikirim otomatis oleh Nala System.
          </div>
        </div>
      `;

      try {
        const transporter = nodemailer.createTransport({
          host: 'mail.nicola.id',
          port: 465,
          secure: true,
          auth: {
            user: 'gmail@nicola.id',
            pass: '@Nandha20'
          }
        });

        console.log('🚀 Sending Email now...');
        const info = await transporter.sendMail({
          from: '"Nala System" <gmail@nicola.id>',
          to: emailRecipient,
          subject: emailSubject,
          html: emailHtml
        });

        console.log(`✅ Email notification sent: ${info.messageId}`);
      } catch (emailError) {
        console.error('❌ Failed to send Email notification:', emailError.message);
      }
    } else {
      if (!isClass) console.log('ℹ️ Not a class transaction, skipping Email.');
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
app.post('/api/transaction/:orderId/generate-code', requireAdmin, async (req, res) => {
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
    await db.logAdminAction({
      adminEmail: req.admin.email,
      action: 'generate_access_code',
      entityType: 'grasp_guide_access',
      entityId: row.code,
      details: db.rowToJson(row),
    });

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
app.get('/api/admin/transactions', requireAdmin, async (req, res) => {
  try {
    const rows = await db.getAllAccessCodes();
    const records = rows.map(row => db.rowToJson(row));
    res.json({ transactions: records, count: records.length });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
});

app.post('/api/admin/access-codes/:code/revoke', requireAdmin, async (req, res) => {
  try {
    const row = await db.revokeAccessCode(req.params.code, req.body.reason);
    if (!row) return res.status(404).json({ message: 'Code not found' });
    await db.logAdminAction({ adminEmail: req.admin.email, action: 'revoke_access_code', entityType: 'grasp_guide_access', entityId: row.code, details: db.rowToJson(row) });
    res.json({ record: db.rowToJson(row) });
  } catch (error) {
    console.error('Revoke code error:', error);
    res.status(500).json({ message: 'Failed to revoke code', error: error.message });
  }
});

app.post('/api/admin/access-codes/:code/restore', requireAdmin, async (req, res) => {
  try {
    const row = await db.restoreAccessCode(req.params.code);
    if (!row) return res.status(404).json({ message: 'Code not found' });
    await db.logAdminAction({ adminEmail: req.admin.email, action: 'restore_access_code', entityType: 'grasp_guide_access', entityId: row.code, details: db.rowToJson(row) });
    res.json({ record: db.rowToJson(row) });
  } catch (error) {
    console.error('Restore code error:', error);
    res.status(500).json({ message: 'Failed to restore code', error: error.message });
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
