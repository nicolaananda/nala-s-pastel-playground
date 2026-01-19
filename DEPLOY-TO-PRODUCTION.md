# 🚀 Deploy ke Production dengan Fix Midtrans

## 📋 Overview

Local sudah fix dan tested ✅, sekarang perlu deploy ke production agar error 401/500 hilang.

---

## 🎯 Option 1: Deploy via Git Push (Recommended)

### Step 1: Commit Changes

```bash
cd /Users/nicolaanandadwiervantoro/SE/nalav2

# Check status
git status

# Add all changes
git add .

# Commit with clear message
git commit -m "Fix Midtrans configuration and improve error handling

- Update MIDTRANS_IS_PRODUCTION to true
- Add improved error handling in backend
- Add user-friendly error messages in frontend
- Fix production key configuration
- Add test scripts and documentation"

# Push to main/master
git push origin main
# atau: git push origin master
```

### Step 2: Trigger Production Deploy

**Jika pakai auto-deploy (Vercel/Netlify/etc):**
- Deploy otomatis setelah push
- Check dashboard untuk status deploy

**Jika manual deploy:**
```bash
# SSH ke production server
ssh user@your-production-server

# Pull latest code
cd /path/to/production
git pull origin main

# Install dependencies (jika ada perubahan)
npm install

# Build (jika perlu)
npm run build

# Restart service
pm2 restart all
```

---

## 🎯 Option 2: Update .env di Production (Quick Fix)

Jika tidak mau deploy full code, cukup update `.env`:

### Step 1: SSH ke Production

```bash
ssh user@your-production-server
```

### Step 2: Find Server Location

```bash
# Check PM2 processes
pm2 list

# Look for process running api.artstudionala.com
# Note the 'cwd' column (current working directory)
```

### Step 3: Update .env

```bash
# Go to server directory
cd /path/to/your/server  # dari pm2 list

# Backup existing .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Edit .env
nano .env
```

**Update with these TESTED keys:**

```env
# Midtrans Configuration (TESTED ✅)
MIDTRANS_MERCHANT_ID=G636278165
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=true
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Step 4: Verify Update

```bash
# Check if updated
cat .env | grep MIDTRANS_SERVER_KEY

# Expected output:
# MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxxxxxxxx
```

### Step 5: Restart Service

```bash
# Restart PM2
pm2 restart all

# Check logs
pm2 logs --lines 30

# Should see:
# "🚀 API Server running on..."
# NO "Midtrans error" messages
```

---

## 🎯 Option 3: Deploy via Script

Jika ada deploy script:

```bash
# Check if deploy script exists
ls deploy.sh

# Run deploy script
bash deploy.sh

# Or
npm run deploy
```

---

## 🧪 Verify Deploy Success

### Test 1: Check API Health

```bash
curl https://api.artstudionala.com/api/health

# Expected:
# {"status":"ok","message":"API is running"}
```

### Test 2: Check Midtrans Config

```bash
curl https://api.artstudionala.com/api/midtrans/debug

# Expected:
# {
#   "configured": {
#     "serverKey": true,
#     "clientKey": true
#   },
#   "serverKeyFormat": "production",
#   "warning": null
# }
```

### Test 3: Test Payment Creation

```bash
curl -X POST https://api.artstudionala.com/api/midtrans/create-payment-link \
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

# Expected:
# {
#   "success": true,
#   "payment_url": "https://app.midtrans.com/snap/v4/...",
#   "token": "..."
# }

# NOT 401 or 500 error!
```

### Test 4: Test dari Frontend

1. Clear browser cache (Cmd+Shift+R atau Ctrl+F5)
2. Buka https://artstudionala.com
3. Coba beli Grasp Guide atau daftar Class
4. Klik "Bayar" / "Daftar"
5. Should redirect ke Midtrans payment page
6. **NO ERROR 500!** ✅

---

## 🔍 Troubleshooting

### Issue 1: Deploy Success tapi Error Masih Ada

**Possible Causes:**
- Browser cache (frontend masih pakai code lama)
- CDN cache (jika pakai CDN)
- .env belum ter-update di production

**Solutions:**
```bash
# 1. Hard refresh browser
Cmd+Shift+R (Mac) atau Ctrl+F5 (Windows)

