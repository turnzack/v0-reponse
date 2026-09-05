
// Headless Electron Mock for Linux/VPS
try {
  require('electron');
} catch (e) {
  const Module = require('module');
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id === 'electron') {
      return {
        shell: {
          openExternal: async (url) => { console.log('[Headless Mock] OpenExternal:', url); return true; },
          openPath: async (p) => { console.log('[Headless Mock] OpenPath:', p); return ''; }
        },
        dialog: {
          showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
          showSaveDialog: async () => ({ canceled: true, filePath: '' })
        },
        BrowserWindow: class {
          constructor() {}
          loadURL() {}
          webContents = { executeJavaScript: async () => '' };
          close() {}
          show() {}
        },
        app: {
          getPath: () => '/tmp',
          isPackaged: false
        }
      };
    }
    return originalRequire.apply(this, arguments);
  };
}

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration de l'environnement de travail Linux / VPS
global.WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.join(__dirname, 'v0saveprojets');
if (!fs.existsSync(global.WORKSPACE_DIR)) {
  fs.mkdirSync(global.WORKSPACE_DIR, { recursive: true });
}

// Système de logs global (partagé avec le routeur)
let globalLogs = ["> Moteur Serveur Headless Kirov5 prêt sur Linux/VPS (Contabo Cloud)."];
function addLog(msg) {
  const time = new Date().toLocaleTimeString('fr-FR', { hour12: false });
  globalLogs.push(`[${time}] ${msg}`);
  if (globalLogs.length > 50) globalLogs.shift();
  console.log(msg);
}
global.addLog = addLog;
global._blockedMissions = global._blockedMissions || new Set();

const server = express();

// Chrome Private Network Access (PNA) & CORS Bypass
server.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Private-Network', 'true');
  
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, x-api-key');
    return res.status(200).end();
  }
  next();
});

server.use(cors({
  origin: true,
  credentials: true
}));

server.use(express.json({ limit: '50mb' }));

// Logs Endpoint
server.get('/api/logs', (req, res) => {
  res.json({ success: true, logs: globalLogs });
});

// Import & Mount V5 Canonical Router
const v5Router = require('./electron/orchestrator/routes/v5-router');
server.use('/api/mobile/v5', v5Router);
server.use('/', v5Router);

// Endpoint Health / Status
server.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'vps_headless',
    workspace: global.WORKSPACE_DIR,
    timestamp: Date.now()
  });
});

// Port configuration
// Endpoint Super-Admin : Statistiques Système VPS & Disque
server.get('/api/admin/system', (req, res) => {
  const os = require('os');
  const totalMem = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
  const freeMem = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
  const usedMem = (totalMem - freeMem).toFixed(2);

  let diskProjects = [];
  try {
    if (fs.existsSync(global.WORKSPACE_DIR)) {
      const entries = fs.readdirSync(global.WORKSPACE_DIR, { withFileTypes: true });
      diskProjects = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => {
          const pPath = path.join(global.WORKSPACE_DIR, e.name);
          let fileCount = 0;
          try {
            fileCount = fs.readdirSync(pPath).length;
          } catch (_) {}
          return {
            name: e.name,
            files: fileCount,
            path: pPath
          };
        });
    }
  } catch(e) {}

  res.json({
    success: true,
    superAdmin: 'zacktunr@gmail.com',
    system: {
      uptimeSeconds: Math.floor(os.uptime()),
      cpuCores: os.cpus().length,
      ramTotalGB: totalMem,
      ramUsedGB: usedMem,
      ramFreeGB: freeMem,
      projectsOnDisk: diskProjects.length,
      workspacePath: global.WORKSPACE_DIR,
      projects: diskProjects
    }
  });
});

// Endpoint fallback /api/projects sur Express
server.get('/api/projects', (req, res) => {
  try {
    if (!fs.existsSync(global.WORKSPACE_DIR)) {
      return res.json({ success: true, count: 0, projects: [] });
    }
    const entries = fs.readdirSync(global.WORKSPACE_DIR, { withFileTypes: true });
    const projects = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.'))
      .map(e => ({
        projectId: e.name,
        title: e.name,
        source: 'vps_disk'
      }));
    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5006;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[TIGER VPS SERVER] 🚀 Moteur Cloud prêt et en écoute sur http://0.0.0.0:${PORT}`);
  console.log(`[TIGER VPS SERVER] 📁 Espace de projets : ${global.WORKSPACE_DIR}`);
});
