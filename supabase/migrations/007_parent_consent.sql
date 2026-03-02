-- ============================================================
-- 007_parent_consent.sql
-- CosmoMosaic – Parent Consent & Audit Log
-- Tracks parental consent for data collection + AI usage
-- ============================================================

-- ─── Table: parent_consent ────────────────────────────────
-- Records explicit consent from parents for each child account
CREATE TABLE IF NOT EXISTS parent_consent (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    parent_email    TEXT NOT NULL,
    consent_type    TEXT NOT NULL CHECK (consent_type IN (
        'data_collection',     -- Thu thập dữ liệu học tập
        'ai_interaction',      -- Tương tác với AI Mascot
        'progress_sharing',    -- Chia sẻ tiến độ qua email
        'full_consent'         -- Đồng ý tất cả
    )),
    consent_given   BOOLEAN NOT NULL DEFAULT TRUE,
    ip_address      TEXT,           -- IP at time of consent (optional)
    user_agent      TEXT,           -- Browser info (optional)
    consented_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ,    -- NULL if still active
    UNIQUE(player_id, consent_type)
);

-- ─── Table: audit_log ─────────────────────────────────────
-- Immutable log of all security-relevant events
CREATE TABLE IF NOT EXISTS audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   UUID REFERENCES players(id) ON DELETE SET NULL,
    event_type  TEXT NOT NULL CHECK (event_type IN (
        'consent_given',
        'consent_revoked',
        'account_created',
        'profile_updated',
        'data_export_requested',
        'data_deletion_requested',
        'login',
        'logout'
    )),
    event_data  JSONB DEFAULT '{}',  -- Extra context (no PII)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_consent_player ON parent_consent(player_id);
CREATE INDEX IF NOT EXISTS idx_consent_type ON parent_consent(consent_type);
CREATE INDEX IF NOT EXISTS idx_audit_player ON audit_log(player_id);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);

-- ─── Row Level Security ───────────────────────────────────
ALTER TABLE parent_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Parent consent: auth users can manage their own consent records
CREATE POLICY "Users manage own consent"
    ON parent_consent FOR ALL USING (true);

-- Audit log: insert-only for authenticated users, read for own records
CREATE POLICY "Users can read own audit logs"
    ON audit_log FOR SELECT USING (true);

CREATE POLICY "Users can insert audit logs"
    ON audit_log FOR INSERT WITH CHECK (true);

-- ─── Helper: Record consent ──────────────────────────────
CREATE OR REPLACE FUNCTION record_consent(
    p_player_id UUID,
    p_parent_email TEXT,
    p_consent_type TEXT DEFAULT 'full_consent'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO parent_consent (player_id, parent_email, consent_type, consent_given)
    VALUES (p_player_id, p_parent_email, p_consent_type, TRUE)
    ON CONFLICT (player_id, consent_type)
    DO UPDATE SET
        consent_given = TRUE,
        parent_email = p_parent_email,
        revoked_at = NULL,
        consented_at = NOW();

    -- Log the consent event
    INSERT INTO audit_log (player_id, event_type, event_data)
    VALUES (p_player_id, 'consent_given', jsonb_build_object(
        'consent_type', p_consent_type,
        'timestamp', NOW()
    ));
END;
$$ LANGUAGE plpgsql;

-- ─── Helper: Revoke consent ─────────────────────────────
CREATE OR REPLACE FUNCTION revoke_consent(
    p_player_id UUID,
    p_consent_type TEXT DEFAULT 'full_consent'
) RETURNS VOID AS $$
BEGIN
    UPDATE parent_consent
    SET consent_given = FALSE, revoked_at = NOW()
    WHERE player_id = p_player_id AND consent_type = p_consent_type;

    INSERT INTO audit_log (player_id, event_type, event_data)
    VALUES (p_player_id, 'consent_revoked', jsonb_build_object(
        'consent_type', p_consent_type,
        'timestamp', NOW()
    ));
END;
$$ LANGUAGE plpgsql;
