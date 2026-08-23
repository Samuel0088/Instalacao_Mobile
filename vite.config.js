import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,svg,woff2}',
          'assets/icons/icon-*.png',
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
     manifest: {
  name: 'Zenith',
  short_name: 'Zenith',
  id: '/',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  theme_color: '#163020',
  background_color: '#0f5a38',
  lang: 'pt-BR',
   icons: [
  {
    src: "/assets/icons/icon-192.png",
    sizes: "192x192",
    type: "image/png",
    purpose: "any"
  },
  {
    src: "/assets/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "any"
  },
  {
    src: "/assets/icons/icon-512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable"
  }
]
},
      // 🔥 Desativa cache durante desenvolvimento
      devOptions: {
        enabled: false
      }
    })
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true, // 🔥 Limpa a pasta antes de build
    sourcemap: false,
    // 🔥 Força rebuild completo
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  // 🔥 Desativa cache do Vite
  server: {
    force: true
  }
})
