# 📊 Webhook Forward Flow Diagram

## 🌊 Complete Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     WEBHOOK FORWARD ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣  USER MAKES PAYMENT
    └─> Frontend (artstudionala.com)
        └─> Calls: /api/midtrans/create-payment-link
            └─> Backend generates payment URL
                └─> User completes payment on Midtrans


2️⃣  MIDTRANS SENDS WEBHOOK
    
    ┌─────────────┐
    │  Midtrans   │  Settlement notification
    │   Payment   │
    └──────┬──────┘
           │
           │ POST /webhook/midtrans
           │ {
           │   "order_id": "CLASS-123",
           │   "transaction_status": "settlement",
           │   "gross_amount": "5000"
           │ }
           ▼
    ┌──────────────────────────────────────────────┐
    │  Bot-WA Server (logs.nicola.id)              │
    │  ─────────────────────────────────────       │
    │                                              │
    │  app.post('/webhook/midtrans')               │
    │  │                                           │
    │  ├─> ✅ Receive webhook                     │
    │  │                                           │
    │  ├─> 📋 Process bot-wa transactions         │
    │  │    (topup, store, etc)                   │
    │  │                                           │
    │  ├─> 🔍 Check if Nala transaction           │
    │  │    if (orderId.includes('CLASS-') ||     │
    │  │        orderId.includes('GG-') ||        │
    │  │        orderId.includes('GRASP-'))       │
    │  │                                           │
    │  └─> 📤 Forward to Nala (if match)          │
    │       └─> forwardToNala(notification)       │
    │                                              │
    └──────────────────┬───────────────────────────┘
                       │
                       │ POST /api/midtrans/notification
                       │ (async, non-blocking)
                       ▼
    ┌──────────────────────────────────────────────┐
    │  Nala Server (api.artstudionala.com)         │
    │  ─────────────────────────────────────       │
    │                                              │
    │  app.post('/api/midtrans/notification')      │
    │  │                                           │
    │  ├─> ✅ Receive forwarded webhook           │
    │  │                                           │
    │  ├─> 🔐 Verify signature                    │
    │  │                                           │
    │  ├─> 📝 Check if code exists                │
    │  │    └─> If not: Generate access code      │
    │  │        └─> Save to database              │
    │  │                                           │
    │  └─> ✉️  Send email with access code        │
    │                                              │
    └──────────────────────────────────────────────┘


3️⃣  USER RECEIVES ACCESS CODE
    └─> Email: "Your access code: GG-ABC123"
        └─> User can access Grasp Guide content
```

---

## 🎯 Transaction Flow by Type

### Type 1: Bot-WA Transaction (No Forward)

```
Midtrans Webhook
   │ order_id: "TOPUP-123"
   ▼
Bot-WA Server (logs.nicola.id)
   │
   ├─> ✅ Process topup
   ├─> 💰 Add balance to user
   ├─> ❌ NO forward (not Nala transaction)
   └─> ✅ Return 200 OK to Midtrans
```

### Type 2: Nala Transaction (With Forward)

```
Midtrans Webhook
   │ order_id: "CLASS-123"
   ▼
Bot-WA Server (logs.nicola.id)
   │
   ├─> ✅ Process webhook
   ├─> 🔍 Detect: Nala transaction!
   ├─> 📤 Forward to Nala server
   │   └─> async (non-blocking)
   │
   └─> ✅ Return 200 OK to Midtrans
       (immediately, without waiting)

   (Meanwhile...)
   
Nala Server receives forward
   │
   ├─> ✅ Process payment
   ├─> 🎫 Generate access code
   ├─> 💾 Save to database
   └─> ✉️  Send email
```

---

## 🔧 Implementation Points

### Bot-WA Server Code

```javascript
// 1. Receive webhook
app.post('/webhook/midtrans', async (req, res) => {
  const notification = req.body;
  const orderId = notification.order_id;
  
  // 2. Process bot-wa logic
  await processBotWa(notification);
  
  // 3. Check if Nala transaction
  if (isNalaTransaction(orderId)) {
    // 4. Forward (async - tidak blocking)
    forwardToNala(notification).catch(console.error);
  }
  
  // 5. Response immediately
  res.status(200).json({ status: 'OK' });
});
```

### Helper Functions

```javascript
// Check if transaction for Nala
function isNalaTransaction(orderId) {
  return orderId.includes('CLASS-') || 
         orderId.includes('GG-') || 
         orderId.includes('GRASP-');
}

