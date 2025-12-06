# Test Webhook dan Database Insert

## Status Saat Ini

✅ **Database sudah berfungsi dengan baik!**
- Tabel `grasp_guide_access` sudah ada
- Insert langsung ke database berhasil
- Total records: 3 (termasuk test data)

## Cara Test

### 1. Test Insert Langsung ke Database

```bash
npm run test:insert
```

Ini akan:
- Generate kode baru
- Insert langsung ke database
- Verify bahwa data tersimpan

### 2. Test Webhook (Perlu Server Running)

**Terminal 1 - Start Server:**
```bash
npm run dev:server
```

**Terminal 2 - Test Webhook:**
```bash
npm run test:webhook
```

Atau manual dengan curl:
```bash
curl -X POST http://localhost:3001/api/midtrans/notification \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "ORDER-TEST-123",
    "transaction_id": "TRANS-TEST-123",
    "customer_details": {
      "email": "test@example.com",
      "first_name": "Test",
      "last_name": "User"
    }
  }'
```

Kemudian cek kode:
```bash
curl http://localhost:3001/api/transaction/ORDER-TEST-123/code
```

### 3. Cek di Database

**Via pgAdmin:**
```sql
SELECT * FROM grasp_guide_access ORDER BY created_at DESC;
```

**Via API:**
```bash
curl http://localhost:3001/api/admin/transactions
```

## Flow Real (Saat Pembayaran)

1. **Customer bayar via Midtrans**
2. **Midtrans kirim webhook** ke: `https://your-domain.com/api/midtrans/notification`
3. **Server terima webhook** → `handleSuccessTransaction()` dipanggil
4. **Generate kode** → `GG-XXXXXX`
5. **Simpan ke database** → `db.saveAccessCode()`
6. **Frontend poll** → `/api/transaction/:orderId/code`
7. **Kode muncul** di frontend

## Troubleshooting

### Kode tidak muncul setelah pembayaran

1. **Cek webhook diterima:**
   - Lihat server logs
   - Cek apakah `handleSuccessTransaction` dipanggil

2. **Cek database:**
   ```sql
   SELECT * FROM grasp_guide_access WHERE order_id = 'ORDER-XXX';
   ```

3. **Cek webhook URL di Midtrans:**
   - Login ke https://dashboard.midtrans.com/
   - Settings → Configuration → Payment Notification URL
   - Pastikan URL benar: `https://your-domain.com/api/midtrans/notification`

4. **Generate manual jika perlu:**
   ```bash
   curl -X POST http://localhost:3001/api/transaction/ORDER-XXX/generate-code \
     -H "Content-Type: application/json" \
     -d '{
       "transactionId": "TRANS-XXX",
       "customer": {
         "email": "customer@example.com"
       }
     }'
   ```

## Test Results

✅ Direct database insert: **BERHASIL**
- Code: GG-ACD8L9
- Order ID: ORDER-TEST-1765041571127
- Data tersimpan dengan benar

✅ Database verification: **BERHASIL**
- Tabel ada
- 3 records total
- Semua kolom terisi dengan benar

## Next Steps

1. **Deploy server ke production**
2. **Set webhook URL di Midtrans dashboard**
3. **Test dengan pembayaran real**
4. **Monitor server logs untuk webhook**

