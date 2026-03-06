/**
 * Admin Questions Import API
 * POST: Import questions from JSON or CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";
import { validateQuestion, parseCSV, type QuestionInput } from "@/lib/services/question-validation";

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const contentType = request.headers.get("content-type") || "";
    let questions: QuestionInput[] = [];
    const parseErrors: string[] = [];

    if (contentType.includes("application/json")) {
        // JSON import
        const body = await request.json();
        if (!Array.isArray(body)) {
            return NextResponse.json({ error: "Expected JSON array of questions" }, { status: 400 });
        }
        questions = body;
    } else if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
        // CSV import
        const csv = await request.text();
        const parsed = parseCSV(csv);
        questions = parsed.data;
        parseErrors.push(...parsed.errors);
    } else {
        return NextResponse.json({
            error: "Content-Type must be application/json or text/csv",
        }, { status: 400 });
    }

    if (questions.length === 0) {
        return NextResponse.json({
            error: "No questions to import",
            parseErrors,
        }, { status: 400 });
    }

    // Validate all questions
    const validationErrors: string[] = [];
    const validQuestions: QuestionInput[] = [];

    for (let i = 0; i < questions.length; i++) {
        const result = validateQuestion(questions[i], i);
        if (result.valid) {
            validQuestions.push(questions[i]);
        } else {
            validationErrors.push(...result.errors);
        }
    }

    if (validQuestions.length === 0) {
        return NextResponse.json({
            error: "No valid questions to import",
            parseErrors,
            validationErrors,
        }, { status: 400 });
    }

    // Pre-fetch all levels for auto-resolving level_id
    const { data: allLevels } = await supabase
        .from("levels")
        .select("id, planet_id, subject, grade_min, grade_max, level_number")
        .order("level_number");

    function findLevelId(q: QuestionInput): string | null {
        if (q.level_id) return q.level_id;
        if (!allLevels) return null;
        // Match by planet_id + subject (levels table has no grade_min/grade_max)
        const match = allLevels.find(l =>
            l.planet_id === q.planet_id &&
            l.subject === q.subject
        );
        return match?.id || null;
    }

    // Insert all valid questions as draft
    const insertData = validQuestions.map(q => ({
        planet_id: q.planet_id,
        level_id: findLevelId(q),
        subject: q.subject,
        grade: q.grade,
        bloom_level: q.bloom_level,
        skill_tag: q.skill_tag || "",
        difficulty: q.difficulty,
        difficulty_score: q.difficulty_score || 0.5,
        curriculum_ref: q.curriculum_ref || "",
        type: q.type,
        question_text: q.question_text || null,
        correct_word: q.correct_word || null,
        wrong_words: q.wrong_words || null,
        equation: q.equation || null,
        answer: q.answer ?? null,
        options: q.options || null,
        accept_answers: q.accept_answers || null,
        grading_mode: q.grading_mode || "exact",
        explanation: q.explanation || "",
        reviewed_by_teacher: false,
        status: "draft",
        created_by: auth.playerId,
        times_shown: 0,
        times_wrong: 0,
        order_index: 0,
    }));

    const { data, error } = await supabase
        .from("questions")
        .insert(insertData)
        .select("id");

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        message: `Imported ${data?.length || 0} questions as draft`,
        imported: data?.length || 0,
        skipped: questions.length - validQuestions.length,
        parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
    }, { status: 201 });
}
