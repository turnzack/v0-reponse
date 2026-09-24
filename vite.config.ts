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

        // 4. Liste des Projets locaux et souverains — format ProjectsData
        if (url.startsWith('/api/projects')) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;

          const projectsList = [];
          const dirsToScan = [
            'e:\\worldmodelv2\\boilerplates\\projets',
            'e:\\v0reponses\\v0-moteur-electron\\v0saveprojets',
            'e:\\v0reponses\\v0saveprojets',
            'e:\\ZAI',
            'e:\\v0reponses\\prd_packs'
          ];

          for (const dir of dirsToScan) {
            try {
              if (fs.existsSync(dir)) {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const e of entries) {
                  if (e.isDirectory() && !e.name.startsWith('.') && !['node_modules', 'dist', 'build', '.git'].includes(e.name) && !projectsList.some(p => p.id === e.name)) {
                    const source = dir.includes('worldmodel') ? 'WorldModel' : dir.includes('ZAI') ? 'ZAI' : 'V0';
                    const slug = e.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                    const now = new Date().toISOString();
                    projectsList.push({
                      id: e.name,
                      name: e.name,
                      slug: slug,
                      type: 'blank',
                      description: 'Projet local (' + source + ')',
                      status: 'active',
                      createdAt: now,
                      updatedAt: now,
                      pack: null,
                      counts: { pages: 0, tables: 0, workflows: 0, rows: 0 },
                      roadmap: { done: 0, total: 0 }
                    });
                  }
                }
              }
            } catch {}
          }

          const activeCount = projectsList.filter(p => p.status === 'active').length;
          const archivedCount = projectsList.filter(p => p.status === 'archived').length;

          res.end(JSON.stringify({
            projects: projectsList,
            stats: {
              active: activeCount,
              archived: archivedCount,
              pages: 0,
              tables: 0,
              workflows: 0,
              rows: 0
            },
            limits: {
              plan: 'free',
              used: activeCount,
              max: null
            }
          }));
          return;
        }

        // 5. Explorateur de fichiers (Tree)
        if (url.startsWith('/api/fs/tree')) {
          const parsedUrl = new URL(url, 'http://localhost');
          const rawProj = (parsedUrl.searchParams.get('project') || '').trim();
          const proj = rawProj.replace(/[^a-zA-Z0-9_\-]/g, '_');
          const candidateDirs = [
            pathLib.join('e:\\ZAI', rawProj),
            pathLib.join('e:\\ZAI', proj),
            pathLib.join('e:\\worldmodelv2\\boilerplates\\projets', proj),
            pathLib.join('e:\\v0reponses\\v0-moteur-electron\\v0saveprojets', proj),
            pathLib.join('e:\\v0reponses\\v0saveprojets', proj),
            pathLib.join(process.cwd(), 'v0saveprojets', proj),
            pathLib.join('/var/projects', proj)
          ];
          if (proj.toLowerCase() === 'p_ie' || proj.toLowerCase() === 'pie') {
            candidateDirs.unshift('e:\\ZAI\\piz');
          }
          let projDir = candidateDirs.find(d => fs.existsSync(d) && fs.statSync(d).isDirectory());

          function buildTree(dPath: string, basePath: string, depth = 0): any {
            if (depth > 7) return null;
            try {
              const stat = fs.statSync(dPath);
              const name = pathLib.basename(dPath);
              const rel = pathLib.relative(basePath, dPath).replace(/\\/g, '/');
              if (stat.isDirectory()) {
                const IGNORE = ['node_modules', '.git', 'dist', '.vite', 'android', 'ios', '.cache', 'build'];
                if (depth > 0 && IGNORE.includes(name)) return null;
                const children = fs.readdirSync(dPath)
                  .map(c => buildTree(pathLib.join(dPath, c), basePath, depth + 1))
                  .filter(Boolean)
                  .sort((a: any, b: any) => {
                    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
                    return a.name.localeCompare(b.name);
                  });
                return { name, path: rel || '.', type: 'directory', children };
              } else {
                return { name, path: rel, type: 'file' };
              }
            } catch { return null; }
          }

          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 200;
          if (!projDir) {
            res.end(JSON.stringify({ success: false, error: 'Projet introuvable', tree: null }));
            return;
          }
          const tree = buildTree(projDir, projDir);
          res.end(JSON.stringify({ success: true, tree }));
          return;
        }

        // 6. Lecture de fichier (Read)
        if (url.startsWith('/api/fs/read')) {
          const parsedUrl = new URL(url, 'http://localhost');
          const rawProj = (parsedUrl.searchParams.get('project') || '').trim();
          const proj = rawProj.replace(/[^a-zA-Z0-9_\-]/g, '_');
          const file = (parsedUrl.searchParams.get('file') || '').replace(/\.\./g, '');
          const candidateDirs = [
            pathLib.join('e:\\ZAI', rawProj),
            pathLib.join('e:\\ZAI', proj),
            pathLib.join('e:\\worldmodelv2\\boilerplates\\projets', proj),
            pathLib.join('e:\\v0reponses\\v0-moteur-electron\\v0saveprojets', proj),
            pathLib.join('e:\\v0reponses\\v0saveprojets', proj),
            pathLib.join(process.cwd(), 'v0saveprojets', proj),
            pathLib.join('/var/projects', proj)
          ];
          if (proj.toLowerCase() === 'p_ie' || proj.toLowerCase() === 'pie') {
            candidateDirs.unshift('e:\\ZAI\\piz');
          }
          const projDir = candidateDirs.find(d => fs.existsSync(d) && fs.statSync(d).isDirectory());

          res.setHeader('Content-Type', 'application/json');
          if (!projDir) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: false, error: 'Projet introuvable' }));
            return;
          }
          const fullPath = pathLib.join(projDir, file);
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true, content, file }));
          } catch (e: any) {
            res.statusCode = 200;
            res.end(JSON.stringify({ success: false, error: e.message }));
          }
          return;
        }

        // 7. Écriture de fichier (Write)
        if (url.startsWith('/api/fs/write') && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body || '{}');
              const rawProj = (parsed.project || '').trim();
              const proj = rawProj.replace(/[^a-zA-Z0-9_\-]/g, '_');
              const file = (parsed.file || '').replace(/\.\./g, '');
              const content = parsed.content !== undefined ? parsed.content : '';
              const candidateDirs = [
                pathLib.join('e:\\ZAI', rawProj),
                pathLib.join('e:\\ZAI', proj),
                pathLib.join('e:\\worldmodelv2\\boilerplates\\projets', proj),
                pathLib.join('e:\\v0reponses\\v0-moteur-electron\\v0saveprojets', proj),
                pathLib.join('e:\\v0reponses\\v0saveprojets', proj),
                pathLib.join(process.cwd(), 'v0saveprojets', proj),
                pathLib.join('/var/projects', proj)
              ];
              if (proj.toLowerCase() === 'p_ie' || proj.toLowerCase() === 'pie') {
                candidateDirs.unshift('e:\\ZAI\\piz');
              }
              const projDir = candidateDirs.find(d => fs.existsSync(d) && fs.statSync(d).isDirectory());
              res.setHeader('Content-Type', 'application/json');
              if (!projDir) {
                res.statusCode = 200;
                res.end(JSON.stringify({ success: false, error: 'Projet introuvable' }));
                return;
              }
              const fullPath = pathLib.join(projDir, file);
              fs.mkdirSync(pathLib.dirname(fullPath), { recursive: true });
              fs.writeFileSync(fullPath, content, 'utf8');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, message: `Fichier "${file}" sauvegardé avec succès.` }));
            } catch (e: any) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
          return;
        }

        // 8. Serve Project Static Files for Live Preview (HTML projects)
        if (url.startsWith('/api/projects/') && url.includes('/preview/')) {
          const match = url.match(/^\/api\/projects\/([^\/]+)\/preview\/(.*)$/);
          if (match) {
            const rawProj = decodeURIComponent(match[1]).trim();
            const proj = rawProj.replace(/[^a-zA-Z0-9_\-]/g, '_');
            const file = match[2] || 'index.html';
            
            const candidateDirs = [
              pathLib.join('e:\\ZAI', rawProj),
              pathLib.join('e:\\ZAI', proj),
              pathLib.join('e:\\worldmodelv2\\boilerplates\\projets', proj),
              pathLib.join('e:\\v0reponses\\v0-moteur-electron\\v0saveprojets', proj),
              pathLib.join('e:\\v0reponses\\v0saveprojets', proj),
              pathLib.join(process.cwd(), 'v0saveprojets', proj),
              pathLib.join('/var/projects', proj)
            ];
            
            const projDir = candidateDirs.find(d => fs.existsSync(d) && fs.statSync(d).isDirectory());
            
            if (projDir) {
              const fullPath = pathLib.join(projDir, file);
              if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                const ext = pathLib.extname(fullPath).toLowerCase();
                const mimeTypes: Record<string, string> = {
                  '.html': 'text/html',
                  '.htm': 'text/html',
                  '.css': 'text/css',
                  '.js': 'application/javascript',
                  '.json': 'application/json',
                  '.png': 'image/png',
                  '.jpg': 'image/jpeg',
                  '.jpeg': 'image/jpeg',
                  '.svg': 'image/svg+xml'
                };
                res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
                res.statusCode = 200;
                fs.createReadStream(fullPath).pipe(res);
                return;
              }
            }
            
            // Fichier non trouvé
            res.setHeader('Content-Type', 'text/html');
            res.statusCode = 404;
            res.end('<h1>404 Not Found</h1><p>Fichier introuvable dans le projet.</p>');
            return;
          }
        }

        next();
      });
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  plugins: [react(), devApiMockPlugin()],
  server: {
    port: 3006,
    strictPort: true,
    proxy: {
      '/v1/bridge': {
        target: 'http://localhost:5006',
        changeOrigin: true
      },
      '/v1': {
        target: 'http://localhost:5006',
        changeOrigin: true
      },
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
      },
      '/api/debug': {
        target: 'http://localhost:5006',
        changeOrigin: true
      },
      '/preview-proxy': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/preview-proxy/, '')
      },
      '/api': {
        target: 'http://localhost:3000',
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
