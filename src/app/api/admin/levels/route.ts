/**
 * Admin Levels API
 * GET: List levels, optionally filtered by planet_id and/or subject
 * Used by admin UI to populate level dropdown when creating questions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const planet = searchParams.get("planet");
    const subject = searchParams.get("subject");

    let query = supabase
        .from("levels")
        .select("id, planet_id, level_number, title, subject, journey_id, game_mode")
        .order("planet_id")
        .order("level_number");

    if (planet) query = query.eq("planet_id", planet);
    if (subject) query = query.eq("subject", subject);

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
}
