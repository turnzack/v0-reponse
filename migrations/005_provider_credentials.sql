-- Migration 005 : Clés API Providers Chiffrées (AES-GCM)
-- Kirov5 Sovereign Forge - Phase 1 Auth

CREATE TABLE IF NOT EXISTS user_provider_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,        -- ex: 'DEEPSEEK', 'OPENAI'
    ciphertext BYTEA NOT NULL,     -- Clé API chiffrée AES-GCM côté serveur
    key_version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider)
);
