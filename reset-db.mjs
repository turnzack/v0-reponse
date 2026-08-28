import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';

let dbUrl = process.argv[2] || process.env.DATABASE_URL;

// Charger .env.local si dbUrl n'est pas passé en argument
if (!dbUrl && existsSync('.env.local')) {
  const envConfig = readFileSync('.env.local', 'utf-8');
  for (const line of envConfig.split('\n')) {
    const [key, ...value] = line.split('=');
    if (key?.trim() === 'DATABASE_URL') {
      dbUrl = value.join('=').trim();
      break;
    }
  }
}

if (!dbUrl || !dbUrl.startsWith('postgres')) {
  console.error('\n❌ Erreur : URL de connexion Neon manquante ou invalide !');
  console.error('\n👉 Usage : node reset-db.mjs "votre_connection_string_neon"');
  console.error('   Exemple : node reset-db.mjs "postgresql://neondb_owner:abc123xyz@ep-cool-name.eu-west-2.aws.neon.tech/neondb?sslmode=require"\n');
  process.exit(1);
}

const sql = neon(dbUrl);

async function resetDb() {
  console.log('🧹 Nettoyage complet de la base de données Neon en cours...');
  try {
    await sql`DROP SCHEMA public CASCADE;`;
    await sql`CREATE SCHEMA public;`;
    await sql`GRANT ALL ON SCHEMA public TO public;`;
    console.log('✨ SUCCÈS : Base de données Neon 100% nettoyée et remise à neuf !');
  } catch (err) {
    console.error('❌ Erreur lors du nettoyage:', err.message || err);
  }
}

resetDb();
