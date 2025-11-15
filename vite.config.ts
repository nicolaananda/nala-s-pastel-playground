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
    // Code splitting - more granular for better tree shaking
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          // Radix UI components - split by usage
          if (id.includes('node_modules/@radix-ui')) {
            if (id.includes('accordion') || id.includes('dialog') || id.includes('dropdown-menu')) {
              return 'radix-ui-core';
            }
            return 'radix-ui-other';
          }
          // TanStack Query
          if (id.includes('node_modules/@tanstack')) {
            return 'tanstack-query';
          }
          // Other large dependencies
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Chunk size warning limit
    chunkSizeWarningLimit: 600,
    // Source maps for production (optional, set to false for smaller builds)
    sourcemap: false,
    // CSS code splitting
    cssCodeSplit: true,
    // Reduce bundle size
    reportCompressedSize: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
