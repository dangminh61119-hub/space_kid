/**
 * /api/ai/english-practice — Luna English Practice Chat
 *
 * Conversational English practice with the Luna owl persona.
 * Luna proactively corrects grammar mistakes using the SANDWICH method.
 */

import { NextRequest, NextResponse } from "next/server";
import { ENGLISH_PRACTICE_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/services/api-auth";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        const rateLimitKey = auth.authenticated
            ? auth.userId!
            : (request.headers.get("x-forwarded-for") || "anon");

        // 30 requests/min — generous for natural conversation
        if (!checkRateLimit(rateLimitKey, 30, 60_000)) return rateLimitResponse();

        const body = await request.json();
        const {
            message,
            history = [],
            sessionContext,
        } = body as {
            message: string;
            history?: ChatMessage[];
            sessionContext: {
                studentName: string;
                grade: number;
                topic: string;
                durationMinutes: number;
                pastSummaries?: string[];
            };
        };

        if (!message || !sessionContext?.topic) {
            return NextResponse.json(
                { error: "Missing required fields: message, sessionContext.topic" },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = process.env.AI_API_URL || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        const modelName = process.env.AI_MODEL || "gemini-2.5-flash";

        if (!apiKey) {
            return NextResponse.json({
                response: "Luna is taking a short break! Please try again in a moment. 🦅",
                isFallback: true,
            });
        }

        const systemPrompt = ENGLISH_PRACTICE_SYSTEM_PROMPT(sessionContext);

        // Keep up to 20 turns of history for natural flow
        const recentHistory = history.slice(-20);

        const messages = [
            { role: "system", content: systemPrompt },
            ...recentHistory,
            { role: "user", content: message },
        ];

        const aiRes = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "Referer": "https://learn.aiclick.vn/",
            },
            body: JSON.stringify({
                model: modelName,
                messages,
                max_tokens: 350,    // Short-ish for conversational turns
                temperature: 0.82,  // Natural, slightly varied
            }),
        });

        if (!aiRes.ok) {
            const errBody = await aiRes.text();
            console.error("[english-practice] AI error:", aiRes.status, errBody);
            return NextResponse.json({
                response: "Luna lost the signal! Try again? 🦅",
                isFallback: true,
            });
        }

        const data = await aiRes.json() as { choices?: Array<{ message: { content: string } }> };
        const aiText = data.choices?.[0]?.message?.content || "Great effort! What would you like to say? 🦅";

        return NextResponse.json({
            response: aiText,
            isFallback: false,
        });

    } catch (error) {
        console.error("[english-practice] Error:", error);
        return NextResponse.json({
            response: "Oops! Something went wrong. Let's try again! 🦅",
            isFallback: true,
        }, { status: 200 });
    }
}
