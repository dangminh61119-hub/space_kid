/**
 * /api/english-sessions — CRUD for English Practice Session Summaries
 *
 * GET  ?player_id=... → returns the 5 most recent sessions
 * POST { player_id, topic, duration_minutes, summary, key_phrases } → saves session
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/services/api-auth";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const { searchParams } = new URL(request.url);
        const playerId = searchParams.get("player_id");

        if (!playerId) {
            return NextResponse.json({ error: "Missing player_id" }, { status: 400 });
        }

        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from("english_practice_sessions")
            .select("id, topic, duration_minutes, summary, key_phrases, created_at")
            .eq("player_id", playerId)
            .order("created_at", { ascending: false })
            .limit(5);

        if (error) {
            console.error("[english-sessions] GET error:", error);
            return NextResponse.json({ sessions: [] });
        }

        return NextResponse.json({ sessions: data ?? [] });

    } catch (error) {
        console.error("[english-sessions] GET catch:", error);
        return NextResponse.json({ sessions: [] });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const body = await request.json();
        const { player_id, topic, duration_minutes, summary, key_phrases = [] } = body;

        if (!player_id || !topic || !summary) {
            return NextResponse.json(
                { error: "Missing required fields: player_id, topic, summary" },
                { status: 400 }
            );
        }

        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from("english_practice_sessions")
            .insert({
                player_id,
                topic,
                duration_minutes: duration_minutes ?? 15,
                summary,
                key_phrases,
            })
            .select("id, created_at")
            .single();

        if (error) {
            console.error("[english-sessions] POST error:", error);
            return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
        }

        return NextResponse.json({ session: data, success: true });

    } catch (error) {
        console.error("[english-sessions] POST catch:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
