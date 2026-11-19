import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // En production sur serveur : utiliser '/' (chemins absolus).
  // './' causait des 404 sur les assets lors d'un rechargement de routes imbriquées.
  base: '/',
  server: {
    proxy: {
      '/api/deepl/free': {
        target: 'https://api-free.deepl.com/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepl\/free/, ''),
      },
      '/api/deepl/pro': {
        target: 'https://api.deepl.com/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/deepl\/pro/, ''),
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // Fichiers des scènes AR / récits audio (servis par le back depuis
      // ARVR_DIR). Les pages /ARVR_musee/… restent rendues par Vite.
      '^/ARVR_musee/.+\\.(glb|usdz|mp3)$': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
    }
  }
})
