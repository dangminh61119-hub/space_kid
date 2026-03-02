/**
 * /api/ai/chat — Conversational Gemini endpoint for Cú Mèo mascot
 *
 * Modes:
 *   "guest"  — greet, ask name, invite login
 *   "member" — companion mode, knows player context
 */

import { NextRequest, NextResponse } from "next/server";
import { CHAT_SYSTEM_PROMPT_GUEST, CHAT_SYSTEM_PROMPT_MEMBER } from "@/lib/ai/prompts";
import { isResponseSafe } from "@/lib/ai/guardrails";

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

interface PlayerContext {
    name?: string;
    playerClass?: string;
    planet?: string;
    xp?: number;
    level?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            message,
            mode = "guest",
            playerContext,
            history = [],
        } = body as {
            message: string;
            mode: "guest" | "member";
            playerContext?: PlayerContext;
            history?: ChatMessage[];
        };

        const apiKey = process.env.GEMINI_API_KEY;
        const apiUrl = process.env.AI_API_URL || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        const modelName = process.env.AI_MODEL || "gemini-2.5-flash";

        if (!apiKey) {
            return NextResponse.json({
                response: "Cú Mèo đang nghỉ ngơi một chút! Thử lại sau nhé bạn nhỏ! 🦉",
                isFallback: true,
            });
        }

        // Build system prompt based on mode
        let systemPrompt = mode === "member" && playerContext
            ? CHAT_SYSTEM_PROMPT_MEMBER(playerContext)
            : CHAT_SYSTEM_PROMPT_GUEST;

        // Detect language from message to tell mascot which language to respond in
        const hasVietnamese = /[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i.test(message);
        const lang = hasVietnamese ? "vi" : "en";
        if (lang === "en") {
            systemPrompt += "\n\nThe child is speaking English. Please respond in English, keeping the same friendly and child-appropriate tone.";
        }

        // Build message array with history (limit to last 8 turns for context)
        const recentHistory = history.slice(-8);
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
                max_tokens: 120,
                temperature: 0.75,
            }),
        });

        if (!aiRes.ok) {
            console.error("[chat/route] AI error:", aiRes.status);
            return NextResponse.json({
                response: "Cú Mèo bị mất sóng! Thử lại nhé! 🦉",
                isFallback: true,
                lang,
            });
        }

        const data = await aiRes.json() as { choices?: Array<{ message: { content: string } }> };
        const aiText = data.choices?.[0]?.message?.content || "Cú Mèo đang suy nghĩ... 🤔";

        const safe = isResponseSafe(aiText);

        return NextResponse.json({
            response: safe ? aiText : "Cú Mèo muốn nói điều gì đó thật tuyệt vời! 🦉✨",
            lang,
            isFallback: false,
            wasFiltered: !safe,
        });

    } catch (error) {
        console.error("[chat/route] Error:", error);
        return NextResponse.json({
            response: "Tín hiệu vũ trụ bị nhiễu! Nói lại nhé bạn nhỏ! 🚀",
            isFallback: true,
        }, { status: 200 });
    }
}
