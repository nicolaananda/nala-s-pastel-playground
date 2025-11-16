# Perbaikan Optimasi Image untuk PageSpeed Insights

## 🔍 Masalah yang Ditemukan

PageSpeed Insights melaporkan 2 masalah optimasi image:

### 1. Nala Art Studio Logo
- **Masalah**: Image 896x896px digunakan, padahal ditampilkan hanya 448x448px
- **Resource Size**: 98.4 KiB
- **Est Savings**: 41.5 KiB
- **Penyebab**: Browser memilih 2x image untuk semua device, padahal hanya perlu untuk high-DPI screens

### 2. Intermediate Class Image
- **Masalah**: Image 800px width digunakan, padahal ditampilkan 400px
- **Resource Size**: 64.5 KiB
- **Est Savings**: 16.0 KiB
- **Penyebab**: Image terlalu besar untuk container yang hanya 400px

## ✅ Solusi yang Diterapkan

### 1. Nala Logo - Responsive Images dengan sizes attribute

**Sebelum:**
```tsx
<source srcSet={`${nalaLogo} 1x, ${nalaLogo2x} 2x`} type="image/webp" />
```

**Sesudah:**
```tsx
<source 
  srcSet={`${nalaLogo} 448w, ${nalaLogo2x} 896w`}
  sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, (max-width: 1024px) 384px, 448px"
  type="image/webp" 
/>
```

**Perubahan:**
- Menggunakan `w` descriptor (width) instead of `x` descriptor (pixel density)
- Menambahkan `sizes` attribute untuk memberitahu browser ukuran image di berbagai breakpoint
- Mengurangi quality 2x image dari 85% ke 75% (masih bagus untuk retina)
- Mengurangi quality 1x image dari 85% ke 80%

**Breakpoints:**
- Mobile (≤640px): 256px (w-64)
- Tablet (≤768px): 320px (w-80)
- Desktop (≤1024px): 384px (w-96)
- Large Desktop: 448px (w-[28rem])

### 2. Class Images - Optimize Width dan Quality

**Sebelum:**
```tsx
import intermediateImg from "@/assets/intermediate-class.jpg?w=800&format=webp&quality=70";
```

**Sesudah:**
```tsx
import intermediateImg from "@/assets/intermediate-class.jpg?w=400&format=webp&quality=80";
```

**Perubahan:**
- Mengurangi width dari 800px ke 400px (sesuai dengan container)
- Meningkatkan quality dari 70% ke 80% (lebih baik untuk kualitas visual)
- Diterapkan untuk semua class images (beginner, intermediate, advanced)
- Menambahkan `sizes` attribute untuk responsive images

## 📊 Expected Results

Setelah perbaikan:
- ✅ Nala Logo: Browser akan memilih 448px untuk default, 896px hanya untuk high-DPI
- ✅ Est Savings: ~41.5 KiB untuk logo
- ✅ Class Images: Ukuran lebih kecil (~50% reduction)
- ✅ Est Savings: ~16 KiB untuk intermediate class
- ✅ Total Est Savings: ~57.5 KiB
- ✅ PageSpeed score meningkat
- ✅ LCP (Largest Contentful Paint) lebih cepat

## 🔄 Build & Deploy

Setelah perubahan ini, perlu rebuild aplikasi:

```bash
npm run build
```

Image akan di-generate ulang dengan ukuran dan quality yang baru.

## 📝 Catatan Penting

1. **Responsive Images**: `sizes` attribute memberitahu browser ukuran image di berbagai viewport, sehingga browser bisa memilih image yang tepat
2. **Quality vs Size**: Quality 75-80% sudah cukup untuk WebP format dengan kualitas visual yang baik
3. **Width Descriptor**: Menggunakan `w` (width) lebih baik daripada `x` (pixel density) karena lebih akurat untuk responsive design
4. **Future Optimization**: Bisa ditambahkan lebih banyak breakpoints jika perlu (misalnya untuk mobile landscape, tablet portrait, dll)

## 🧪 Testing

Setelah deploy, test dengan:
1. PageSpeed Insights: https://pagespeed.web.dev/
2. Lighthouse di Chrome DevTools
3. Network tab di DevTools - cek ukuran file yang di-download
4. Test di berbagai device/viewport size

## 📚 Referensi

- [Responsive Images Guide](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [WebP Quality Guide](https://developers.google.com/speed/webp/docs/compression)
- [Vite Imagetools Documentation](https://github.com/JonasKruckenberg/imagetools)

