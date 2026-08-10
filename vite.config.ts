import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005,
    strictPort: true,
    watch: {
      ignored: [
        '**/v0-moteur-electron/**', '**\\\\v0-moteur-electron\\\\**',
        '**/v0saveprojets/**', '**\\\\v0saveprojets\\\\**',
        '**/v0-moteur-mobile/**', '**\\\\v0-moteur-mobile\\\\**'
      ]
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        adminDesign: resolve(__dirname, 'admin-design.html'),
      },
    },
  },
})
