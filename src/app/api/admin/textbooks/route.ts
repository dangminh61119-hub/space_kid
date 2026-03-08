/**
 * Admin Textbooks API
 * 
 * GET    - List all textbooks with grade/subject filtering
 * POST   - Create textbook metadata (content processing via /chunks endpoint)
 * PATCH  - Update textbook metadata
 * DELETE - Remove a textbook and its chunks
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";
import { deleteTextbookChunks } from "@/lib/services/rag-service";

// Vercel Hobby plan = 10s max
export const maxDuration = 10;


/* ─── GET: List textbooks ─── */
export async function GET(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const supabase = getAdminSupabase(admin.userToken);
    if (!supabase) {
        return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    }

    const url = new URL(request.url);
    const grade = url.searchParams.get("grade");
    const subject = url.searchParams.get("subject");

    let query = supabase
        .from("textbooks")
        .select("*")
        .order("grade", { ascending: true })
        .order("subject", { ascending: true })
        .order("created_at", { ascending: false });

    if (grade) query = query.eq("grade", parseInt(grade));
    if (subject) query = query.eq("subject", subject);

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ textbooks: data || [] });
}

/* ─── PATCH: Update textbook metadata ─── */
export async function PATCH(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const supabase = getAdminSupabase(admin.userToken);
    if (!supabase) {
        return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    }

    const { id, title, subject, grade, publisher } = await request.json();

    if (!id) {
        return NextResponse.json({ error: "Missing textbook id" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (subject !== undefined) updateData.subject = subject;
    if (grade !== undefined) updateData.grade = parseInt(String(grade));
    if (publisher !== undefined) updateData.publisher = publisher || null;

    const { data, error } = await supabase
        .from("textbooks")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ textbook: data });
}

/* ─── POST: Create textbook metadata ─── */
/* Content processing (chunking + embedding) is handled by /chunks endpoint */
export async function POST(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const supabase = getAdminSupabase(admin.userToken);
    if (!supabase) {
        return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    }

    const contentType = request.headers.get("content-type") || "";
    let title: string, subject: string, grade: number, publisher: string;

    if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        title = formData.get("title") as string || "";
        subject = formData.get("subject") as string || "";
        grade = parseInt(formData.get("grade") as string || "1");
        publisher = formData.get("publisher") as string || "";
    } else {
        const body = await request.json();
        title = body.title;
        subject = body.subject;
        grade = parseInt(body.grade);
        publisher = body.publisher || "";
    }

    // Validate
    if (!title || !subject || !grade) {
        return NextResponse.json(
            { error: "Missing required fields: title, subject, grade" },
            { status: 400 }
        );
    }

    if (grade < 1 || grade > 5) {
        return NextResponse.json(
            { error: "Grade must be between 1 and 5" },
            { status: 400 }
        );
    }

    // Insert textbook metadata only
    const { data: textbook, error: insertError } = await supabase
        .from("textbooks")
        .insert({
            title,
            subject,
            grade,
            publisher: publisher || null,
            status: "processing",
        })
        .select()
        .single();

    if (insertError || !textbook) {
        console.error("[textbooks/POST] Insert error:", insertError);
        return NextResponse.json(
            { error: `DB insert failed: ${insertError?.message || "Unknown error"}` },
            { status: 500 }
        );
    }

    return NextResponse.json({ textbook });
}

/* ─── DELETE: Remove textbook ─── */
export async function DELETE(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const supabase = getAdminSupabase(admin.userToken);
    if (!supabase) {
        return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Missing textbook id" }, { status: 400 });
    }

    try {
        // Delete chunks from Supabase
        await deleteTextbookChunks(id);
    } catch (err) {
        console.warn("[textbooks/DELETE] Cleanup warning:", err);
    }

    // Delete metadata from Supabase
    const { error } = await supabase.from("textbooks").delete().eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
