import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  assetsInclude: ['**/*.docx'],
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    // Proxy uniquement en développement
    proxy: process.env.NODE_ENV === 'development' ? {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    } : undefined,
    allowedHosts: [
      '524f1ea48590.ngrok-free.app'
    ],
    cors: {
      origin: ['http://localhost:5173', 'https://planifymmi.fr'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
      credentials: true
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    cssCodeSplit: true, // Divise le CSS pour éviter le blocage
    rollupOptions: {
      output: {
        format: 'es',
        // Éviter eval() pour la CSP
        generatedCode: {
          constBindings: true,
          arrowFunctions: true
        },
        assetFileNames: (assetInfo) => {
          const info = (assetInfo.name || '').split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        manualChunks: {
          // Sépare les gros chunks pour un chargement plus rapide
          vendor: ['vue', 'vue-router', 'pinia'],
          utils: ['axios']
        },
        // Éviter l'utilisation d'eval() pour la CSP
        inlineDynamicImports: false
      }
    }
  }
})
