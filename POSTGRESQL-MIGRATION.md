# Migrasi ke PostgreSQL

Sistem database telah dimigrasikan dari file JSON ke PostgreSQL.

## Setup Database

1. Pastikan database PostgreSQL sudah dibuat:
```sql
CREATE DATABASE nala;
```

2. Update file `.env` di root project dengan konfigurasi database:
```env
DB_HOST=nicola.id
DB_PORT=5432
DB_NAME=nala
DB_USER=bot_wa
DB_PASSWORD=bot_wa
DB_SSL=false
```

## Migrasi Data

Jalankan migrasi untuk memindahkan data dari `database.json` ke PostgreSQL:

```bash
npm run migrate
```

Script ini akan:
- Membuat tabel `grasp_guide_access` jika belum ada
- Memigrasikan semua data dari JSON ke PostgreSQL
- Skip data yang sudah ada (berdasarkan `transaction_id`)

## Test Koneksi Database

Untuk menguji koneksi database:

```bash
npm run test:db
```

## Menangani Kode yang Hilang

Jika ada transaksi yang sudah dibayar tapi tidak mendapatkan kode akses:

### Metode 1: Menggunakan API Endpoint

Gunakan endpoint berikut untuk generate kode manual:

```bash
POST /api/transaction/:orderId/generate-code
```

Contoh menggunakan curl:
```bash
curl -X POST http://localhost:3001/api/transaction/ORDER-12345/generate-code \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TRANSACTION-12345",
    "customer": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+6281234567890"
    }
  }'
```

### Metode 2: Melihat Semua Transaksi

Untuk melihat semua transaksi (termasuk yang belum punya kode):

```bash
GET /api/admin/transactions
```

## Endpoint Baru

- `POST /api/transaction/:orderId/generate-code` - Generate kode manual untuk transaksi
- `GET /api/admin/transactions` - List semua transaksi

## Perubahan

- ✅ Database menggunakan PostgreSQL (bukan lagi file JSON)
- ✅ Schema database dibuat otomatis saat server start
- ✅ Data lama di-migrate dari JSON ke PostgreSQL
- ✅ Endpoint untuk generate kode manual jika ada yang hilang
- ✅ Endpoint admin untuk melihat semua transaksi

## Troubleshooting

### Error: "relation does not exist"
- Pastikan database `nala` sudah dibuat
- Jalankan server sekali untuk membuat schema otomatis
- Atau jalankan `npm run migrate` yang akan membuat schema

### Error: "password authentication failed"
- Periksa kredensial di file `.env`
- Pastikan user `bot_wa` memiliki akses ke database `nala`

### Koneksi timeout
- Periksa apakah host `nicola.id` dapat diakses
- Periksa firewall/network settings
- Coba set `DB_SSL=true` jika diperlukan

