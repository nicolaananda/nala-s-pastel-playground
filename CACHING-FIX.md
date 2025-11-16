# Panduan Perbaikan Caching untuk artstudionala.com

## 🔍 Masalah yang Ditemukan

Lighthouse audit menunjukkan bahwa semua static assets (JS, CSS, gambar) tidak memiliki cache headers, sehingga browser tidak menyimpan cache dan harus mengunduh ulang setiap kali. Ini menyebabkan:
- ⚠️ Est savings of 682 KiB (potensi penghematan bandwidth)
- ⚠️ Memperlambat kunjungan berulang
- ⚠️ Meningkatkan server load

## ✅ Solusi

### 1. Jika Menggunakan Nginx (Recommended)

#### A. Untuk Docker Deployment
File `nginx.conf` sudah diperbaiki dengan cache headers yang lengkap. Jika menggunakan Docker, konfigurasi sudah otomatis terpakai.

#### B. Untuk Production Server (VPS)
1. Copy file `nginx-production.conf` ke server:
   ```bash
   sudo cp nginx-production.conf /etc/nginx/sites-available/artstudionala.com
   ```

2. Edit file tersebut dan sesuaikan:
   - Path SSL certificate (jika menggunakan Let's Encrypt)
   - Server name jika berbeda

3. Buat symlink:
   ```bash
   sudo ln -s /etc/nginx/sites-available/artstudionala.com /etc/nginx/sites-enabled/
   ```

4. Test konfigurasi:
   ```bash
   sudo nginx -t
   ```

5. Reload nginx:
   ```bash
   sudo systemctl reload nginx
   ```

### 2. Jika Menggunakan Apache

1. Copy file `.htaccess` ke direktori web root:
   ```bash
   cp .htaccess /var/www/artstudionala.com/
   ```

2. Pastikan modul Apache sudah aktif:
   ```bash
   sudo a2enmod rewrite
   sudo a2enmod headers
   sudo a2enmod expires
   sudo systemctl restart apache2
   ```

### 3. Konfigurasi Cloudflare (PENTING!)

Jika menggunakan Cloudflare, pastikan:

1. **Cache Level**: Set ke "Standard" atau "Cache Everything" untuk static assets
2. **Browser Cache TTL**: Set ke "Respect Existing Headers" (jangan override)
3. **Edge Cache TTL**: Set sesuai kebutuhan (1 month untuk static assets)

#### Cara Setup di Cloudflare Dashboard:

1. Login ke Cloudflare Dashboard
2. Pilih domain `artstudionala.com`
3. Buka **Rules** → **Page Rules**
4. Buat rules berikut (prioritas tinggi ke rendah):

   **Rule 1: Cache static assets dengan hash**
   - URL Pattern: `artstudionala.com/assets/*-*.js`
   - Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: Respect Existing Headers

   **Rule 2: Cache CSS dengan hash**
   - URL Pattern: `artstudionala.com/assets/*-*.css`
   - Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: Respect Existing Headers

   **Rule 3: Cache images**
   - URL Pattern: `artstudionala.com/assets/*.{jpg,png,webp,svg}`
   - Settings:
     - Cache Level: Cache Everything
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: Respect Existing Headers

   **Rule 4: NO CACHE untuk index.html**
   - URL Pattern: `artstudionala.com/index.html`
   - Settings:
     - Cache Level: Bypass
     - Browser Cache TTL: Respect Existing Headers

5. Atau gunakan **Cache Rules** (lebih modern):
   - Buka **Rules** → **Cache Rules**
   - Buat rule dengan kondisi:
     - If: URI Path contains `/assets/` AND URI Extension is one of `js, css, jpg, png, webp, svg`
     - Then: Cache status = Cache Everything, Edge TTL = 1 month

### 4. Verifikasi

Setelah konfigurasi, verifikasi dengan:

1. **Browser DevTools**:
   - Buka website di browser
   - Buka DevTools (F12) → Network tab
   - Reload halaman
   - Cek header `Cache-Control` pada static assets
   - Harus terlihat: `Cache-Control: public, immutable, max-age=31536000`

2. **Lighthouse Audit**:
   - Jalankan Lighthouse audit lagi
   - Issue "Use efficient cache lifetimes" seharusnya sudah hilang
   - Est savings seharusnya menjadi 0 KiB

3. **Online Tools**:
   - https://www.webpagetest.org/
   - https://tools.pingdom.com/
   - Cek header response untuk static assets

### 5. Testing Cache Headers

Test dengan curl:
```bash
# Test JS file
curl -I https://artstudionala.com/assets/index-XXXXX.js

# Test CSS file
curl -I https://artstudionala.com/assets/index-XXXXX.css

# Test image
curl -I https://artstudionala.com/assets/nala-logo-XXXXX.png

# Test index.html (harus no-cache)
curl -I https://artstudionala.com/index.html
```

Header yang diharapkan:
- Static assets: `Cache-Control: public, immutable, max-age=31536000`
- index.html: `Cache-Control: no-cache, no-store, must-revalidate`

## 📊 Expected Results

Setelah perbaikan:
- ✅ Static assets di-cache selama 1 tahun (31536000 detik)
- ✅ File dengan hash (immutable) di-cache selamanya
- ✅ index.html tidak di-cache (selalu ambil versi terbaru)
- ✅ Est savings: 0 KiB (sudah optimal)
- ✅ Lighthouse score meningkat
- ✅ Page load time lebih cepat untuk kunjungan berulang

## 🔄 Update Deploy Script

Jika perlu, update `deploy.sh` untuk memastikan konfigurasi terpakai:

```bash
# Tambahkan di akhir deploy.sh
echo "🔄 Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx
```

## 📝 Catatan Penting

1. **File dengan hash** (seperti `index-abc123.js`) aman untuk di-cache selamanya karena nama file berubah setiap build
2. **index.html** tidak boleh di-cache karena berisi referensi ke file assets terbaru
3. **Cloudflare** harus diatur untuk menghormati cache headers dari server (jangan override)
4. Setelah perubahan, **clear cache Cloudflare** jika perlu: Dashboard → Caching → Purge Everything

## 🆘 Troubleshooting

### Cache headers tidak muncul
- Pastikan konfigurasi nginx/apache sudah benar
- Pastikan modul headers sudah aktif
- Cek apakah Cloudflare override cache headers

### Masih muncul warning di Lighthouse
- Tunggu beberapa menit untuk cache headers terpropagasi
- Clear browser cache dan test lagi
- Pastikan Cloudflare tidak override headers

### index.html ter-cache
- Pastikan rule untuk index.html menggunakan "Bypass" di Cloudflare
- Pastikan header no-cache sudah ter-set di server

