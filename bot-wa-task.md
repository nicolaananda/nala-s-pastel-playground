# Task Backend `bot-wa`: Pisahkan Entitlement Produk Grasp

## Ringkasan Masalah

Saat ini produk Grasp pernah tercampur sebagai satu akses:

- `Panduan Nama Grasp`
- `Nama & Nomor Grasp Isi 60 Warna`

Frontend sudah dipisah menjadi dua produk berbeda. Backend/API `bot-wa` juga harus ikut dipisah supaya pembelian baru menghasilkan kode akses yang benar.

Jika backend tidak diupdate, user bisa bayar produk 60 warna tapi menerima kode yang dianggap milik produk Panduan Nama, sehingga unlock bisa salah atau gagal.

## Perubahan Frontend Yang Sudah Dibuat

Frontend sekarang mengirim `orderPrefix` berbeda saat membuat transaksi Midtrans:

| Produk | Order ID Prefix | Kode Akses Yang Diharapkan | Route Premium |
|---|---|---|---|
| Panduan Nama Grasp | `GRASP-` | `GG-XXXXXX` | `/grasp-guide-premium` |
| Nama & Nomor Grasp Isi 60 Warna | `G60-` | `G60-XXXXXX` | `/grasp-sixty-color-premium` |

Frontend juga sudah menolak kode yang salah produk:

- Kode `GG-...` hanya boleh membuka `Panduan Nama Grasp`.
- Kode `G60-...` hanya boleh membuka `Nama & Nomor Grasp Isi 60 Warna`.

## Requirement Backend

### 1. Generate kode berdasarkan `order_id`

Di handler webhook Midtrans, saat transaksi sukses (`settlement` / `capture`), generate kode berdasarkan prefix `order_id`:

```js
if (orderId.startsWith('G60-')) {
  code = `G60-${randomPart}`;
} else if (orderId.startsWith('GRASP-')) {
  code = `GG-${randomPart}`;
}
```

Rule lain yang sudah ada jangan rusak:

```js
if (orderId.startsWith('SKET-')) code = `SK-${randomPart}`;
if (orderId.startsWith('BELAJAR-')) code = orderId;
if (orderId.startsWith('BAJU-')) code = `BJ-${randomPart}`;
if (orderId.startsWith('BOOK-')) code = `BK-${randomPart}`;
```

Urutan penting: cek `G60-` dan `GRASP-` sebelum fallback `GG-`.

### 2. Pastikan endpoint create transaction menerima prefix baru

Endpoint:

```http
POST /api/midtrans/create-payment-link
```

Harus menerima request dari frontend dengan `transaction_details.order_id` prefix:

- `GRASP-...`
- `G60-...`

Jangan override order ID dari frontend menjadi `BELAJAR-...` di backend.

### 3. Pastikan webhook menyimpan kode sesuai order

Endpoint:

```http
POST /api/midtrans/notification
```

Saat Midtrans mengirim notification untuk order `G60-...`, backend harus menyimpan kode `G60-...` di database.

Saat notification untuk order `GRASP-...`, backend harus menyimpan kode `GG-...` di database.

### 4. Pastikan polling kode tetap jalan

Endpoint:

```http
GET /api/transaction/:orderId/code
```

Expected response setelah webhook sukses:

Untuk order `G60-...`:

```json
{
  "code": "G60-ABC123",
  "orderId": "G60-..."
}
```

Untuk order `GRASP-...`:

```json
{
  "code": "GG-ABC123",
  "orderId": "GRASP-..."
}
```

Field tambahan boleh ada, tapi `code` wajib ada.

### 5. Verifikasi kode tetap bisa lookup

Endpoint:

```http
POST /api/grasp-guide/verify-code
```

Minimal behavior:

- `GG-...` valid jika ada di database.
- `G60-...` valid jika ada di database.
- kode tidak ditemukan harus invalid / 404 sesuai pola API sekarang.

Frontend sudah handle pemisahan produk dari prefix, jadi backend tidak wajib membuat endpoint verify terpisah. Tapi kalau mau lebih aman, backend boleh menambahkan metadata produk.

## Optional Tapi Direkomendasikan: Simpan Metadata Produk

Kalau schema database bisa diubah, tambahkan kolom seperti:

```sql
product_type TEXT
```

Nilai:

- `grasp-guide`
- `grasp-60-color`
- `sketch`
- `book`
- `shirt`
- `class`

Mapping:

```js
if (orderId.startsWith('GRASP-')) productType = 'grasp-guide';
if (orderId.startsWith('G60-')) productType = 'grasp-60-color';
```

Ini bukan blocker untuk deploy cepat, tapi bagus untuk audit/admin/debug.

## Test Checklist

### Test 1: Panduan Nama Grasp

1. Buat transaksi dengan order ID prefix `GRASP-`.
2. Simulasikan webhook `settlement`.
3. Cek database: kode harus prefix `GG-`.
4. Panggil:

```http
GET /api/transaction/GRASP-.../code
```

Expected: response mengandung `code` prefix `GG-`.

### Test 2: Nama & Nomor Grasp Isi 60 Warna

1. Buat transaksi dengan order ID prefix `G60-`.
2. Simulasikan webhook `settlement`.
3. Cek database: kode harus prefix `G60-`.
4. Panggil:

```http
GET /api/transaction/G60-.../code
```

Expected: response mengandung `code` prefix `G60-`.

### Test 3: Tidak merusak produk lain

Pastikan prefix lama masih benar:

- `SKET-` -> `SK-`
- `BAJU-` -> `BJ-`
- `BOOK-` -> `BK-`
- `BELAJAR-` -> tetap sesuai behavior lama

### Test 4: Production sanity

Setelah deploy ke `api.artstudionala.com`:

1. Test pembelian 60 warna nominal kecil/real flow.
2. Pastikan order ID mulai `G60-`.
3. Pastikan kode yang diterima mulai `G60-`.
4. Pastikan kode `G60-...` membuka halaman 60 warna.
5. Pastikan kode `G60-...` tidak membuka halaman Panduan Nama.

## Deploy Order Yang Aman

1. Deploy backend `bot-wa` dulu.
2. Deploy frontend setelah backend siap.
3. Test transaksi baru untuk `G60-`.
4. Test transaksi baru untuk `GRASP-`.

## Catatan Kode Lama

Kode/transaksi lama yang sudah terbuat dengan prefix `BELAJAR-` atau `GG-` mungkin tidak punya metadata produk. Jangan paksa migrasi otomatis tanpa data pembelian asli.

Untuk user lama yang sudah membeli 60 warna tapi menerima kode lama, lakukan manual fix case-by-case:

- cek order/payment asli,
- generate kode `G60-...`,
- simpan ke order terkait,
- kirim kode baru ke user.
