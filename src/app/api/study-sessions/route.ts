/**
 * Study Sessions API — Save, retrieve, update study sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse } from "@/lib/services/api-auth";
import {
    saveStudySession,
    getRecentSessions,
    getTodaySessions,
    markPracticed,
    markReviewed,
    getUnpracticedSessions,
} from "@/lib/services/study-session-db";

/* ─── GET: Get sessions ─── */
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const { searchParams } = new URL(request.url);
        const mode = searchParams.get("mode") || "recent";
        const playerId = searchParams.get("player_id");

        if (!playerId) {
            return NextResponse.json({ error: "Missing player_id" }, { status: 400 });
        }

        // Extract user JWT for RLS-compliant reads
        const authHeader = request.headers.get("Authorization") || "";
        const userToken = authHeader.replace("Bearer ", "") || undefined;

        let sessions;
        switch (mode) {
            case "today":
                sessions = await getTodaySessions(playerId, userToken);
                break;
            case "unpracticed":
                sessions = await getUnpracticedSessions(playerId, 5, userToken);
                break;
            default:
                sessions = await getRecentSessions(playerId, 7, 10, userToken);
        }

        return NextResponse.json({ sessions });
    } catch (error) {
        console.error("[study-sessions/GET] Error:", error);
        return NextResponse.json({ sessions: [], error: String(error) }, { status: 200 });
    }
}

/* ─── POST: Save a new session ─── */
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const body = await request.json();
        const { playerId, query, subject, grade, lesson, sources } = body;

        if (!playerId || !query || !grade) {
            return NextResponse.json(
                { error: "Missing required fields: playerId, query, grade" },
                { status: 400 }
            );
        }

        // Truncate lesson to avoid oversized payloads
        const truncatedLesson = lesson ? String(lesson).substring(0, 10000) : "";
        // Limit sources to top 3
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const limitedSources = Array.isArray(sources) ? sources.slice(0, 3).map((s: any) => ({
            content: String(s.content || "").substring(0, 500),
            chapter: String(s.chapter || ""),
            sectionTitle: String(s.sectionTitle || ""),
            similarity: Number(s.similarity || 0),
            textbookTitle: String(s.textbookTitle || ""),
            subject: String(s.subject || ""),
        })) : [];

        // Extract user JWT for RLS-compliant Supabase client
        const authHeader = request.headers.get("Authorization") || "";
        const userToken = authHeader.replace("Bearer ", "");

        const session = await saveStudySession({
            playerId,
            query,
            subject,
            grade,
            lesson: truncatedLesson,
            sources: limitedSources,
        }, userToken || undefined);

        if (!session) {
            return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
        }

        return NextResponse.json({ session });
    } catch (error) {
        console.error("[study-sessions/POST] Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

/* ─── PATCH: Update session flags ─── */
export async function PATCH(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (!auth.authenticated) return unauthorizedResponse(auth.error);

        const body = await request.json();
        const { sessionId, practiced, reviewed } = body;

        if (!sessionId) {
            return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
        }

        if (practiced) await markPracticed(sessionId);
        if (reviewed) await markReviewed(sessionId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[study-sessions/PATCH] Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
