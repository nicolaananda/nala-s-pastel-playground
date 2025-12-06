# Server API Backend

Backend API untuk Midtrans Payment dan RajaOngkir Shipping.

## Setup

1. Buat file `.env` di root project dengan isi:

```env
# Server Port
PORT=3001

# PostgreSQL Database Configuration
DB_HOST=nicola.id
DB_PORT=5432
DB_NAME=nala
DB_USER=bot_wa
DB_PASSWORD=bot_wa
DB_SSL=false

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

2. Pastikan database PostgreSQL sudah dibuat:
```sql
CREATE DATABASE nala;
```

3. Install dependencies (dari root project):
```bash
npm install
```

4. Migrate data dari JSON ke PostgreSQL (jika ada data lama):
```bash
npm run migrate
```

5. Jalankan server:
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
- `POST /api/midtrans/notification` - Midtrans webhook untuk notifikasi pembayaran
- `POST /api/grasp-guide/access-code` - Simpan kode akses
- `POST /api/grasp-guide/verify-code` - Verifikasi kode akses
- `GET /api/transaction/:orderId/code` - Get kode berdasarkan order ID
- `POST /api/transaction/:orderId/generate-code` - Generate kode manual untuk transaksi yang belum punya kode
- `GET /api/admin/transactions` - List semua transaksi (untuk debugging)
- `POST /api/shipping/calculate` - Calculate shipping cost
- `GET /api/shipping/cities?search=jakarta` - Search cities

## Database

Sistem menggunakan PostgreSQL untuk menyimpan data kode akses. Schema akan dibuat otomatis saat server pertama kali dijalankan.

### Migrasi dari JSON ke PostgreSQL

Jika sebelumnya menggunakan file JSON, jalankan:
```bash
npm run migrate
```

Script ini akan:
- Membuat tabel jika belum ada
- Migrate semua data dari `database.json` ke PostgreSQL
- Skip data yang sudah ada (berdasarkan transaction_id)

## Troubleshooting

### Kode tidak terkirim setelah pembayaran

Jika ada transaksi yang sudah dibayar tapi tidak dapat kode:
1. Cek order ID dari Midtrans dashboard
2. Gunakan endpoint `POST /api/transaction/:orderId/generate-code` untuk generate kode manual
3. Atau cek log server untuk melihat apakah webhook diterima

## Catatan

- File `.env` sudah di-ignore oleh git untuk keamanan
- Jika API key tidak di-set, sistem akan menggunakan fallback (estimasi ongkir)
- Untuk production, set `MIDTRANS_IS_PRODUCTION=true`
- Database schema akan dibuat otomatis saat server pertama kali dijalankan

