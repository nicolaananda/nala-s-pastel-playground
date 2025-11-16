import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { imagetools } from "vite-imagetools";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    imagetools({
      defaultDirectives: (url) => {
        // Convert to WebP by default for better compression
        if (url.searchParams.has('webp') === false) {
          url.searchParams.set('format', 'webp');
        }
        return new URLSearchParams(url.searchParams);
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build output
    minify: 'esbuild', // Faster than terser
    // Code splitting - manual chunks for better optimization
    rollupOptions: {
      output: {
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // Manual chunk splitting for better tree shaking
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }
            // Radix UI components (large library)
            if (id.includes('@radix-ui')) {
              return 'vendor-radix';
            }
            // Other vendor libraries
            return 'vendor';
          }
        },
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Source maps for production (optional, set to false for smaller builds)
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Reduce bundle size
    reportCompressedSize: false,
    // Tree shaking
    treeshake: {
      moduleSideEffects: false,
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    // Exclude unused dependencies from pre-bundling
    exclude: ['@tanstack/react-query'],
  },
});
