# Cara Update Nginx Config untuk Menambahkan Cache Headers

## 📋 Situasi
Anda sudah punya config nginx dengan SSL dari Certbot. Sekarang perlu menambahkan cache headers tanpa merusak setup SSL yang ada.

## 🎯 Solusi: Tambahkan Location Blocks untuk Cache

### Langkah 1: Backup Config yang Ada
```bash
sudo cp /etc/nginx/sites-available/artstudionala.com /etc/nginx/sites-available/artstudionala.com.backup
```

### Langkah 2: Edit Config
```bash
sudo nano /etc/nginx/sites-available/artstudionala.com
```

### Langkah 3: Tambahkan Cache Headers

Di dalam **server block HTTPS (port 443)**, setelah `location / { ... }`, tambahkan block berikut:

```nginx
    # Cache static assets dengan hash (immutable) - PRIORITAS TINGGI
    location ~* ^/assets/.+-[a-f0-9]+\.(js|css|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)$ {
        expires max;
        add_header Cache-Control "public, immutable, max-age=31536000" always;
        add_header Vary "Accept-Encoding" always;
        access_log off;
    }
    
    # Cache static assets lainnya (fallback)
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000" always;
        add_header Vary "Accept-Encoding" always;
        access_log off;
    }
    
    # NO CACHE untuk index.html (selalu ambil versi terbaru)
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }
    
    # Cache HTML lainnya dengan shorter duration
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate, max-age=3600" always;
    }

    # Cache fonts
    location ~* \.(woff|woff2|ttf|eot|otf)$ {
        expires 1y;
        add_header Cache-Control "public, immutable, max-age=31536000" always;
        add_header Access-Control-Allow-Origin "*" always;
        access_log off;
    }

    # Cache images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000" always;
        access_log off;
    }
```

### Langkah 4: Struktur Config yang Benar

Config Anda seharusnya terlihat seperti ini:

```nginx
server {
    listen 443 ssl;
    server_name artstudionala.com www.artstudionala.com;
    
    root /var/www/artstudionala.com;
    index index.html;

    # SSL Configuration (managed by Certbot - JANGAN DIUBAH)
    ssl_certificate /etc/letsencrypt/live/artstudionala.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/artstudionala.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot

    # Gzip compression (tambahkan jika belum ada)
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json image/svg+xml;
    gzip_disable "msie6";

    # Security headers (tambahkan jika belum ada)
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ===== TAMBAHKAN CACHE HEADERS DI SINI =====
    # (paste semua location blocks untuk cache di sini)
    # ============================================

}

# Server block untuk redirect HTTP ke HTTPS (biarkan seperti ini)
server {
    if ($host = www.artstudionala.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name artstudionala.com www.artstudionala.com;
    return 404; # managed by Certbot
}
```

### Langkah 5: Test dan Reload

```bash
# Test config
sudo nginx -t

# Jika test berhasil, reload nginx
sudo systemctl reload nginx
```

### Langkah 6: Verifikasi

```bash
# Test cache headers
curl -I https://artstudionala.com/assets/index-XXXXX.js
```

Harus muncul:
```
Cache-Control: public, immutable, max-age=31536000
```

## ⚠️ PENTING

1. **JANGAN mengubah bagian yang ditandai `# managed by Certbot`** - ini akan di-overwrite saat renew certificate
2. **JANGAN mengubah server block untuk redirect HTTP** - biarkan seperti yang dibuat Certbot
3. **Hanya tambahkan location blocks** di dalam server block HTTPS (443)
4. **Pastikan gzip sudah aktif** untuk kompresi yang lebih baik

## 🔄 Jika Certbot Update Config

Jika Certbot update config (saat renew certificate), cache headers yang Anda tambahkan mungkin hilang. Solusinya:

1. Backup location blocks cache yang sudah dibuat
2. Setelah Certbot update, tambahkan lagi location blocks tersebut
3. Atau gunakan script untuk auto-append cache headers setelah Certbot update

## 📝 Quick Copy-Paste

Jika ingin cepat, copy semua location blocks dari file `nginx-production-with-ssl.conf` dan paste ke dalam server block HTTPS (443) Anda.

