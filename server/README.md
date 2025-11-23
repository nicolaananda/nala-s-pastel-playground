# Server API Backend

Backend API untuk Midtrans Payment dan RajaOngkir Shipping.

## Setup

1. Buat file `.env` di folder ini dengan isi:

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

2. Install dependencies (dari root project):
```bash
npm install
```

3. Jalankan server:
```bash
npm run dev:server
```

Atau jalankan bersama frontend:
```bash
npm run dev:all
```

## Endpoints

- `GET /api/health` - Health check
- `POST /api/midtrans/create-payment-link` - Create Midtrans payment link
- `POST /api/shipping/calculate` - Calculate shipping cost
- `GET /api/shipping/cities?search=jakarta` - Search cities

## Catatan

- File `.env` sudah di-ignore oleh git untuk keamanan
- Jika API key tidak di-set, sistem akan menggunakan fallback (estimasi ongkir)
- Untuk production, set `MIDTRANS_IS_PRODUCTION=true`

