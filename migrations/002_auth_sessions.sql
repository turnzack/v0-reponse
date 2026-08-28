-- Migration 002 : Sessions Web HttpOnly
-- Kirov5 Sovereign Forge - Phase 1 Auth

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash BYTEA NOT NULL UNIQUE, -- Hash SHA-256 du token brut (jamais en clair)
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,           -- NULL = active, non-NULL = révoquée
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
