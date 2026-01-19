#!/bin/bash

# ========================================
# Update Production Server Environment
# ========================================
# Script untuk update .env di production server
# ========================================

cat << 'EOF'

╔═══════════════════════════════════════════════════════════╗
║     🚀 UPDATE PRODUCTION SERVER ENVIRONMENT 🚀           ║
╚═══════════════════════════════════════════════════════════╝

📋 YANG HARUS DILAKUKAN:

1️⃣  SSH ke Production Server
   └─> Server dimana api.artstudionala.com running

2️⃣  Find Server Location
   └─> Cari dimana server berjalan (lihat PM2 list)

3️⃣  Update .env File
   └─> Set Midtrans keys yang SAMA dengan local

4️⃣  Restart Service
   └─> Restart agar environment variable terbaca

════════════════════════════════════════════════════════════

🔑 MIDTRANS KEYS (dari local .env yang sudah tested):

MIDTRANS_MERCHANT_ID=YOUR_MERCHANT_ID
MIDTRANS_SERVER_KEY=YOUR_SERVER_KEY
MIDTRANS_CLIENT_KEY=YOUR_CLIENT_KEY
MIDTRANS_IS_PRODUCTION=true

⚠️  PENTING: Keys ini sudah DI-TEST dan VALID! ✅

════════════════════════════════════════════════════════════

📝 STEP-BY-STEP COMMANDS:

1. SSH ke production server:
   
   ssh user@your-production-server
   # Ganti 'user' dan 'your-production-server' dengan yang benar


2. Check dimana server running:
   
   pm2 list
   # Cari process untuk api.artstudionala.com
   # Lihat kolom 'cwd' untuk tau path server


3. Backup .env yang ada (opsional):
   
   cd /path/to/your/server  # sesuaikan dengan hasil pm2 list
   cp .env .env.backup.$(date +%Y%m%d)


4. Edit .env:
   
   nano .env
   
   # Update atau tambahkan:
   MIDTRANS_MERCHANT_ID=YOUR_MERCHANT_ID
   MIDTRANS_SERVER_KEY=YOUR_SERVER_KEY
   MIDTRANS_CLIENT_KEY=YOUR_CLIENT_KEY
   MIDTRANS_IS_PRODUCTION=true
   
   # Save: Ctrl+O, Enter, Ctrl+X


5. Verify .env updated:
   
   cat .env | grep MIDTRANS_SERVER_KEY
   # Should show: MIDTRANS_SERVER_KEY=YOUR_SERVER_KEY


6. Restart service:
   
   pm2 restart all
   # atau
   pm2 restart api-nala  # ganti dengan nama process yang benar


7. Check logs:
   
   pm2 logs api-nala --lines 30
   # Look for "API Server running" without errors


8. Test debug endpoint:
   
   curl http://localhost:PORT/api/midtrans/debug
   # Should show serverKey: true, warning: null

════════════════════════════════════════════════════════════

🧪 TEST SETELAH UPDATE:

1. Test dari server:
   
   curl -X POST http://localhost:PORT/api/midtrans/create-payment-link \
     -H "Content-Type: application/json" \
     -d '{
       "transaction_details": {
         "order_id": "TEST-'$(date +%s)'",
         "gross_amount": 10000
       },
       "customer_details": {
         "first_name": "Test",
         "email": "test@example.com",
         "phone": "08123456789"
       }
     }'
   
   # Expected: {"success":true,"payment_url":"https://...","token":"..."}
   # NO error 401!


2. Test dari frontend:
   
   - Buka https://artstudionala.com
   - Coba beli Grasp Guide atau daftar Class
   - Klik "Bayar" / "Daftar"
   - Should redirect ke Midtrans payment page
   - NO error 401!

════════════════════════════════════════════════════════════

❓ TROUBLESHOOTING:

Jika setelah update masih error 401:

1. Check .env benar-benar ter-update:
   cat .env | grep MIDTRANS_SERVER_KEY

2. Check service sudah restart:
   pm2 list  # cek 'restart' column

3. Check logs untuk error:
   pm2 logs api-nala --lines 50 | grep -i midtrans

4. Test dengan script di server:
   # Upload test-midtrans-direct.cjs ke server
   node test-midtrans-direct.cjs

5. Check environment variable terbaca:
   pm2 env api-nala | grep MIDTRANS

════════════════════════════════════════════════════════════

✅ SUCCESS INDICATORS:

- [ ] .env di production ter-update dengan keys yang benar
- [ ] Service sudah di-restart
- [ ] Debug endpoint shows serverKey: true
- [ ] Test curl tidak error 401
- [ ] Frontend bisa create payment tanpa error
- [ ] Logs tidak ada error "Midtrans API Error: 401"

════════════════════════════════════════════════════════════

🎯 SUMMARY:

Problem: Production server .env tidak punya atau punya key yang salah
Solution: Update production .env dengan keys yang sudah tested di local
Time:    5-10 menit

Keys yang sudah TESTED dan VALID: ✅
  MIDTRANS_SERVER_KEY=YOUR_SERVER_KEY
  
Jangan lupa RESTART service setelah update .env!

════════════════════════════════════════════════════════════

📞 Need Help?

Jika tidak tau production server atau cara SSH:
1. Check hosting control panel
2. Check Vercel/Netlify/Railway environment variables
3. Check deploy.sh atau deployment script

════════════════════════════════════════════════════════════

EOF

