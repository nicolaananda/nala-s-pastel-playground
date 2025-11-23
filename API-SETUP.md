# Setup API Backend

API backend sudah dibuat di folder `server/` dan bisa dijalankan bersamaan dengan frontend.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

Ini akan menginstall semua dependencies termasuk:
- Express (backend server)
- Midtrans Client
- Axios (untuk RajaOngkir API)
- Concurrently (untuk menjalankan frontend & backend bersamaan)

### 2. Setup Environment Variables

Buat file `.env` di folder `server/`:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` dan isi dengan API keys Anda:

```env
# Server Port
PORT=3001

# Midtrans Configuration
# Dapatkan dari: https://dashboard.midtrans.com/
MIDTRANS_SERVER_KEY=your-midtrans-server-key-here
MIDTRANS_CLIENT_KEY=your-midtrans-client-key-here
MIDTRANS_IS_PRODUCTION=false

# RajaOngkir API Key
# Dapatkan dari: https://rajaongkir.com/akun/daftar
# Free tier: 10,000 requests/bulan
RAJAONGKIR_API_KEY=your-rajaongkir-api-key-here
```

### 3. Jalankan Development Server

**Opsi 1: Jalankan Frontend & Backend Bersamaan (Recommended)**
```bash
npm run dev:all
```

Ini akan menjalankan:
- Backend API di `http://localhost:3001`
- Frontend di `http://localhost:8080`

**Opsi 2: Jalankan Terpisah**

Terminal 1 (Backend):
```bash
npm run dev:server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

## 📡 API Endpoints

### 1. Health Check
```
GET /api/health
```

### 2. Create Midtrans Payment Link
```
POST /api/midtrans/create-payment-link
```

**Request Body:**
```json
{
  "transaction_details": {
    "order_id": "BOOK-1234567890-abc123",
    "gross_amount": 189000
  },
  "item_details": [...],
  "customer_details": {...}
}
```

### 3. Calculate Shipping Cost
```
POST /api/shipping/calculate
```

**Request Body:**
```json
{
  "origin": "399",
  "destination": "151",
  "weight": 500,
  "courier": "jne"
}
```

### 4. Get Cities (Search)
```
GET /api/shipping/cities?search=jakarta
```

## 🔧 Konfigurasi

### Vite Proxy
Frontend sudah dikonfigurasi untuk proxy request `/api/*` ke backend server di `http://localhost:3001` saat development.

Lihat `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true,
  },
}
```

### Production Setup

Untuk production, Anda perlu:
1. Deploy backend API ke server terpisah atau gunakan serverless function
2. Update `VITE_API_URL` di frontend untuk menunjuk ke production API URL
3. Set environment variables di production server

## ⚠️ Catatan Penting

1. **Jangan commit file `.env`** - sudah di-ignore di `.gitignore`
2. **Midtrans Server Key** harus tetap rahasia, jangan expose di frontend
3. **RajaOngkir API Key** juga harus di backend untuk keamanan
4. Jika API key tidak di-set, sistem akan menggunakan fallback (estimasi ongkir)

## 🐛 Troubleshooting

### Backend tidak jalan
- Pastikan port 3001 tidak digunakan aplikasi lain
- Cek apakah semua dependencies sudah terinstall: `npm install`

### Payment link gagal dibuat
- Pastikan `MIDTRANS_SERVER_KEY` sudah di-set dengan benar
- Cek apakah key yang digunakan sesuai dengan environment (sandbox/production)

### Ongkir tidak muncul
- Jika `RAJAONGKIR_API_KEY` tidak di-set, sistem akan menggunakan estimasi ongkir
- Pastikan format request body sudah benar (origin, destination, weight, courier)

## 📚 Resources

- [Midtrans Documentation](https://docs.midtrans.com/)
- [RajaOngkir API Documentation](https://rajaongkir.com/dokumentasi)
- [Express.js Documentation](https://expressjs.com/)

