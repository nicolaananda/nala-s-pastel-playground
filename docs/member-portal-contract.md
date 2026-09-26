# Kontrak portal member fase 0–3

- Aset statis: Cloudflare Workers Assets. API/DB: Express/PostgreSQL yang ada.
- Paket: Rp30.000 untuk 30 hari. Perpanjangan aktif dimulai dari expiry saat ini; akun kedaluwarsa dari waktu settlement terverifikasi.
- Identitas member dan sesi terpisah dari admin. Cookie host-only API, HttpOnly, Secure di production, SameSite=Lax, path `/api/member`.
- Origin production: `https://member.artstudionala.com`, `https://artstudionala.com`, `https://www.artstudionala.com`; dev eksplisit tetap `localhost:8080` dan `localhost:5173`.
- Prefix baru hanya `MEMBER-`. Prefix/handler LOMBA dan legacy tidak berubah. Rollback menutup checkout baru tetapi mempertahankan dispatcher webhook dan ledger order MEMBER yang sudah terbit.
- Harga, durasi, identitas, dan status akses ditentukan backend. Settlement QRIS memerlukan signature, status code 200, status settlement, channel qris, dan nominal tepat.
- Worksheet disimpan di `MEMBER_PRIVATE_DIR`, bukan `public/uploads`, lalu dialirkan melalui API berautentikasi dan entitlement aktif.
- YouTube unlisted adalah implementasi video awal. URL dapat bocor/dibagikan dan video dapat disalin atau direkam. Verifikasi syarat penggunaan dan persetujuan go-live wajib; ini bukan DRM.
- Refund/revocation belum diotomasi dalam fase 0–3. Penanganan manual wajib mempertahankan ledger dan mengikuti keputusan bisnis sebelum go-live.

## Environment names

`MEMBER_PORTAL_URL`, `MEMBER_PRIVATE_DIR`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, plus existing DB and Midtrans names.

## Deployment oleh pemilik

1. Backup dan uji restore database production.
2. Review lalu jalankan `server/migrations/002-member-portal-phases-0-3.sql` dengan transaksi selesai penuh.
3. Siapkan private directory yang writable dan tidak dilayani static server.
4. Isi environment SMTP/member, deploy backend kompatibel lebih dulu, lalu build/deploy `apps/member`.
5. Uji sandbox Midtrans dan email sink/staging. Buka checkout production hanya setelah external gate lulus.
