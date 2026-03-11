/**
 * /api/ai/english-practice — Luna English Practice Chat
 *
 * Conversational English practice with the Luna owl persona.
 * Uses 5-level prompt system for targeted difficulty.
 */

import { NextRequest, NextResponse } from "next/server";
import { getLunaPromptByLevel, type LunaLevel } from "@/lib/ai/prompts";
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
                level?: number;
                // Legacy support
                fluencyLevel?: "beginner" | "intermediate" | "advanced";
            };
        };

        if (!message || !sessionContext?.topic) {
            return NextResponse.json(
                { error: "Missing required fields: message, sessionContext.topic" },
                { status: 400 }
            );
        }

        // Use OpenAI GPT-4O Mini for Luna English Practice
        const apiKey = process.env.OPENAI_API_KEY;
        const apiUrl = "https://api.openai.com/v1/chat/completions";
        const modelName = "gpt-4o-mini";

        if (!apiKey) {
            return NextResponse.json({
                response: "Luna is taking a short break! Please try again in a moment.",
                isFallback: true,
            });
        }

        // Resolve level: use explicit level prop, or map legacy fluencyLevel
        const level: LunaLevel = sessionContext.level
            ? (Math.min(5, Math.max(1, sessionContext.level)) as LunaLevel)
            : sessionContext.fluencyLevel === "advanced" ? 4
                : sessionContext.fluencyLevel === "intermediate" ? 3
                    : 2;

        const systemPrompt = getLunaPromptByLevel(level, {
            studentName: sessionContext.studentName,
            grade: sessionContext.grade,
            topic: sessionContext.topic,
            durationMinutes: sessionContext.durationMinutes,
            pastSummaries: sessionContext.pastSummaries,
        });

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
            },
            body: JSON.stringify({
                model: modelName,
                messages,
                max_tokens: 200,    // Keep responses short
                temperature: 0.85,  // Natural but not too wild
            }),
        });

        if (!aiRes.ok) {
            const errBody = await aiRes.text();
            console.error("[english-practice] AI error:", aiRes.status, errBody);
            return NextResponse.json({
                response: "Luna lost the signal! Try again?",
                isFallback: true,
            });
        }

        const data = await aiRes.json() as { choices?: Array<{ message: { content: string } }> };
        const aiText = data.choices?.[0]?.message?.content || "What would you like to say?";

        return NextResponse.json({
            response: aiText,
            isFallback: false,
        });

    } catch (error) {
        console.error("[english-practice] Error:", error);
        return NextResponse.json({
            response: "Oops! Something went wrong. Let's try again!",
            isFallback: true,
        }, { status: 200 });
    }
}

