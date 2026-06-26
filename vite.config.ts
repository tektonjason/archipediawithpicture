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
        globPatterns: ['**/*.{html,css}'],
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
      manifest: {
        id: '/',
        name: 'Archipedia',
        short_name: 'Archipedia',
        description: '面向建筑学习者的建筑百科、读物与资源知识库。',
        theme_color: '#18181b',
        background_color: '#0f0f11',
        lang: 'zh-CN',
        categories: ['education', 'reference', 'books'],
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon/archipedia-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon/archipedia-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon/archipedia-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
});
