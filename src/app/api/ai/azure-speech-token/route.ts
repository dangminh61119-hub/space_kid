/**
 * /api/ai/azure-speech-token — Azure Speech SDK Auth Token
 *
 * Returns a short-lived authorization token for the Azure Speech SDK
 * to use client-side (browser). Token expires in 10 minutes.
 *
 * Env vars required:
 *   AZURE_SPEECH_KEY    — Azure Speech resource key
 *   AZURE_SPEECH_REGION — Azure region (e.g. "eastus")
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/services/api-auth";

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const key = process.env.AZURE_SPEECH_KEY;
        const region = process.env.AZURE_SPEECH_REGION;

        if (!key || !region) {
            return NextResponse.json(
                { error: "Azure Speech not configured" },
                { status: 503 }
            );
        }

        // Exchange subscription key for auth token
        const tokenUrl = `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;
        const tokenRes = await fetch(tokenUrl, {
            method: "POST",
            headers: {
                "Ocp-Apim-Subscription-Key": key,
                "Content-Length": "0",
            },
        });

        if (!tokenRes.ok) {
            console.error("[azure-speech-token] Token exchange failed:", tokenRes.status);
            return NextResponse.json(
                { error: "Failed to get Azure token" },
                { status: 502 }
            );
        }

        const token = await tokenRes.text();

        return NextResponse.json({ token, region });
    } catch (error) {
        console.error("[azure-speech-token] Error:", error);
        return NextResponse.json(
            { error: "Server error" },
            { status: 500 }
        );
    }
}
