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
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        globPatterns: ['**/*.{html,css,webmanifest,ico,svg,png}'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'archipedia-scripts',
              expiration: {
                maxEntries: 48,
                maxAgeSeconds: 365 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/(images|icon)\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'archipedia-images',
              expiration: {
                maxEntries: 180,
                maxAgeSeconds: 30 * 24 * 60 * 60
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Archipedia',
        short_name: 'Archipedia',
        description: 'A comprehensive, Bauhaus-style architectural encyclopedia and AI learning assistant.',
        theme_color: '#18181b',
        background_color: '#0f0f11',
        display: 'standalone',
        scope: '/',
        start_url: '/',
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
          },
          {
            src: '/icon/archipediaicon.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
});
