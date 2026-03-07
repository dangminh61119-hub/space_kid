/**
 * learning-session-service.ts — CosmoMosaic Learning Hub
 * 
 * Tracks individual learning sessions (study, review, AI tutor, lesson).
 * Each session is logged to learning_sessions table and triggers profile update.
 */

import { supabase, isMockMode } from "./supabase";

/* ─── Types ─── */

export type SessionType = "study" | "review" | "ai_tutor" | "lesson";

export interface LearningSession {
    id: string;
    playerId: string;
    sessionType: SessionType;
    subject: string | null;

    questionsTotal: number;
    questionsCorrect: number;
    errorDetails: Array<{ questionId?: string; errorType: string; skillTag?: string }>;
    bloomLevelsAttempted: number[];

    startedAt: string;
    endedAt: string | null;
    durationSeconds: number | null;
}

const SESSIONS_STORAGE_KEY = "cosmomosaic_learning_sessions";

/* ─── Local storage (mock mode) ─── */

function getLocalSessions(playerId: string): LearningSession[] {
    try {
        const saved = localStorage.getItem(`${SESSIONS_STORAGE_KEY}_${playerId}`);
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
}

function saveLocalSessions(playerId: string, sessions: LearningSession[]): void {
    try {
        // Keep only last 100 sessions locally
        const trimmed = sessions.slice(-100);
        localStorage.setItem(`${SESSIONS_STORAGE_KEY}_${playerId}`, JSON.stringify(trimmed));
    } catch { /* ignore */ }
}

/* ─── Public API ─── */

/**
 * Start a new learning session. Returns the session ID.
 */
export async function startSession(
    playerId: string,
    type: SessionType,
    subject?: string,
): Promise<string> {
    const session: LearningSession = {
        id: crypto.randomUUID(),
        playerId,
        sessionType: type,
        subject: subject || null,
        questionsTotal: 0,
        questionsCorrect: 0,
        errorDetails: [],
        bloomLevelsAttempted: [],
        startedAt: new Date().toISOString(),
        endedAt: null,
        durationSeconds: null,
    };

    if (isMockMode || !supabase) {
        const sessions = getLocalSessions(playerId);
        sessions.push(session);
        saveLocalSessions(playerId, sessions);
        return session.id;
    }

    const { data } = await supabase
        .from("learning_sessions")
        .insert({
            id: session.id,
            player_id: playerId,
            session_type: type,
            subject,
            started_at: session.startedAt,
        })
        .select("id")
        .single();

    return data?.id || session.id;
}

/**
 * End a session and save results
 */
export async function endSession(
    playerId: string,
    sessionId: string,
    results: {
        questionsTotal: number;
        questionsCorrect: number;
        errorDetails?: Array<{ questionId?: string; errorType: string; skillTag?: string }>;
        bloomLevelsAttempted?: number[];
    }
): Promise<void> {
    const now = new Date().toISOString();

    if (isMockMode || !supabase) {
        const sessions = getLocalSessions(playerId);
        const idx = sessions.findIndex(s => s.id === sessionId);
        if (idx >= 0) {
            const startTime = new Date(sessions[idx].startedAt).getTime();
            sessions[idx] = {
                ...sessions[idx],
                questionsTotal: results.questionsTotal,
                questionsCorrect: results.questionsCorrect,
                errorDetails: results.errorDetails || [],
                bloomLevelsAttempted: results.bloomLevelsAttempted || [],
                endedAt: now,
                durationSeconds: Math.round((Date.now() - startTime) / 1000),
            };
            saveLocalSessions(playerId, sessions);
        }
        return;
    }

    const { data: sessionData } = await supabase
        .from("learning_sessions")
        .select("started_at")
        .eq("id", sessionId)
        .single();

    const durationSeconds = sessionData
        ? Math.round((Date.now() - new Date(sessionData.started_at).getTime()) / 1000)
        : null;

    await supabase
        .from("learning_sessions")
        .update({
            questions_total: results.questionsTotal,
            questions_correct: results.questionsCorrect,
            error_details: results.errorDetails || [],
            bloom_levels_attempted: results.bloomLevelsAttempted || [],
            ended_at: now,
            duration_seconds: durationSeconds,
        })
        .eq("id", sessionId);
}

/**
 * Get recent sessions for a player
 */
export async function getRecentSessions(
    playerId: string,
    limit: number = 20
): Promise<LearningSession[]> {
    if (isMockMode || !supabase) {
        return getLocalSessions(playerId).slice(-limit).reverse();
    }

    const { data } = await supabase
        .from("learning_sessions")
        .select("*")
        .eq("player_id", playerId)
        .order("started_at", { ascending: false })
        .limit(limit);

    if (!data) return [];

    return data.map(row => ({
        id: row.id,
        playerId: row.player_id,
        sessionType: row.session_type,
        subject: row.subject,
        questionsTotal: row.questions_total ?? 0,
        questionsCorrect: row.questions_correct ?? 0,
        errorDetails: row.error_details ?? [],
        bloomLevelsAttempted: row.bloom_levels_attempted ?? [],
        startedAt: row.started_at,
        endedAt: row.ended_at,
        durationSeconds: row.duration_seconds,
    }));
}

/**
 * Get aggregated session stats
 */
export async function getSessionStats(playerId: string): Promise<{
    totalSessions: number;
    totalMinutes: number;
    totalQuestions: number;
    totalCorrect: number;
    averageAccuracy: number;
    sessionsThisWeek: number;
}> {
    const sessions = await getRecentSessions(playerId, 100);

    const totalSessions = sessions.length;
    const totalMinutes = Math.round(
        sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60
    );
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsTotal, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.questionsCorrect, 0);
    const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sessionsThisWeek = sessions.filter(s => new Date(s.startedAt) > weekAgo).length;

    return { totalSessions, totalMinutes, totalQuestions, totalCorrect, averageAccuracy, sessionsThisWeek };
}
