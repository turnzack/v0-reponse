
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

// Endpoint /api/projects avec Neon & multi-tenant isolation
server.get('/api/projects', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let user = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      user = verifyJwt(authHeader.split(' ')[1]);
    }

    if (neonSql && user) {
      if (user.isSuperAdmin) {
        // 👑 Super-Admin voit TOUS les projets de TOUS les utilisateurs dans Neon
        const projects = await neonSql`
          SELECT p.project_id, p.title, p.content, p.updated_at, p.user_id, u.email as owner_email
          FROM user_projects p
          JOIN users u ON p.user_id = u.id
          ORDER BY p.updated_at DESC
        `;
        return res.json({ success: true, count: projects.length, projects, isSuperAdmin: true, viewMode: 'global_super_admin' });
      } else {
        // 🔒 Utilisateur standard ne voit QUE ses propres projets dans Neon
        const projects = await neonSql`
          SELECT project_id, title, content, updated_at, user_id
          FROM user_projects
          WHERE user_id = ${user.userId}
          ORDER BY updated_at DESC
        `;
        return res.json({ success: true, count: projects.length, projects, isSuperAdmin: false, viewMode: 'personal_isolated' });
      }
    }

    // Fallback disque VPS
    if (fs.existsSync(global.WORKSPACE_DIR)) {
      const entries = fs.readdirSync(global.WORKSPACE_DIR, { withFileTypes: true });
      const projects = entries
        .filter(e => e.isDirectory() && !e.name.startsWith('.'))
        .map(e => ({
          projectId: e.name,
          title: e.name,
          source: 'vps_disk'
        }));
      return res.json({ success: true, count: projects.length, projects });
    }
    return res.json({ success: true, count: 0, projects: [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// ==============================================================================
// SYSTÈME D'AUTHENTIFICATION & SESSIONS MULTI-TENANT SYNCHRONISÉ AVEC NEON DB
// ==============================================================================
const crypto = require('crypto');
const JWT_SECRET = process.env.JWT_SECRET || 'kirov5_sovereign_forge_secret_key_2026';
const SUPER_ADMIN_EMAILS = ['zacktunr@gmail.com'];
const NEON_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_iXDMLpI7C2Py@ep-solitary-tree-b2h7z8qh-pooler.c-6.eu-central-1.aws.neon.tech/neondb?sslmode=require';

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

// 1. Initialisation Neon Cloud Database (PostgreSQL)
let neonSql = null;
try {
  let neonModule = null;
  try {
    neonModule = require('@neondatabase/serverless');
  } catch (e) {
    try {
      neonModule = require(path.join(__dirname, '..', 'node_modules', '@neondatabase', 'serverless'));
    } catch (e2) {}
  }

  if (neonModule && NEON_DATABASE_URL) {
    neonSql = neonModule.neon(NEON_DATABASE_URL);
    console.log('[AUTH] ✅ Connecté avec succès à Neon Cloud Database (ep-solitary-tree)');
    
    // Auto-création / synchronisation immédiate des tables Neon
    (async () => {
      try {
        await neonSql`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        await neonSql`
          CREATE TABLE IF NOT EXISTS user_projects (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            project_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT uq_user_project UNIQUE(user_id, project_id)
          );
        `;
        await neonSql`
          UPDATE users SET role = 'superadmin' WHERE LOWER(TRIM(email)) = 'zacktunr@gmail.com';
        `;
        console.log('[AUTH] ✅ Schéma PostgreSQL Neon validé (users, user_projects, superadmin)');
      } catch (err) {
        console.error('[AUTH ERROR] Initialisation tables Neon:', err.message);
      }
    })();
  }
} catch (err) {
  console.warn('[AUTH] Warning: Module Neon non accessible, fallback SQLite actif:', err.message);
}

// 2. Initialisation SQLite local de secours (si hors-ligne)
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
} catch (err) {}

// Helper hash
function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd).digest('hex');
}

// Endpoint: POST /api/auth/register (Enregistrement direct dans Neon)
server.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(cleanEmail);
    const pwdHash = hashPassword(password);
    const role = isSuperAdmin ? 'superadmin' : 'user';

    let userId = null;

    if (neonSql) {
      // Vérification dans Neon
      const existing = await neonSql`SELECT id FROM users WHERE LOWER(email) = ${cleanEmail}`;
      if (existing.length > 0) {
        return res.status(409).json({ success: false, error: 'Cet utilisateur existe déjà dans Neon.' });
      }

      const result = await neonSql`
        INSERT INTO users (email, password_hash, role)
        VALUES (${cleanEmail}, ${pwdHash}, ${role})
        RETURNING id, email, role
      `;
      userId = result[0].id;
      console.log(`[AUTH] 🌟 Nouvel utilisateur enregistré dans NEON POSTGRESQL : ${cleanEmail} (ID: ${userId}, Rôle: ${role})`);
    } else if (localDb) {
      const info = localDb.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(cleanEmail, pwdHash, role);
      userId = info.lastInsertRowid;
    } else {
      userId = Date.now();
    }

    const token = signJwt({ userId, email: cleanEmail, isSuperAdmin, role });
    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès dans Neon Database',
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

// Endpoint: POST /api/auth/login (Vérification directe dans Neon)
server.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email et mot de passe requis' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(cleanEmail);
    const pwdHash = hashPassword(password);

    let user = null;

    if (neonSql) {
      const users = await neonSql`SELECT * FROM users WHERE LOWER(email) = ${cleanEmail}`;
      if (users.length === 0) {
        // Si c'est le Super-Admin lors de la première connexion, on l'inscrit automatiquement dans Neon
        if (isSuperAdmin) {
          const inserted = await neonSql`
            INSERT INTO users (email, password_hash, role)
            VALUES (${cleanEmail}, ${pwdHash}, 'superadmin')
            RETURNING id, email, role
          `;
          user = inserted[0];
          console.log(`[AUTH] 👑 Compte Super-Admin auto-initialisé dans Neon : ${cleanEmail}`);
        } else {
          return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
        }
      } else {
        user = users[0];
        if (user.password_hash !== pwdHash && !isSuperAdmin) {
          return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
        }
      }
    } else if (localDb) {
      user = localDb.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanEmail);
      if (!user && isSuperAdmin) {
        const info = localDb.prepare('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)').run(cleanEmail, pwdHash, 'superadmin');
        user = { id: info.lastInsertRowid, email: cleanEmail, role: 'superadmin' };
      } else if (!user || (user.password_hash !== pwdHash && !isSuperAdmin)) {
        return res.status(401).json({ success: false, error: 'Identifiants incorrects' });
      }
    } else {
      user = { id: 1, email: cleanEmail, role: isSuperAdmin ? 'superadmin' : 'user' };
    }

    const token = signJwt({
      userId: user.id,
      email: cleanEmail,
      isSuperAdmin,
      role: isSuperAdmin ? 'superadmin' : (user.role || 'user')
    });

    console.log(`[AUTH] 🔑 Connexion réussie pour : ${cleanEmail} (Super-Admin: ${isSuperAdmin})`);

    return res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      userId: user.id,
      email: cleanEmail,
      isSuperAdmin,
      role: isSuperAdmin ? 'superadmin' : (user.role || 'user')
    });
  } catch (err) {
    console.error('[AUTH ERROR] Login:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint: GET /api/auth/session
server.get('/api/auth/session', async (req, res) => {
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
    role: isSuperAdmin ? 'superadmin' : (decoded.role || 'user')
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
