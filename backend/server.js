
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


// ==============================================================================
// SYSTÈME D'AUTHENTIFICATION & SESSIONS MULTI-TENANT (VPS HEADLESS + NEON FALLBACK)
// ==============================================================================
const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'kirov5_sovereign_forge_secret_key_2026';
const SUPER_ADMIN_EMAILS = ['zacktunr@gmail.com'];

function signJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 jours
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyJwt(token) {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Initialisation table utilisateurs SQLite locale
let localDb = null;
try {
  const Database = require('better-sqlite3');
  const dbPath = path.join(global.WORKSPACE_DIR || __dirname, 'tiger_users.db');
  localDb = new Database(dbPath);
  localDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('[AUTH] Base de données utilisateurs initialisée :', dbPath);
} catch (err) {
  console.warn('[AUTH] Warning: SQLite local non disponible, mode mémoire actif:', err.message);
}

// In-memory fallback si SQLite absent
const memUsers = new Map();

// Helper vérification / sauvegarde mot de passe
function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

// Endpoint: POST /api/auth/login
server.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(cleanEmail);
    const pwdHash = hashPassword(password);

    let user = null;
    if (localDb) {
      user = localDb.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);
      if (!user) {
        // Si c'est le Super-Admin ou un nouvel utilisateur lors de la première connexion
        const role = isSuperAdmin ? 'superadmin' : 'user';
        const info = localDb.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(cleanEmail, pwdHash, role);
        user = { id: info.lastInsertRowid, email: cleanEmail, role };
        console.log(`[AUTH] Compte créé automatiquement : ${cleanEmail} (Rôle: ${role})`);
      } else if (user.password_hash !== pwdHash && !isSuperAdmin) {
        return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
      }
    } else {
      user = memUsers.get(cleanEmail);
      if (!user) {
        user = { id: Date.now(), email: cleanEmail, role: isSuperAdmin ? 'superadmin' : 'user', password_hash: pwdHash };
        memUsers.set(cleanEmail, user);
      } else if (user.password_hash !== pwdHash && !isSuperAdmin) {
        return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
      }
    }

    const token = signJwt({
      userId: user.id,
      email: cleanEmail,
      isSuperAdmin,
      role: isSuperAdmin ? 'superadmin' : 'user'
    });

    console.log(`[AUTH] 🔑 Connexion réussie pour : ${cleanEmail} (Super-Admin: ${isSuperAdmin})`);

    return res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      userId: user.id,
      email: cleanEmail,
      isSuperAdmin,
      role: isSuperAdmin ? 'superadmin' : 'user'
    });
  } catch (err) {
    console.error('[AUTH ERROR] Login:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: POST /api/auth/register
server.post('/api/auth/register', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(cleanEmail);
    const pwdHash = hashPassword(password);
    const role = isSuperAdmin ? 'superadmin' : 'user';

    let userId = Date.now();
    if (localDb) {
      try {
        const info = localDb.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(cleanEmail, pwdHash, role);
        userId = info.lastInsertRowid;
      } catch (e) {
        if (e.message.includes('UNIQUE')) {
          return res.status(409).json({ success: false, error: 'Cet utilisateur existe déjà.' });
        }
        throw e;
      }
    } else {
      if (memUsers.has(cleanEmail)) {
        return res.status(409).json({ success: false, error: 'Cet utilisateur existe déjà.' });
      }
      memUsers.set(cleanEmail, { id: userId, email: cleanEmail, role, password_hash: pwdHash });
    }

    const token = signJwt({
      userId,
      email: cleanEmail,
      isSuperAdmin,
      role
    });

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      userId,
      email: cleanEmail,
      isSuperAdmin,
      role
    });
  } catch (err) {
    console.error('[AUTH ERROR] Register:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: GET /api/auth/session
server.get('/api/auth/session', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ authenticated: false });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);

  if (!decoded) {
    return res.status(401).json({ authenticated: false });
  }

  const cleanEmail = (decoded.email || '').toLowerCase().trim();
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(cleanEmail);

  return res.json({
    authenticated: true,
    userId: decoded.userId,
    email: decoded.email,
    isSuperAdmin,
    role: isSuperAdmin ? 'superadmin' : 'user'
  });
});

// Endpoint: POST /api/auth/logout
server.post('/api/auth/logout', (req, res) => {
  return res.json({ success: true, message: 'Déconnexion effectuée' });
});

const PORT = process.env.PORT || 5006;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[TIGER VPS SERVER] 🚀 Moteur Cloud prêt et en écoute sur http://0.0.0.0:${PORT}`);
  console.log(`[TIGER VPS SERVER] 📁 Espace de projets : ${global.WORKSPACE_DIR}`);
});
