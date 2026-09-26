# Member fase 0–3: pengujian terisolasi

Tidak ada perintah di bawah yang membaca `.env`. Gunakan nama container/database ini agar tidak menyentuh PostgreSQL lain.

```bash
docker run --name nala-member-pg-test --rm -e POSTGRES_PASSWORD=member_test_password -e POSTGRES_DB=member_test -p 127.0.0.1:55439:5432 -d postgres:16-alpine
MEMBER_TEST_DATABASE_URL=postgres://postgres:***@127.0.0.1:55439/member_test node --test server/member-postgres.test.js
MEMBER_TEST_DATABASE_URL=postgres://postgres:***@127.0.0.1:55439/member_test node --test server/member-http.test.js
node --test server/member-core.test.js
npm run build:dev
(cd apps/member && npm run build)
# Jalankan hanya setelah semua preview selesai:
docker stop nala-member-pg-test

# Rekonsiliasi file privat idempotent (jalankan dari script maintenance dengan pool test/runtime yang benar):
# await reconcileMemberFiles({pool, privateDir, recordCleanup})
```

Environment runtime: `DATABASE_URL`, `MEMBER_PRIVATE_DIR`, `MEMBER_PORTAL_URL`, `MEMBER_ALLOWED_ORIGINS` (origin eksplisit), `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION`.

Gate provider nyata tetap belum terverifikasi tanpa kredensial sandbox. Jangan memakai key production. Mock harus menghasilkan `https://app.sandbox.midtrans.com/...`, mail sink harus menyimpan tautan synthetic lokal. Refund hanya berstatus review manual; webhook refund tidak otomatis mencabut hak yang telah diberikan.

Fixture hanya `fixture@example.test`; tidak ada PII production. Worksheet disimpan di `MEMBER_PRIVATE_DIR`, bukan `public/uploads`. YouTube unlisted tetap dapat dibagikan dan bukan DRM.

Admin production memakai middleware admin lama. E2E lokal boleh memakai bootstrap admin test hanya jika proses bind `127.0.0.1`; implementasi production tidak menyediakan bypass tersebut.
