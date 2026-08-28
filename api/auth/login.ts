import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).set(corsHeaders).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL non configuré sur Vercel' });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Auto-création pour s'assurer que ça ne crash pas si la table n'est pas encore là
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    const users = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`;
    if (users.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const user = users[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret_key_kirov5_jwt',
      { expiresIn: '7d' }
    );

    return res.status(200).set(corsHeaders).json({
      success: true,
      message: 'Connexion réussie',
      token,
      userId: user.id
    });

  } catch (error: any) {
    console.error('Erreur API Login:', error);
    return res.status(500).json({ error: 'Erreur interne: ' + error.message });
  }
}
