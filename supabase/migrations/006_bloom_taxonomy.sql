-- ============================================================
-- 006_bloom_taxonomy.sql
-- CosmoMosaic – Bloom Taxonomy & Question Schema Upgrade
-- Run this in Supabase Studio → SQL Editor
-- ============================================================

-- ─── Step 1: Add Bloom Taxonomy columns to questions ───────

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS bloom_level       SMALLINT NOT NULL DEFAULT 1
        CHECK (bloom_level BETWEEN 1 AND 6),
    ADD COLUMN IF NOT EXISTS difficulty_score  FLOAT NOT NULL DEFAULT 0.5
        CHECK (difficulty_score BETWEEN 0.0 AND 1.0),
    ADD COLUMN IF NOT EXISTS curriculum_ref    TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS reviewed_by_teacher BOOLEAN NOT NULL DEFAULT false;

-- Bloom level meanings:
-- 1 = Remember, 2 = Understand, 3 = Apply
-- 4 = Analyze,  5 = Evaluate,   6 = Create

-- ─── Step 2: Back-fill existing questions with sensible defaults ────

-- Map easy → bloom 1, medium → bloom 2, hard → bloom 3
-- Map easy → score 0.2, medium → score 0.5, hard → score 0.8
UPDATE questions SET
    bloom_level      = CASE difficulty WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
    difficulty_score = CASE difficulty WHEN 'easy' THEN 0.2 WHEN 'medium' THEN 0.5 ELSE 0.8 END,
    curriculum_ref   = 'SGK-' || subject || '-' || grade::text,
    reviewed_by_teacher = true   -- existing seed data is teacher-reviewed
WHERE reviewed_by_teacher = false;

-- ─── Step 3: Create index for fast Bloom-filtered queries ───

CREATE INDEX IF NOT EXISTS idx_questions_bloom
    ON questions (planet_id, grade, bloom_level, difficulty_score);

CREATE INDEX IF NOT EXISTS idx_questions_reviewed
    ON questions (reviewed_by_teacher, grade, planet_id);

-- ─── Step 4: Create mastery tracking table ─────────────────
-- Tracks per-player mastery % for each topic (subject × planet combination)

CREATE TABLE IF NOT EXISTS mastery (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    planet_id       TEXT NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
    subject         TEXT NOT NULL,
    mastery_score   FLOAT NOT NULL DEFAULT 50.0
        CHECK (mastery_score BETWEEN 0.0 AND 100.0),
    bloom_reached   SMALLINT NOT NULL DEFAULT 1
        CHECK (bloom_reached BETWEEN 1 AND 6),
    correct_count   INT NOT NULL DEFAULT 0,
    total_attempts  INT NOT NULL DEFAULT 0,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (player_id, planet_id, subject)
);

-- RLS for mastery table
ALTER TABLE mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players manage own mastery" ON mastery
    FOR ALL USING (true);  -- Allow open access (same pattern as planet_progress)

-- ─── Step 5: Function to update mastery after an answer ────
-- Called by the app after each correct/wrong answer

CREATE OR REPLACE FUNCTION update_mastery(
    p_player_id   UUID,
    p_planet_id   TEXT,
    p_subject     TEXT,
    p_is_correct  BOOLEAN,
    p_bloom_level SMALLINT DEFAULT 1
) RETURNS void AS $$
DECLARE
    v_current       FLOAT;
    v_new_score     FLOAT;
    v_bloom_reached SMALLINT;
BEGIN
    -- Upsert mastery row
    INSERT INTO mastery (player_id, planet_id, subject, mastery_score, bloom_reached, correct_count, total_attempts)
    VALUES (p_player_id, p_planet_id, p_subject, 50.0, 1, 0, 0)
    ON CONFLICT (player_id, planet_id, subject) DO NOTHING;

    -- Read current score
    SELECT mastery_score, bloom_reached INTO v_current, v_bloom_reached
    FROM mastery
    WHERE player_id = p_player_id AND planet_id = p_planet_id AND subject = p_subject;

    -- Weighted moving average: 70% old + 30% new result
    v_new_score := ROUND(
        CAST((v_current * 0.7 + (CASE WHEN p_is_correct THEN 100.0 ELSE 0.0 END) * 0.3) AS NUMERIC),
        2
    );

    -- Bloom level advances if mastery ≥ 80%
    IF p_is_correct AND v_new_score >= 80 AND v_bloom_reached < p_bloom_level + 1 THEN
        v_bloom_reached := LEAST(v_bloom_reached + 1, 6);
    END IF;

    -- Update mastery
    UPDATE mastery SET
        mastery_score  = v_new_score,
        bloom_reached  = v_bloom_reached,
        correct_count  = correct_count  + (CASE WHEN p_is_correct THEN 1 ELSE 0 END),
        total_attempts = total_attempts + 1,
        updated_at     = NOW()
    WHERE player_id = p_player_id AND planet_id = p_planet_id AND subject = p_subject;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Done ─────────────────────────────────────────────────
COMMENT ON COLUMN questions.bloom_level IS
    '1=Remember, 2=Understand, 3=Apply, 4=Analyze, 5=Evaluate, 6=Create';
COMMENT ON COLUMN questions.difficulty_score IS
    'IRT-calibrated difficulty: 0.0 = easiest, 1.0 = hardest';
COMMENT ON COLUMN questions.reviewed_by_teacher IS
    'Must be TRUE before questions appear in production gameplay';
