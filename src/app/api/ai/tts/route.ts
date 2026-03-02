/**
 * /api/ai/tts — Google Cloud Text-to-Speech (Chirp3-HD)
 *
 * Tất cả tiers đều dùng Chirp3-HD, phân biệt bằng giọng:
 *   "hd"     → Chirp3-HD Puck   (trẻ trung, vui vẻ — cho greetings quan trọng)
 *   "neural" → Chirp3-HD Aoede  (tự nhiên, thân thiện — cho chat hàng ngày)
 *   "fast"   → Chirp3-HD Zephyr (sáng, rõ ràng — cho game feedback)
 *
 * Chirp3-HD KHÔNG hỗ trợ: pitch, speakingRate, effectsProfileId
 * Fallback: 503 → client dùng Web Speech API SpeechSynthesis
 */

import { NextRequest, NextResponse } from "next/server";

/* ─── Chirp3-HD voice maps (tất cả tiers) ─── */
const VOICES: Record<string, Record<string, string>> = {
    hd: {
        // Puck: giọng trẻ trung, năng động, phù hợp trẻ em
        vi: "vi-VN-Chirp3-HD-Puck",
        en: "en-US-Chirp3-HD-Puck",
    },
    neural: {
        // Aoede: giọng tự nhiên, ấm áp cho chat hàng ngày
        vi: "vi-VN-Chirp3-HD-Aoede",
        en: "en-US-Chirp3-HD-Aoede",
    },
    fast: {
        // Zephyr: giọng sáng, rõ ràng, phù hợp phản hồi game
        vi: "vi-VN-Chirp3-HD-Zephyr",
        en: "en-US-Chirp3-HD-Zephyr",
    },
};

const LANGUAGE_CODES: Record<string, string> = {
    vi: "vi-VN",
    en: "en-US",
};

/* ─── Handler ─── */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, lang = "vi", tier = "neural", voice } = body as {
            text: string;
            lang?: "vi" | "en";
            tier?: "hd" | "neural" | "fast";
            voice?: string;
        };

        if (!text || text.trim().length === 0) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "TTS not configured" }, { status: 503 });
        }

        const selectedVoice = voice || VOICES[tier]?.[lang] || VOICES.neural.vi;
        const languageCode = LANGUAGE_CODES[lang] || "vi-VN";

        // Chirp3-HD chỉ hỗ trợ audioEncoding, không hỗ trợ pitch/speakingRate/effectsProfileId
        const ttsPayload = {
            input: { text: text.slice(0, 4000) },
            voice: {
                languageCode,
                name: selectedVoice,
            },
            audioConfig: {
                audioEncoding: "MP3",
            },
        };

        const ttsUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
        const ttsRes = await fetch(ttsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ttsPayload),
        });

        if (!ttsRes.ok) {
            const err = await ttsRes.text();
            console.error("[tts/route] Google TTS error:", err);
            return NextResponse.json({ error: "TTS API error", details: err }, { status: 503 });
        }

        const ttsData = await ttsRes.json() as { audioContent: string };
        return NextResponse.json({
            audioBase64: ttsData.audioContent,
            mimeType: "audio/mp3",
            voice: selectedVoice,
            tier,
            lang,
        });

    } catch (error) {
        console.error("[tts/route] Error:", error);
        return NextResponse.json({ error: "TTS failed" }, { status: 503 });
    }
}
