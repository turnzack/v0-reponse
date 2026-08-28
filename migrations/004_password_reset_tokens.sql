-- Migration 004 : Tokens Reset Mot de Passe (Usage Unique)
-- Kirov5 Sovereign Forge - Phase 1 Auth

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE, -- Token aléatoire haché, à usage unique
    expires_at TIMESTAMPTZ NOT NULL,  -- Expiration courte : 15 minutes
    used_at TIMESTAMPTZ,              -- Marqué après utilisation (invalidé)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
