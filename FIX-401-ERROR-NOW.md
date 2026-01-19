# 🚨 FIX ERROR 401 - URGENT

## ❌ Error Yang Terjadi

```
HTTP status code: 401
Error: Access denied due to unauthorized transaction, 
       please check client or server key
```

**Lokasi:** `api.artstudionala.com` (Nala Server)

---

## ✅ SOLUSI CEPAT (5 Menit)

### Step 1: Ambil Server Key yang BENAR

**Login ke Midtrans Dashboard:**
- Sandbox: https://dashboard.sandbox.midtrans.com/
- Production: https://dashboard.midtrans.com/

**Menu:** Settings → Access Keys

**Copy Server Key** (harus LENGKAP, jangan sampai terpotong!)

**Format yang benar:**
```
Sandbox:    SB-Mid-server-XXXXXXXXXXXXXXXXXXXXXXXXX
Production: Mid-server-XXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### Step 2: Update .env di Server Production

```bash
# 1. SSH ke server
ssh user@server-nala  # atau server yang running api.artstudionala.com

# 2. Find dimana server running
# Kemungkinan lokasi:
# - /root/Work/nala-s-pastel-playground
# - /var/www/artstudionala
# - /home/user/nala-api

# Cek PM2 untuk tau path
pm2 list
pm2 env api-nala  # atau nama process kamu

# 3. Edit .env
cd /path/to/your/server  # sesuaikan dengan path yang benar
nano .env

# 4. Update atau tambahkan (ganti dengan key BENAR dari dashboard):
MIDTRANS_SERVER_KEY=SB-Mid-server-PASTE_KEY_LENGKAP_DISINI
MIDTRANS_CLIENT_KEY=SB-Mid-client-PASTE_KEY_LENGKAP_DISINI
MIDTRANS_IS_PRODUCTION=false

# ⚠️ PENTING:
# - Pastikan tidak ada SPASI di awal/akhir
# - Key harus LENGKAP (biasanya 40-50 karakter)
# - Untuk sandbox, pakai SB-Mid-server-
# - Untuk production, pakai Mid-server-

# 5. Save
# Ctrl+O, Enter, Ctrl+X
```

---

### Step 3: Restart Service

```bash
# Restart PM2
pm2 restart api-nala  # atau nama process kamu
pm2 restart all        # atau restart semua

# ATAU jika pakai systemd
sudo systemctl restart api-nala

# ATAU jika pakai Docker
docker-compose restart
```

---

### Step 4: Test dengan Script

```bash
# Jalankan test script yang sudah dibuat
cd /path/to/your/server
node server/test-midtrans-key.js

# Expected output:
# ✅ Format Server Key valid
# ✅ SUCCESS! Server Key VALID dan berfungsi dengan baik
```

---

### Step 5: Test dari Frontend

1. Buka website: https://artstudionala.com
2. Coba beli Grasp Guide atau daftar Class
3. Klik "Bayar" atau "Daftar"
4. Seharusnya redirect ke Midtrans payment page

**Jika berhasil:**
- ✅ Redirect ke payment page
- ✅ Tidak ada error 401

**Jika masih error:**
- ❌ Cek logs server
- ❌ Verify Server Key sekali lagi

---

## 🔍 Debug: Cek Current Configuration

```bash
# 1. Check environment variable
cd /path/to/your/server
cat .env | grep MIDTRANS_SERVER_KEY

# Expected output (first 20 chars only for security):
# MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx...

# 2. Check if server can read .env
pm2 env api-nala | grep MIDTRANS

# 3. Test debug endpoint
curl http://localhost:PORT/api/midtrans/debug

# Expected response:
# {
#   "configured": {
#     "serverKey": true,
#     "clientKey": true
#   },
#   "serverKeyFormat": "sandbox",
#   "warning": null
# }
```

---

## 🚨 Common Mistakes

### ❌ SALAH: Key Terpotong
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
# Too short! Key harus 40-50 karakter
```

### ❌ SALAH: Ada Spasi
```env
MIDTRANS_SERVER_KEY= SB-Mid-server-xxxxxxxxxxxxx
# Ada spasi sebelum SB!
```

### ❌ SALAH: Pakai Client Key (bukan Server Key)
```env
MIDTRANS_SERVER_KEY=SB-Mid-client-xxxxxxxxxxxxx
# Ini Client Key, bukan Server Key!
```

### ❌ SALAH: Environment Tidak Sesuai
```env
# Pakai sandbox key tapi set production
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=true
# Harus false untuk sandbox!
```

### ✅ BENAR: Complete dan Valid
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-XXXXXXXXXXXXXXXXXXXXXXXXX
MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXXXXXXXXXX
MIDTRANS_IS_PRODUCTION=false
# No spaces, complete key, correct environment
```

---

## 📊 Verification Checklist

Setelah update, verify dengan checklist ini:

- [ ] **Server Key LENGKAP** (40-50 karakter)
- [ ] **Tidak ada SPASI** di awal/akhir
- [ ] **Format BENAR** (SB-Mid-server- atau Mid-server-)
- [ ] **IS_PRODUCTION sesuai** dengan key type
- [ ] **Service sudah di-RESTART**
- [ ] **Test script PASS** (✅ SUCCESS!)
- [ ] **Debug endpoint OK** (serverKey: true, warning: null)
- [ ] **Frontend bisa create payment** (no error 401)

---

## 🔧 Quick Commands Reference

```bash
# SSH
ssh user@server-nala

# Find server location
pm2 list
pm2 env api-nala

# Edit .env
cd /path/to/server
nano .env

# Restart
pm2 restart api-nala

# Test
node server/test-midtrans-key.js

# Check logs
pm2 logs api-nala --lines 50

# Debug endpoint
curl http://localhost:PORT/api/midtrans/debug
```

---

## 📞 Still Having Issues?

### Check Logs

```bash
# Real-time logs
pm2 logs api-nala -f

# Look for:
# ❌ "MIDTRANS_SERVER_KEY is not configured"
# ❌ "Midtrans API Error: ... httpStatusCode: 401"
# ✅ "Payment link created successfully"
```

### Verify Network

```bash
# Test Midtrans API directly
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

# If this fails with 401, your Server Key is definitely wrong
# If this works, problem is in your server config
```

---

## 🎯 Expected Results After Fix

### Backend Logs
```
💳 Creating payment link: { order_id: 'CLASS-...', amount: 5000 }
✅ Payment link created successfully: abc123-token
```

### Frontend
```
✅ Redirect to: https://app.sandbox.midtrans.com/snap/v3/...
✅ User can complete payment
```

### No More Error 401!

---

## 📝 Summary

**Problem:** Midtrans Server Key tidak valid (error 401)

**Solution:**
1. ✅ Get correct Server Key from Midtrans Dashboard
2. ✅ Update .env with complete key (no spaces)
3. ✅ Restart service
4. ✅ Test with script & frontend

**Time:** 5 minutes if you follow steps correctly

---

**GO FIX IT NOW!** 🚀

Check `MIDTRANS-401-FIX.md` untuk detailed explanation.

