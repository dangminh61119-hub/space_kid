-- ============================================================
-- 008_learning_events.sql
-- CosmoMosaic – Learning Events, Quiz Attempts & AI Feedback
-- Tracks all learning interactions for analytics & audit
-- ============================================================

-- ─── Table: learning_event ────────────────────────────────
-- High-level learning session events (start/end, time-on-task)
CREATE TABLE IF NOT EXISTS learning_event (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    planet_id       TEXT NOT NULL,
    subject         TEXT NOT NULL,
    event_type      TEXT NOT NULL CHECK (event_type IN (
        'session_start',
        'session_end',
        'level_complete',
        'level_failed',
        'bloom_progression'   -- Player advanced to next Bloom level
    )),
    bloom_level     INT CHECK (bloom_level IS NULL OR bloom_level BETWEEN 1 AND 6),
    duration_secs   INT,               -- Time spent (for session_end)
    score           INT,               -- Score achieved (for level_complete)
    metadata        JSONB DEFAULT '{}', -- Extra context
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: quiz_attempt ──────────────────────────────────
-- Raw log of every individual question attempt
CREATE TABLE IF NOT EXISTS quiz_attempt (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    planet_id       TEXT NOT NULL,
    subject         TEXT NOT NULL,
    question_id     UUID,              -- NULL if mock mode
    question_text   TEXT NOT NULL,      -- Store question for audit
    answer_given    TEXT NOT NULL,      -- What the player answered
    correct_answer  TEXT NOT NULL,      -- What the correct answer was
    is_correct      BOOLEAN NOT NULL,
    bloom_level     INT DEFAULT 1 CHECK (bloom_level BETWEEN 1 AND 6),
    time_taken_ms   INT,               -- Response time in milliseconds
    difficulty      TEXT CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Table: ai_feedback ───────────────────────────────────
-- Logs every AI Mascot response for safety audit
CREATE TABLE IF NOT EXISTS ai_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    trigger_context TEXT NOT NULL CHECK (trigger_context IN (
        'correct_answer',       -- After getting answer right
        'wrong_answer',         -- After getting answer wrong
        'hint_requested',       -- Player asked for help
        'encouragement',        -- Proactive encouragement
        'general_chat'          -- General interaction
    )),
    ai_prompt       TEXT NOT NULL,      -- What was sent to AI (sanitized)
    ai_response     TEXT NOT NULL,      -- AI's response
    model_used      TEXT,               -- 'grok-3' / 'gemini-flash' etc
    response_time_ms INT,              -- API response time
    was_filtered    BOOLEAN DEFAULT FALSE, -- True if response was safety-filtered
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_learning_event_player ON learning_event(player_id);
CREATE INDEX IF NOT EXISTS idx_learning_event_planet ON learning_event(planet_id);
CREATE INDEX IF NOT EXISTS idx_learning_event_created ON learning_event(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_attempt_player ON quiz_attempt(player_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_planet ON quiz_attempt(planet_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_correct ON quiz_attempt(is_correct);
CREATE INDEX IF NOT EXISTS idx_quiz_attempt_created ON quiz_attempt(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_player ON ai_feedback(player_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_trigger ON ai_feedback(trigger_context);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created ON ai_feedback(created_at DESC);

-- ─── Row Level Security ───────────────────────────────────
ALTER TABLE learning_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- All three tables: authenticated users can insert and read own data
CREATE POLICY "Users manage own learning events"
    ON learning_event FOR ALL USING (true);

CREATE POLICY "Users manage own quiz attempts"
    ON quiz_attempt FOR ALL USING (true);

CREATE POLICY "Users manage own AI feedback"
    ON ai_feedback FOR ALL USING (true);
