/**
 * /api/pa-progress — Update sentence mastery progress
 *
 * POST { player_id, sentence_id, accuracy, mastered }
 * Upserts pa_sentence_progress, keeping best accuracy
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

        const { player_id, sentence_id, accuracy, mastered } = await request.json();

        if (!player_id || !sentence_id) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const supabase = getAdminClient();

        // Check if progress exists
        const { data: existing } = await supabase
            .from("pa_sentence_progress")
            .select("id, best_accuracy, attempts")
            .eq("player_id", player_id)
            .eq("sentence_id", sentence_id)
            .maybeSingle();

        if (existing) {
            // Update: keep best accuracy, increment attempts
            const { error } = await supabase
                .from("pa_sentence_progress")
                .update({
                    best_accuracy: Math.max(existing.best_accuracy, accuracy ?? 0),
                    attempts: existing.attempts + 1,
                    mastered: mastered || existing.best_accuracy >= (accuracy ?? 0) ? true : (existing as any).mastered,
                    last_practiced_at: new Date().toISOString(),
                })
                .eq("id", existing.id);

            if (error) {
                console.error("[pa-progress] Update error:", error);
                return NextResponse.json({ error: "Update failed" }, { status: 500 });
            }
        } else {
            // Insert new
            const { error } = await supabase
                .from("pa_sentence_progress")
                .insert({
                    player_id,
                    sentence_id,
                    best_accuracy: accuracy ?? 0,
                    attempts: 1,
                    mastered: mastered ?? false,
                    last_practiced_at: new Date().toISOString(),
                });

            if (error) {
                console.error("[pa-progress] Insert error:", error);
                return NextResponse.json({ error: "Insert failed" }, { status: 500 });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("[pa-progress] Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
