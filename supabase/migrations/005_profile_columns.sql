-- ============================================================
-- 005_profile_columns.sql
-- CosmoMosaic – Add profile fields to players table
-- Run this in Supabase Studio → SQL Editor
-- ============================================================

-- ─── Add profile-related columns to players ──────────────
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS birthday TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS school TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS parent_email TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS parent_name TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS parent_phone TEXT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS favorite_subjects TEXT[] DEFAULT NULL;
