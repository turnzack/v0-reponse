#!/usr/bin/env node
/**
 * Kirov5 - Script d'exécution des migrations Neon PostgreSQL
 * Usage: node run-migrations.mjs
 * Prérequis: DATABASE_URL dans l'environnement
 */
import { neon } from '@neondatabase/serverless';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL manquante !');
  console.error('   Ajoutez-la dans vos variables d\'environnement ou dans un fichier .env.local');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function runMigrations() {
  const migrationsDir = join(__dirname, 'migrations');
  
  // Créer la table de suivi des migrations si elle n'existe pas
  await sql(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Ordre alphabétique = ordre numérique (001_, 002_, ...)

  let applied = 0;

  for (const file of files) {
    const row = await sql(`SELECT filename FROM schema_migrations WHERE filename = $1`, [file]);
    
    if (row.length > 0) {
      console.log(`  ⏩ ${file} — déjà appliquée`);
      continue;
    }

    const migrationSQL = readFileSync(join(migrationsDir, file), 'utf-8');
    
    try {
      await sql(migrationSQL);
      await sql(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [file]);
      console.log(`  ✅ ${file} — appliquée avec succès`);
      applied++;
    } catch (err) {
      console.error(`  ❌ ${file} — ERREUR:`, err.message);
      process.exit(1);
    }
  }

  console.log(`\n🎉 Migrations terminées : ${applied} appliquée(s), ${files.length - applied} ignorée(s)`);
}

console.log('🚀 Kirov5 - Exécution des migrations Neon PostgreSQL...\n');
runMigrations().catch(err => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
