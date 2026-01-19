# 🚀 Setup Webhook Forward: Step-by-Step Guide

## 📋 Overview

File ini menjelaskan cara **implementasi webhook forward** dari bot-wa server ke nala server untuk transaksi Grasp Guide & Class Registration.

### Arsitektur:
```
Midtrans → logs.nicola.id (bot-wa) → api.artstudionala.com (nala)
            ↓ receives webhook    ↓ forwards webhook
            ↓ process bot-wa      ↓ generates access code
```

---

## 🎯 Tujuan

1. ✅ Bot-wa tetap menerima semua webhook dari Midtrans
2. ✅ Bot-wa process transaksi normal (topup, store, dll)
3. ✅ Bot-wa forward transaksi Nala (CLASS-, GG-, GRASP-) ke server Nala
4. ✅ Nala server generate access code untuk Grasp Guide

---

## 📁 File yang Dibutuhkan

Sudah ada di project ini:

1. ✅ `server/webhook-forward.js` - Helper function untuk forward
2. ✅ `BOT-WA-WEBHOOK-EXAMPLE.js` - Example code untuk bot-wa

---

## 🔧 Step-by-Step Implementation

### **Step 1: Setup di Bot-WA Server (logs.nicola.id)**

#### 1.1. Upload Helper Function

Upload file `server/webhook-forward.js` ke bot-wa server:

```bash
# Dari local machine
scp server/webhook-forward.js user@logs.nicola.id:/root/Work/bot-wa/
```

Atau copy manual code dari `BOT-WA-WEBHOOK-EXAMPLE.js`.

#### 1.2. Set Environment Variable

Di server bot-wa, tambahkan environment variable:

```bash
# SSH ke bot-wa server
ssh user@logs.nicola.id

# Edit .env bot-wa
cd /root/Work/bot-wa
nano .env

# Tambahkan:
NALA_WEBHOOK_URL=https://api.artstudionala.com/api/midtrans/notification
```

#### 1.3. Install Dependencies

Pastikan bot-wa punya axios (untuk HTTP request):

```bash
# Di bot-wa server
cd /root/Work/bot-wa
npm install axios
```

### **Step 2: Update Webhook Handler di Bot-WA**

Buka file webhook handler bot-wa (biasanya `index.js` atau `webhook.js`):

```bash
nano /root/Work/bot-wa/index.js
```

#### Option A: Jika Bot-WA Pakai ES6 (import/export)

```javascript
// Di bagian atas file
import axios from 'axios';

// Constants
const NALA_WEBHOOK_URL = process.env.NALA_WEBHOOK_URL || 'https://api.artstudionala.com/api/midtrans/notification';

// Helper functions
function isNalaTransaction(orderId) {
  if (!orderId) return false;
  return orderId.includes('CLASS-') || 
         orderId.includes('GG-') || 
         orderId.includes('GRASP-');
}

async function forwardToNala(notification) {
  try {
    console.log(`[Webhook Forward] 📤 Forwarding to nala: ${notification.order_id}`);
    
    const response = await axios.post(NALA_WEBHOOK_URL, notification, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    console.log(`[Webhook Forward] ✅ Success: ${notification.order_id}`);
    return { success: true };
  } catch (error) {
    console.error(`[Webhook Forward] ❌ Error: ${notification.order_id}`, error.message);
    return { success: false, error: error.message };
  }
}

// Update webhook handler
app.post('/webhook/midtrans', async (req, res) => {
  try {
    const notification = req.body;
    const orderId = notification.order_id || '';
    
    console.log(`[Webhook] 📥 Received: ${orderId}`);
    
    // 1. Process untuk bot-wa (existing logic)
    // TODO: Taruh logic bot-wa di sini
    await processBotWaNotification(notification);
    
    // 2. Forward ke nala jika order_id untuk nala
    if (isNalaTransaction(orderId)) {
      console.log(`[Webhook] 🎯 Nala transaction detected: ${orderId}`);
      
      // Forward async (tidak blocking response ke Midtrans)
      forwardToNala(notification).catch(err => {
        console.error('[Webhook] Forward failed:', err);
        // Tidak throw error karena tidak mau block response
      });
    }
    
    // 3. Return response ke Midtrans (HARUS 200 OK)
    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('[Webhook] ❌ Error:', error);
    // Tetap return 200 OK ke Midtrans agar tidak retry
    res.status(200).json({ status: 'OK' });
  }
});
```

#### Option B: Jika Bot-WA Pakai CommonJS (require/module.exports)

