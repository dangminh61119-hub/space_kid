-- ============================================================
-- 009_parent_child_roles.sql
-- CosmoMosaic – Parent/Child Role System
-- Adds role-based access, link codes, and parent-child linking
-- ============================================================

-- ─── Add role column to players ──────────────────────────
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'child'
        CHECK (role IN ('parent', 'child'));

-- ─── Add link_code for child accounts ────────────────────
-- 6-character unique code that parents use to link to their child
ALTER TABLE players
    ADD COLUMN IF NOT EXISTS link_code TEXT UNIQUE;

-- ─── Auto-generate link_code for existing child accounts ─
-- Generate random 6-char alphanumeric code
CREATE OR REPLACE FUNCTION generate_link_code() RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Backfill link_code for existing child players
DO $$
DECLARE
    rec RECORD;
    new_code TEXT;
    retries INT;
BEGIN
    FOR rec IN SELECT id FROM players WHERE link_code IS NULL AND role = 'child' LOOP
        retries := 0;
        LOOP
            new_code := generate_link_code();
            BEGIN
                UPDATE players SET link_code = new_code WHERE id = rec.id;
                EXIT; -- success
            EXCEPTION WHEN unique_violation THEN
                retries := retries + 1;
                IF retries > 10 THEN
                    RAISE EXCEPTION 'Could not generate unique link_code after 10 retries';
                END IF;
            END;
        END LOOP;
    END LOOP;
END $$;

-- ─── Trigger: auto-generate link_code on new child insert ─
CREATE OR REPLACE FUNCTION auto_generate_link_code()
RETURNS TRIGGER AS $$
DECLARE
    new_code TEXT;
    retries INT := 0;
BEGIN
    IF NEW.role = 'child' AND NEW.link_code IS NULL THEN
        LOOP
            new_code := generate_link_code();
            BEGIN
                NEW.link_code := new_code;
                RETURN NEW;
            EXCEPTION WHEN unique_violation THEN
                retries := retries + 1;
                IF retries > 10 THEN
                    RAISE EXCEPTION 'Could not generate unique link_code';
                END IF;
            END;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_link_code ON players;
CREATE TRIGGER trg_auto_link_code
    BEFORE INSERT ON players
    FOR EACH ROW EXECUTE FUNCTION auto_generate_link_code();

-- ─── Table: parent_child_link ────────────────────────────
-- Maps parent accounts to child accounts
CREATE TABLE IF NOT EXISTS parent_child_link (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    child_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    linked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(parent_id, child_id)
);

-- ─── Indexes ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pcl_parent ON parent_child_link(parent_id);
CREATE INDEX IF NOT EXISTS idx_pcl_child ON parent_child_link(child_id);
CREATE INDEX IF NOT EXISTS idx_players_role ON players(role);
CREATE INDEX IF NOT EXISTS idx_players_link_code ON players(link_code);

-- ─── RLS for parent_child_link ───────────────────────────
ALTER TABLE parent_child_link ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own links"
    ON parent_child_link FOR ALL USING (true);
