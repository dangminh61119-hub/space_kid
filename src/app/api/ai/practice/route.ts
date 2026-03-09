/**
 * /api/ai/practice — Generate practice exercises from SGK content
 * 
 * Uses RAG to find relevant textbook content, then AI generates
 * flashcards or quiz questions based on that content.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse, checkRateLimit, rateLimitResponse } from "@/lib/services/api-auth";
import { searchTextbooks, buildRAGContext } from "@/lib/services/rag-service";

const PRACTICE_SYSTEM_PROMPT = `Bạn là Cú Mèo 🦉 — trợ lý tạo bài tập cho học sinh tiểu học Việt Nam.

NHIỆM VỤ: Dựa trên nội dung SGK được cung cấp, tạo bài tập luyện tập.

QUY TẮC:
1. Sử dụng tiếng Việt, phù hợp trình độ học sinh
2. Câu hỏi phải DỰA TRÊN nội dung SGK, không tự bịa
3. Mỗi câu hỏi có 4 đáp án, 1 đáp án đúng
4. Có gợi ý (hint) cho mỗi câu
5. Trả về JSON hợp lệ, KHÔNG kèm markdown code fence

FORMAT JSON (trả về ĐÚNG format này):
[
  {
    "question": "Câu hỏi",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "hint": "Gợi ý",
    "explanation": "Giải thích đáp án"
  }
]`;

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);
        if (!checkRateLimit(auth.userId!, 10, 60_000)) return rateLimitResponse();

        const body = await request.json();
        const { topic, grade, subject, count = 5 } = body;

        if (!topic || !grade) {
            return NextResponse.json(
                { error: "Missing required fields: topic, grade" },
                { status: 400 }
            );
        }

        // Step 1: RAG search for relevant content
        const ragResults = await searchTextbooks(
            topic,
            parseInt(grade),
            subject || undefined,
            5
        );

        const ragContext = buildRAGContext(ragResults);

        if (!ragContext) {
            return NextResponse.json({
                questions: [],
                message: "Cú Mèo chưa tìm thấy nội dung SGK phù hợp với chủ đề này.",
                hasSGK: false,
            });
        }

        // Step 2: AI generates practice questions
        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = process.env.AI_API_URL || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        const modelName = process.env.AI_MODEL || "gemini-2.5-flash";

        if (!apiKey) {
            return NextResponse.json({ questions: [], message: "AI không khả dụng", hasSGK: true });
        }

        const userMessage = `${ragContext}\n\n---\n\nDựa trên nội dung SGK ở trên, hãy tạo ${count} câu hỏi trắc nghiệm cho học sinh lớp ${grade} về chủ đề: "${topic}".\n\nTrả về JSON array, KHÔNG có markdown code fence.`;

        const aiRes = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: PRACTICE_SYSTEM_PROMPT },
                    { role: "user", content: userMessage },
                ],
                max_tokens: 2000,
                temperature: 0.5,
            }),
        });

        if (!aiRes.ok) {
            console.error("[ai/practice] API error:", aiRes.status);
            return NextResponse.json({ questions: [], message: "Lỗi AI", hasSGK: true });
        }

        const data = await aiRes.json();
        let aiText = data.choices?.[0]?.message?.content || "";

        // Clean up: remove markdown code fences if present
        aiText = aiText.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

        let questions = [];
        try {
            questions = JSON.parse(aiText);
        } catch {
            console.error("[ai/practice] JSON parse error:", aiText.substring(0, 200));
            return NextResponse.json({ questions: [], message: "Lỗi format bài tập", hasSGK: true });
        }

        return NextResponse.json({
            questions,
            sources: ragResults,
            hasSGK: true,
            topic,
            grade,
            subject,
        });

    } catch (error) {
        console.error("[ai/practice] Error:", error);
        return NextResponse.json({
            questions: [],
            message: "Có lỗi xảy ra",
            hasSGK: false,
        }, { status: 200 });
    }
}
