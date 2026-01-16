import { defineConfig, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { imagetools } from "vite-imagetools";
import { copyFileSync, existsSync } from "fs";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8723',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    imagetools({
      defaultDirectives: (url) => {
        // Convert to WebP by default for better compression
        if (url.searchParams.has('webp') === false) {
          url.searchParams.set('format', 'webp');
        }
        return new URLSearchParams(url.searchParams);
      },
    }),
    // Plugin untuk copy .htaccess ke dist setelah build
    {
      name: 'copy-htaccess',
      closeBundle() {
        const htaccessPath = path.resolve(__dirname, '.htaccess');
        const distPath = path.resolve(__dirname, 'dist', '.htaccess');
        
        if (existsSync(htaccessPath)) {
          copyFileSync(htaccessPath, distPath);
          console.log('✅ Copied .htaccess to dist/');
        } else {
          console.warn('⚠️  .htaccess not found in root directory');
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build output
    minify: 'esbuild', // Faster than terser
    // Code splitting - let Vite handle automatically
    rollupOptions: {
      output: {
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        manualChunks(id) {
          // Only isolate the heavy Grasp Guide page; let Rollup decide other vendor chunks to avoid circular deps.
          if (id.includes('src/pages/GraspGuide')) {
            return 'grasp-guide';
          }
          return undefined;
        },
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Source maps for production (optional, set to false for smaller builds)
    sourcemap: false,
    // CSS code splitting - false for faster initial render
    cssCodeSplit: true,
    // Reduce bundle size
    reportCompressedSize: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
