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

// === SCRIPT DE CORRECTION AUTOMATIQUE POUR CHAT_COMMS ===
import fs from 'fs'
import path from 'path'
try {
  const badAppDir = 'e:\\v0reponses\\v0-moteur-electron\\v0saveprojets\\Chat_Comms\\app'
  const goodSrcAppDir = 'e:\\v0reponses\\v0-moteur-electron\\v0saveprojets\\Chat_Comms\\src\\app'
  const nextCacheDir = 'e:\\v0reponses\\v0-moteur-electron\\v0saveprojets\\Chat_Comms\\.next'
  
  if (fs.existsSync(badAppDir)) {
    console.log('[AUTO-FIX] Dossier app/ détecté, fusion...')
    if (!fs.existsSync(goodSrcAppDir)) fs.mkdirSync(goodSrcAppDir, { recursive: true })
    fs.cpSync(badAppDir, goodSrcAppDir, { recursive: true })
    fs.rmSync(badAppDir, { recursive: true, force: true })
    console.log('[AUTO-FIX] Dossier app/ supprimé.')
  }
  
  if (fs.existsSync(nextCacheDir)) {
    fs.rmSync(nextCacheDir, { recursive: true, force: true })
    console.log('[AUTO-FIX] Cache .next supprimé pour forcer le re-rendu Next.js !')
  }
} catch (e) {
  console.log('[AUTO-FIX] Erreur:', e)
}
