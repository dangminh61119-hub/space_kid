/**
 * Admin Questions CRUD API
 * GET:    List questions with filters
 * POST:   Create new question (status=draft)
 * PUT:    Update existing question
 * DELETE: Delete question(s)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";
import { validateQuestion, type QuestionInput } from "@/lib/services/question-validation";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const planet = searchParams.get("planet");
    const grade = searchParams.get("grade");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const subject = searchParams.get("subject");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabase
        .from("questions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (planet) query = query.eq("planet_id", planet);
    if (grade) query = query.eq("grade", parseInt(grade));
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);
    if (subject) query = query.eq("subject", subject);

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        data,
        pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
    });
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json() as QuestionInput;
    const validation = validateQuestion(body);
    if (!validation.valid) {
        return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
    }

    // Auto-resolve level_id if not provided
    let resolvedLevelId = body.level_id || null;
    if (!resolvedLevelId) {
        const { data: matchingLevel } = await supabase
            .from("levels")
            .select("id")
            .eq("planet_id", body.planet_id)
            .eq("subject", body.subject)
            .order("level_number")
            .limit(1)
            .single();

        if (matchingLevel) {
            resolvedLevelId = matchingLevel.id;
        }
    }

    if (!resolvedLevelId) {
        return NextResponse.json(
            { error: "Không tìm được level phù hợp. Hãy cung cấp level_id trực tiếp, hoặc đảm bảo đã có level với planet_id và subject tương ứng." },
            { status: 400 }
        );
    }

    const { data, error } = await supabase
        .from("questions")
        .insert({
            planet_id: body.planet_id,
            level_id: resolvedLevelId,
            subject: body.subject,
            grade: body.grade,
            bloom_level: body.bloom_level,
            skill_tag: body.skill_tag || "",
            difficulty: body.difficulty,
            difficulty_score: body.difficulty_score || 0.5,
            curriculum_ref: body.curriculum_ref || "",
            type: body.type,
            question_text: body.question_text || null,
            correct_word: body.correct_word || null,
            wrong_words: body.wrong_words || null,
            equation: body.equation || null,
            answer: body.answer ?? null,
            options: body.options || null,
            accept_answers: body.accept_answers || null,
            grading_mode: body.grading_mode || "exact",
            explanation: body.explanation || "",
            reviewed_by_teacher: false,
            status: "draft",
            created_by: auth.playerId,
            times_shown: 0,
            times_wrong: 0,
            order_index: 0,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: "Question created (draft)" }, { status: 201 });
}

export async function PUT(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
        return NextResponse.json({ error: "Question id is required" }, { status: 400 });
    }

    // Validate if type-specific fields are present
    if (updates.type || updates.question_text || updates.correct_word) {
        const existing = await supabase.from("questions").select("*").eq("id", id).single();
        if (existing.error) {
            return NextResponse.json({ error: "Question not found" }, { status: 404 });
        }
        const merged = { ...existing.data, ...updates };
        const validation = validateQuestion(merged as QuestionInput);
        if (!validation.valid) {
            return NextResponse.json({ error: "Validation failed", details: validation.errors }, { status: 400 });
        }
    }

    const { data, error } = await supabase
        .from("questions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: "Question updated" });
}

export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];

    if (ids.length === 0) {
        return NextResponse.json({ error: "Provide id or ids array" }, { status: 400 });
    }

    const { error, count } = await supabase
        .from("questions")
        .delete()
        .in("id", ids);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: `Deleted ${count || ids.length} question(s)` });
}
