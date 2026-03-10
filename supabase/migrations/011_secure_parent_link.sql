-- ============================================================
-- 011_secure_parent_link.sql
-- Security improvements for parent-child linking:
-- 1. RPC function to regenerate link_code after one-time use
-- ============================================================

-- ── RPC: regenerate_link_code ──
-- Called by child accounts to get a fresh link code after the previous one was used
CREATE OR REPLACE FUNCTION regenerate_link_code(player_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_code TEXT;
    retries INT := 0;
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT;
    i INT;
BEGIN
    -- Verify the player exists and is a child
    IF NOT EXISTS (SELECT 1 FROM players WHERE id = player_id AND role = 'child') THEN
        RAISE EXCEPTION 'Player not found or not a child account';
    END IF;

    LOOP
        -- Generate 6-char code
        result := '';
        FOR i IN 1..6 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
        END LOOP;
        new_code := result;

        BEGIN
            UPDATE players SET link_code = new_code WHERE id = player_id;
            RETURN new_code;
        EXCEPTION WHEN unique_violation THEN
            retries := retries + 1;
            IF retries > 10 THEN
                RAISE EXCEPTION 'Could not generate unique link_code after 10 retries';
            END IF;
        END;
    END LOOP;
END;
$$;
