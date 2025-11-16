# Perbaikan Unused JavaScript untuk PageSpeed Insights

## 🔍 Masalah yang Ditemukan

PageSpeed Insights melaporkan masalah "Reduce unused JavaScript":
- **File**: `index-RbTOmXOP.js`
- **Transfer Size**: 101.3 KiB
- **Est Savings**: 44.8 KiB (44% unused)
- **Masalah**: Banyak JavaScript yang tidak digunakan di-bundle ke dalam file utama

## 🔎 Analisis Masalah

### 1. React Query Tidak Digunakan
- `@tanstack/react-query` diimport dan di-setup di `App.tsx`
- Tidak ada `useQuery`, `useMutation`, atau hooks React Query lainnya yang digunakan
- Library ini menambah ~15-20 KiB ke bundle

### 2. Tidak Ada Code Splitting
- Semua komponen di-load secara synchronous
- Semua routes di-load sekaligus
- Tidak ada lazy loading untuk below-the-fold content

### 3. Tidak Ada Manual Chunk Splitting
- Semua vendor libraries di-bundle ke satu file
- Radix UI components yang besar tidak di-split
- Tidak ada optimasi untuk tree shaking

## ✅ Solusi yang Diterapkan

### 1. Hapus React Query (Tidak Digunakan)

**Sebelum:**
```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

<QueryClientProvider client={queryClient}>
  {/* ... */}
</QueryClientProvider>
```

**Sesudah:**
```tsx
// React Query dihapus karena tidak digunakan
// Exclude dari optimizeDeps di vite.config.ts
```

**Impact**: Mengurangi bundle size ~15-20 KiB

### 2. Lazy Loading untuk Routes

**Sebelum:**
```tsx
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
```

**Sesudah:**
```tsx
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));

<Suspense fallback={<LoadingFallback />}>
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
</Suspense>
```

**Impact**: Routes hanya di-load saat diperlukan

### 3. Lazy Loading untuk Below-the-Fold Components

**Sebelum:**
```tsx
import BestSellerBooks from "@/components/BestSellerBooks";
import ArtClasses from "@/components/ArtClasses";
import FreeWorksheet from "@/components/FreeWorksheet";
import GraspGuide from "@/components/GraspGuide";

// Semua di-load sekaligus
<BestSellerBooks />
<ArtClasses />
<FreeWorksheet />
<GraspGuide />
```

**Sesudah:**
```tsx
import { lazy, Suspense } from "react";

// Hero dan Footer tetap sync (above-the-fold)
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";

// Below-the-fold components di-lazy load
const BestSellerBooks = lazy(() => import("@/components/BestSellerBooks"));
const ArtClasses = lazy(() => import("@/components/ArtClasses"));
const FreeWorksheet = lazy(() => import("@/components/FreeWorksheet"));
const GraspGuide = lazy(() => import("@/components/GraspGuide"));

// Dengan Suspense untuk loading state
<Suspense fallback={<SectionLoader />}>
  <BestSellerBooks />
</Suspense>
```

**Impact**: 
- Initial bundle size berkurang signifikan
- Components di-load saat user scroll ke bawah
- Better LCP (Largest Contentful Paint)

### 4. Manual Chunk Splitting di Vite Config

**Sebelum:**
```ts
rollupOptions: {
  output: {
    chunkFileNames: 'assets/js/[name]-[hash].js',
    // No manual chunks
  },
}
```

**Sesudah:**
```ts
rollupOptions: {
  output: {
    chunkFileNames: 'assets/js/[name]-[hash].js',
    manualChunks: (id) => {
      if (id.includes('node_modules')) {
        // React core
        if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
          return 'vendor-react';
        }
        // Radix UI (large library)
        if (id.includes('@radix-ui')) {
          return 'vendor-radix';
        }
        // Other vendors
        return 'vendor';
      }
    },
  },
}
```

**Impact**:
- Better caching (vendor chunks jarang berubah)
- Parallel loading (multiple chunks bisa di-download bersamaan)
- Better tree shaking

### 5. Optimize Dependencies

**Sebelum:**
```ts
optimizeDeps: {
  include: ['react', 'react-dom', 'react-router-dom'],
}
```

**Sesudah:**
```ts
optimizeDeps: {
  include: ['react', 'react-dom', 'react-router-dom'],
  // Exclude unused dependencies
  exclude: ['@tanstack/react-query'],
}
```

**Impact**: React Query tidak di-pre-bundle

### 6. Enable Tree Shaking

**Sebelum:**
```ts
build: {
  // No explicit tree shaking config
}
```

**Sesudah:**
```ts
build: {
  treeshake: {
    moduleSideEffects: false,
  },
}
```

**Impact**: Unused code dihapus lebih agresif

## 📊 Expected Results

Setelah perbaikan:
- ✅ Initial bundle size berkurang ~30-45 KiB
- ✅ Unused JavaScript berkurang signifikan
- ✅ Better code splitting (multiple smaller chunks)
- ✅ Faster initial load (only critical code loaded)
- ✅ Better caching (vendor chunks separated)
- ✅ Improved LCP dan FCP scores
- ✅ PageSpeed score meningkat

## 🔄 Build & Deploy

Setelah perubahan ini, perlu rebuild aplikasi:

```bash
npm run build
```

Bundle akan di-split menjadi beberapa chunks:
- `index-[hash].js` - Main entry point (lebih kecil)
- `vendor-react-[hash].js` - React core
- `vendor-radix-[hash].js` - Radix UI components
- `vendor-[hash].js` - Other vendor libraries
- Component chunks untuk lazy-loaded components

## 📝 Catatan Penting

1. **Lazy Loading**: Components di-load saat diperlukan, bukan di initial load
2. **Suspense**: Wajib digunakan dengan lazy loading untuk handle loading state
3. **Above-the-Fold**: Hero dan Footer tetap sync karena critical untuk LCP
4. **Below-the-Fold**: BestSellerBooks, ArtClasses, dll di-lazy load
5. **Code Splitting**: Manual chunks untuk better caching dan parallel loading
6. **Tree Shaking**: Unused code akan dihapus otomatis oleh bundler

## 🧪 Testing

Setelah deploy, test dengan:
1. PageSpeed Insights: https://pagespeed.web.dev/
2. Lighthouse di Chrome DevTools
3. Network tab di DevTools - cek chunks yang di-load
4. Test lazy loading dengan scroll ke bawah
5. Test dengan throttling network untuk melihat impact

## 📚 Referensi

- [React Lazy Loading](https://react.dev/reference/react/lazy)
- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Tree Shaking](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Reduce Unused JavaScript](https://web.dev/reduce-javascript-execution-time/)

