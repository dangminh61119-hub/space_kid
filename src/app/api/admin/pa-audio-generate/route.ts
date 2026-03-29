/**
 * POST /api/admin/pa-audio-generate
 * 
 * Batch generate Azure TTS audio for pa_sentences, upload to Supabase Storage.
 * Admin-only endpoint. Processes sentences in small batches to avoid timeouts.
 * 
 * Body: { voice?: string, limit?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || "eastus";

// Default batch size per request (to avoid timeout)
const DEFAULT_BATCH = 10;

export async function POST(req: NextRequest) {
    if (!AZURE_SPEECH_KEY) {
        return NextResponse.json({ error: "Azure Speech chưa được cấu hình" }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const body = await req.json().catch(() => ({}));
    const voice = body.voice || "en-US-AvaMultilingualNeural";
    const limit = Math.min(body.limit || DEFAULT_BATCH, 50);

    // Get sentences without audio_url
    const { data: sentences, error: fetchErr } = await supabase
        .from("pa_sentences")
        .select("id, text")
        .is("audio_url", null)
        .eq("active", true)
        .order("level", { ascending: true })
        .limit(limit);

    if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!sentences?.length) {
        return NextResponse.json({ message: "Tất cả câu đã có audio!", generated: 0, remaining: 0 });
    }

    const results: { id: string; text: string; status: string }[] = [];

    for (const sentence of sentences) {
        try {
            // Generate TTS audio via Azure REST API
            const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
                <voice name='${voice}'>${escapeXml(sentence.text)}</voice>
            </speak>`;

            const ttsRes = await fetch(
                `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
                {
                    method: "POST",
                    headers: {
                        "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
                        "Content-Type": "application/ssml+xml",
                        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
                    },
                    body: ssml,
                }
            );

            if (!ttsRes.ok) {
                results.push({ id: sentence.id, text: sentence.text, status: `TTS error: ${ttsRes.status}` });
                continue;
            }

            const audioBuffer = await ttsRes.arrayBuffer();
            const fileName = `${sentence.id}.mp3`;

            // Upload to Supabase Storage
            const { error: uploadErr } = await supabase.storage
                .from("pa-audio")
                .upload(fileName, audioBuffer, {
                    contentType: "audio/mpeg",
                    upsert: true,
                });

            if (uploadErr) {
                results.push({ id: sentence.id, text: sentence.text, status: `Upload error: ${uploadErr.message}` });
                continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
                .from("pa-audio")
                .getPublicUrl(fileName);

            // Update sentence record
            await supabase
                .from("pa_sentences")
                .update({ audio_url: urlData.publicUrl })
                .eq("id", sentence.id);

            results.push({ id: sentence.id, text: sentence.text, status: "✅ OK" });

            // Small delay to respect Azure rate limits
            await new Promise(r => setTimeout(r, 200));

        } catch (err: any) {
            results.push({ id: sentence.id, text: sentence.text, status: `Error: ${err.message}` });
        }
    }

    // Count remaining
    const { count } = await supabase
        .from("pa_sentences")
        .select("id", { count: "exact", head: true })
        .is("audio_url", null)
        .eq("active", true);

    return NextResponse.json({
        generated: results.filter(r => r.status === "✅ OK").length,
        failed: results.filter(r => r.status !== "✅ OK").length,
        remaining: count ?? 0,
        results,
    });
}

function escapeXml(str: string): string {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
