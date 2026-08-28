import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function applyCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL non configuré sur Vercel' });
    }

    const sql = neon(process.env.DATABASE_URL);

    // Auto-création de la table si elle n'existe pas
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

    // Vérifier si l'utilisateur existe déjà
    const existingUsers = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`;
    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'Cet agent existe déjà dans le Nexus.' });
    }

    // Hachage du mot de passe
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertion
    const result = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${email.toLowerCase().trim()}, ${passwordHash})
      RETURNING id, email
    `;

    const user = result[0];

    // Création du JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'kirov5_sovereign_forge_secret_key_2026',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Habilitation créée avec succès',
      token,
      userId: user.id
    });

  } catch (error: any) {
    console.error('Erreur API Register:', error);
    return res.status(500).json({ error: 'Erreur interne: ' + (error?.message || error) });
  }
}
