# ✅ Complete Fix Checklist - Midtrans 401 Error

## 🎯 Root Cause

Error 401 terjadi karena:
- ❌ Backend pakai **Production Key** + **Sandbox URL** (mismatch!)
- ❌ Service belum restart setelah update `.env`

---

## 📋 Step-by-Step Fix

### **STEP 1: Restart Backend** ⚡ (PALING PENTING!)

Error 401 = backend issue, jadi restart backend dulu:

```bash
# Di terminal SSH (sudah di server kan?)
pm2 restart api-nala

# Atau restart all
pm2 restart all

# Check logs - should see production URL now
pm2 logs api-nala --lines 30 -f
```

**Expected logs setelah restart:**
```
✅ url: 'https://app.midtrans.com/...'  (Production URL!)
✅ NOT app.sandbox.midtrans.com
```

**Test immediately:**
```bash
# Test dari server
curl -X POST http://localhost:8723/api/midtrans/create-payment-link \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_details": {"order_id": "TEST-'$(date +%s)'", "gross_amount": 10000},
    "customer_details": {"first_name": "Test", "email": "test@example.com", "phone": "08123"}
  }'

# Expected: {"success":true,"payment_url":"https://app.midtrans.com/...","token":"..."}
# NO error 401!
```

---

### **STEP 2: Rebuild & Deploy Frontend** 🎨

Frontend build manual perlu di-update:

#### Option A: Automated Script

```bash
# Di local laptop
cd /Users/nicolaanandadwiervantoro/SE/nalav2

# Edit server config di script
nano MANUAL-DEPLOY-FRONTEND.sh
# Update SERVER_USER, SERVER_HOST, SERVER_PATH

# Make executable
chmod +x MANUAL-DEPLOY-FRONTEND.sh

# Run
./MANUAL-DEPLOY-FRONTEND.sh
```

#### Option B: Manual Commands

```bash
# 1. Build
cd /Users/nicolaanandadwiervantoro/SE/nalav2
npm run build

# 2. Upload dist/ ke server
scp -r dist/* user@your-server:/var/www/artstudionala.com/

# Atau pakai rsync (better):
rsync -avz --delete dist/ user@your-server:/var/www/artstudionala.com/
```

#### Option C: Git + Build on Server

```bash
# Local: Push code
git add .
git commit -m "Fix Midtrans configuration"
git push origin main

# Server: Pull & build
ssh user@your-server
cd /path/to/frontend
git pull origin main
npm install
npm run build
# Copy dist to web root if needed
cp -r dist/* /var/www/artstudionala.com/
```

---

### **STEP 3: Verify Everything Works** 🧪

#### Test 1: Backend Health
```bash
curl https://api.artstudionala.com/api/health
# Expected: {"status":"ok","message":"API is running"}
```

#### Test 2: Midtrans Config
```bash
curl https://api.artstudionala.com/api/midtrans/debug
# Expected: {"configured":{"serverKey":true},"serverKeyFormat":"production","warning":null}
```

#### Test 3: Payment Creation
```bash
curl -X POST https://api.artstudionala.com/api/midtrans/create-payment-link \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_details": {"order_id": "TEST-'$(date +%s)'", "gross_amount": 10000},
    "customer_details": {"first_name": "Test", "email": "test@example.com", "phone": "08123"}
  }'

# Expected: {"success":true,"payment_url":"https://app.midtrans.com/..."}
# NO error 401 or 500!
```

#### Test 4: Frontend
1. **Clear browser cache**: `Cmd+Shift+R` (Mac) atau `Ctrl+F5` (Windows)
2. Open: https://artstudionala.com
3. Try: Beli Grasp Guide atau daftar Class
4. Result: Should redirect to Midtrans payment page
5. Status: **NO ERROR!** ✅

---

## 🔍 Troubleshooting

### Issue 1: Backend Restart Tapi Masih Error

**Check environment variable:**
```bash
# Check if PM2 loaded new .env
pm2 env api-nala | grep MIDTRANS_IS_PRODUCTION

# If not showing true, try delete and restart:
pm2 delete api-nala
pm2 start /root/Work/nala-s-pastel-playground/server/index.js --name api-nala
```

### Issue 2: Frontend Deploy Tapi Masih Error

**Check browser cache:**
```bash
# Hard refresh: Cmd+Shift+R or Ctrl+F5
# Or clear cache completely
# Or try incognito/private mode
```

**Check correct files deployed:**
```bash
# SSH to server
cd /var/www/artstudionala.com
ls -la index.html
cat index.html | grep "midtrans"  # should see new JS bundle
```

### Issue 3: Masih 401 Setelah Semua

**Verify .env di server:**
```bash
ssh user@server
cd /root/Work/nala-s-pastel-playground
cat .env | grep MIDTRANS

# Should show:
# MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxxxxxxxx
# MIDTRANS_IS_PRODUCTION=true
```

**Check logs in real-time:**
```bash
pm2 logs api-nala -f
# Then try payment from frontend
# Watch logs for error details
```

---

## 📊 Success Indicators

✅ **Backend:**
- [ ] Service restarted successfully
- [ ] Logs show `app.midtrans.com` (NOT sandbox)
- [ ] Debug endpoint shows `serverKey: true`
- [ ] Test curl returns payment URL (no 401)

✅ **Frontend:**
- [ ] Build completed without errors
- [ ] Files uploaded to server
- [ ] Browser cache cleared
- [ ] Payment form works
- [ ] Redirects to Midtrans
- [ ] No error 401/500 in console

---

## ⚡ Quick Fix Summary

```bash
# BACKEND (MOST IMPORTANT!)
pm2 restart api-nala

# FRONTEND
npm run build
rsync -avz dist/ user@server:/var/www/path/

# TEST
curl https://api.artstudionala.com/api/health
# Open browser, try payment
```

---

## 🎯 Priority Order

1. **RESTART BACKEND** ← Do this FIRST! (fixes 401 error)
2. Clear browser cache ← Quick test
3. Rebuild & deploy frontend ← Better UX with improved errors

**Error 401 adalah backend issue, jadi backend restart adalah yang PALING PENTING!**

---

## 💡 Why This Happens

**Before Fix:**
```
Backend:
├─ MIDTRANS_SERVER_KEY = Mid-server-xxx (Production)
├─ MIDTRANS_IS_PRODUCTION = false (Sandbox)
└─ Result: Use Production key with Sandbox URL
   → MISMATCH! → Error 401 ❌
```

**After Fix:**
```
Backend:
├─ MIDTRANS_SERVER_KEY = Mid-server-xxx (Production)
├─ MIDTRANS_IS_PRODUCTION = true (Production)
└─ Result: Use Production key with Production URL
   → MATCH! → Success ✅
```

---

## 📞 Need Help?

If still having issues:

1. **Show me logs:**
   ```bash
   pm2 logs api-nala --lines 50 > logs.txt
   ```

2. **Check environment:**
   ```bash
   pm2 env api-nala | grep MIDTRANS > env.txt
   ```

3. **Test curl:**
   ```bash
   curl https://api.artstudionala.com/api/midtrans/debug
   ```

Share hasil dari commands di atas!

---

**IMPORTANT:** Backend restart adalah yang TERPENTING! Frontend rebuild hanya improve error messages, tapi tidak fix error 401.

