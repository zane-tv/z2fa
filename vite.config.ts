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
      includeAssets: ['favicon.svg', 'apple-touch-icon.svg'],
      manifest: {
        name: 'Z2FA — Precision 2FA Authenticator',
        short_name: 'Z2FA',
        description: 'Trình lấy mã & quản lý 2FA tốc độ cao, bảo mật 100% trên trình duyệt.',
        theme_color: '#fdfcfc',
        background_color: '#fdfcfc',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
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
