/**
 * Kirov5 Sovereign Forge - Neon PostgreSQL Client
 * ⚠️  SERVER-SIDE ONLY — Ne jamais importer dans src/ (bundle frontend)
 * Utilisé uniquement dans api/ (Vercel Serverless Functions)
 */
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('[NEON] DATABASE_URL manquante dans les variables d\'environnement Vercel');
}

export const sql = neon(process.env.DATABASE_URL);

// Helper typé pour les requêtes paramétrées sécurisées
export async function query<T = Record<string, unknown>>(
  queryText: string,
  params: unknown[] = []
): Promise<T[]> {
  return sql(queryText, params) as Promise<T[]>;
}
