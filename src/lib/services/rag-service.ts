/**
 * RAG Service — Supabase pgvector Textbook Knowledge Base
 *
 * Handles:
 * 1. Chunking textbook content with overlap
 * 2. Generating embeddings via OpenAI API
 * 3. Storing chunks + embeddings in Supabase (pgvector)
 * 4. Semantic similarity search via match_textbook_sections() RPC
 *
 * No external vector DB needed — uses Supabase PostgreSQL + pgvector
 */

import { createClient } from "@supabase/supabase-js";

/* ─── Types ─── */
export interface RAGResult {
    content: string;
    chapter?: string;
    sectionTitle?: string;
    similarity: number;
    textbookId: string;
    textbookTitle?: string;
    subject: string;
    grade: number;
    chunkIndex: number;
}

/* ─── Config ─── */
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIM = 1536;

/** Get a Supabase client for server-side operations */
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
}

/* ─── OpenAI Embedding ─── */

/** Generate embeddings via OpenAI text-embedding-3-small */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required for embedding generation");
    }

    // Process in batches of 100 (OpenAI limit)
    const batchSize = 100;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        const response = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: EMBEDDING_MODEL,
                input: batch,
                dimensions: EMBEDDING_DIM,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenAI embedding error: ${response.status} — ${err}`);
        }

        const data = await response.json();
        const embeddings = data.data.map((item: { embedding: number[] }) => item.embedding);
        allEmbeddings.push(...embeddings);
    }

    return allEmbeddings;
}

/** Generate a single embedding for a query */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
    const [embedding] = await generateEmbeddings([query]);
    return embedding;
}

/* ─── Text Chunking ─── */

/**
 * Split text into overlapping chunks of ~chunkSize words.
 * Preserves paragraph boundaries.
 */
export function chunkText(
    text: string,
    chunkSize = 400,
    overlap = 80
): string[] {
    const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    const paragraphs = cleaned.split(/\n\n+/);

    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentWordCount = 0;

    for (const para of paragraphs) {
        const paraWords = para.split(/\s+/).length;

        if (currentWordCount + paraWords > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.join("\n\n"));

            const overlapText = currentChunk.join("\n\n");
            const words = overlapText.split(/\s+/);
            if (words.length > overlap) {
                currentChunk = [words.slice(-overlap).join(" ")];
                currentWordCount = overlap;
            } else {
                currentChunk = [];
                currentWordCount = 0;
            }
        }

        currentChunk.push(para);
        currentWordCount += paraWords;
    }

    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n\n"));
    }

    return chunks;
}

/** Parse chapter/section info from Vietnamese textbook content */
export function parseChapterInfo(text: string): {
    chapter?: string;
    sectionTitle?: string;
} {
    const chapterMatch = text.match(
        /^(Chương\s+\d+[:\s].+|CHƯƠNG\s+\d+[:\s].+|Chapter\s+\d+[:\s].+)/im
    );
    const sectionMatch = text.match(
        /^(Bài\s+\d+[:\s].+|BÀI\s+\d+[:\s].+|Lesson\s+\d+[:\s].+|Phần\s+\d+[:\s].+)/im
    );

    return {
        chapter: chapterMatch?.[1]?.trim(),
        sectionTitle: sectionMatch?.[1]?.trim(),
    };
}

/* ─── Supabase pgvector Operations ─── */

/**
 * Process and store a textbook's content in Supabase.
 * Chunks text → generates embeddings → inserts into textbook_sections.
 */
export async function processTextbook(
    textbookId: string,
    content: string,
    chunkSize = 400
): Promise<number> {
    const supabase = getSupabase();
    const chunks = chunkText(content, chunkSize);

    // Generate all embeddings
    const embeddings = await generateEmbeddings(chunks);

    let lastChapter = "";
    let lastSection = "";

    // Insert in batches of 50
    const batchSize = 50;
    for (let batchStart = 0; batchStart < chunks.length; batchStart += batchSize) {
        const rows = [];

        for (let j = 0; j < batchSize && batchStart + j < chunks.length; j++) {
            const i = batchStart + j;
            const chunk = chunks[i];
            const { chapter, sectionTitle } = parseChapterInfo(chunk);

            if (chapter) lastChapter = chapter;
            if (sectionTitle) lastSection = sectionTitle;

            rows.push({
                textbook_id: textbookId,
                chapter: lastChapter || "",
                section_title: lastSection || "",
                content: chunk,
                chunk_index: i,
                embedding: JSON.stringify(embeddings[i]),
            });
        }

        const { error } = await supabase.from("textbook_sections").insert(rows);
        if (error) {
            console.error("[rag] Insert batch error:", error.message);
            throw new Error(`Failed to insert chunks: ${error.message}`);
        }
    }

    return chunks.length;
}

/**
 * Search textbook sections by semantic similarity.
 * Uses the match_textbook_sections() PostgreSQL function with pgvector.
 */
export async function searchTextbooks(
    query: string,
    grade: number,
    subject?: string,
    topK = 5
): Promise<RAGResult[]> {
    const supabase = getSupabase();

    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);

    // Call the RPC function
    const { data, error } = await supabase.rpc("match_textbook_sections", {
        query_embedding: JSON.stringify(queryEmbedding),
        match_grade: grade,
        match_subject: subject || null,
        match_count: topK,
        match_threshold: 0.3,
    });

    if (error) {
        console.error("[rag] Search error:", error.message);
        return [];
    }

    return (data || []).map((row: {
        id: number;
        textbook_id: string;
        textbook_title: string;
        subject: string;
        grade: number;
        chapter: string;
        section_title: string;
        content: string;
        chunk_index: number;
        similarity: number;
    }) => ({
        content: row.content,
        chapter: row.chapter || undefined,
        sectionTitle: row.section_title || undefined,
        similarity: row.similarity,
        textbookId: row.textbook_id,
        textbookTitle: row.textbook_title || undefined,
        subject: row.subject,
        grade: row.grade,
        chunkIndex: row.chunk_index,
    }));
}

/**
 * Delete all chunks for a specific textbook
 */
export async function deleteTextbookChunks(textbookId: string): Promise<void> {
    const supabase = getSupabase();
    const { error } = await supabase
        .from("textbook_sections")
        .delete()
        .eq("textbook_id", textbookId);

    if (error) {
        console.error("[rag] Delete chunks error:", error.message);
    }
}

/**
 * Build the AI prompt context from RAG results.
 */
export function buildRAGContext(results: RAGResult[]): string {
    if (results.length === 0) return "";

    let context = "📚 NỘI DUNG SÁCH GIÁO KHOA LIÊN QUAN:\n\n";

    for (const r of results) {
        context += `--- [${r.textbookTitle || "SGK"}`;
        if (r.chapter) context += ` | ${r.chapter}`;
        if (r.sectionTitle) context += ` | ${r.sectionTitle}`;
        context += `] (Độ liên quan: ${Math.round(r.similarity * 100)}%) ---\n`;
        context += `${r.content}\n\n`;
    }

    return context;
}
