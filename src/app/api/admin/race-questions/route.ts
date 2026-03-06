/**
 * Admin Race Questions API
 * GET:    List race questions with filters
 * POST:   Create new race question
 * PUT:    Update existing race question
 * DELETE: Delete race question(s)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";

export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const journey = searchParams.get("journey");
    const grade = searchParams.get("grade");
    const difficulty = searchParams.get("difficulty");
    const subject = searchParams.get("subject");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    let query = supabase
        .from("race_questions")
        .select("*", { count: "exact" })
        .order("journey_slug")
        .order("grade")
        .order("order_index")
        .range(offset, offset + limit - 1);

    if (journey) query = query.eq("journey_slug", journey);
    if (grade) query = query.eq("grade", parseInt(grade));
    if (difficulty) query = query.eq("difficulty", difficulty);
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

    const body = await request.json();
    const { journey_slug, subject, grade, question_text, correct_answer, wrong_answers, difficulty } = body;

    if (!journey_slug || !question_text || !correct_answer || !wrong_answers) {
        return NextResponse.json({ error: "journey_slug, question_text, correct_answer, wrong_answers are required" }, { status: 400 });
    }

    if (!["race-alpha", "race-beta", "race-gamma"].includes(journey_slug)) {
        return NextResponse.json({ error: "journey_slug must be race-alpha, race-beta, or race-gamma" }, { status: 400 });
    }

    if (!Array.isArray(wrong_answers) || wrong_answers.length < 2) {
        return NextResponse.json({ error: "wrong_answers must be array with at least 2 items" }, { status: 400 });
    }

    if (grade && (grade < 1 || grade > 5)) {
        return NextResponse.json({ error: "grade must be 1-5" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("race_questions")
        .insert({
            journey_slug,
            subject: subject || "Chung",
            grade: grade || 3,
            question_text,
            correct_answer,
            wrong_answers,
            difficulty: difficulty || "medium",
            order_index: 0,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: "Race question created" }, { status: 201 });
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

    const { data, error } = await supabase
        .from("race_questions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, message: "Race question updated" });
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
        .from("race_questions")
        .delete()
        .in("id", ids);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: `Deleted ${count || ids.length} race question(s)` });
}
