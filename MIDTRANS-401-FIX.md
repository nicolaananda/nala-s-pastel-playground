# Fix Midtrans 401 Unauthorized Error

## 🔍 Masalah
```
Midtrans error: MidtransError: Midtrans API is returning API error. 
HTTP status code: 401. 
API response: {
  "error_messages": [
    "Access denied due to unauthorized transaction, please check client or server key"
  ]
}
```

## 📋 Penyebab
Error 401 ini terjadi karena **Server Key yang digunakan salah, tidak lengkap, atau tidak valid**.

Dari log, Base64 decode Authorization header menunjukkan:
```
Mid-server-xxxxxxxxxxxxxxxxxxxx:
```

Key ini terlihat **tidak lengkap** atau **salah format**.

## ✅ Solusi

### 1. Cek Midtrans Dashboard
Buka Midtrans Dashboard dan ambil Server Key yang benar:

**Untuk Sandbox (Testing):**
- Login ke: https://dashboard.sandbox.midtrans.com/
- Menu: **Settings** → **Access Keys**
- Copy **Server Key** yang lengkap (format: `SB-Mid-server-xxxxxxxxxxxxx`)

**Untuk Production:**
- Login ke: https://dashboard.midtrans.com/
- Menu: **Settings** → **Access Keys**  
- Copy **Server Key** yang lengkap (format: `Mid-server-xxxxxxxxxxxxx`)

### 2. Update Environment Variable di Server

**Di server `logs.nicola.id` atau server production:**

```bash
# SSH ke server
ssh user@logs.nicola.id

# Edit file .env (sesuaikan path-nya)
nano /root/Work/nala-s-pastel-playground/.env
# atau
nano /path/to/your/project/.env
```

**Pastikan isi .env seperti ini:**

```env
# Midtrans Configuration
MIDTRANS_SERVER_KEY=SB-Mid-server-XXXXXXXXXXXXXXXXXXXXXXX
MIDTRANS_CLIENT_KEY=SB-Mid-client-XXXXXXXXXXXXXXX
MIDTRANS_IS_PRODUCTION=false

# Untuk Production, gunakan:
# MIDTRANS_SERVER_KEY=Mid-server-XXXXXXXXXXXXXXXXXXXXXXX
# MIDTRANS_CLIENT_KEY=Mid-client-XXXXXXXXXXXXXXX
# MIDTRANS_IS_PRODUCTION=true
```

**⚠️ PENTING:**
- Server Key harus LENGKAP dan VALID
- Jangan ada spasi di awal/akhir
- Untuk sandbox, harus dimulai dengan `SB-Mid-server-`
- Untuk production, dimulai dengan `Mid-server-`

### 3. Restart Service

```bash
# Jika menggunakan PM2
pm2 restart api-nala

# Jika menggunakan systemd
sudo systemctl restart api-nala

# Jika menggunakan Docker
docker-compose restart api-nala

# Atau restart manual
pkill -f "node.*server/index.js"
node server/index.js
```

### 4. Verifikasi

**Test dengan curl:**

```bash
# Test API health
curl http://localhost:8723/api/health

# Test payment endpoint (jika ada test endpoint)
curl -X POST http://localhost:8723/api/test-midtrans \
  -H "Content-Type: application/json"
```

**Atau lihat logs:**

```bash
# PM2 logs
pm2 logs api-nala

# Systemd logs  
journalctl -u api-nala -f

# Docker logs
docker-compose logs -f api-nala
```

## 🔧 Debugging Tambahan

### Cek apakah .env terbaca

Tambahkan log sementara di `server/index.js`:

```javascript
// Tambahkan setelah line require('dotenv').config();
console.log('🔑 MIDTRANS_SERVER_KEY loaded:', 
  process.env.MIDTRANS_SERVER_KEY ? 
  `${process.env.MIDTRANS_SERVER_KEY.substring(0, 20)}...` : 
  'NOT SET');
```

### Test Server Key secara manual

```bash
# Test dengan curl langsung ke Midtrans
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

Ganti `YOUR_SERVER_KEY` dengan Server Key yang kamu ambil dari dashboard.

**Expected Response (jika key valid):**
```json
{
  "token": "xxxxx",
  "redirect_url": "https://app.sandbox.midtrans.com/snap/v3/..."
}
```

**Error Response (jika key invalid):**
```json
{
  "error_messages": [
    "Access denied due to unauthorized transaction..."
  ]
}
```

## 📝 Checklist

- [ ] Ambil Server Key yang benar dari Midtrans Dashboard
- [ ] Pastikan menggunakan Sandbox key untuk testing
- [ ] Update file .env di server dengan key yang benar
- [ ] Tidak ada spasi atau karakter tambahan di .env
- [ ] Restart service setelah update .env
- [ ] Test dengan curl untuk verifikasi
- [ ] Cek logs untuk memastikan tidak ada error lagi

## 🆘 Jika Masih Error

1. **Cek environment yang digunakan:**
   - Pastikan MIDTRANS_IS_PRODUCTION sesuai dengan key yang digunakan
   - Sandbox key harus pakai `MIDTRANS_IS_PRODUCTION=false`
   - Production key harus pakai `MIDTRANS_IS_PRODUCTION=true`

2. **Cek apakah key sudah activated:**
   - Di Midtrans Dashboard, pastikan key statusnya "Active"
   - Kadang key baru perlu diaktifkan dulu

3. **Regenerate key jika perlu:**
   - Di Midtrans Dashboard → Settings → Access Keys
   - Klik "Regenerate" untuk generate key baru
   - Update .env dengan key baru

4. **Cek IP Whitelist (jika ada):**
   - Beberapa merchant Midtrans mengaktifkan IP whitelist
   - Pastikan IP server kamu sudah di-whitelist di dashboard Midtrans

## 📞 Kontak

Jika masih bermasalah, hubungi:
- Midtrans Support: support@midtrans.com
- Midtrans Docs: https://docs.midtrans.com/
