/**
 * POST /api/auth/password-reset/request
 * Génération d'un token de reset MDP (usage unique, 15 min)
 * ⚠️  SERVER-SIDE ONLY
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/neonClient.js';
import { generateToken, hashToken, corsHeaders } from '../../_lib/authUtils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).set(corsHeaders()).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const { email } = req.body ?? {};

  if (typeof email !== 'string') {
    return res.status(400).json({ error: 'EMAIL_REQUIRED' });
  }

  // Réponse identique qu'il existe ou non — anti-enumération
  const GENERIC_RESPONSE = { ok: true, message: 'Si cet email existe, un lien a été envoyé.' };

  try {
    const users = await query<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (users.length === 0) {
      // Délai simulé pour éviter timing attack
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
      return res.status(200).set(corsHeaders()).json(GENERIC_RESPONSE);
    }

    const userId = users[0].id;
    const resetToken = generateToken(32);
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt.toISOString()]
    );

    // TODO: Envoyer l'email avec le token brut (resetToken)
    // ex: await sendResetEmail(email, resetToken);
    console.log(`[PASSWORD_RESET] Token généré pour ${email} — À envoyer par email`);

    return res.status(200).set(corsHeaders()).json(GENERIC_RESPONSE);

  } catch (err) {
    console.error('[AUTH/RESET-REQUEST] Erreur:', err instanceof Error ? err.message : 'Unknown');
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}
