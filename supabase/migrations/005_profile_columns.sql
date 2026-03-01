-- ============================================================
-- 005_all_missing_columns.sql
-- CosmoMosaic – Add ALL missing columns and tables
-- This consolidates migrations 004 + 005 for cases where
-- migration 004 was not run on the Supabase instance.
-- Run this in Supabase Studio → SQL Editor
-- ============================================================

-- ─── Extend players table (from 004 + 005) ───────────────
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS survey_completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS estimated_grade INT DEFAULT NULL CHECK (estimated_grade IS NULL OR estimated_grade BETWEEN 1 AND 5),
    ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS birthday TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS school TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS parent_email TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS parent_name TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS parent_phone TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS favorite_subjects TEXT[] DEFAULT NULL;

-- ─── Table: survey_questions ──────────────────────────────
CREATE TABLE IF NOT EXISTS survey_questions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject       TEXT NOT NULL,
    grade         INT NOT NULL CHECK (grade BETWEEN 1 AND 5),
    difficulty    TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    question_text TEXT NOT NULL,
    options       TEXT[] NOT NULL,
    correct_answer INT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: survey_responses ──────────────────────────────
CREATE TABLE IF NOT EXISTS survey_responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    question_id     UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
    selected_answer INT NOT NULL,
    is_correct      BOOLEAN NOT NULL,
    answered_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: player_proficiency ────────────────────────────
CREATE TABLE IF NOT EXISTS player_proficiency (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    subject         TEXT NOT NULL,
    estimated_grade INT NOT NULL DEFAULT 3 CHECK (estimated_grade BETWEEN 1 AND 5),
    mastery_score   INT NOT NULL DEFAULT 50 CHECK (mastery_score BETWEEN 0 AND 100),
    total_correct   INT NOT NULL DEFAULT 0,
    total_attempted INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, subject)
);

-- ─── Table: answer_history ────────────────────────────────
CREATE TABLE IF NOT EXISTS answer_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    is_correct  BOOLEAN NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_survey_questions_subject ON survey_questions(subject);
CREATE INDEX IF NOT EXISTS idx_survey_questions_difficulty ON survey_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_survey_responses_player ON survey_responses(player_id);
CREATE INDEX IF NOT EXISTS idx_proficiency_player ON player_proficiency(player_id);
CREATE INDEX IF NOT EXISTS idx_proficiency_subject ON player_proficiency(player_id, subject);
CREATE INDEX IF NOT EXISTS idx_answer_history_player ON answer_history(player_id);
CREATE INDEX IF NOT EXISTS idx_answer_history_question ON answer_history(question_id);

-- ─── Updated_at trigger for proficiency ───────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'proficiency_updated_at'
    ) THEN
        CREATE TRIGGER proficiency_updated_at
            BEFORE UPDATE ON player_proficiency
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- ─── Row Level Security ───────────────────────────────────
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_proficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_history ENABLE ROW LEVEL SECURITY;

-- Safe policy creation (skip if already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read survey questions' AND tablename = 'survey_questions') THEN
        CREATE POLICY "Anyone can read survey questions" ON survey_questions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own survey responses' AND tablename = 'survey_responses') THEN
        CREATE POLICY "Users manage own survey responses" ON survey_responses FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own proficiency' AND tablename = 'player_proficiency') THEN
        CREATE POLICY "Users manage own proficiency" ON player_proficiency FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users manage own answer history' AND tablename = 'answer_history') THEN
        CREATE POLICY "Users manage own answer history" ON answer_history FOR ALL USING (true);
    END IF;
END $$;

-- ─── Helper: Update proficiency after answer ──────────────
CREATE OR REPLACE FUNCTION update_proficiency(
    p_player_id UUID,
    p_subject TEXT,
    p_is_correct BOOLEAN
) RETURNS VOID AS $$
DECLARE
    new_correct INT;
    new_attempted INT;
    new_mastery INT;
BEGIN
    INSERT INTO player_proficiency (player_id, subject, total_correct, total_attempted, mastery_score)
    VALUES (p_player_id, p_subject,
            CASE WHEN p_is_correct THEN 1 ELSE 0 END,
            1,
            CASE WHEN p_is_correct THEN 55 ELSE 45 END)
    ON CONFLICT (player_id, subject) DO UPDATE SET
        total_correct = player_proficiency.total_correct + CASE WHEN p_is_correct THEN 1 ELSE 0 END,
        total_attempted = player_proficiency.total_attempted + 1,
        mastery_score = LEAST(100, GREATEST(0,
            (player_proficiency.mastery_score * 7 + CASE WHEN p_is_correct THEN 100 ELSE 0 END * 3) / 10
        )),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
