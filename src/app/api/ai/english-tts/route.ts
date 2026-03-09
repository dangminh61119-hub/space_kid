/**
 * /api/ai/english-tts — Google Cloud TTS Neural2 for Luna
 *
 * POST { text: string, speed?: "slow" | "normal" | "fast" }
 * Returns audio/mp3 binary — ready for new Audio(objectURL).play()
 *
 * Voice: en-US-Neural2-F — warm, natural, clear American English
 * Speed: 0.82 (slow/default) for EFL learners, 0.95 (normal) when fluent
 *
 * Latency: ~80–150ms (vs 3–9s with Gemini TTS preview)
 */

import { NextRequest, NextResponse } from "next/server";

const SPEED_RATES: Record<string, number> = {
    slow: 0.82,    // Clear for beginners — every word distinct
    normal: 0.95,  // Near-native when student is fluent
    fast: 1.05,    // Challenge mode
};

export async function POST(request: NextRequest) {
    try {
        const { text, speed = "slow", voice = "en-US-Studio-O" } = await request.json() as { text: string; speed?: string; voice?: string };
        if (!text?.trim()) return NextResponse.json({ error: "Missing text" }, { status: 400 });

        const apiKey = process.env.GOOGLE_TTS_API_KEY;
        if (!apiKey) return NextResponse.json({ error: "No Google TTS API key" }, { status: 503 });

        const speakingRate = SPEED_RATES[speed] ?? SPEED_RATES.slow;

        // Determine language code from voice name
        const languageCode = voice.startsWith("vi-") ? "vi-VN" : "en-US";
        // Studio voices use SSML gender; Chirp3-HD voices ignore it
        const ssmlGender = voice.includes("-Studio-O") ? "FEMALE"
            : voice.includes("-Studio-Q") ? "MALE"
                : "NEUTRAL";

        const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

        const payload = {
            input: { text: text.trim() },
            voice: {
                languageCode,
                name: voice,
                ssmlGender,
            },
            audioConfig: {
                audioEncoding: "MP3",
                speakingRate,
                pitch: 0.0,
                effectsProfileId: ["headphone-class-device"],
            },
        };

        const res = await fetch(ttsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("[english-tts] Cloud TTS error:", res.status, err);
            return NextResponse.json({ error: "TTS failed", detail: err }, { status: 502 });
        }

        const data = await res.json() as { audioContent?: string };
        if (!data.audioContent) {
            return NextResponse.json({ error: "No audio content" }, { status: 502 });
        }

        const audioBuffer = Buffer.from(data.audioContent, "base64");

        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": "audio/mpeg",
                "Content-Length": String(audioBuffer.length),
                "Cache-Control": "no-store",
            },
        });

    } catch (err) {
        console.error("[english-tts] Error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
