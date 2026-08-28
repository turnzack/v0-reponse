-- Migration 006 : Compteur de Quotas Atomique
-- Kirov5 Sovereign Forge - Phase 1 Auth

CREATE TABLE IF NOT EXISTS quota_counters (
    scope_type TEXT NOT NULL,           -- 'USER' | 'ACCOUNT' | 'SYSTEM'
    scope_id UUID NOT NULL,
    provider TEXT NOT NULL,             -- 'CLOUDFLARE_WORKERS_AI' | 'DEEPSEEK'
    period_start DATE NOT NULL,         -- CURRENT_DATE (réinitialisation quotidienne)
    limit_neurons INTEGER NOT NULL,
    used_neurons INTEGER NOT NULL DEFAULT 0,
    reserved_neurons INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (scope_type, scope_id, provider, period_start)
);

-- Migration 007 : Logs d'Audit Quota (Immuables)
CREATE TABLE IF NOT EXISTS quota_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Nullable pour événements système
    account_id UUID,
    scope_type TEXT NOT NULL,             -- 'USER' | 'ACCOUNT' | 'SYSTEM'
    mission_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    action TEXT NOT NULL,                 -- 'RESERVE' | 'CONSUME' | 'RELEASE' | 'EXPIRE' | 'REJECT'
    reservation_id TEXT,                  -- Identifiant de réservation pour idempotence
    estimated_neurons INTEGER NOT NULL,
    actual_neurons INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index d'unicité pour idempotence des réservations
CREATE UNIQUE INDEX IF NOT EXISTS quota_logs_reservation_action_unique
ON quota_logs (reservation_id, action)
WHERE reservation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quota_logs_user_id ON quota_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_quota_logs_created_at ON quota_logs(created_at);
