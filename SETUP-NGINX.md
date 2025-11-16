# Setup Nginx untuk Production (Tanpa Docker)

## 📋 Prerequisites

- Nginx sudah terinstall di server
- File hasil build ada di `/var/www/artstudionala.com/`
- Akses sudo/root ke server

## 🚀 Langkah Setup

### 1. Copy Konfigurasi Nginx

```bash
# Copy file konfigurasi ke server
sudo cp nginx-production.conf /etc/nginx/sites-available/artstudionala.com
```

### 2. Edit Konfigurasi (Sesuaikan dengan Setup Anda)

Buka file konfigurasi:
```bash
sudo nano /etc/nginx/sites-available/artstudionala.com
```

**Pilih salah satu:**

#### A. Jika menggunakan Cloudflare (Recommended)
- Gunakan block `server` port 80 yang sudah aktif
- Pastikan path `root /var/www/artstudionala.com;` sudah benar
- Sesuaikan `server_name` jika berbeda

#### B. Jika menggunakan SSL langsung di server
- Uncomment block HTTPS di bagian bawah file
- Comment atau hapus block port 80 yang pertama
- Update path SSL certificate:
  ```nginx
  ssl_certificate /etc/letsencrypt/live/artstudionala.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/artstudionala.com/privkey.pem;
  ```

### 3. Aktifkan Konfigurasi

```bash
# Buat symlink ke sites-enabled
sudo ln -s /etc/nginx/sites-available/artstudionala.com /etc/nginx/sites-enabled/

# Hapus default config jika ada (optional)
sudo rm /etc/nginx/sites-enabled/default
```

### 4. Test Konfigurasi

```bash
# Test syntax nginx config
sudo nginx -t
```

Jika berhasil, akan muncul:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Reload Nginx

```bash
# Reload nginx untuk apply konfigurasi baru
sudo systemctl reload nginx

# Atau restart jika perlu
sudo systemctl restart nginx
```

### 6. Verifikasi

```bash
# Cek status nginx
sudo systemctl status nginx

# Test dari browser atau curl
curl -I http://artstudionala.com/assets/index-XXXXX.js
```

Header yang diharapkan:
```
Cache-Control: public, immutable, max-age=31536000
```

## 🔧 Troubleshooting

### Error: "nginx: [emerg] bind() to 0.0.0.0:80 failed"
Port 80 sudah digunakan. Cek dengan:
```bash
sudo lsof -i :80
```

### Error: "nginx: [emerg] could not build the server_names_hash"
Terlalu banyak server_name. Tambahkan di `/etc/nginx/nginx.conf`:
```nginx
server_names_hash_bucket_size 128;
```

### Cache headers tidak muncul
1. Pastikan konfigurasi sudah benar
2. Clear browser cache
3. Test dengan curl atau incognito mode
4. Cek apakah Cloudflare override headers

### Permission denied
Pastikan nginx bisa membaca file:
```bash
sudo chown -R www-data:www-data /var/www/artstudionala.com
sudo chmod -R 755 /var/www/artstudionala.com
```

## 📝 Catatan Penting

1. **File dengan hash** (seperti `index-abc123.js`) akan di-cache selama 1 tahun
2. **index.html** tidak akan di-cache (selalu versi terbaru)
3. Setelah deploy, nginx akan otomatis reload (jika menggunakan `deploy.sh`)
4. Jika menggunakan Cloudflare, pastikan cache level di Cloudflare tidak override headers

## 🔄 Update Konfigurasi

Jika perlu update konfigurasi:
```bash
# Edit config
sudo nano /etc/nginx/sites-available/artstudionala.com

# Test
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

## ✅ Checklist

- [ ] File konfigurasi sudah di-copy ke `/etc/nginx/sites-available/`
- [ ] Symlink sudah dibuat di `/etc/nginx/sites-enabled/`
- [ ] Path `root` sudah benar
- [ ] `server_name` sudah sesuai
- [ ] Test nginx config berhasil
- [ ] Nginx sudah reload
- [ ] Cache headers muncul di response
- [ ] Website bisa diakses

