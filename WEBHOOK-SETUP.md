# Setup Midtrans Webhook

## Masalah: Kode Tidak Ter-generate Otomatis

Jika pembayaran sudah settlement tapi kode tidak ter-generate, kemungkinan:
1. Webhook URL belum dikonfigurasi di Midtrans
2. Webhook URL salah
3. Server tidak bisa diakses dari internet

## Solusi Cepat: Generate Kode Manual

Untuk transaksi yang sudah settlement tapi tidak dapat kode:

```bash
npm run generate:code <order_id> [transaction_id] [email]
```

**Contoh:**
```bash
npm run generate:code CLASS-1765041774621-vfzm8oth7 cdc3d5a9-bd39-4515-a536-3c161fb37ef4 customer@example.com
```

## Setup Webhook di Midtrans

### 1. Login ke Midtrans Dashboard

https://dashboard.midtrans.com/

### 2. Set Payment Notification URL

1. Pilih **Settings** → **Configuration**
2. Scroll ke **Payment Notification URL**
3. Masukkan URL webhook Anda:
   ```
   https://api.artstudionala.com/api/midtrans/notification
   ```
   Atau jika API di server yang sama:
   ```
   https://artstudionala.com/api/midtrans/notification
   ```
4. Klik **Save**

### 3. Test Webhook

Setelah set webhook URL, test dengan:
```bash
npm run test:webhook
```

## Pastikan Server Bisa Diakses

### 1. Server Harus Running

```bash
npm run dev:server
```

Atau di production dengan PM2:
```bash
pm2 start server/index.js --name nala-api
```

### 2. Endpoint Harus Bisa Diakses

Test dengan:
```bash
curl https://api.artstudionala.com/api/health
```

Harus return:
```json
{"status":"ok","message":"API is running"}
```

### 3. Webhook Endpoint Harus Bisa Diakses

Test dengan:
```bash
curl -X POST https://api.artstudionala.com/api/midtrans/notification \
  -H "Content-Type: application/json" \
  -d '{"transaction_status":"settlement","order_id":"TEST-123"}'
```

## Flow Webhook

1. **Customer bayar** → Midtrans proses pembayaran
2. **Pembayaran settlement** → Midtrans kirim webhook ke server
3. **Server terima webhook** → `/api/midtrans/notification`
4. **Generate kode** → `GG-XXXXXX`
5. **Simpan ke database** → PostgreSQL `grasp_guide_access`
6. **Frontend poll** → `/api/transaction/:orderId/code`
7. **Kode muncul** → Customer dapat kode

## Troubleshooting

### Webhook Tidak Terkirim

1. **Cek webhook URL di Midtrans dashboard**
   - Pastikan URL benar
   - Pastikan menggunakan HTTPS (Midtrans require HTTPS)

2. **Cek server logs**
   ```bash
   # Lihat apakah webhook diterima
   tail -f server.log
   ```

3. **Test webhook manual**
   ```bash
   npm run test:webhook
   ```

### Kode Tidak Ter-generate

1. **Cek apakah webhook diterima**
   - Lihat server logs
   - Cek apakah `handleSuccessTransaction` dipanggil

2. **Cek database**
   ```sql
   SELECT * FROM grasp_guide_access WHERE order_id = 'ORDER-XXX';
   ```

3. **Generate manual**
   ```bash
   npm run generate:code ORDER-XXX TRANS-XXX customer@example.com
   ```

### 404 Error di Frontend

1. **Cek apakah kode ada di database**
   ```sql
   SELECT * FROM grasp_guide_access WHERE order_id = 'ORDER-XXX';
   ```

2. **Cek API endpoint**
   ```bash
   curl https://api.artstudionala.com/api/transaction/ORDER-XXX/code
   ```

3. **Pastikan VITE_API_URL sudah di-set**
   - Di production, set environment variable sebelum build
   - Atau pastikan proxy bekerja dengan benar

## Checklist

- [ ] Webhook URL sudah di-set di Midtrans dashboard
- [ ] Server API running dan bisa diakses dari internet
- [ ] Endpoint `/api/midtrans/notification` bisa diakses
- [ ] Database PostgreSQL connected
- [ ] Test webhook berhasil
- [ ] Test generate code manual berhasil

## Catatan Penting

1. **HTTPS Required**: Midtrans hanya mengirim webhook ke HTTPS URL
2. **Webhook Retry**: Midtrans akan retry webhook jika gagal (max 3x)
3. **Idempotency**: Server sudah handle duplicate webhook (cek existing code)
4. **Manual Fix**: Selalu bisa generate kode manual jika webhook gagal



