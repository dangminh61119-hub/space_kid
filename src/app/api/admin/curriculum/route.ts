import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";

/* ─── GET: List curriculum topics with counts ─── */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const subject = searchParams.get("subject");

    let query = supabase.from("curriculum_topics").select("*");

    if (grade) query = query.eq("grade", parseInt(grade));
    if (subject) query = query.eq("subject", subject);
    query = query.order("subject").order("sort_order");

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Get question counts per topic
    const { data: qCounts } = await supabase
        .from("question_bank")
        .select("topic_id")
        .eq("active", true);

    const countMap: Record<string, number> = {};
    for (const q of qCounts || []) {
        countMap[q.topic_id] = (countMap[q.topic_id] || 0) + 1;
    }

    // Get lesson resource counts per topic
    const { data: lCounts } = await supabase
        .from("lesson_resources")
        .select("topic_id")
        .eq("active", true);

    const lessonMap: Record<string, number> = {};
    for (const l of lCounts || []) {
        lessonMap[l.topic_id] = (lessonMap[l.topic_id] || 0) + 1;
    }

    const enriched = (data || []).map(t => ({
        ...t,
        question_count: countMap[t.id] || 0,
        lesson_count: lessonMap[t.id] || 0,
    }));

    return NextResponse.json({ data: enriched });
}

/* ─── POST: Create a new curriculum topic ─── */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json();
    const { subject, grade, chapter, topic_name, topic_slug, description, bloom_max, sort_order, sgk_keywords } = body;

    if (!subject || !grade || !topic_name || !topic_slug) {
        return NextResponse.json({ error: "Missing required fields: subject, grade, topic_name, topic_slug" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("curriculum_topics")
        .insert({
            subject,
            grade: parseInt(grade),
            chapter: chapter || null,
            topic_name,
            topic_slug,
            description: description || null,
            bloom_max: bloom_max ? parseInt(bloom_max) : 3,
            sort_order: sort_order ? parseInt(sort_order) : 0,
            sgk_keywords: sgk_keywords || [],
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
}

/* ─── DELETE: Remove curriculum topics ─── */
export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { ids } = await request.json();
    if (!ids?.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

    const { error } = await supabase.from("curriculum_topics").delete().in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
