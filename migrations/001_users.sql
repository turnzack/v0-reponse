-- Migration 001 : Table des utilisateurs
-- Kirov5 Sovereign Forge - Phase 1 Auth
-- Exécuter sur Neon PostgreSQL Dashboard ou via psql

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,  -- Haché Argon2id UNIQUEMENT — jamais en clair
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
