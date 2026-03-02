/**
 * AI Mascot API Route — Cú Mèo (CosmoMosaic)
 *
 * Guardrailed system prompt for kid-safe AI interactions.
 * Supports Grok API / Gemini Flash / OpenAI-compatible endpoints.
 *
 * Business logic lives in:
 *   lib/ai/prompts.ts     ← SYSTEM_PROMPT + fallback responses
 *   lib/ai/guardrails.ts  ← safety filter + message builder
 */

import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PROMPT, getFallbackResponse } from "@/lib/ai/prompts";
import { isResponseSafe, buildUserMessage } from "@/lib/ai/guardrails";

/* ─── API Route Handler ─── */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { context, questionText, playerAnswer, correctAnswer, subject, bloomLevel } = body;

        const userMessage = buildUserMessage({ context, questionText, playerAnswer, correctAnswer, subject, bloomLevel });

        // Try AI API if configured
        const apiKey = process.env.GROK_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
        const apiUrl = process.env.AI_API_URL || "https://api.x.ai/v1/chat/completions";
        const modelName = process.env.AI_MODEL || "grok-3-mini";

        if (!apiKey) {
            return NextResponse.json({
                response: getFallbackResponse(context),
                model: "fallback",
                isFallback: true,
            });
        }

        const startTime = Date.now();
        const aiResponse = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage },
                ],
                max_tokens: 150,
                temperature: 0.7,
            }),
        });

        const responseTimeMs = Date.now() - startTime;

        if (!aiResponse.ok) {
            console.error("[ai/route] API error:", aiResponse.status);
            return NextResponse.json({
                response: getFallbackResponse(context),
                model: "fallback",
                isFallback: true,
            });
        }

        const data = await aiResponse.json();
        const aiText = data.choices?.[0]?.message?.content || getFallbackResponse(context);

        // Safety filter
        const safe = isResponseSafe(aiText);

        return NextResponse.json({
            response: safe ? aiText : getFallbackResponse(context),
            model: modelName,
            responseTimeMs,
            wasFiltered: !safe,
            isFallback: false,
        });
    } catch (error) {
        console.error("[ai/route] Error:", error);
        return NextResponse.json({
            response: "Cú Mèo bị lỗi rồi! Nhưng bạn cứ tiếp tục chơi nhé! 🦉",
            model: "fallback",
            isFallback: true,
        }, { status: 200 }); // Always 200 to not break client
    }
}
