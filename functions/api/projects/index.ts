import { getNeonClient } from '../_lib/neonClient';
import jwt from 'jsonwebtoken';

function getAuthUser(request: Request, env: any): { userId: number; email: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET || 'kirov5_sovereign_forge_secret_key_2026'
    ) as any;
    
    return {
      userId: Number(decoded.userId),
      email: decoded.email
    };
  } catch {
    return null;
  }
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const user = getAuthUser(request, env);
  
  if (!user || !user.userId) {
    return new Response(JSON.stringify({ error: 'Accès non autorisé. Veuillez vous connecter.' }), { status: 401 });
  }

  try {
    const sql = getNeonClient(env);
    
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

    const projects = await sql`
      SELECT project_id, title, content, updated_at 
      FROM user_projects 
      WHERE user_id = ${user.userId}
      ORDER BY updated_at DESC
    `;

    return new Response(JSON.stringify({
      success: true,
      userId: user.userId,
      projects
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Erreur API User Projects GET:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne: ' + (error?.message || error) }), { status: 500 });
  }
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  const user = getAuthUser(request, env);
  
  if (!user || !user.userId) {
    return new Response(JSON.stringify({ error: 'Accès non autorisé. Veuillez vous connecter.' }), { status: 401 });
  }

  try {
    const sql = getNeonClient(env);
    const { projectId, title, content } = await request.json() as any;
    
    if (!projectId || !title) {
      return new Response(JSON.stringify({ error: 'projectId et title sont requis' }), { status: 400 });
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

    return new Response(JSON.stringify({
      success: true,
      message: 'Projet sauvegardé en toute sécurité dans votre espace Neon'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Erreur API User Projects POST:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne: ' + (error?.message || error) }), { status: 500 });
  }
}

export async function onRequestDelete(context: any) {
  const { request, env } = context;
  const user = getAuthUser(request, env);
  
  if (!user || !user.userId) {
    return new Response(JSON.stringify({ error: 'Accès non autorisé. Veuillez vous connecter.' }), { status: 401 });
  }

  try {
    const sql = getNeonClient(env);
    const { projectId } = await request.json() as any;
    
    if (!projectId) {
      return new Response(JSON.stringify({ error: 'projectId requis' }), { status: 400 });
    }

    await sql`
      DELETE FROM user_projects 
      WHERE user_id = ${user.userId} AND project_id = ${projectId}
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Projet supprimé de votre espace'
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Erreur API User Projects DELETE:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne: ' + (error?.message || error) }), { status: 500 });
  }
}
