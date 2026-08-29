import { getNeonClient } from '../_lib/neonClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function onRequestPost(context: any) {
  try {
    const env = context.env;
    const request = context.request;
    const sql = getNeonClient(env);

    // Auto-création de la table si elle n'existe pas
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const { email, password } = await request.json() as any;
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email et mot de passe requis' }), { status: 400 });
    }

    const users = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`;
    if (users.length === 0) {
      return new Response(JSON.stringify({ error: 'Identifiants incorrects' }), { status: 401 });
    }

    const user = users[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Identifiants incorrects' }), { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      env.JWT_SECRET || 'kirov5_sovereign_forge_secret_key_2026',
      { expiresIn: '7d' }
    );

    return new Response(JSON.stringify({
      success: true,
      message: 'Connexion réussie',
      token,
      userId: user.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Erreur API Login:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne: ' + (error?.message || error) }), { status: 500 });
  }
}
