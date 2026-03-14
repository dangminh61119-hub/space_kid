/**
 * /api/ai/english-live-token — Ephemeral token for Gemini Live API
 *
 * POST { level, studentName, grade, topic, durationMinutes, pastSummaries? }
 * Returns { token, wsUrl } for client-to-server WebSocket connection
 *
 * The token is short-lived (30 min) and locked to the native-audio model.
 * Client uses it to connect directly to Gemini Live API.
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Modality } from "@google/genai";
import { getCosmoLivePrompt, type CosmoLevel } from "@/lib/ai/prompts";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/services/api-auth";

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        const rateLimitKey = auth.authenticated
            ? auth.userId!
            : (request.headers.get("x-forwarded-for") || "anon");

        // 5 requests/min — one per session start
        if (!checkRateLimit(rateLimitKey, 5, 60_000)) return rateLimitResponse();

        const body = await request.json();
        const {
            level = 2,
            studentName = "bạn",
            grade = 2,
            topic = "free talk",
            durationMinutes = 10,
            pastSummaries,
            voiceName = "Kore",
        } = body as {
            level?: number;
            studentName?: string;
            grade?: number;
            topic?: string;
            durationMinutes?: number;
            pastSummaries?: string[];
            voiceName?: string;
        };

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 503 }
            );
        }

        // Build Cosmo Live voice-optimized prompt
        const cosmoLevel = Math.min(5, Math.max(1, level)) as CosmoLevel;
        const systemInstruction = getCosmoLivePrompt(cosmoLevel, {
            studentName,
            grade,
            topic,
            durationMinutes,
        });

        // Create GenAI client
        const client = new GoogleGenAI({ apiKey });

        // Ephemeral token — 30 min expiry, locked to native-audio model
        const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        const token = await client.authTokens.create({
            config: {
                uses: 1,
                expireTime,
                liveConnectConstraints: {
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    config: {
                        responseModalities: [Modality.AUDIO],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName },
                            },
                        },
                        systemInstruction: {
                            parts: [{ text: systemInstruction }],
                        },
                    },
                },
                httpOptions: { apiVersion: "v1alpha" },
            },
        });

        // WebSocket URL with ephemeral token
        const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained`;

        return NextResponse.json({
            token: (token as { name?: string }).name || token,
            wsUrl,
            model: "gemini-2.5-flash-native-audio-preview-12-2025",
            expiresAt: expireTime,
        });

    } catch (error) {
        console.error("[english-live-token] Error:", error);
        return NextResponse.json(
            { error: "Failed to create live session token" },
            { status: 500 }
        );
    }
}
