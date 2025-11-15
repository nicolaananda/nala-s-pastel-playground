# Docker Deployment Guide

## Build dan Run dengan Docker

### 1. Build Image
```bash
docker build -t nala-art-studio .
```

### 2. Run Container
```bash
docker run -d -p 6612:6612 --name nala-art-studio nala-art-studio
```

### 3. Atau Gunakan Docker Compose (Recommended)
```bash
# Build dan run
docker-compose up --build -d

# Lihat logs
docker-compose logs -f

# Stop
docker-compose down

# Restart
docker-compose restart
```

## Build Process

Dockerfile menggunakan multi-stage build:

1. **Builder Stage**:
   - Menggunakan Node.js 20 Alpine
   - Install dependencies untuk sharp (image processing)
   - Build aplikasi dengan WebP image conversion
   - Generate optimized images

2. **Production Stage**:
   - Menggunakan Nginx Alpine (lightweight)
   - Copy built files dari builder stage
   - Serve static files dengan Nginx

## Image Optimization

Saat build, semua gambar akan:
- ✅ Dikonversi ke WebP format
- ✅ Di-resize sesuai kebutuhan
- ✅ Dioptimasi untuk web

## Port

Aplikasi berjalan di port **6612**

Akses di: `http://localhost:6612`

## Health Check

Container memiliki health check endpoint:
- URL: `http://localhost:6612/health`
- Interval: 30 detik
- Timeout: 10 detik

## Update Deployment

Untuk update aplikasi:

```bash
# Pull latest code
git pull

# Rebuild dan restart
docker-compose up --build -d

# Atau dengan Docker langsung
docker build -t nala-art-studio .
docker stop nala-art-studio
docker rm nala-art-studio
docker run -d -p 6612:6612 --name nala-art-studio nala-art-studio
```

## Troubleshooting

### Build Error dengan Sharp
Jika ada error saat build sharp, pastikan:
- Docker memiliki cukup memory (min 2GB)
- Build stage menginstall dependencies yang diperlukan

### Port Already in Use
Jika port 6612 sudah digunakan:
```bash
# Cek port
lsof -i :6612

# Atau ubah port di docker-compose.yml
ports:
  - "8080:6612"  # Host:Container
```

### View Logs
```bash
# Docker Compose
docker-compose logs -f

# Docker
docker logs -f nala-art-studio
```

## Production Tips

1. **Use Docker Compose** untuk easier management
2. **Set restart policy** ke `unless-stopped` (sudah ada)
3. **Monitor health check** untuk auto-restart
4. **Use reverse proxy** (Nginx/Caddy) untuk HTTPS
5. **Enable Cloudflare CDN** untuk better performance

