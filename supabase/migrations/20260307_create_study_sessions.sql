-- Study sessions: lưu lịch sử báo bài + học tập
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    subject TEXT,
    grade INT,
    lesson TEXT,
    sources JSONB DEFAULT '[]'::jsonb,
    practiced BOOLEAN DEFAULT false,
    reviewed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_player ON study_sessions(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject ON study_sessions(subject, grade);

-- RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Players can read their own sessions
CREATE POLICY "Players read own sessions" ON study_sessions
    FOR SELECT USING (
        player_id IN (SELECT id FROM players WHERE auth_id = auth.uid())
    );

-- Players can insert own sessions
CREATE POLICY "Players insert own sessions" ON study_sessions
    FOR INSERT WITH CHECK (
        player_id IN (SELECT id FROM players WHERE auth_id = auth.uid())
    );

-- Players can update own sessions
CREATE POLICY "Players update own sessions" ON study_sessions
    FOR UPDATE USING (
        player_id IN (SELECT id FROM players WHERE auth_id = auth.uid())
    );
