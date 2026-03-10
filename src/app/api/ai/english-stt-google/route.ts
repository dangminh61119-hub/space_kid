/**
 * /api/ai/english-stt-google — Google Cloud Speech-to-Text for Luna
 *
 * POST: multipart/form-data with `audio` blob (webm/opus)
 * Optional: `topic` string for Speech Adaptation (boost relevant vocab)
 * Returns: { transcript: string, confidence: number }
 *
 * Uses Google Cloud STT v1 REST API with `latest_short` model
 * optimized for short utterances from non-native English speakers.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRateLimit, rateLimitResponse } from "@/lib/services/api-auth";

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        const rateLimitKey = auth.authenticated
            ? auth.userId!
            : (request.headers.get("x-forwarded-for") || "anon");

        // 40 requests/min — one per speaking turn
        if (!checkRateLimit(rateLimitKey, 40, 60_000)) return rateLimitResponse();

        const formData = await request.formData();
        const audioFile = formData.get("audio") as File | null;
        const topic = formData.get("topic") as string | null;

        if (!audioFile) {
            return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_TTS_API_KEY; // Same GCP project as TTS
        if (!apiKey) {
            return NextResponse.json({ error: "No Google Cloud API key" }, { status: 503 });
        }

        // Convert audio blob to base64
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString("base64");

        // Build Speech Adaptation phrases from topic
        const speechContexts = topic
            ? [{ phrases: topic.split(/[\s,]+/).filter(Boolean), boost: 10 }]
            : [];

        const sttUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;

        const payload = {
            config: {
                encoding: "WEBM_OPUS",
                sampleRateHertz: 48000,
                languageCode: "en-US",
                model: "latest_short",
                enableAutomaticPunctuation: true,
                speechContexts,
            },
            audio: {
                content: base64Audio,
            },
        };

        const res = await fetch(sttUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("[english-stt-google] Cloud STT error:", res.status, err);
            return NextResponse.json(
                { error: "STT failed", transcript: "", confidence: 0 },
                { status: 502 }
            );
        }

        const data = await res.json() as {
            results?: Array<{
                alternatives?: Array<{
                    transcript: string;
                    confidence: number;
                }>;
            }>;
        };

        // Combine all result segments
        const allResults = data.results || [];
        const transcript = allResults
            .map(r => r.alternatives?.[0]?.transcript || "")
            .join(" ")
            .trim();
        const confidence = allResults[0]?.alternatives?.[0]?.confidence ?? 0;

        return NextResponse.json({ transcript, confidence });

    } catch (err) {
        console.error("[english-stt-google] Error:", err);
        return NextResponse.json(
            { error: "Server error", transcript: "", confidence: 0 },
            { status: 500 }
        );
    }
}
