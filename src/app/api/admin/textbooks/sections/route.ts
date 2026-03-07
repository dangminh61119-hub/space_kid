/**
 * Textbook Sections (Chunks) API
 * 
 * GET    - List all chunks for a textbook
 * PATCH  - Update a chunk's content
 * DELETE - Delete a specific chunk
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";

/* ─── GET: List chunks for a textbook ─── */
export async function GET(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const supabase = getAdminSupabase(admin.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const url = new URL(request.url);
    const textbookId = url.searchParams.get("textbook_id");

    if (!textbookId) {
        return NextResponse.json({ error: "Missing textbook_id" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("textbook_sections")
        .select("id, textbook_id, chapter, section_title, content, chunk_index, created_at")
        .eq("textbook_id", textbookId)
        .order("chunk_index", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sections: data || [] });
}

/* ─── PATCH: Update a chunk ─── */
export async function PATCH(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const supabase = getAdminSupabase(admin.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const { id, content, chapter, section_title } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "Missing chunk id" }, { status: 400 });
    }

    const updateData: Record<string, string> = {};
    if (content !== undefined) updateData.content = content;
    if (chapter !== undefined) updateData.chapter = chapter;
    if (section_title !== undefined) updateData.section_title = section_title;

    const { error } = await supabase
        .from("textbook_sections")
        .update(updateData)
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

/* ─── DELETE: Delete a specific chunk ─── */
export async function DELETE(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const supabase = getAdminSupabase(admin.userToken);
    if (!supabase) return NextResponse.json({ error: "DB not configured" }, { status: 500 });

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing chunk id" }, { status: 400 });
    }

    const { error } = await supabase
        .from("textbook_sections")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
