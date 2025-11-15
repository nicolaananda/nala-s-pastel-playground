# Nala Art Studio

Website resmi Nala Art Studio - Art Therapy untuk Anak & Dewasa.

## Teknologi yang Digunakan

Proyek ini dibangun dengan:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Cara Menjalankan Proyek Lokal

### Prasyarat

- Node.js & npm terinstall - [install dengan nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Langkah-langkah

```sh
# Step 1: Clone repository
git clone <YOUR_GIT_URL>

# Step 2: Masuk ke direktori proyek
cd nalav2

# Step 3: Install dependencies
npm install

# Step 4: Jalankan development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8080`

## Build untuk Production

```sh
# Build aplikasi
npm run build

# Preview build
npm run preview
```

## Deploy dengan Docker

```sh
# Build dan jalankan dengan Docker Compose
docker-compose up --build -d

# Aplikasi akan berjalan di port 6612
# Akses di: http://localhost:6612
```

## Struktur Proyek

```
nalav2/
├── src/
│   ├── components/     # Komponen React
│   ├── pages/          # Halaman aplikasi
│   ├── assets/         # Gambar dan aset
│   └── ...
├── public/             # File statis
├── Dockerfile          # Konfigurasi Docker
├── docker-compose.yml  # Docker Compose config
└── nginx.conf          # Konfigurasi Nginx
```

## Fitur

- ✅ Mobile-friendly dan responsive
- ✅ Animasi interaktif untuk anak-anak
- ✅ Optimized untuk performance
- ✅ SEO-friendly
- ✅ Docker support untuk deployment

## Kontak

- Instagram: [@nala_art_studio](https://instagram.com/nala_art_studio)
