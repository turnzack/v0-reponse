
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
const PORT = process.env.PORT || 5006;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[TIGER VPS SERVER] 🚀 Moteur Cloud prêt et en écoute sur http://0.0.0.0:${PORT}`);
  console.log(`[TIGER VPS SERVER] 📁 Espace de projets : ${global.WORKSPACE_DIR}`);
});