// Forward to Nala server
async function forwardToNala(notification) {
  return axios.post(NALA_WEBHOOK_URL, notification);
}
```

---

## 📋 Order ID Patterns

| Pattern | Type | Server | Action |
|---------|------|--------|--------|
| `TOPUP-xxx` | Bot-WA | Bot-WA only | ❌ No forward |
| `STORE-xxx` | Bot-WA | Bot-WA only | ❌ No forward |
| `CLASS-xxx` | Nala | Bot-WA + Nala | ✅ Forward to Nala |
| `GG-xxx` | Nala | Bot-WA + Nala | ✅ Forward to Nala |
| `GRASP-xxx` | Nala | Bot-WA + Nala | ✅ Forward to Nala |

---

## 🔍 Debugging Flow

### 1. Check Bot-WA Logs

```bash
pm2 logs bot-wa --lines 50

# Look for:
# ✅ "[Webhook] 📥 Received: CLASS-123"
# ✅ "[Webhook] 🎯 Nala transaction detected"
# ✅ "[Webhook Forward] 📤 Forwarding to nala"
# ✅ "[Webhook Forward] ✅ Success"
```

### 2. Check Nala Logs

```bash
pm2 logs api-nala --lines 50

# Look for:
# ✅ "[Webhook] Received notification: CLASS-123"
# ✅ "[Access Code] Generated: GG-XXXXXX"
```

### 3. Error Scenarios

```
❌ Forward Failed
   └─> Check:
       ├─> Nala server running?
       ├─> Network connectivity?
       ├─> Correct URL in NALA_WEBHOOK_URL?
       └─> Firewall blocking?

❌ Code Not Generated
   └─> Check:
       ├─> Webhook signature valid?
       ├─> Database connection?
       ├─> Transaction status = "settlement"?
       └─> Order ID not duplicate?
```

---

## 🚀 Quick Test Commands

### Test Bot-WA Webhook

```bash
# Test normal bot-wa transaction (no forward)
curl -X POST https://logs.nicola.id/webhook/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TOPUP-TEST-123",
    "transaction_status": "settlement",
    "gross_amount": "10000"
  }'
```

### Test Nala Transaction (with forward)

```bash
# Test Nala transaction (will forward)
curl -X POST https://logs.nicola.id/webhook/midtrans \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "CLASS-TEST-456",
    "transaction_status": "settlement",
    "gross_amount": "5000",
    "transaction_id": "test-456",
    "customer_details": {
      "first_name": "Test",
      "last_name": "User",
      "email": "test@example.com",
      "phone": "08123456789"
    }
  }'
```

### Test Direct to Nala

```bash
# Test Nala webhook directly (bypass bot-wa)
curl -X POST https://api.artstudionala.com/api/midtrans/notification \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "CLASS-DIRECT-789",
    "transaction_status": "settlement",
    "gross_amount": "5000"
  }'
```

---

## ✅ Success Indicators

### Bot-WA Logs
```
[Webhook] 📥 Received: CLASS-1234567890-abc
[Webhook] 🎯 Nala transaction detected: CLASS-1234567890-abc
[Webhook Forward] 📤 Forwarding to nala: CLASS-1234567890-abc
[Webhook Forward] ✅ Success: CLASS-1234567890-abc
```

### Nala Logs
```
🔔 [Webhook] Midtrans notification: CLASS-1234567890-abc
✅ [Webhook] Payment successful for CLASS-1234567890-abc
💾 [Webhook] Saved webhook to PostgreSQL
🎫 [Access Code] Generated: GG-XYZ789 for CLASS-1234567890-abc
```

### Database Check
```sql
-- Check if code was generated
SELECT * FROM grasp_guide_codes 
WHERE order_id = 'CLASS-1234567890-abc';

-- Expected result:
-- code: GG-XYZ789
-- order_id: CLASS-1234567890-abc
-- created_at: 2024-12-xx xx:xx:xx
```

---

## 🎓 Summary

### What Happens:
1. ✅ User pays for Grasp Guide/Class
2. ✅ Midtrans sends webhook to bot-wa
3. ✅ Bot-wa receives and processes
4. ✅ Bot-wa detects Nala transaction
5. ✅ Bot-wa forwards to Nala server
6. ✅ Nala generates access code
7. ✅ User receives access code

### Why This Works:
- ✅ Single webhook URL in Midtrans (no dual webhook needed)
- ✅ Bot-wa still handles all transactions
- ✅ Nala gets notified only for relevant transactions
- ✅ Async forward doesn't block bot-wa response
- ✅ Error in forward doesn't affect bot-wa operation

### Key Benefits:
- ✅ **Reliability:** Bot-wa always responds to Midtrans
- ✅ **Performance:** Async forward = fast response
- ✅ **Maintainability:** Clear separation of concerns
- ✅ **Scalability:** Easy to add more forwards if needed
- ✅ **Debugging:** Clear logs at each step

