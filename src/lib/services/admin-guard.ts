/**
 * admin-guard.ts — Admin authorization guard
 * 
 * Server-side: verifies Supabase auth token + checks role=admin
 * Used by all /api/admin/* routes
 * 
 * Works with either:
 * 1. SUPABASE_SERVICE_ROLE_KEY (preferred, bypasses RLS)
 * 2. NEXT_PUBLIC_SUPABASE_ANON_KEY + user JWT (via RLS admin policies)
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

interface AdminCheckResult {
    isAdmin: boolean;
    playerId: string | null;
    userToken?: string;
    error?: string;
}

/**
 * Verify the request comes from an authenticated admin user.
 * Extracts the JWT from the Authorization header and checks
 * the player's role in the database.
 */
export async function requireAdmin(request: Request): Promise<AdminCheckResult> {
    const effectiveKey = supabaseServiceKey || supabaseAnonKey;
    if (!supabaseUrl || !effectiveKey) {
        return { isAdmin: false, playerId: null, error: "Supabase not configured" };
    }

    // Extract token from Authorization header
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
        return { isAdmin: false, playerId: null, error: "No auth token provided" };
    }

    // Create client — use service role if available, otherwise anon key
    const supabaseAdmin = createClient(supabaseUrl, effectiveKey);

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
        return { isAdmin: false, playerId: null, error: "Invalid auth token" };
    }

    // Look up the player and check role
    // When using anon key, we need to use the user's own session for RLS
    let queryClient: SupabaseClient;
    if (supabaseServiceKey) {
        queryClient = supabaseAdmin;
    } else {
        // Create a client authenticated as the user (for RLS to work)
        queryClient = createClient(supabaseUrl, effectiveKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });
    }

    const { data: player, error: playerError } = await queryClient
        .from("players")
        .select("id, role")
        .eq("auth_id", user.id)
        .single();

    if (playerError || !player) {
        return { isAdmin: false, playerId: null, error: "Player not found" };
    }

    if (player.role !== "admin") {
        return { isAdmin: false, playerId: player.id, error: "Insufficient permissions" };
    }

    return { isAdmin: true, playerId: player.id, userToken: token };
}

/**
 * Helper to create a 403 response for non-admin users
 */
export function forbiddenResponse(message = "Admin access required") {
    return new Response(JSON.stringify({ error: message }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
    });
}

/**
 * Helper to get a Supabase client for admin operations.
 * Uses service role key if available (bypasses RLS),
 * otherwise uses anon key with user token (relies on RLS admin policies).
 */
export function getAdminSupabase(userToken?: string) {
    const effectiveKey = supabaseServiceKey || supabaseAnonKey;
    if (!supabaseUrl || !effectiveKey) {
        return null;
    }

    // If we have service role key, use it (bypasses RLS)
    if (supabaseServiceKey) {
        return createClient(supabaseUrl, supabaseServiceKey);
    }

    // Otherwise, use anon key + user token (RLS admin policies allow access)
    if (userToken) {
        return createClient(supabaseUrl, effectiveKey, {
            global: { headers: { Authorization: `Bearer ${userToken}` } }
        });
    }

    return createClient(supabaseUrl, effectiveKey);
}
