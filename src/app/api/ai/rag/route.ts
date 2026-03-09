/**
 * RAG Query API — Student homework report + textbook retrieval
 *
 * POST: Student submits "báo bài" → system finds matching textbook content
 *       → AI synthesizes a personalized lesson
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse, checkRateLimit, rateLimitResponse } from "@/lib/services/api-auth";
import { searchTextbooks, buildRAGContext } from "@/lib/services/rag-service";

const STUDY_SYSTEM_PROMPT = `Bạn là Cú Mèo 🦉 — gia sư AI thông minh cho học sinh tiểu học Việt Nam.

NHIỆM VỤ:
Dựa trên nội dung sách giáo khoa được cung cấp bên dưới, hãy tạo bài học phù hợp cho học sinh.

QUY TẮC:
1. Sử dụng tiếng Việt, phong cách thân thiện, dễ hiểu cho trẻ em
2. Chia bài học thành các phần rõ ràng: Kiến thức cần nhớ → Ví dụ minh họa → Bài tập nhỏ
3. Sử dụng emoji để bài học sinh động hơn
4. Giải thích chi tiết, đừng bỏ qua bước nào
5. Cuối bài luôn có 2-3 câu hỏi ôn tập nhanh
6. Nếu nội dung SGK rõ ràng, hãy dạy đúng theo SGK
7. Luôn khen ngợi và khuyến khích học sinh

TRƯỜNG HỢP KHÔNG TÌM THẤY NỘI DUNG:
Nếu không có nội dung SGK liên quan, hãy nói: "Cú Mèo chưa tìm thấy bài này trong kho sách. Bạn thử mô tả cụ thể hơn nhé! 📚"`;

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        // Rate limit: 10 RAG queries per minute
        if (!checkRateLimit(auth.userId!, 10, 60_000)) return rateLimitResponse();

        const body = await request.json();
        const { query, grade, subject, mode } = body;

        if (!query || !grade) {
            return NextResponse.json(
                { error: "Missing required fields: query, grade" },
                { status: 400 }
            );
        }

        // Step 1: Search ChromaDB for relevant textbook content
        const ragResults = await searchTextbooks(
            query,
            parseInt(grade),
            subject || undefined,
            5 // top-5 chunks
        );

        const ragContext = buildRAGContext(ragResults);

        // Step 2: If mode is "search-only", just return the raw results
        if (mode === "search") {
            return NextResponse.json({
                results: ragResults,
                query,
                grade,
                subject,
            });
        }

        // Step 3: Use AI to synthesize a lesson from retrieved content
        const apiKey = process.env.GROK_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        const apiUrl = process.env.AI_API_URL || "https://api.x.ai/v1/chat/completions";
        const modelName = process.env.AI_MODEL || "grok-3-mini";

        if (!apiKey) {
            return NextResponse.json({
                lesson: ragContext || "Cú Mèo chưa tìm thấy bài này trong kho sách. 📚",
                sources: ragResults,
                model: "fallback",
                isFallback: true,
            });
        }

        const userMessage = ragContext
            ? `${ragContext}\n\n---\n\nHỌC SINH HỎI: "${query}"\n\nHãy dựa trên nội dung sách giáo khoa ở trên để tạo bài học chi tiết, dễ hiểu cho học sinh lớp ${grade}.`
            : `Học sinh lớp ${grade} hỏi: "${query}"\n\nKhông tìm thấy nội dung SGK liên quan. Hãy thông báo cho học sinh biết.`;

        const startTime = Date.now();
        const aiResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: STUDY_SYSTEM_PROMPT },
                    { role: "user", content: userMessage },
                ],
                max_tokens: 2000,
                temperature: 0.4,
            }),
        });

        const responseTimeMs = Date.now() - startTime;

        if (!aiResponse.ok) {
            console.error("[ai/rag] API error:", aiResponse.status);
            return NextResponse.json({
                lesson: ragContext || "Cú Mèo bị lỗi rồi! 🦉",
                sources: ragResults,
                model: "fallback",
                isFallback: true,
            });
        }

        const data = await aiResponse.json();
        const lesson = data.choices?.[0]?.message?.content || "Cú Mèo chưa tìm thấy bài này 📚";

        return NextResponse.json({
            lesson,
            sources: ragResults,
            model: modelName,
            responseTimeMs,
            isFallback: false,
        });
    } catch (error) {
        console.error("[ai/rag] Error:", error);
        return NextResponse.json({
            lesson: "Cú Mèo bị lỗi rồi! Bạn thử lại nhé! 🦉",
            sources: [],
            model: "fallback",
            isFallback: true,
        }, { status: 200 });
    }
}
