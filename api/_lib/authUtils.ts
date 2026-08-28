/**
 * Kirov5 Sovereign Forge - Auth Utilities
 * ⚠️  SERVER-SIDE ONLY — Ne jamais importer dans src/
 */
import { hash, verify } from '@node-rs/argon2';
import { randomBytes, createHash } from 'crypto';

// ─── Argon2id Password Hashing (OWASP recommandé) ─────────────────────────

export async function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, {
    algorithm: 2,           // Argon2id
    memoryCost: 65536,      // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  return verify(hash, plaintext);
}

// ─── Token Generation (Session & Reset) ───────────────────────────────────

/** Génère un token aléatoire cryptographiquement sûr */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/** Hash un token brut en SHA-256 pour stockage en base */
export function hashToken(token: string): Buffer {
  return createHash('sha256').update(token).digest();
}

// ─── Cookie Helpers ────────────────────────────────────────────────────────

export const SESSION_COOKIE = 'kirov5_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours

export function buildSessionCookie(token: string, httpOnly = true): string {
  const expires = new Date(Date.now() + SESSION_DURATION_MS).toUTCString();
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const httpOnlyFlag = httpOnly ? '; HttpOnly' : '';
  return `${SESSION_COOKIE}=${token}; Path=/; SameSite=Lax${secure}${httpOnlyFlag}; Expires=${expires}`;
}

export function buildClearCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; SameSite=Lax; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

// ─── CORS Headers pour API ────────────────────────────────────────────────

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3006',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

// ─── Rate Limiting (simple en mémoire pour MVP — utiliser KV en prod) ─────

const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(identifier: string): { blocked: boolean; remaining: number } {
  const now = Date.now();
  const record = loginAttempts.get(identifier);

  if (!record || now - record.firstAttempt > RATE_LIMIT_WINDOW_MS) {
    loginAttempts.set(identifier, { count: 1, firstAttempt: now });
    return { blocked: false, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { blocked: true, remaining: 0 };
  }

  record.count++;
  return { blocked: false, remaining: RATE_LIMIT_MAX - record.count };
}

export function resetRateLimit(identifier: string): void {
  loginAttempts.delete(identifier);
}
