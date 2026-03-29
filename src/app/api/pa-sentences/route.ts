/**
 * /api/pa-sentences — Smart sentence selection for PA Mode
 *
 * GET ?level=N&player_id=UUID
 * Returns sentences prioritized: needs-improvement > new > mastered
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

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const { searchParams } = new URL(request.url);
        const level = parseInt(searchParams.get("level") || "1");
        const playerId = searchParams.get("player_id");

        if (level < 1 || level > 5) {
            return NextResponse.json({ error: "Invalid level" }, { status: 400 });
        }

        const supabase = getAdminClient();

        // 1. Get all active sentences for this level
        const { data: allSentences, error: sentError } = await supabase
            .from("pa_sentences")
            .select("id, text, level, phoneme_targets, vietnamese_trap, category, topic, difficulty, tip_vi, audio_url")
            .eq("level", level)
            .eq("is_active", true)
            .order("difficulty", { ascending: true });

        if (sentError || !allSentences?.length) {
            return NextResponse.json({ sentences: [] });
        }

        // 2. If no player, return shuffled sentences
        if (!playerId) {
            const shuffled = [...allSentences].sort(() => Math.random() - 0.5);
            return NextResponse.json({ sentences: shuffled.slice(0, 20) });
        }

        // 3. Get player's progress for these sentences
        const sentenceIds = allSentences.map(s => s.id);
        const { data: progress } = await supabase
            .from("pa_sentence_progress")
            .select("sentence_id, best_accuracy, mastered, attempts, last_practiced_at")
            .eq("player_id", playerId)
            .in("sentence_id", sentenceIds);

        const progressMap = new Map(
            (progress ?? []).map(p => [p.sentence_id, p])
        );

        // 4. Smart selection: needs-improvement > new > mastered
        const needsImprovement: typeof allSentences = []; // practiced but not mastered
        const newSentences: typeof allSentences = [];      // never practiced
        const mastered: typeof allSentences = [];           // already mastered

        for (const s of allSentences) {
            const p = progressMap.get(s.id);
            if (!p) {
                newSentences.push(s);
            } else if (!p.mastered) {
                needsImprovement.push(s);
            } else {
                mastered.push(s);
            }
        }

        // Shuffle each group
        const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

        // Sort mastered by oldest first (spaced repetition)
        mastered.sort((a, b) => {
            const pa = progressMap.get(a.id)?.last_practiced_at ?? "";
            const pb = progressMap.get(b.id)?.last_practiced_at ?? "";
            return pa.localeCompare(pb); // oldest first
        });

        const ordered = [
            ...shuffle(needsImprovement),
            ...shuffle(newSentences),
            ...mastered,
        ];

        return NextResponse.json({ sentences: ordered.slice(0, 20) });

    } catch (error) {
        console.error("[pa-sentences] Error:", error);
        return NextResponse.json({ sentences: [] });
    }
}
