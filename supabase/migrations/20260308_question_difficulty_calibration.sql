-- Auto-calibrate difficulty: track answer stats per question
-- When attempt_count >= 20, calibrated_difficulty overrides the original difficulty label

ALTER TABLE question_bank
ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS correct_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS calibrated_difficulty integer;

-- Index for efficient stats updates
CREATE INDEX IF NOT EXISTS idx_question_bank_calibration
ON question_bank (id) WHERE attempt_count > 0;

COMMENT ON COLUMN question_bank.attempt_count IS 'Total number of student attempts on this question';
COMMENT ON COLUMN question_bank.correct_count IS 'Total number of correct answers';
COMMENT ON COLUMN question_bank.calibrated_difficulty IS 'Auto-calibrated difficulty (1=easy, 2=medium, 3=hard). NULL until enough data (>=20 attempts). Overrides manual difficulty when set.';
