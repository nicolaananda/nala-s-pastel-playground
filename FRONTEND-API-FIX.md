# Fix: Error Fetching Access Code

## Masalah

Frontend tidak bisa mengambil kode akses setelah pembayaran berhasil dengan error:
- `Error fetching code: SyntaxError: The string did not match the expected pattern`
- Kode tidak muncul setelah pembayaran

## Penyebab

1. **VITE_API_URL tidak di-set di production**
   - Di development, Vite proxy otomatis forward `/api/*` ke backend
   - Di production, perlu set `VITE_API_URL` environment variable

2. **API endpoint tidak bisa diakses**
   - CORS issue
   - Server API tidak running
   - URL salah

## Solusi

### 1. Set VITE_API_URL untuk Production

**Jika frontend dan backend di server yang sama:**
```bash
# Di production server, set environment variable sebelum build
export VITE_API_URL=""
# Atau kosongkan jika menggunakan relative path
```

**Jika frontend dan backend di server berbeda:**
```bash
# Set ke full URL backend API
export VITE_API_URL="https://api.artstudionala.com"
# Atau
export VITE_API_URL="https://artstudionala.com:3001"
```

**Build dengan environment variable:**
```bash
VITE_API_URL=https://api.artstudionala.com npm run build
```

### 2. Pastikan CORS di Backend

Di `server/index.js`, pastikan CORS sudah dikonfigurasi:

```javascript
app.use(cors({
  origin: ['https://artstudionala.com', 'https://www.artstudionala.com'],
  credentials: true
}));
```

### 3. Pastikan Server API Running

```bash
# Di production server
npm run dev:server
# Atau gunakan PM2 untuk production
pm2 start server/index.js --name nala-api
```

### 4. Test API Endpoint

Test apakah endpoint bisa diakses:
```bash
curl https://api.artstudionala.com/api/health
```

## Debugging

### Check Console Logs

Setelah perbaikan, console akan menampilkan:
- `[Poll 1/10] Fetching code from: ...` - URL yang digunakan
- `[Poll 1] Response status: 200` - Status response
- `[Poll 1] Response data: {...}` - Data yang diterima
- `✅ Code found: GG-XXXXXX` - Kode berhasil ditemukan

### Common Issues

1. **"Failed to fetch"**
   - Server API tidak running
   - CORS issue
   - VITE_API_URL salah

2. **"404 Not Found"**
   - Endpoint salah
   - Order ID tidak ada di database
   - Webhook belum trigger (tunggu beberapa detik)

3. **"SyntaxError: The string did not match the expected pattern"**
   - Response bukan JSON (mungkin HTML error page)
   - Server mengembalikan error format yang tidak valid

## Testing

### Test Manual di Browser Console

```javascript
// Test fetch code
fetch('/api/transaction/ORDER-123/code')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### Test dengan Order ID yang Benar

1. Buat transaksi test
2. Setelah pembayaran, cek di database:
   ```sql
   SELECT * FROM grasp_guide_access WHERE order_id = 'ORDER-123';
   ```
3. Test fetch dengan order ID tersebut

## Perubahan yang Sudah Dilakukan

1. ✅ Perbaiki fetch untuk menggunakan `baseUrl` dengan benar
2. ✅ Tambahkan error handling yang lebih baik
3. ✅ Tambahkan logging untuk debugging
4. ✅ Handle response yang bukan JSON
5. ✅ Handle 404 dengan benar (continue polling)

## Next Steps

1. Set `VITE_API_URL` di production environment
2. Rebuild frontend dengan environment variable yang benar
3. Pastikan CORS di backend sudah dikonfigurasi
4. Test dengan transaksi real