# 2. Check production .env
ssh user@your-server
cat /path/to/server/.env | grep MIDTRANS

# 3. Check environment variables
pm2 env your-process-name | grep MIDTRANS

# 4. Restart service again
pm2 restart all
```

### Issue 2: Git Push Gagal

```bash
# If push rejected, pull first
git pull origin main --rebase
git push origin main

# If conflicts, resolve then:
git add .
git rebase --continue
git push origin main
```

### Issue 3: Production Server Tidak Bisa SSH

**Options:**
1. **Vercel/Netlify Environment Variables:**
   - Login to dashboard
   - Settings → Environment Variables
   - Add/update Midtrans keys
   - Trigger redeploy

2. **cPanel/Hosting:**
   - File Manager → public_html
   - Edit .env file
   - Restart via control panel

3. **Railway/Render:**
   - Dashboard → Environment Variables
   - Update keys
   - Redeploy

---

## ✅ Success Checklist

Deploy berhasil jika:

- [ ] Code ter-push ke Git
- [ ] Production service ter-restart
- [ ] API health endpoint OK
- [ ] Debug endpoint shows serverKey: true
- [ ] Test curl tidak error 401/500
- [ ] Frontend bisa create payment
- [ ] User bisa redirect ke Midtrans
- [ ] Logs tidak ada error Midtrans

---

## 📊 Before vs After

### Before (Error):
```
Frontend → api.artstudionala.com → Midtrans
                ↓ MIDTRANS_SERVER_KEY=??? ❌
                ↓ Error 401 from Midtrans
                ↓ Return 500 to frontend
                ❌ User sees "Server error"
```

### After (Success):
```
Frontend → api.artstudionala.com → Midtrans
                ↓ MIDTRANS_SERVER_KEY=Mid-server-ZVcA... ✅
                ↓ Success 201 from Midtrans
                ↓ Return payment URL to frontend
                ✅ User redirects to payment page
```

---

## 🎯 Quick Commands Summary

```bash
# === DEPLOY VIA GIT ===
git add .
git commit -m "Fix Midtrans configuration"
git push origin main

# === UPDATE .ENV ONLY ===
ssh user@server
cd /path/to/server
nano .env
# Update keys, save, exit
pm2 restart all

# === VERIFY ===
curl https://api.artstudionala.com/api/health
curl https://api.artstudionala.com/api/midtrans/debug

# === TEST ===
# Open browser, try payment, should work!
```

---

## 💡 Tips

1. **Always backup .env** before changes
2. **Test in staging** if available
3. **Monitor logs** after deploy: `pm2 logs -f`
4. **Clear browser cache** after deploy
5. **Test immediately** after deploy to catch issues early

---

## 📞 Still Having Issues?

If error persists after deploy:

1. **Check logs:**
   ```bash
   ssh user@server
   pm2 logs --lines 100 | grep -i midtrans
   ```

2. **Verify environment:**
   ```bash
   pm2 env your-process | grep MIDTRANS
   ```

3. **Test with script on server:**
   ```bash
   # Upload test-midtrans-direct.cjs
   node test-midtrans-direct.cjs
   ```

4. **Check if using correct environment:**
   - Development: http://localhost:3001
   - Production: https://api.artstudionala.com

---

## 🚀 Next Steps

1. **Choose deploy option** (Git push recommended)
2. **Deploy/update production**
3. **Verify with curl tests**
4. **Test from frontend**
5. **Monitor logs for errors**
6. **Celebrate when it works!** 🎉

---

**Keys yang VALID (sudah tested di local):**
```
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxxxxx
MIDTRANS_IS_PRODUCTION=true
```

**GO DEPLOY NOW!** 🚀