```javascript
// Di bagian atas file
const axios = require('axios');

// Constants
const NALA_WEBHOOK_URL = process.env.NALA_WEBHOOK_URL || 'https://api.artstudionala.com/api/midtrans/notification';

// Helper functions
function isNalaTransaction(orderId) {
  if (!orderId) return false;
  return orderId.includes('CLASS-') || 
         orderId.includes('GG-') || 
         orderId.includes('GRASP-');
}

async function forwardToNala(notification) {
  try {
    console.log(`[Webhook Forward] 📤 Forwarding to nala: ${notification.order_id}`);
    
    const response = await axios.post(NALA_WEBHOOK_URL, notification, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    console.log(`[Webhook Forward] ✅ Success: ${notification.order_id}`);
    return { success: true };
  } catch (error) {
    console.error(`[Webhook Forward] ❌ Error: ${notification.order_id}`, error.message);
    return { success: false, error: error.message };
  }
}

// Update webhook handler
app.post('/webhook/midtrans', async (req, res) => {
  try {
    const notification = req.body;
    const orderId = notification.order_id || '';
    
    console.log(`[Webhook] 📥 Received: ${orderId}`);
    
    // 1. Process untuk bot-wa (existing logic)
    // TODO: Taruh logic bot-wa di sini
    await processBotWaNotification(notification);
    
    // 2. Forward ke nala jika order_id untuk nala
    if (isNalaTransaction(orderId)) {
      console.log(`[Webhook] 🎯 Nala transaction detected: ${orderId}`);
      
      // Forward async (tidak blocking response ke Midtrans)
      forwardToNala(notification).catch(err => {
        console.error('[Webhook] Forward failed:', err);
      });
    }
    
    // 3. Return response ke Midtrans (HARUS 200 OK)
    res.status(200).json({ status: 'OK' });
  } catch (error) {
    console.error('[Webhook] ❌ Error:', error);
    // Tetap return 200 OK ke Midtrans agar tidak retry
    res.status(200).json({ status: 'OK' });
  }
});
```

### **Step 3: Restart Bot-WA Service**

```bash
# SSH ke bot-wa server
ssh user@logs.nicola.id

# Restart service
pm2 restart bot-wa

# Atau jika systemd
sudo systemctl restart bot-wa

# Check logs
pm2 logs bot-wa --lines 50
```

### **Step 4: Verify Nala Server Ready**

Pastikan nala server siap menerima webhook:

```bash
# Test nala webhook endpoint
curl -X POST https://api.artstudionala.com/api/midtrans/notification \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "CLASS-TEST-123",
    "transaction_status": "settlement",
    "gross_amount": "5000",
    "transaction_id": "test-123"
  }'

# Expected response:
# {"status":"ok"}
```

---

## 🧪 Testing

### Test 1: Test Bot-WA Webhook (Non-Nala Transaction)

```bash
# Test transaksi bot-wa normal (tidak akan di-forward)
curl -X POST https://logs.nicola.id/webhook/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TOPUP-123",
    "transaction_status": "settlement",
    "gross_amount": "10000"
  }'

# Expected logs di bot-wa:
# [Webhook] 📥 Received: TOPUP-123
# (tidak ada forward karena bukan nala transaction)
```

### Test 2: Test Nala Transaction (Akan Di-Forward)

```bash
# Test transaksi nala (akan di-forward)
curl -X POST https://logs.nicola.id/webhook/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "CLASS-1734123456789-abc123",
    "transaction_status": "settlement",
    "gross_amount": "5000",
    "transaction_id": "test-456",
    "customer_details": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "08123456789"
    }
  }'

# Expected logs di bot-wa:
# [Webhook] 📥 Received: CLASS-1734123456789-abc123
# [Webhook] 🎯 Nala transaction detected: CLASS-1734123456789-abc123
# [Webhook Forward] 📤 Forwarding to nala: CLASS-1734123456789-abc123
# [Webhook Forward] ✅ Success: CLASS-1734123456789-abc123
```

### Test 3: Check Nala Server Received Webhook

```bash
# SSH ke nala server
ssh user@server-nala

# Check logs nala API
pm2 logs api-nala | grep "CLASS-1734123456789-abc123"

# Expected output:
# [Webhook] Received notification: CLASS-1734123456789-abc123
# [Access Code] Generated: GG-XXXXXX for order CLASS-1734123456789-abc123
```

### Test 4: Verify Access Code Generated

```bash
# Test verify endpoint nala
curl -X POST https://api.artstudionala.com/api/grasp-guide/verify-code \
  -H "Content-Type: application/json" \
  -d '{"code": "GG-XXXXXX"}'

# Expected response:
# {
#   "valid": true,
#   "record": {
#     "orderId": "CLASS-1734123456789-abc123",
#     "code": "GG-XXXXXX",
#     ...
#   }
# }
```

---

## 📊 Monitoring & Debugging

### Check Bot-WA Logs

```bash
# Real-time logs
pm2 logs bot-wa -f

# Last 100 lines
pm2 logs bot-wa --lines 100

# Filter webhook logs
pm2 logs bot-wa --lines 200 | grep -i webhook
```

