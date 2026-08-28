/**
 * POST /api/auth/password-reset/confirm
 * Validation du token + nouveau hash Argon2id + révocation sessions
 * ⚠️  SERVER-SIDE ONLY
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../../_lib/neonClient.js';
import { hashPassword, hashToken, corsHeaders } from '../../_lib/authUtils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).set(corsHeaders()).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const { token, newPassword } = req.body ?? {};

  if (typeof token !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'INVALID_INPUT' });
  }

  if (newPassword.length < 8 || newPassword.length > 128) {
    return res.status(400).json({ error: 'PASSWORD_INVALID_LENGTH' });
  }

  try {
    const tokenHash = hashToken(token);

    const tokens = await query<{ id: string; user_id: string; used_at: string | null }>(
      `SELECT id, user_id, used_at
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND expires_at > now()`,
      [tokenHash]
    );

    if (tokens.length === 0) {
      return res.status(400).json({ error: 'TOKEN_INVALID_OR_EXPIRED' });
    }

    const resetEntry = tokens[0];

    // Vérifier que le token n'a pas déjà été utilisé
    if (resetEntry.used_at !== null) {
      return res.status(400).json({ error: 'TOKEN_ALREADY_USED' });
    }

    // Hacher le nouveau mot de passe avec Argon2id
    const newHash = await hashPassword(newPassword);

    // Mettre à jour le mot de passe ET marquer le token comme utilisé
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, resetEntry.user_id]);
    await query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [resetEntry.id]);

    // Révoquer TOUTES les sessions existantes (sécurité post-reset)
    await query(
      'UPDATE auth_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [resetEntry.user_id]
    );
    await query(
      'UPDATE device_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
      [resetEntry.user_id]
    );

    return res.status(200).set(corsHeaders()).json({ ok: true });

  } catch (err) {
    console.error('[AUTH/RESET-CONFIRM] Erreur:', err instanceof Error ? err.message : 'Unknown');
    return res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
}
