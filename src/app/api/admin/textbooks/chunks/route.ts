/**
 * Admin Textbooks Chunks API — Process chunks in batches
 *
 * POST - Process a batch of text chunks (embed + store)
 *        Designed for Vercel Hobby plan: each call handles ≤5 chunks
 *        to stay within 10-second timeout and 4.5MB body limit.
 *
 * PATCH - Update textbook status when all chunks are done
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";
import { processChunkBatch } from "@/lib/services/rag-service";

// Vercel Hobby plan max is 10s, but we set this for Pro plan compatibility
export const maxDuration = 10;

/* ─── POST: Process a batch of chunks ─── */
export async function POST(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
            { error: "OPENAI_API_KEY is not configured" },
            { status: 500 }
        );
    }

    const { textbookId, chunks } = await request.json();

    if (!textbookId || !chunks || !Array.isArray(chunks) || chunks.length === 0) {
        return NextResponse.json(
            { error: "Missing textbookId or chunks array" },
            { status: 400 }
        );
    }

    // Safety: max 5 chunks per request
    if (chunks.length > 5) {
        return NextResponse.json(
            { error: "Max 5 chunks per request" },
            { status: 400 }
        );
    }

    try {
        const processed = await processChunkBatch(textbookId, chunks);
        return NextResponse.json({ processed });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[textbooks/chunks] Error:", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

/* ─── PATCH: Update textbook status after all chunks processed ─── */
export async function PATCH(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const supabase = getAdminSupabase(admin.userToken);
    if (!supabase) {
        return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    }

    const { textbookId, totalChunks, status } = await request.json();

    if (!textbookId) {
        return NextResponse.json({ error: "Missing textbookId" }, { status: 400 });
    }

    const { error } = await supabase
        .from("textbooks")
        .update({
            status: status || "ready",
            total_chunks: totalChunks || 0,
        })
        .eq("id", textbookId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
