/**
 * /api/pa-sessions — Save pronunciation practice session results
 *
 * POST { player_id, level, duration_seconds, sentences_practiced, ... }
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/services/api-auth";
import { createClient } from "@supabase/supabase-js";

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const body = await request.json();
        const {
            player_id, level, duration_seconds, sentences_practiced,
            accuracy_score, fluency_score, prosody_score,
            problem_phonemes, problem_words, azure_audio_seconds,
        } = body;

        if (!player_id || !level) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const supabase = getAdminClient();
        const { data, error } = await supabase
            .from("pronunciation_sessions")
            .insert({
                player_id,
                level,
                duration_seconds: duration_seconds ?? 0,
                sentences_practiced: sentences_practiced ?? 0,
                accuracy_score: accuracy_score ?? null,
                fluency_score: fluency_score ?? null,
                prosody_score: prosody_score ?? null,
                problem_phonemes: problem_phonemes ?? null,
                problem_words: problem_words ?? null,
                azure_audio_seconds: azure_audio_seconds ?? 0,
            })
            .select("id, created_at")
            .single();

        if (error) {
            console.error("[pa-sessions] Insert error:", error);
            return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
        }

        return NextResponse.json({ session: data, success: true });

    } catch (error) {
        console.error("[pa-sessions] Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
