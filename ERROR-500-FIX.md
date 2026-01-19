# Fix Error 500: Failed to Create Payment Link

## 🔴 Error Message
```
[Error] Failed to load resource: the server responded with a status of 500 ()
(create-payment-link, line 0)
```

## 🔍 Penyebab Error 500

Error 500 pada endpoint `/api/midtrans/create-payment-link` biasanya disebabkan oleh:

1. **Midtrans Server Key tidak valid** (Error 401 dari Midtrans yang di-catch jadi 500)
2. **MIDTRANS_SERVER_KEY tidak di-set** di environment variable
3. **Request payload tidak valid**
4. **Network issue** ke Midtrans API

## ✅ Langkah-langkah Perbaikan

### 1️⃣ Cek Logs Server (PENTING!)

Sekarang error logging sudah di-improve. Cek logs untuk melihat detail error:

**Di Production Server (logs.nicola.id):**

```bash
# SSH ke server
ssh user@logs.nicola.id

# Cek logs PM2
pm2 logs api-nala --lines 50

# Atau systemd logs
journalctl -u api-nala -n 50 -f

# Atau Docker logs
docker-compose logs -f api-nala --tail=50
```

**Cari salah satu dari messages ini:**

```
❌ MIDTRANS_SERVER_KEY is not configured
❌ Midtrans API Error: ... httpStatusCode: 401
⚠️  Missing required fields in payment request
```

### 2️⃣ Fix Berdasarkan Error Message

#### ✅ Jika: `MIDTRANS_SERVER_KEY is not configured`

```bash
# Edit .env di server
nano /root/Work/nala-s-pastel-playground/.env

# Tambahkan:
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false

# Save (Ctrl+O, Enter, Ctrl+X)

# Restart service
pm2 restart api-nala
```

#### ✅ Jika: `Midtrans API Error: ... httpStatusCode: 401`

Ini berarti Server Key **SALAH** atau **TIDAK VALID**.

**Solusi:**

1. Login ke Midtrans Dashboard
   - Sandbox: https://dashboard.sandbox.midtrans.com/
   - Production: https://dashboard.midtrans.com/

2. Pergi ke: **Settings** → **Access Keys**

3. Copy **Server Key** yang benar (harus lengkap!)
   - Sandbox: `SB-Mid-server-xxxxxxxxxxxxxxxxxxxxx`
   - Production: `Mid-server-xxxxxxxxxxxxxxxxxxxxx`

4. Update .env:
   ```bash
   nano /root/Work/nala-s-pastel-playground/.env
   
   # Ganti dengan key yang benar (PASTIKAN LENGKAP!)
   MIDTRANS_SERVER_KEY=SB-Mid-server-LENGKAP_DARI_DASHBOARD
   ```

5. Restart:
   ```bash
   pm2 restart api-nala
   ```

6. **Test dengan script:**
   ```bash
   cd /root/Work/nala-s-pastel-playground
   node server/test-midtrans-key.js
   ```

#### ✅ Jika: `Missing required fields in payment request`

Ini berarti **request dari frontend tidak lengkap**.

Cek frontend code yang memanggil API:

```typescript
// src/lib/midtrans.ts
const response = await fetch('/api/midtrans/create-payment-link', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transaction_details: {
      order_id: 'ORDER-123',        // HARUS ADA
      gross_amount: 10000            // HARUS ADA
    },
    customer_details: {
      first_name: 'John',            // HARUS ADA
      email: 'john@example.com',     // HARUS ADA
      phone: '08123456789'           // HARUS ADA
    }
  })
});
```

### 3️⃣ Test Payment Link Creation

**Manual test dengan curl:**

```bash
# Test di local (jika server berjalan di local)
curl -X POST http://localhost:3001/api/midtrans/create-payment-link \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_details": {
      "order_id": "TEST-'$(date +%s)'",
      "gross_amount": 10000
    },
    "item_details": [{
      "id": "TEST_ITEM",
      "price": 10000,
      "quantity": 1,
      "name": "Test Item"
    }],
    "customer_details": {
      "first_name": "Test",
      "last_name": "User",
      "email": "test@example.com",
      "phone": "08123456789"
    }
  }'

# Test di production
curl -X POST https://api.artstudionala.com/api/midtrans/create-payment-link \
  -H "Content-Type: application/json" \
  -d '{...}'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "payment_url": "https://app.sandbox.midtrans.com/snap/v3/...",
  "order_id": "TEST-1234567890",
  "token": "xxxxx-xxxxx-xxxxx"
}
```

