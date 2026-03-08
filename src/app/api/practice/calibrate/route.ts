/**
 * /api/practice/calibrate — Record per-question answer stats & auto-calibrate difficulty
 *
 * POST: Submit per-question results after quiz completion
 * Body: { answers: [{ questionId: string, isCorrect: boolean }] }
 *
 * Calibration thresholds (applied when attempt_count >= 20):
 *   >= 80% accuracy → difficulty 1 (Easy)
 *   40-79% accuracy → difficulty 2 (Medium)
 *   < 40% accuracy  → difficulty 3 (Hard)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/services/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const CALIBRATION_THRESHOLD = 20; // Minimum attempts before calibrating

export async function POST(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const { answers } = body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return NextResponse.json({ error: "answers array required" }, { status: 400 });
    }

    // Filter to only valid question_bank IDs (UUIDs, not hardcoded like "ai-0")
    const validAnswers = answers.filter(
        (a: { questionId: string; isCorrect: boolean }) =>
            a.questionId && !a.questionId.startsWith("ai-") && !a.questionId.startsWith("local-")
    );

    if (validAnswers.length === 0) {
        return NextResponse.json({ calibrated: 0, message: "No DB questions to calibrate" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    let calibratedCount = 0;

    // Process each answer: increment stats and calibrate if threshold reached
    for (const answer of validAnswers) {
        const { questionId, isCorrect } = answer as { questionId: string; isCorrect: boolean };

        // Atomic increment using RPC or direct update
        const { data, error } = await supabase
            .from("question_bank")
            .select("attempt_count, correct_count")
            .eq("id", questionId)
            .single();

        if (error || !data) continue;

        const newAttempts = (data.attempt_count || 0) + 1;
        const newCorrect = (data.correct_count || 0) + (isCorrect ? 1 : 0);

        // Build update payload
        const update: Record<string, unknown> = {
            attempt_count: newAttempts,
            correct_count: newCorrect,
        };

        // Auto-calibrate if we have enough data
        if (newAttempts >= CALIBRATION_THRESHOLD) {
            const accuracy = newCorrect / newAttempts;
            let calibrated: number;

            if (accuracy >= 0.8) {
                calibrated = 1; // Easy
            } else if (accuracy >= 0.4) {
                calibrated = 2; // Medium
            } else {
                calibrated = 3; // Hard
            }

            update.calibrated_difficulty = calibrated;
            calibratedCount++;
        }

        await supabase
            .from("question_bank")
            .update(update)
            .eq("id", questionId);
    }

    return NextResponse.json({
        processed: validAnswers.length,
        calibrated: calibratedCount,
    });
}
