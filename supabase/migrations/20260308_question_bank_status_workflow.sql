-- ============================================================
-- question_bank: Source tracking + audit trail
-- Track where each question came from (manual / ai / csv)
-- Admin can filter by source to review AI content when needed
-- ============================================================

-- ─── 1. Source tracking ──────────────────────────────────
ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'ai-generated', 'csv-import'));

-- ─── 2. Review audit trail (optional admin review) ───────
ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

-- ─── 3. Indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_question_bank_source
  ON question_bank(source);

COMMENT ON COLUMN question_bank.source IS 'How the question was created: manual, ai-generated, csv-import';
COMMENT ON COLUMN question_bank.reviewed_by IS 'UUID of admin who reviewed (NULL = not yet reviewed)';
COMMENT ON COLUMN question_bank.reviewed_at IS 'When the question was reviewed';
