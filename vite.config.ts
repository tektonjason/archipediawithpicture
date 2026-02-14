import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    angular({
      tsconfig: 'tsconfig.json'
    }),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Architecture Learning Planet',
        short_name: 'Archipedia',
        description: 'Architecture Learning Planet PWA',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icon/archipediaicon.webp',
            sizes: '192x192',
            type: 'image/webp'
          },
          {
            src: '/icon/archipediaicon.webp',
            sizes: '512x512',
            type: 'image/webp'
          }
        ]
      }
    })
  ],
});
