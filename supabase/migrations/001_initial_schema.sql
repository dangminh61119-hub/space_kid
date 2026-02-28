-- ============================================================
-- 001_initial_schema.sql
-- CosmoMosaic – Supabase Database Schema
-- Run this in Supabase Studio → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Table: planets ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS planets (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    emoji       TEXT NOT NULL DEFAULT '🌍',
    subjects    TEXT[] NOT NULL DEFAULT '{}',
    game_type   TEXT NOT NULL CHECK (game_type IN ('shooter', 'math')),
    color1      TEXT NOT NULL DEFAULT '#00F5FF',
    color2      TEXT NOT NULL DEFAULT '#0077B6',
    ring_color  TEXT NOT NULL DEFAULT '#00F5FF',
    description TEXT NOT NULL DEFAULT '',
    total_levels INT NOT NULL DEFAULT 10,
    order_index INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: levels ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS levels (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planet_id    TEXT NOT NULL REFERENCES planets(id) ON DELETE CASCADE,
    level_number INT NOT NULL,
    title        TEXT NOT NULL,
    subject      TEXT NOT NULL,
    grade_min    INT NOT NULL DEFAULT 1 CHECK (grade_min BETWEEN 1 AND 5),
    grade_max    INT NOT NULL DEFAULT 5 CHECK (grade_max BETWEEN 1 AND 5),
    -- SpaceShooter: bomb fall speed multiplier
    speed        FLOAT NOT NULL DEFAULT 1.0,
    -- MathForge: seconds per question
    time_per_q   INT NOT NULL DEFAULT 15,
    order_index  INT NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(planet_id, level_number)
);

-- ─── Table: questions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id      UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
    planet_id     TEXT NOT NULL REFERENCES planets(id),
    subject       TEXT NOT NULL,
    grade         INT NOT NULL DEFAULT 3 CHECK (grade BETWEEN 1 AND 5),
    difficulty    TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    type          TEXT NOT NULL CHECK (type IN ('word', 'math')),

    -- SpaceShooter (type = 'word')
    question_text TEXT,
    correct_word  TEXT,
    wrong_words   TEXT[],

    -- MathForge (type = 'math')
    equation      TEXT,
    answer        INT,
    options       INT[],

    -- Analytics
    times_shown   INT NOT NULL DEFAULT 0,
    times_wrong   INT NOT NULL DEFAULT 0,

    order_index   INT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: players ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS players (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Will link to Supabase Auth later
    auth_id                UUID UNIQUE,
    name                   TEXT NOT NULL DEFAULT 'Tân Binh',
    mascot                 TEXT CHECK (mascot IN ('cat', 'dog')),
    player_class           TEXT CHECK (player_class IN ('warrior', 'wizard', 'hunter')),
    grade                  INT NOT NULL DEFAULT 3 CHECK (grade BETWEEN 1 AND 5),
    xp                     INT NOT NULL DEFAULT 0,
    streak                 INT NOT NULL DEFAULT 0,
    onboarding_complete    BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_quiz_score  INT NOT NULL DEFAULT 0,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: planet_progress ───────────────────────────────
CREATE TABLE IF NOT EXISTS planet_progress (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id        UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    planet_id        TEXT NOT NULL REFERENCES planets(id),
    completed_levels INT NOT NULL DEFAULT 0,
    last_played_at   TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(player_id, planet_id)
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_levels_planet ON levels(planet_id);
CREATE INDEX IF NOT EXISTS idx_questions_level ON questions(level_id);
CREATE INDEX IF NOT EXISTS idx_questions_grade ON questions(grade);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_planet_progress_player ON planet_progress(player_id);

-- ─── Updated_at trigger for players ──────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── Row Level Security ───────────────────────────────────
-- Enable RLS (everyone can read planets/levels/questions)
ALTER TABLE planets ENABLE ROW LEVEL SECURITY;
ALTER TABLE levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE planet_progress ENABLE ROW LEVEL SECURITY;

-- Public read for game content
CREATE POLICY "Anyone can read planets" ON planets FOR SELECT USING (true);
CREATE POLICY "Anyone can read levels" ON levels FOR SELECT USING (true);
CREATE POLICY "Anyone can read questions" ON questions FOR SELECT USING (true);

-- Players: full access (will restrict to auth user later)
CREATE POLICY "Anyone can manage players" ON players FOR ALL USING (true);
CREATE POLICY "Anyone can manage progress" ON planet_progress FOR ALL USING (true);

-- ─── Analytics helper function ────────────────────────────
-- Call this when a question is answered wrong
CREATE OR REPLACE FUNCTION record_wrong_answer(q_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE questions
    SET times_shown = times_shown + 1,
        times_wrong = times_wrong + 1
    WHERE id = q_id;
END;
$$ LANGUAGE plpgsql;

-- Call this when a question is shown
CREATE OR REPLACE FUNCTION record_question_shown(q_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE questions
    SET times_shown = times_shown + 1
    WHERE id = q_id;
END;
$$ LANGUAGE plpgsql;
