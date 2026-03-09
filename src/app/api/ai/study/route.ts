/**
 * /api/ai/study — AI Tutor endpoint for Learning Hub
 *
 * Extended chat with longer responses, student profile context,
 * and Socratic teaching method.
 */

import { NextRequest, NextResponse } from "next/server";
import { STUDY_AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { isResponseSafe } from "@/lib/ai/guardrails";
import { requireAuth, unauthorizedResponse, checkRateLimit, rateLimitResponse } from "@/lib/services/api-auth";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        // Auth check
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        // Rate limit: 20 study requests per minute (more generous responses)
        if (!checkRateLimit(auth.userId!, 20, 60_000)) return rateLimitResponse();

        const body = await request.json();
        const {
            message,
            history = [],
            studentContext,
        } = body as {
            message: string;
            history?: ChatMessage[];
            studentContext: {
                name: string;
                grade: number;
                profileContext: string;
                currentSubject?: string;
            };
        };

        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = process.env.AI_API_URL || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        const modelName = process.env.AI_MODEL || "gemini-2.5-flash";

        if (!apiKey) {
            return NextResponse.json({
                response: "Cú Mèo đang nghỉ ngơi! Thử lại sau nhé! 🦉",
                isFallback: true,
            });
        }

        const systemPrompt = STUDY_AI_SYSTEM_PROMPT(studentContext);

        // RAG: Search textbook content for relevant context
        let ragContext = "";
        if (studentContext.grade && message) {
            try {
                const { searchTextbooks, buildRAGContext } = await import("@/lib/services/rag-service");
                const ragResults = await searchTextbooks(
                    message,
                    studentContext.grade,
                    studentContext.currentSubject || undefined,
                    3 // top-3 for tutor context
                );
                if (ragResults.length > 0) {
                    ragContext = buildRAGContext(ragResults);
                }
            } catch (ragErr) {
                console.warn("[study/route] RAG search failed (non-fatal):", ragErr);
            }
        }

        // Build messages with longer history (up to 20 turns for study sessions)
        const recentHistory = history.slice(-20);

        // Inject RAG context into the user message when available
        const userMessage = ragContext
            ? `${ragContext}\n\n---\n\nHỌC SINH HỎI: "${message}"\n\nHãy trả lời dựa trên nội dung SGK ở trên (nếu liên quan). Nếu SGK không liên quan, trả lời bình thường.`
            : message;

        const messages = [
            { role: "system", content: systemPrompt },
            ...recentHistory,
            { role: "user", content: userMessage },
        ];

        const aiRes = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
                model: modelName,
                messages,
                max_tokens: 500,        // Longer responses for teaching
                temperature: 0.7,       // Slightly less creative, more accurate
            }),
        });

        if (!aiRes.ok) {
            console.error("[study/route] AI error:", aiRes.status);
            return NextResponse.json({
                response: "Cú Mèo bị mất sóng! Thử lại nhé! 🦉",
                isFallback: true,
            });
        }

        const data = await aiRes.json() as { choices?: Array<{ message: { content: string } }> };
        const aiText = data.choices?.[0]?.message?.content || "Cú Mèo đang suy nghĩ... 🤔";

        const safe = isResponseSafe(aiText);

        return NextResponse.json({
            response: safe ? aiText : "Cú Mèo muốn nói điều gì đó thật tuyệt vời! 🦉✨",
            isFallback: false,
            wasFiltered: !safe,
        });

    } catch (error) {
        console.error("[study/route] Error:", error);
        return NextResponse.json({
            response: "Tín hiệu bị nhiễu! Nói lại nhé! 🚀",
            isFallback: true,
        }, { status: 200 });
    }
}
