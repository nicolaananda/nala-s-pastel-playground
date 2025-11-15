# Cloudflare CDN Configuration

## Setup Cloudflare untuk Nala Art Studio

### 1. Daftar/Login ke Cloudflare
- Kunjungi https://dash.cloudflare.com
- Tambahkan domain Anda (artstudionala.com)

### 2. DNS Configuration
- Set A record untuk domain ke IP VPS Anda
- Set CNAME untuk www ke domain utama

### 3. SSL/TLS Settings
- Set SSL/TLS encryption mode ke "Full" atau "Full (strict)"
- Enable "Always Use HTTPS"
- Enable "Automatic HTTPS Rewrites"

### 4. Speed Optimization
- Enable "Auto Minify" untuk HTML, CSS, JS
- Enable "Brotli" compression
- Enable "Rocket Loader" (optional)
- Enable "Mirage" untuk image optimization (optional)

### 5. Caching Rules
Buat Page Rules:
- `artstudionala.com/*.jpg` - Cache Level: Cache Everything, Edge Cache TTL: 1 month
- `artstudionala.com/*.png` - Cache Level: Cache Everything, Edge Cache TTL: 1 month
- `artstudionala.com/*.webp` - Cache Level: Cache Everything, Edge Cache TTL: 1 month
- `artstudionala.com/*.css` - Cache Level: Cache Everything, Edge Cache TTL: 1 month
- `artstudionala.com/*.js` - Cache Level: Cache Everything, Edge Cache TTL: 1 month

### 6. Workers (Optional - untuk advanced optimization)
Bisa digunakan untuk:
- Image optimization on-the-fly
- A/B testing
- Custom headers
- Request routing

### 7. Argo Smart Routing (Optional - paid)
- Untuk global traffic optimization
- Reduce latency worldwide

## Benefits
- ✅ Global CDN distribution
- ✅ DDoS protection
- ✅ SSL/TLS encryption
- ✅ Image optimization
- ✅ Automatic compression
- ✅ Better caching
- ✅ Reduced server load

