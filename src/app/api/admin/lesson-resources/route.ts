import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";

/* ─── GET: List lesson resources ─── */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { searchParams } = new URL(request.url);
    const topic_id = searchParams.get("topic_id");

    let query = supabase
        .from("lesson_resources")
        .select("*, curriculum_topics(topic_name, topic_slug, subject, grade, chapter)");

    if (topic_id) query = query.eq("topic_id", topic_id);
    query = query.order("sort_order").order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ data: data || [] });
}

/* ─── POST: Create a lesson resource ─── */
export async function POST(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json();
    const { topic_id, resource_type, youtube_id, title, summary, thumbnail_url, duration_seconds } = body;

    if (!topic_id || !title) {
        return NextResponse.json({ error: "Missing topic_id or title" }, { status: 400 });
    }

    // Auto-generate thumbnail from YouTube ID
    const thumb = thumbnail_url || (youtube_id ? `https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg` : null);

    const { data, error } = await supabase
        .from("lesson_resources")
        .insert({
            topic_id,
            resource_type: resource_type || "youtube",
            youtube_id: youtube_id || null,
            title,
            summary: summary || null,
            thumbnail_url: thumb,
            duration_seconds: duration_seconds || null,
            active: true,
        })
        .select("*, curriculum_topics(topic_name, topic_slug, subject, grade)")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

/* ─── PUT: Update a lesson resource ─── */
export async function PUT(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Auto-update thumbnail if youtube_id changed
    if (updates.youtube_id && !updates.thumbnail_url) {
        updates.thumbnail_url = `https://img.youtube.com/vi/${updates.youtube_id}/hqdefault.jpg`;
    }

    const { data, error } = await supabase
        .from("lesson_resources")
        .update(updates)
        .eq("id", id)
        .select("*, curriculum_topics(topic_name, topic_slug, subject, grade)")
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
}

/* ─── DELETE: Delete lesson resource(s) ─── */
export async function DELETE(request: NextRequest) {
    const auth = await requireAdmin(request);
    if (!auth.isAdmin) return forbiddenResponse(auth.error);

    const supabase = getAdminSupabase(auth.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids)) {
        return NextResponse.json({ error: "Missing ids array" }, { status: 400 });
    }

    const { error } = await supabase.from("lesson_resources").delete().in("id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deleted: ids.length });
}
