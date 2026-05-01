# Setup Notifikasi Telegram untuk Pembayaran Midtrans

Panduan lengkap untuk mengaktifkan notifikasi Telegram real-time setiap ada pembayaran sukses.

## 🎯 Fitur

Setiap kali ada pembayaran sukses melalui Midtrans, Anda akan langsung menerima notifikasi Telegram berisi:
- ✅ Order ID dan kode akses
- 💰 Nominal pembayaran
- 👤 Data pembeli (nama, email, no HP)
- 📦 Jenis produk (Kelas/Sketchbook/Grasp Guide)
- 📋 Detail kelas (untuk pembelian kelas)

## 📋 Langkah Setup

### 1. Buat Bot Telegram

1. Buka Telegram dan cari **@BotFather**
2. Kirim perintah `/newbot`
3. Ikuti instruksi untuk memberi nama bot Anda
4. Simpan **Bot Token** yang diberikan (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Dapatkan Chat ID

Ada 2 cara untuk mendapatkan Chat ID:

#### Cara 1: Menggunakan Script (Recommended)

```bash
# Jalankan script yang sudah disediakan
node get-telegram-id.js
```

Script akan memberikan instruksi untuk:
1. Kirim pesan `/start` ke bot Anda
2. Chat ID akan otomatis terdeteksi dan ditampilkan

#### Cara 2: Manual

1. Kirim pesan apapun ke bot Anda
2. Buka browser dan akses:
   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```
   Ganti `<BOT_TOKEN>` dengan token bot Anda
3. Cari field `"chat":{"id":123456789}` - angka tersebut adalah Chat ID Anda

### 3. Konfigurasi Environment Variables

Tambahkan ke file `.env` di root project:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
```

**Catatan:**
- `TELEGRAM_BOT_TOKEN` = Token dari BotFather
- `TELEGRAM_CHAT_ID` = ID chat Anda (bisa personal chat atau group chat)

### 4. Restart Server

```bash
# Stop server yang sedang berjalan (Ctrl+C)
# Lalu jalankan ulang
npm run dev:server
```

## ✅ Testing

### Test dengan Script

Gunakan script test yang sudah disediakan:

```bash
# Test notifikasi Telegram untuk pembelian kelas
node test-telegram-class.js

# Atau jika server berjalan di port lain
node test-telegram-class.js http://localhost:3001
```

Script akan:
1. Mengirim webhook simulasi ke server
2. Server akan memproses pembayaran
3. Notifikasi Telegram akan terkirim otomatis

### Test dengan Midtrans Sandbox

1. Buat transaksi test di Midtrans Sandbox
2. Lakukan pembayaran dengan kartu test:
   - Card Number: `4811 1111 1111 1114`
   - CVV: `123`
   - Exp: `01/25`
3. Setelah pembayaran sukses, notifikasi akan langsung masuk ke Telegram

## 📱 Format Notifikasi

Notifikasi yang dikirim akan terlihat seperti ini:

```
🎉 PEMBAYARAN BERHASIL!

🎓 Kelas
━━━━━━━━━━━━━━━━━━━━
💳 Order ID: BELAJAR-1234567890
💰 Nominal: Rp 150.000
🔑 Kode Akses: BELAJAR-1234567890
💳 Metode: qris
✅ Status: LUNAS

📋 Detail Kelas:
Nama Siswa: John Doe
Kelas: Belajar Menggambar
Jadwal: 10:00 - 12:00

👤 Data Pemesan:
━━━━━━━━━━━━━━━━━━━━
📛 Nama: John Doe
📧 Email: john@example.com
📱 No HP: 081234567890

⏰ 01/05/2026 14:30:45
```

## 🔧 Troubleshooting

### Notifikasi tidak terkirim

**Cek 1: Environment Variables**
```bash
# Pastikan variabel sudah di-set
echo $TELEGRAM_BOT_TOKEN
echo $TELEGRAM_CHAT_ID
```

**Cek 2: Bot sudah di-start**
- Buka chat dengan bot Anda
- Kirim `/start`
- Pastikan bot merespon

**Cek 3: Chat ID benar**
- Jalankan ulang `node get-telegram-id.js`
- Pastikan Chat ID yang di-set sama dengan yang terdeteksi

**Cek 4: Server logs**
```bash
# Lihat log server untuk error message
npm run dev:server
```

Cari pesan seperti:
- `⚠️ TELEGRAM_BOT_TOKEN not set` - Token belum di-set
- `⚠️ TELEGRAM_CHAT_ID not set` - Chat ID belum di-set
- `✅ Telegram notification sent` - Notifikasi berhasil terkirim
- `❌ Failed to send Telegram notification` - Ada error saat kirim

### Bot tidak merespon

1. Pastikan token benar (copy-paste dari BotFather)
2. Cek apakah bot masih aktif di BotFather
3. Coba revoke dan generate token baru

### Notifikasi masuk ke chat yang salah

- Pastikan `TELEGRAM_CHAT_ID` sesuai dengan chat yang Anda inginkan
- Untuk group chat, tambahkan bot ke group dan gunakan group chat ID

## 🎨 Customisasi

### Mengubah Format Pesan

Edit fungsi `sendTelegramNotification` di `server/index.js`:

```javascript
const message = `
🎉 *PEMBAYARAN BERHASIL!*
// Ubah format sesuai keinginan
`.trim();
```

### Menambahkan Notifikasi ke Multiple Chat

Ubah `TELEGRAM_CHAT_ID` menjadi array:

```javascript
const chatIds = process.env.TELEGRAM_CHAT_ID.split(',');
for (const chatId of chatIds) {
  await telegramBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
}
```

Lalu di `.env`:
```env
TELEGRAM_CHAT_ID=123456789,987654321
```

## 📚 Referensi

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [Midtrans Notification Documentation](https://docs.midtrans.com/en/after-payment/http-notification)

## 💡 Tips

1. **Gunakan Group Chat** untuk notifikasi tim
2. **Simpan Chat ID** untuk backup
3. **Test dulu di Sandbox** sebelum production
4. **Monitor logs** untuk memastikan notifikasi terkirim
5. **Backup token** di tempat aman (jangan commit ke git)

## 🔒 Keamanan

- ❌ **JANGAN** commit file `.env` ke git
- ✅ File `.env` sudah ada di `.gitignore`
- ✅ Token dan Chat ID hanya disimpan di server
- ✅ Notifikasi hanya dikirim untuk pembayaran yang terverifikasi

---

**Selamat!** Notifikasi Telegram Anda sudah siap. Setiap pembayaran sukses akan langsung masuk ke Telegram Anda secara real-time. 🎉
