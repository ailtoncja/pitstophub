import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      filename: 'sw.js',
      manifestFilename: 'manifest.webmanifest',
      manifest: {
        name: 'PitStopHub',
        short_name: 'PitStopHub',
        description: 'Calendarios, categorias, equipes e pilotos do automobilismo em um web app instalavel.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0f1720',
        theme_color: '#c1121f',
        categories: ['sports', 'news', 'productivity'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Explorar categorias',
            short_name: 'Explorar',
            url: '/',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    proxy: {
      '/api/openf1': {
        target: 'https://api.openf1.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openf1/, '/v1'),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'motion': ['motion/react'],
          'icons': ['lucide-react'],
          'supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
}));
