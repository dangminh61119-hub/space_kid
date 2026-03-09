/**
 * /api/ai/english-tts — Gemini Text-to-Speech for Luna
 *
 * POST { text: string, voice?: string }
 * Returns audio/wav binary blob, suitable for new Audio(objectURL).play()
 *
 * Gemini voices: Aoede (warm), Charon (confident), Fenrir (bright),
 *                Kore (gentle), Puck (playful)
 * We use "Kore" for Luna — gentle, encouraging female voice.
 */

import { NextRequest, NextResponse } from "next/server";

/* ─── Helpers ─── */
function buildWavHeader(pcmLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const chunkSize = 36 + pcmLength;
    const buf = Buffer.alloc(44);
    buf.write("RIFF", 0);
    buf.writeUInt32LE(chunkSize, 4);
    buf.write("WAVE", 8);
    buf.write("fmt ", 12);
    buf.writeUInt32LE(16, 16);           // Subchunk1Size
    buf.writeUInt16LE(1, 20);            // PCM
    buf.writeUInt16LE(numChannels, 22);
    buf.writeUInt32LE(sampleRate, 24);
    buf.writeUInt32LE(byteRate, 28);
    buf.writeUInt16LE(blockAlign, 32);
    buf.writeUInt16LE(bitsPerSample, 34);
    buf.write("data", 36);
    buf.writeUInt32LE(pcmLength, 40);
    return buf;
}

export async function POST(request: NextRequest) {
    try {
        const { text, voice = "Kore", speed = "slow" } = await request.json() as { text: string; voice?: string; speed?: "slow" | "normal" | "fast" };
        if (!text?.trim()) return NextResponse.json({ error: "Missing text" }, { status: 400 });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return NextResponse.json({ error: "No API key" }, { status: 503 });

        // Use Gemini TTS model — generates natural expressive speech
        const ttsUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

        // Prepend speaking style instruction for EFL learners — Gemini TTS honours natural language pacing hints.
        const styledText = speed === "slow"
            ? `Say the following slowly, clearly, and with natural pauses between sentences, as if speaking to an English language learner: ${text.trim()}`
            : text.trim();

        const payload = {
            contents: [{ parts: [{ text: styledText }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        };

        const res = await fetch(ttsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.text();
            console.error("[english-tts] Gemini TTS error:", res.status, err);
            return NextResponse.json({ error: "TTS generation failed", detail: err }, { status: 502 });
        }

        const data = await res.json() as {
            candidates?: Array<{
                content: {
                    parts: Array<{
                        inlineData?: { mimeType: string; data: string }
                    }>
                }
            }>
        };

        const inlineData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;
        if (!inlineData?.data) {
            console.error("[english-tts] No audio data in response", JSON.stringify(data).slice(0, 200));
            return NextResponse.json({ error: "No audio data" }, { status: 502 });
        }

        const pcmBuffer = Buffer.from(inlineData.data, "base64");
        const wavHeader = buildWavHeader(pcmBuffer.length);
        const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);

        return new NextResponse(wavBuffer, {
            headers: {
                "Content-Type": "audio/wav",
                "Content-Length": String(wavBuffer.length),
                "Cache-Control": "no-store",
            },
        });

    } catch (err) {
        console.error("[english-tts] Error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
