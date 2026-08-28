/**
 * POST /api/auth/logout
 * Révocation avec schéma minimal
 * ⚠️  SERVER-SIDE ONLY
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from '../_lib/neonClient.js';
import { buildClearCookie, SESSION_COOKIE, corsHeaders } from '../_lib/authUtils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).set(corsHeaders()).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
  }

  const cookieHeader = req.headers.cookie ?? '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1];

  if (token) {
    try {
      await query('DELETE FROM "Session" WHERE "sessionToken" = $1', [token]);
    } catch (err) {
      console.error('[AUTH/LOGOUT] Erreur:', err instanceof Error ? err.message : 'Unknown');
    }
  }

  return res
    .status(200)
    .setHeader('Set-Cookie', buildClearCookie())
    .set(corsHeaders())
    .json({ ok: true });
}
