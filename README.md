# Nala Art Studio

Website resmi Nala Art Studio untuk kelas seni, produk digital, merchandise, artikel lomba mewarnai, dan pembayaran online.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Express API server
- PostgreSQL untuk kode akses produk digital
- Midtrans untuk pembayaran
- api.co.id untuk ongkir Indonesia
- Telegram dan email untuk notifikasi transaksi
- Docker + Nginx untuk deploy frontend

## Prasyarat

- Node.js 20+
- npm
- PostgreSQL jika fitur backend lokal dipakai
- Kredensial Midtrans, api.co.id, Telegram, dan SMTP untuk fitur produksi

## Setup Lokal

```sh
npm install
```

Buat file `.env` di root project bila menjalankan backend:

```env
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=nala
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false

MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_IS_PRODUCTION=false

API_CO_ID_KEY=your-api-co-id-key
ORIGIN_VILLAGE_CODE=3374101006

TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=Nala Art Studio <noreply@example.com>
```

## Menjalankan Project

Frontend saja:

```sh
npm run dev
```

Frontend berjalan di `http://localhost:8080`.

Backend saja:

```sh
npm run dev:server
```

Backend berjalan di `http://localhost:3001` secara default.

Frontend + backend bersamaan:

```sh
npm run dev:all
```

## Script Penting

```sh
npm run build          # build production frontend
npm run preview        # preview hasil build
npm run lint           # lint source code
npm run create:db      # buat database PostgreSQL
npm run init:schema    # buat schema database
npm run migrate        # migrasi data lama ke PostgreSQL
npm run test:db        # tes koneksi database
npm run test:webhook   # tes webhook Midtrans
npm run generate:code  # generate kode akses transaksi manual
```

## Backend API

Dokumentasi backend utama ada di `server/README.md`.

Endpoint utama:

- `GET /api/health`
- `POST /api/midtrans/create-payment-link`
- `POST /api/midtrans/notification`
- `POST /api/grasp-guide/access-code`
- `POST /api/grasp-guide/verify-code`
- `GET /api/transaction/:orderId/code`
- `POST /api/transaction/:orderId/generate-code`
- `GET /api/admin/transactions`
- `POST /api/shipping/calculate`
- `GET /api/shipping/villages?search=semarang`

## Build dan Deploy

Build production:

```sh
npm run build
```

Deploy frontend dengan Docker Compose:

```sh
docker compose up --build -d
```

Container expose aplikasi di port `6612`.

Deploy manual frontend masih tersedia lewat `deploy.sh` bila server memakai alur lama.

## Struktur Project

```text
.
├── src/                 # frontend React
│   ├── assets/          # gambar dan aset aplikasi
│   ├── components/      # komponen UI dan section halaman
│   ├── data/            # data artikel/produk statis
│   ├── hooks/           # React hooks
│   ├── lib/             # helper client, Midtrans, shipping
│   └── pages/           # halaman route utama
├── server/              # Express API, database, webhook, migration
├── public/              # favicon, sitemap, robots, static assets
├── Dockerfile           # build frontend dan serve via Nginx
├── docker-compose.yml   # service frontend production
├── nginx.conf           # config Nginx container
└── README.md            # dokumentasi utama project
```

## Catatan Maintenance

- Root project sengaja dibuat ringkas. Catatan fix/deploy lama dan helper test manual yang tidak dipakai sudah dihapus; informasi aktif dipusatkan di README ini dan `server/README.md`.
- Jangan commit `.env`, `node_modules/`, atau `dist/`.
- Gunakan `.htaccess` hanya untuk hosting yang membutuhkan rewrite Apache/LiteSpeed; Docker memakai `nginx.conf`.

## Kontak

- Instagram: [@nala_art_studio](https://instagram.com/nala_art_studio)
