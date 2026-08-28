import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Extraction sécurisée du userId depuis le jeton JWT
function getAuthUser(req: VercelRequest): { userId: number; email: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'kirov5_sovereign_forge_secret_key_2026'
    ) as any;
    
    return {
      userId: Number(decoded.userId),
      email: decoded.email
    };
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 🔒 VÉRIFICATION ABSOLUE DU USER : Seul l'utilisateur du token a accès !
  const user = getAuthUser(req);
  if (!user || !user.userId) {
    return res.status(401).json({ error: 'Accès non autorisé. Veuillez vous connecter.' });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL non configurée' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Auto-création de la table si elle n'existe pas encore
    await sql`
      CREATE TABLE IF NOT EXISTS user_projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, project_id)
      )
    `;

    // ─────────────────────────────────────────────
    // 1. GET : Récupérer UNIQUEMENT les projets de cet utilisateur
    // ─────────────────────────────────────────────
    if (req.method === 'GET') {
      const projects = await sql`
        SELECT project_id, title, content, updated_at 
        FROM user_projects 
        WHERE user_id = ${user.userId}
        ORDER BY updated_at DESC
      `;

      return res.status(200).json({
        success: true,
        userId: user.userId,
        projects
      });
    }

    // ─────────────────────────────────────────────
    // 2. POST : Sauvegarder un projet POUR cet utilisateur uniquement
    // ─────────────────────────────────────────────
    if (req.method === 'POST') {
      const { projectId, title, content } = req.body ?? {};
      if (!projectId || !title) {
        return res.status(400).json({ error: 'projectId et title sont requis' });
      }

      await sql`
        INSERT INTO user_projects (user_id, project_id, title, content, updated_at)
        VALUES (${user.userId}, ${projectId}, ${title}, ${JSON.stringify(content || {})}, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, project_id) 
        DO UPDATE SET 
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          updated_at = CURRENT_TIMESTAMP
      `;

      return res.status(200).json({
        success: true,
        message: 'Projet sauvegardé en toute sécurité dans votre espace Neon'
      });
    }

    // ─────────────────────────────────────────────
    // 3. DELETE : Supprimer un projet de cet utilisateur
    // ─────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { projectId } = req.body ?? {};
      if (!projectId) {
        return res.status(400).json({ error: 'projectId requis' });
      }

      await sql`
        DELETE FROM user_projects 
        WHERE user_id = ${user.userId} AND project_id = ${projectId}
      `;

      return res.status(200).json({
        success: true,
        message: 'Projet supprimé de votre espace'
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error: any) {
    console.error('Erreur API User Projects:', error);
    return res.status(500).json({ error: 'Erreur interne: ' + (error?.message || error) });
  }
}
