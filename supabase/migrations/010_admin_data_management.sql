-- ============================================================
-- 010_admin_data_management.sql
-- CosmoMosaic – Admin Data Management System
-- Adds admin role, question status workflow, audit fields
-- ============================================================

-- ─── 1. Expand role to include 'admin' ──────────────────
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_role_check;
ALTER TABLE players ADD CONSTRAINT players_role_check
    CHECK (role IN ('parent', 'child', 'admin'));

-- ─── 2. Add status workflow to questions ─────────────────
-- status: draft → review → approved
-- Only 'approved' questions are shown to players
ALTER TABLE questions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('draft', 'review', 'approved'));

-- Default 'approved' for existing questions (backward compatible)
-- New questions created via admin will default to 'draft'

-- ─── 3. Add audit fields to questions ───────────────────
ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES players(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES players(id) ON DELETE SET NULL;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── 4. Auto-update updated_at on questions ─────────────
CREATE OR REPLACE FUNCTION update_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_questions_updated_at ON questions;
CREATE TRIGGER trg_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_questions_updated_at();

-- ─── 5. Indexes for admin queries ───────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);
CREATE INDEX IF NOT EXISTS idx_questions_planet_grade ON questions(planet_id, grade);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- ─── 6. RLS policies for admin ──────────────────────────
-- Admin can do everything on questions
CREATE POLICY "Admin full access on questions"
    ON questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM players
            WHERE players.auth_id = (SELECT auth.uid())
            AND players.role = 'admin'
        )
    );

-- Admin can read all levels
CREATE POLICY "Admin full access on levels"
    ON levels FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM players
            WHERE players.auth_id = (SELECT auth.uid())
            AND players.role = 'admin'
        )
    );

-- ─── 7. Mark all existing questions as approved ─────────
UPDATE questions SET status = 'approved' WHERE status IS NULL;
