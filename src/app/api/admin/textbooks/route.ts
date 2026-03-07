/**
 * Admin Textbooks API
 * 
 * GET  - List all textbooks with grade/subject filtering
 * POST - Create a new textbook + process content (pgvector embeddings)
 *        Accepts either:
 *        - multipart/form-data with a PDF file
 *        - application/json with raw text content
 * DELETE - Remove a textbook and its chunks
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, forbiddenResponse, getAdminSupabase } from "@/lib/services/admin-guard";
import { processTextbook, deleteTextbookChunks } from "@/lib/services/rag-service";

// Vercel serverless function config — extend timeout for embedding processing
export const maxDuration = 60; // seconds (requires Pro plan; Hobby = 10s max)

/* ─── PDF text extraction ─── */
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(Buffer.from(buffer));
    return data.text || "";
}

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

/* ─── POST: Create + process textbook ─── */
export async function POST(request: NextRequest) {
    const admin = await requireAdmin(request);
    if (!admin.isAdmin) return forbiddenResponse(admin.error);

    const supabase = getAdminSupabase(admin.userToken);
    if (!supabase) {
        return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    }

    // Check OPENAI_API_KEY is available
    if (!process.env.OPENAI_API_KEY) {
        console.error("[textbooks/POST] OPENAI_API_KEY is not set");
        return NextResponse.json(
            { error: "Server config error: OPENAI_API_KEY is not configured" },
            { status: 500 }
        );
    }

    // Parse request body — supports both form-data (PDF) and JSON (text)
    let title: string;
    let subject: string;
    let grade: number;
    let publisher: string;
    let content: string;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
        // PDF file upload via FormData
        const formData = await request.formData();
        title = formData.get("title") as string || "";
        subject = formData.get("subject") as string || "";
        grade = parseInt(formData.get("grade") as string || "1");
        publisher = formData.get("publisher") as string || "";

        const file = formData.get("file") as File | null;
        const textContent = formData.get("content") as string || "";

        if (file && file.size > 0) {
            // Extract text from PDF
            try {
                const buffer = await file.arrayBuffer();
                content = await extractTextFromPDF(buffer);
                if (!content.trim()) {
                    return NextResponse.json(
                        { error: "Không thể trích xuất text từ PDF. File có thể là scan/ảnh. Hãy thử paste text." },
                        { status: 400 }
                    );
                }
            } catch (err) {
                console.error("[textbooks/POST] PDF parse error:", err);
                return NextResponse.json(
                    { error: `Lỗi đọc PDF: ${err instanceof Error ? err.message : String(err)}` },
                    { status: 400 }
                );
            }
        } else if (textContent.trim()) {
            content = textContent;
        } else {
            return NextResponse.json(
                { error: "Cần upload file PDF hoặc paste nội dung text" },
                { status: 400 }
            );
        }
    } else {
        // JSON body (backward compatible)
        const body = await request.json();
        title = body.title;
        subject = body.subject;
        grade = parseInt(body.grade);
        publisher = body.publisher || "";
        content = body.content;
    }

    // Validate
    if (!title || !subject || !grade || !content) {
        return NextResponse.json(
            { error: "Missing required fields: title, subject, grade, content/file" },
            { status: 400 }
        );
    }

    if (grade < 1 || grade > 5) {
        return NextResponse.json(
            { error: "Grade must be between 1 and 5" },
            { status: 400 }
        );
    }

    // Insert textbook metadata
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

    // Process content: chunk → embed → store in Supabase pgvector
    try {
        const chunkCount = await processTextbook(
            textbook.id,
            content
        );

        // Update status to ready
        await supabase
            .from("textbooks")
            .update({ status: "ready", total_chunks: chunkCount })
            .eq("id", textbook.id);

        return NextResponse.json({
            textbook: { ...textbook, status: "ready", total_chunks: chunkCount },
            chunks: chunkCount,
        });
    } catch (err) {
        // Update status to error
        try {
            await supabase
                .from("textbooks")
                .update({ status: "error" })
                .eq("id", textbook.id);
        } catch (updateErr) {
            console.error("[textbooks/POST] Failed to update error status:", updateErr);
        }

        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("[textbooks/POST] Processing error:", errorMsg);
        return NextResponse.json(
            { error: `Embedding failed: ${errorMsg}` },
            { status: 500 }
        );
    }
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
