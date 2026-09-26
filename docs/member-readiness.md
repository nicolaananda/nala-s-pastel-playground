# Readiness portal member Nala

Tanggal QA: 2026-09-26. Lingkup: QA non-email terisolasi; tanpa deploy, commit, restart production/preview, pembayaran/email nyata, atau database production.

## Ringkasan

**Status: belum siap deploy.** Lima suite terisolasi dan kedua build lulus. Preview publik member dapat login dan menampilkan dashboard, katalog, serta akun tanpa overflow. Masalah `LocalNetworkAccessPermissionDenied` admin sudah diperbaiki di temporary preview build dengan `VITE_API_URL=''`; browser publik kini membuktikan data kursus dan kontrol plan termuat tanpa kegagalan browser. Zoho, Midtrans sandbox, UAT, backup/restore, dan prosedur deploy juga masih menjadi gate.

## Lingkungan yang diverifikasi

- Container: `nala-member-pg-test`, image `postgres:16-alpine`, status running.
- Bind: `127.0.0.1:55439`; database: `member_test`.
- Semua suite membuat schema acak baru dan membersihkannya; schema preview aktif tidak di-reset.
- Preview tetap berjalan: `scripts/member-preview.mjs` PID 684619 pada `127.0.0.1:4324`; proxy pada `127.0.0.1:4330`; tunnel publik tetap mengarah ke proxy.
- Kredensial preview hanya dibaca oleh check lokal dari artifact privat dan tidak dicetak/disalin.

## Perintah dan hasil

Semua URL database di bawah menggunakan password fixture test; tidak membaca `.env`.

```bash
node --test server/member-core.test.js
# PASS: 1/1

MEMBER_TEST_DATABASE_URL='postgres://postgres:***@127.0.0.1:55439/member_test' node --test server/member-postgres.test.js
# PASS: migration, settlement concurrency and catalog lifecycle

MEMBER_TEST_DATABASE_URL='postgres://postgres:***@127.0.0.1:55439/member_test' node --test server/member-http.test.js
# PASS: real HTTP member lifecycle and boundaries

MEMBER_TEST_DATABASE_URL='postgres://postgres:***@127.0.0.1:55439/member_test' node --test server/member-phase45.test.js
# PASS: phase 4-5 authorization, operations and reminders

MEMBER_TEST_DATABASE_URL='postgres://postgres:***@127.0.0.1:55439/member_test' node --test server/member-phase7.test.js
# PASS: phase7 HTTP gates, concurrency, media, gallery, challenge, and certificate

node /tmp/nala-preview-self-check.mjs
# PASS: member login/me, admin authentication/list/config, origin/helper gates, assets (HTTP only)

(cd apps/member && npm run build -- --outDir /tmp/nala-member-build)
# PASS: 5 static pages

./node_modules/.bin/vite build --outDir /tmp/nala-root-build --emptyOutDir
# PASS: root Vite bundle, temporary output

npm --prefix /tmp/nala-prod-check run build
# PASS: complete production script in isolated copy; Vite build + 15 SEO routes from CMS.
# Warning expected in isolated copy: root .htaccess absent from copied fixture. Repository/preview assets were untouched.
```

## Cakupan regresi

Suite yang lulus mencakup defect audit sebelumnya dan alur terkait:

- reset password tidak menyisakan sesi aktif;
- parser karya dijalankan setelah gate dan batas payload 2 MiB;
- reminder tidak dikirim dari renewal yang stale;
- revoke sertifikat menerima UUID;
- cookie admin malformed tidak menjatuhkan proses;
- Sharp aktif dan pemrosesan media diuji;
- nominal/durasi checkout mengikuti konfigurasi plan backend;
- settlement/perpanjangan paralel idempoten;
- video, worksheet, progress, dan fitur member terproteksi saat membership kedaluwarsa.

Tidak ditambahkan test baru karena cakupan regresi yang diminta sudah ada dan lulus.

## Bukti browser publik

Chromium 153 headless via CDP, tanpa dependency baru dan tanpa checkout/email nyata:

| Tampilan | Hasil | Overflow horizontal |
|---|---|---|
| Login member → dashboard | termuat dan terautentikasi | tidak |
| Katalog member | termuat | tidak |
| Akun member | termuat | tidak |
| Member viewport 390×844 | termuat | tidak |
| Admin login → kursus | data fixture termuat | tidak |
| Admin program/plan | data fixture termuat | tidak |

Temuan awal API loopback admin telah diperbaiki dengan temporary build same-origin `/tmp/nala-admin-same-origin/` dan proxy yang tetap terautentikasi. Coordinator menjalankan ulang `node /tmp/nala-preview-self-check.mjs` dan `node /tmp/nala-browser-check.mjs`: PASS. Data kursus fixture serta kontrol plan terbukti termuat; tidak ada request admin ke loopback/production API, kegagalan browser, atau overflow pada viewport yang diperiksa. Header bypass ngrok hanya untuk origin preview.

## Branding dan linkage konten

- `src/assets/nala-logo.png`, `public/nala-logo.png`, dan `apps/member/public/nala-logo.png` mempunyai SHA-256 identik. Kesamaan hash hanya membuktikan file identik, bukan ketepatan visual logo. Branding visual belum diverifikasi; tidak ada perubahan branding.
- Landing/CMS mengelola buku/artikel, sedangkan materi eksklusif portal disimpan terpisah pada `member_courses`/chapter/lesson/worksheet. Tidak ditemukan mapping dari item CMS/landing ke course member. Konten eksklusif aktual harus dipetakan melalui admin member atau skema linkage yang disepakati; konten landing tidak disalin atau ditulis ulang dalam QA ini.

## Perubahan pada QA ini

- `docs/member-readiness.md`: laporan ini.
- Tidak ada kode aplikasi yang diubah. Dirty worktree dan perubahan yang sudah ada dipertahankan.
- Temporary proxy `/tmp/nala-public-proxy.mjs`, build `/tmp/nala-admin-same-origin/`, dan runnable browser check `/tmp/nala-browser-check.mjs` diperbarui untuk memperbaiki admin publik. Preview backend/schema dan kredensial user dipertahankan.

## Gate tersisa

1. **Browser admin: selesai untuk preview.** Data course/plan terverifikasi di origin publik. Ini bukan deployment production atau UAT seluruh fitur.
2. **Zoho:** pemilik mengisi environment. Runtime membership menerima `SMTP_PASS || SMTP_PASSWORD`; lakukan verifikasi provider/mail sink tanpa mencetak rahasia. Mock bukan bukti sandbox/provider.
3. **Credential lama:** `server/index.js` masih memiliki jalur mailer kelas lama dengan kredensial hardcoded yang telah ada. Rotasi secret dan migrasi ke environment wajib sebelum deploy; perilakunya sengaja tidak diubah dalam tugas ini agar mail kelas production tidak rusak.
4. **Midtrans sandbox:** gunakan key sandbox terpisah; verifikasi create transaction, callback tervalidasi provider, settlement idempoten, cancel/expire, dan nominal/durasi plan. Jangan gunakan key production.
5. **UAT:** pemilik menyetujui copy, materi eksklusif, plan/harga/durasi, role admin, mobile, akses expired, sertifikat, artwork, dan consent galeri.
6. **Operasional:** backup dan uji restore database/file privat; review migration plan; deploy rehearsal; monitoring/rollback. Production migration, restart, dan deploy belum dilakukan.

## Keputusan

**NO-GO untuk production** sampai seluruh gate di atas selesai. Backend terisolasi dan build berada pada kondisi hijau; kesiapan provider, konten, UAT, serta operasi belum hijau. Browser admin preview telah diverifikasi.
