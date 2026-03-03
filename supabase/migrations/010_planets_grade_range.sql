-- ============================================================
-- 010_planets_grade_range.sql
-- CosmoMosaic – Add grade_range to planets table
-- Enables filtering planets by student grade
-- ============================================================

-- Add grade_range column (integer array: [min_grade, max_grade])
ALTER TABLE planets
    ADD COLUMN IF NOT EXISTS grade_range INTEGER[] DEFAULT '{1,5}';

-- Populate grade_range based on PROJECT_REQUIREMENTS.md
UPDATE planets SET grade_range = '{1,3}' WHERE id = 'ha-long';    -- Lớp 1–3
UPDATE planets SET grade_range = '{2,4}' WHERE id = 'hue';        -- Lớp 2–4
UPDATE planets SET grade_range = '{3,5}' WHERE id = 'giong';      -- Lớp 3–5
UPDATE planets SET grade_range = '{1,3}' WHERE id = 'phong-nha';  -- Lớp 1–3
UPDATE planets SET grade_range = '{1,2}' WHERE id = 'hoi-an';     -- Lớp 1–2
UPDATE planets SET grade_range = '{3,5}' WHERE id = 'sapa';       -- Lớp 3–5
UPDATE planets SET grade_range = '{1,5}' WHERE id = 'hanoi';      -- Lớp 1–5
UPDATE planets SET grade_range = '{1,5}' WHERE id = 'mekong';     -- Lớp 1–5
