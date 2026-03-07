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