### Check Nala Logs

```bash
# Real-time logs
pm2 logs api-nala -f

# Check specific order
pm2 logs api-nala --lines 500 | grep "CLASS-"
```

### Debug Checklist

- [ ] Bot-WA service running?
  ```bash
  pm2 list | grep bot-wa
  ```

- [ ] Environment variable set?
  ```bash
  pm2 env bot-wa | grep NALA_WEBHOOK_URL
  ```

- [ ] Nala server running?
  ```bash
  curl https://api.artstudionala.com/api/health
  ```

- [ ] Network connectivity?
  ```bash
  # Test dari bot-wa ke nala
  ssh user@logs.nicola.id
  curl https://api.artstudionala.com/api/health
  ```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Forward Failed - Connection Refused

**Error:**
```
[Webhook Forward] ❌ Error: connect ECONNREFUSED
```

**Solution:**
- Check nala server running: `pm2 list | grep api-nala`
- Check firewall: `sudo ufw status`
- Test connectivity: `curl https://api.artstudionala.com/api/health`

### Issue 2: Forward Failed - 401 Unauthorized

**Error:**
```
[Webhook Forward] Response: 401 - Unauthorized
```

**Solution:**
- Nala server Midtrans key salah
- Check nala server logs
- Run test script: `node server/test-midtrans-key.js`

### Issue 3: Forward Failed - Timeout

**Error:**
```
[Webhook Forward] ❌ Error: timeout of 10000ms exceeded
```

**Solution:**
- Nala server slow/overloaded
- Check nala server CPU/Memory: `htop`
- Increase timeout di forward function (ganti 10000 ke 30000)

### Issue 4: Code Not Generated

**Symptom:** Webhook di-forward tapi code tidak ter-generate

**Solution:**
1. Check nala webhook handler logs
2. Check database connection
3. Test manual generate code:
   ```bash
   curl -X POST https://api.artstudionala.com/api/grasp-guide/access-code \
     -H "Content-Type: application/json" \
     -d '{
       "transactionId": "test-123",
       "orderId": "CLASS-TEST",
       "code": "GG-TEST",
       "customer": {"firstName": "Test"}
     }'
   ```

---

## 🎯 Quick Troubleshooting Commands

```bash
# 1. Check bot-wa webhook handler
curl -X POST https://logs.nicola.id/webhook/midtrans \
  -H "Content-Type: application/json" \
  -d '{"order_id":"CLASS-TEST","transaction_status":"settlement"}'

# 2. Check bot-wa logs
ssh user@logs.nicola.id
pm2 logs bot-wa --lines 50 | grep -i webhook

# 3. Check nala server
curl https://api.artstudionala.com/api/health

# 4. Check nala logs
ssh user@server-nala
pm2 logs api-nala --lines 50 | grep -i webhook

# 5. Test direct to nala
curl -X POST https://api.artstudionala.com/api/midtrans/notification \
  -H "Content-Type: application/json" \
  -d '{"order_id":"CLASS-TEST","transaction_status":"settlement"}'
```

---

## 📝 Configuration Summary

### Bot-WA Server (logs.nicola.id)

**Environment Variables:**
```env
NALA_WEBHOOK_URL=https://api.artstudionala.com/api/midtrans/notification
```

**Required Files:**
- Webhook handler with forward logic
- axios package installed

### Nala Server (api.artstudionala.com)

**Webhook Endpoint:**
```
POST /api/midtrans/notification
```

**Environment Variables:**
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
MIDTRANS_IS_PRODUCTION=false
```

### Midtrans Dashboard

**Payment Notification URL:**
```
https://logs.nicola.id/webhook/midtrans
```

---

## ✅ Success Checklist

Webhook forward berhasil jika:

- [ ] Bot-WA menerima webhook dari Midtrans (200 OK)
- [ ] Bot-WA mendeteksi transaksi Nala (log: "Nala transaction detected")
- [ ] Bot-WA forward webhook ke Nala (log: "Forwarding to nala")
- [ ] Nala menerima webhook (log di nala server)
- [ ] Nala generate access code (log: "Generated code")
- [ ] Access code bisa di-verify

---

## 🚀 Done!

Setelah setup:

1. ✅ Webhook Midtrans tetap ke bot-wa
2. ✅ Bot-wa process semua transaksi
3. ✅ Transaksi Nala (CLASS-, GG-, GRASP-) di-forward ke Nala
4. ✅ Nala generate access code
5. ✅ User dapat access code via email/WhatsApp

---

## 📞 Need Help?

Check documentation:
- `WEBHOOK-INTEGRATION.md` - Detailed webhook integration guide
- `BOT-WA-WEBHOOK-EXAMPLE.js` - Complete code example
- `server/webhook-forward.js` - Helper function reference

Or check logs untuk debugging! 🔍

