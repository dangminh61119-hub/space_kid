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
    const auth = await requireAuth(request);
    if (!auth.authenticated) return unauthorizedResponse(auth.error);

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") || "recent"; // recent | today | unpracticed
    const playerId = searchParams.get("player_id");

    if (!playerId) {
        return NextResponse.json({ error: "Missing player_id" }, { status: 400 });
    }

    let sessions;
    switch (mode) {
        case "today":
            sessions = await getTodaySessions(playerId);
            break;
        case "unpracticed":
            sessions = await getUnpracticedSessions(playerId);
            break;
        default:
            sessions = await getRecentSessions(playerId);
    }

    return NextResponse.json({ sessions });
}

/* ─── POST: Save a new session ─── */
export async function POST(request: NextRequest) {
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

    const session = await saveStudySession({
        playerId,
        query,
        subject,
        grade,
        lesson: lesson || "",
        sources: sources || [],
    });

    if (!session) {
        return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
    }

    return NextResponse.json({ session });
}

/* ─── PATCH: Update session flags ─── */
export async function PATCH(request: NextRequest) {
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
}
