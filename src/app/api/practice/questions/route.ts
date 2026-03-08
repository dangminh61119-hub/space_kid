/**
 * /api/practice/questions — Serve questions from question_bank for practice
 * 
 * GET: Fetch questions for a topic (for student practice)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/services/api-auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);
    if (!authResult.authenticated) {
        return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topic_id");
    const subject = searchParams.get("subject");
    const grade = searchParams.get("grade");
    const count = parseInt(searchParams.get("count") || "10");

    if (!topicId && !subject) {
        return NextResponse.json({ error: "topic_id or subject required" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    let query = supabase
        .from("question_bank")
        .select("id, topic_id, question_text, options, correct_index, explanation, hint, bloom_level, difficulty, calibrated_difficulty, attempt_count, correct_count, curriculum_topics(topic_name)")
        .eq("active", true);

    if (topicId) query = query.eq("topic_id", topicId);
    if (subject) query = query.eq("subject", subject);
    if (grade) query = query.eq("grade", parseInt(grade));

    // Fetch more than needed, then shuffle and slice
    const { data, error } = await query.limit(count * 3);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Shuffle and take `count`
    const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, count);

    // Format for SmartQuiz component compatibility
    // Use calibrated_difficulty if available (cold-start: fall back to original difficulty)
    const questions = shuffled.map((q, i) => ({
        id: q.id || `qb-${i}`,
        question: q.question_text,
        correctAnswer: (q.options || [])[q.correct_index] || "",
        wrongAnswers: (q.options || []).filter((_: string, idx: number) => idx !== q.correct_index),
        subject: subject || "mixed",
        bloomLevel: q.bloom_level,
        difficulty: q.calibrated_difficulty ?? q.difficulty,
        explanation: q.explanation || q.hint || "",
        topic_id: q.topic_id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        topic_name: (q.curriculum_topics as any)?.topic_name || "",
        // Stats metadata (for admin/debug)
        attemptCount: q.attempt_count || 0,
        isCalibrated: q.calibrated_difficulty != null,
    }));

    return NextResponse.json({ questions, total: data?.length || 0 });
}
