import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'apple-touch-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'og-image.png',
      ],
      manifest: {
        id: '/',
        start_url: '/',
        scope: '/',
        lang: 'vi',
        name: 'Z2FA — Lấy Mã 2FA & Kho Bảo Mật AES-256',
        short_name: 'Z2FA',
        description:
          'Công cụ lấy mã 2FA (TOTP) tức thì từ Secret Key, chuỗi UID|PASS|2FA hoặc ảnh QR. Bảo mật 100% trên trình duyệt.',
        theme_color: '#fdfcfc',
        background_color: '#fdfcfc',
        display: 'standalone',
        orientation: 'portrait-primary',
        categories: ['security', 'utilities', 'productivity'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,txt,xml}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          motion: ['framer-motion'],
          qr: ['jsqr', 'qrcode'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