**Error Response (Auth Failed):**
```json
{
  "success": false,
  "message": "Payment gateway authentication failed. Please contact administrator.",
  "error_code": "MIDTRANS_AUTH_FAILED",
  "details": [
    "Access denied due to unauthorized transaction, please check client or server key"
  ]
}
```

### 4️⃣ Verify Environment Variables

```bash
# Di server production
cd /root/Work/nala-s-pastel-playground

# Check apakah .env ada
ls -la .env

# Check isi .env (hanya tampilkan 20 karakter pertama untuk keamanan)
cat .env | grep MIDTRANS | sed 's/=\(.\{20\}\).*/=\1.../'

# Output yang benar:
# MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx...
# MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx...
# MIDTRANS_IS_PRODUCTION=false
```

### 5️⃣ Restart All Services

```bash
# PM2
pm2 restart all
pm2 logs api-nala --lines 20

# Systemd
sudo systemctl restart api-nala
sudo systemctl status api-nala

# Docker
docker-compose restart
docker-compose logs -f api-nala
```

## 🧪 Testing Checklist

- [ ] Environment variable MIDTRANS_SERVER_KEY sudah di-set
- [ ] Server Key format benar (dimulai dengan SB-Mid-server- atau Mid-server-)
- [ ] Server Key lengkap (tidak terpotong)
- [ ] MIDTRANS_IS_PRODUCTION sesuai dengan key (false untuk sandbox)
- [ ] Service sudah di-restart setelah update .env
- [ ] Test dengan script `test-midtrans-key.js` berhasil
- [ ] Test dengan curl berhasil
- [ ] Cek logs tidak ada error 401
- [ ] Frontend bisa create payment link

## 🎯 Quick Fix (TL;DR)

```bash
# 1. SSH ke server
ssh user@logs.nicola.id

# 2. Edit .env
cd /root/Work/nala-s-pastel-playground
nano .env

# 3. Pastikan ada (ganti dengan key yang benar):
MIDTRANS_SERVER_KEY=SB-Mid-server-COPY_DARI_DASHBOARD
MIDTRANS_CLIENT_KEY=SB-Mid-client-COPY_DARI_DASHBOARD
MIDTRANS_IS_PRODUCTION=false

# 4. Save & restart
pm2 restart api-nala

# 5. Test
node server/test-midtrans-key.js

# 6. Check logs
pm2 logs api-nala --lines 20
```

## 🔧 Debugging Tips

### Enable Detailed Logging

Tambahkan di `server/index.js` setelah `dotenv.config()`:

```javascript
// Debug environment variables (sementara)
console.log('🔍 Environment Check:');
console.log('  MIDTRANS_SERVER_KEY:', process.env.MIDTRANS_SERVER_KEY ? 
  `${process.env.MIDTRANS_SERVER_KEY.substring(0, 20)}... (length: ${process.env.MIDTRANS_SERVER_KEY.length})` : 
  '❌ NOT SET');
console.log('  MIDTRANS_IS_PRODUCTION:', process.env.MIDTRANS_IS_PRODUCTION);
```

**Restart dan cek output:**
```bash
pm2 restart api-nala
pm2 logs api-nala | grep "Environment Check"
```

### Test Midtrans Directly

```bash
# Test langsung ke Midtrans API (ganti YOUR_SERVER_KEY)
curl -X POST https://app.sandbox.midtrans.com/snap/v1/transactions \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -u "YOUR_SERVER_KEY:" \
  -d '{
    "transaction_details": {
      "order_id": "TEST-'$(date +%s)'",
      "gross_amount": 10000
    }
  }'
```

Jika ini berhasil tapi API endpoint error, berarti masalah di aplikasi.
Jika ini gagal dengan 401, berarti Server Key salah.

## 📞 Bantuan Lebih Lanjut

1. **Cek dokumentasi lengkap:** `MIDTRANS-401-FIX.md`
2. **Test Server Key:** `node server/test-midtrans-key.js`
3. **Midtrans Docs:** https://docs.midtrans.com/
4. **Midtrans Support:** support@midtrans.com

## 🎓 Common Mistakes

❌ **SALAH:**
```bash
# Key terpotong
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx

# Ada spasi
MIDTRANS_SERVER_KEY= SB-Mid-server-xxx

# Pakai Client Key (bukan Server Key)
MIDTRANS_SERVER_KEY=SB-Mid-client-xxx

# Production key tapi IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=Mid-server-xxx
MIDTRANS_IS_PRODUCTION=false
```

✅ **BENAR:**
```bash
# Lengkap, tidak ada spasi, format benar
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=false
```

