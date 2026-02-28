-- ============================================================
-- 005_profile_columns.sql
-- CosmoMosaic – Add profile questionnaire columns to players
-- Run this in Supabase Studio → SQL Editor
-- ============================================================

-- ─── Add missing profile columns to players ──────────────
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS birthday TEXT,
    ADD COLUMN IF NOT EXISTS school TEXT,
    ADD COLUMN IF NOT EXISTS parent_email TEXT,
    ADD COLUMN IF NOT EXISTS parent_name TEXT,
    ADD COLUMN IF NOT EXISTS parent_phone TEXT,
    ADD COLUMN IF NOT EXISTS favorite_subjects TEXT[];

-- ─── Index for quick lookup by auth_id ────────────────────
CREATE INDEX IF NOT EXISTS idx_players_auth_id ON players(auth_id);

-- ─── RLS: Allow authenticated users to insert their own player record ───
-- Drop the overly permissive policy and replace with auth-aware ones
DO $$
BEGIN
    -- Drop existing permissive policy if it exists
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'players' AND policyname = 'Anyone can manage players'
    ) THEN
        DROP POLICY "Anyone can manage players" ON players;
    END IF;
END $$;

-- Authenticated users can read all players (for leaderboards etc.)
CREATE POLICY "Authenticated users can read players"
    ON players FOR SELECT
    USING (true);

-- Users can insert their own player record during registration
CREATE POLICY "Users can insert own player"
    ON players FOR INSERT
    WITH CHECK (auth.uid() = auth_id);

-- Users can update only their own player record
CREATE POLICY "Users can update own player"
    ON players FOR UPDATE
    USING (auth.uid() = auth_id)
    WITH CHECK (auth.uid() = auth_id);

-- Users can delete only their own player record
CREATE POLICY "Users can delete own player"
    ON players FOR DELETE
    USING (auth.uid() = auth_id);
