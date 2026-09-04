import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import pathLib from 'path'

// Plugin de simulation et résilience API locale pour V0-Reponse (Vite 3006)
function devApiMockPlugin() {
  return {
    name: 'dev-api-mock',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // 1. Session d'authentification
        if (url.startsWith('/api/auth/session')) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            authenticated: true,
            userId: 'dev-user-001',
            email: 'dev@kirov5.local'
          }));
          return;
        }

        // 2. Connexion / Inscription
        if (url.startsWith('/api/auth/login') || url.startsWith('/api/auth/register')) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            token: 'dev-local-jwt-token',
            userId: 'dev-user-001',
            email: 'dev@kirov5.local'
          }));
          return;
        }

        // 3. Réception et écriture locale des archives ZIP (Stitch / PRD)
        if (url.startsWith('/api/fs/upload-zip') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              const pName = data.project || 'guest_project';
              const projectDir = pathLib.join('e:\\worldmodelv2\\boilerplates\\projets', pName);
              if (!fs.existsSync(projectDir)) {
                fs.mkdirSync(projectDir, { recursive: true });
              }
              const filePath = pathLib.join(projectDir, data.fileName || 'stitch.zip');
              const buffer = Buffer.from(data.fileBase64, 'base64');
              fs.writeFileSync(filePath, buffer);
              console.log('[Vite 3006] ✅ ZIP ' + data.fileName + ' sauvegardé dans ' + projectDir);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, path: filePath, fileName: data.fileName }));
            } catch (e) {
              console.error('[Vite 3006] Erreur upload zip:', e);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        // 3.5 Création Idempotente de Boilerplate
        if (url.startsWith('/api/fs/create-boilerplate')) {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const proj = parsed.project || ('Projet_' + Date.now());
              const targetDir = path.join('e:\\worldmodelv2\\boilerplates\\projets', proj);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                project: proj,
                filesCreated: 24,
                projectDir: targetDir
              }));
            } catch (e) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, filesCreated: 24 }));
            }
          });
          return;
        }

        // 4. Liste des Projets locaux et souverains
        if (url.startsWith('/api/projects')) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;

          const projectsList = [];
          const dirsToScan = [
            'e:\\worldmodelv2\\boilerplates\\projets',
            'e:\\v0reponses\\v0saveprojets',
            'e:\\v0reponses\\prd_packs'
          ];

          for (const dir of dirsToScan) {
            try {
              if (fs.existsSync(dir)) {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const e of entries) {
                  if (e.isDirectory() && !e.name.startsWith('.') && !projectsList.some(p => p.project_id === e.name)) {
                    projectsList.push({
                      project_id: e.name,
                      title: e.name,
                      desc: 'Projet local (' + (dir.includes('worldmodel') ? 'WorldModel' : 'V0') + ')'
                    });
                  }
                }
              }
            } catch {}
          }

          res.end(JSON.stringify({
            success: true,
            projects: projectsList
          }));
          return;
        }

        next();
      });
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), devApiMockPlugin()],
  server: {
    port: 3006,
    strictPort: true,
    proxy: {
      '/api/bridge': {
        target: 'http://localhost:5006',
        changeOrigin: true
      },
      '/bridge': {
        target: 'http://localhost:5006',
        changeOrigin: true
      },
      '/api/suture': {
        target: 'http://localhost:5006',
        changeOrigin: true
      }
    },
    watch: {
      ignored: [
        '**/v0-moteur-electron/**', '**\\v0-moteur-electron\\**',
        '**/v0saveprojets/**', '**\\v0saveprojets\\**',
        '**/v0-moteur-mobile/**', '**\\v0-moteur-mobile\\**'
      ]
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        adminDesign: resolve(__dirname, 'admin-design.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-v200-[hash].js',
        chunkFileNames: 'assets/[name]-v200-[hash].js',
        assetFileNames: 'assets/[name]-v200-[hash].[ext]'
      }
    },
  },
})
