/**
 * Study Session DB Service
 * 
 * Manages study sessions (báo bài history) in Supabase.
 * Replaces localStorage-based session tracking.
 */

import { createClient } from "@supabase/supabase-js";

/* ─── Types ─── */
export interface StudySession {
    id: string;
    player_id: string;
    query: string;
    subject: string | null;
    grade: number;
    lesson: string;
    sources: RAGSourceDB[];
    practiced: boolean;
    reviewed: boolean;
    created_at: string;
}

export interface RAGSourceDB {
    content: string;
    chapter?: string;
    sectionTitle?: string;
    similarity: number;
    textbookTitle?: string;
    subject: string;
}

/* ─── Supabase client ─── */
function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, key);
}

/* ─── API ─── */

/** Save a new study session (after báo bài) */
export async function saveStudySession(data: {
    playerId: string;
    query: string;
    subject?: string;
    grade: number;
    lesson: string;
    sources: RAGSourceDB[];
}): Promise<StudySession | null> {
    const supabase = getSupabase();
    const { data: row, error } = await supabase
        .from("study_sessions")
        .insert({
            player_id: data.playerId,
            query: data.query,
            subject: data.subject || null,
            grade: data.grade,
            lesson: data.lesson,
            sources: data.sources,
        })
        .select()
        .single();

    if (error) {
        console.error("[study-session] save error:", error.message, error.details, error.hint);
        throw new Error(`Supabase save failed: ${error.message} | ${error.details || ""} | ${error.hint || ""}`);
    }
    return row as StudySession;
}

/** Get recent study sessions for a player */
export async function getRecentSessions(
    playerId: string,
    days: number = 7,
    limit: number = 10
): Promise<StudySession[]> {
    const supabase = getSupabase();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("player_id", playerId)
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[study-session] getRecent error:", error);
        return [];
    }
    return (data || []) as StudySession[];
}

/** Get today's sessions */
export async function getTodaySessions(playerId: string): Promise<StudySession[]> {
    const supabase = getSupabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("player_id", playerId)
        .gte("created_at", today.toISOString())
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[study-session] getToday error:", error);
        return [];
    }
    return (data || []) as StudySession[];
}

/** Mark session as practiced */
export async function markPracticed(sessionId: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
        .from("study_sessions")
        .update({ practiced: true })
        .eq("id", sessionId);
}

/** Mark session as reviewed */
export async function markReviewed(sessionId: string): Promise<void> {
    const supabase = getSupabase();
    await supabase
        .from("study_sessions")
        .update({ reviewed: true })
        .eq("id", sessionId);
}

/** Get unpracticed sessions (for recommendations) */
export async function getUnpracticedSessions(
    playerId: string,
    limit: number = 5
): Promise<StudySession[]> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("player_id", playerId)
        .eq("practiced", false)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[study-session] getUnpracticed error:", error);
        return [];
    }
    return (data || []) as StudySession[];
}

/** Get studied subjects summary */
export async function getStudiedSubjectsSummary(playerId: string): Promise<Record<string, number>> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from("study_sessions")
        .select("subject")
        .eq("player_id", playerId)
        .not("subject", "is", null);

    if (error) return {};

    const counts: Record<string, number> = {};
    for (const row of data || []) {
        counts[row.subject] = (counts[row.subject] || 0) + 1;
    }
    return counts;
}
