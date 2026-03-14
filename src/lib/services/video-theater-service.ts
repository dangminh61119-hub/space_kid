/**
 * video-theater-service.ts — StarFlix Vũ Trụ
 *
 * Service layer for the Video Theater feature.
 * Manages series, episodes, quiz progress, and coin-based skip mechanics.
 */

import { supabase, isMockMode, type DBVideoSeries, type DBVideoEpisode, type DBVideoQuizQuestion, type DBVideoWatchProgress } from "./supabase";

/* ─── Public Types ─── */

export interface VideoSeries {
    id: string;
    title: string;
    description: string;
    thumbnailUrl: string;
    category: 'english' | 'math' | 'science';
    gradeMin: number;
    gradeMax: number;
    unlockCost: number;
    orderIndex: number;
    episodeCount?: number;
}

export interface VideoEpisode {
    id: string;
    seriesId: string;
    title: string;
    youtubeId: string;
    durationSeconds: number;
    orderIndex: number;
}

export interface VideoQuizQuestion {
    id: string;
    episodeId: string;
    questionText: string;
    options: string[];
    correctIndex: number;
    orderIndex: number;
}

export interface EpisodeProgress {
    episodeId: string;
    watched: boolean;
    quizPassed: boolean;
    quizSkipCount: number;
}

/* ─── Constants ─── */
const SKIP_BASE_COST = 10; // Base cost in coins for first skip

/** Calculate skip cost: 2^n × base */
export function calculateSkipCost(skipCount: number): number {
    return Math.pow(2, skipCount) * SKIP_BASE_COST;
}

/* ─── Series ─── */

export async function getVideoSeries(grade: number): Promise<VideoSeries[]> {
    if (isMockMode || !supabase) return [];

    const { data, error } = await supabase
        .from("video_series")
        .select("*, video_episodes(id)")
        .eq("is_active", true)
        .lte("grade_min", grade)
        .gte("grade_max", grade)
        .order("order_index");

    if (error || !data) {
        console.error("[starflix] getVideoSeries error:", error);
        return [];
    }

    return (data as (DBVideoSeries & { video_episodes: { id: string }[] })[]).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        thumbnailUrl: s.thumbnail_url,
        category: s.category,
        gradeMin: s.grade_min,
        gradeMax: s.grade_max,
        unlockCost: s.unlock_cost,
        orderIndex: s.order_index,
        episodeCount: s.video_episodes?.length ?? 0,
    }));
}

/* ─── Episodes ─── */

export async function getSeriesEpisodes(seriesId: string): Promise<VideoEpisode[]> {
    if (isMockMode || !supabase) return [];

    const { data, error } = await supabase
        .from("video_episodes")
        .select("*")
        .eq("series_id", seriesId)
        .eq("is_active", true)
        .order("order_index");

    if (error || !data) {
        console.error("[starflix] getSeriesEpisodes error:", error);
        return [];
    }

    return (data as DBVideoEpisode[]).map(e => ({
        id: e.id,
        seriesId: e.series_id,
        title: e.title,
        youtubeId: e.youtube_id,
        durationSeconds: e.duration_seconds,
        orderIndex: e.order_index,
    }));
}

/* ─── Quiz Questions ─── */

export async function getEpisodeQuiz(episodeId: string): Promise<VideoQuizQuestion[]> {
    if (isMockMode || !supabase) return [];

    const { data, error } = await supabase
        .from("video_quiz_questions")
        .select("*")
        .eq("episode_id", episodeId)
        .order("order_index");

    if (error || !data) {
        console.error("[starflix] getEpisodeQuiz error:", error);
        return [];
    }

    return (data as DBVideoQuizQuestion[]).map(q => ({
        id: q.id,
        episodeId: q.episode_id,
        questionText: q.question_text,
        options: q.options,
        correctIndex: q.correct_index,
        orderIndex: q.order_index,
    }));
}

/* ─── Player Progress ─── */

export async function getPlayerSeriesProgress(
    playerId: string,
    seriesId: string
): Promise<Record<string, EpisodeProgress>> {
    if (isMockMode || !supabase || !playerId) return {};

    // Get all episode IDs for this series
    const { data: episodes } = await supabase
        .from("video_episodes")
        .select("id")
        .eq("series_id", seriesId)
        .eq("is_active", true);

    if (!episodes || episodes.length === 0) return {};

    const episodeIds = episodes.map(e => e.id);

    const { data: progress, error } = await supabase
        .from("video_watch_progress")
        .select("*")
        .eq("player_id", playerId)
        .in("episode_id", episodeIds);

    if (error) {
        console.error("[starflix] getPlayerSeriesProgress error:", error);
        return {};
    }

    const map: Record<string, EpisodeProgress> = {};
    if (progress) {
        for (const p of progress as DBVideoWatchProgress[]) {
            map[p.episode_id] = {
                episodeId: p.episode_id,
                watched: p.watched,
                quizPassed: p.quiz_passed,
                quizSkipCount: p.quiz_skip_count,
            };
        }
    }
    return map;
}

/** Mark an episode as watched */
export async function markEpisodeWatched(
    playerId: string,
    episodeId: string
): Promise<void> {
    if (isMockMode || !supabase || !playerId) return;

    const { error } = await supabase
        .from("video_watch_progress")
        .upsert({
            player_id: playerId,
            episode_id: episodeId,
            watched: true,
            updated_at: new Date().toISOString(),
        }, { onConflict: "player_id,episode_id" });

    if (error) console.error("[starflix] markEpisodeWatched error:", error);
}

/** Submit quiz answers → returns true if ALL correct */
export async function submitQuizAnswers(
    playerId: string,
    episodeId: string,
    answers: number[] // player's selected indexes
): Promise<{ passed: boolean; correctCount: number; totalCount: number }> {
    if (isMockMode || !supabase || !playerId) {
        return { passed: false, correctCount: 0, totalCount: 0 };
    }

    // Get correct answers
    const questions = await getEpisodeQuiz(episodeId);
    if (questions.length === 0) {
        return { passed: true, correctCount: 0, totalCount: 0 };
    }

    let correctCount = 0;
    for (let i = 0; i < questions.length; i++) {
        if (answers[i] === questions[i].correctIndex) {
            correctCount++;
        }
    }

    const passed = correctCount === questions.length;

    if (passed) {
        // Mark quiz as passed
        const { error } = await supabase
            .from("video_watch_progress")
            .upsert({
                player_id: playerId,
                episode_id: episodeId,
                watched: true,
                quiz_passed: true,
                updated_at: new Date().toISOString(),
            }, { onConflict: "player_id,episode_id" });

        if (error) console.error("[starflix] submitQuizAnswers error:", error);
    }

    return { passed, correctCount, totalCount: questions.length };
}

/** Skip quiz by spending coins (exponential cost).
 *  Returns the cost spent, or -1 if failed. */
export async function skipQuizWithCoins(
    playerId: string,
    episodeId: string,
): Promise<{ cost: number; newSkipCount: number }> {
    if (isMockMode || !supabase || !playerId) return { cost: -1, newSkipCount: 0 };

    // Get current skip count
    const { data: existing } = await supabase
        .from("video_watch_progress")
        .select("quiz_skip_count")
        .eq("player_id", playerId)
        .eq("episode_id", episodeId)
        .maybeSingle();

    const currentSkips = existing?.quiz_skip_count ?? 0;
    const cost = calculateSkipCost(currentSkips);
    const newSkipCount = currentSkips + 1;

    // Update progress: mark quiz as passed via skip
    const { error } = await supabase
        .from("video_watch_progress")
        .upsert({
            player_id: playerId,
            episode_id: episodeId,
            watched: true,
            quiz_passed: true,
            quiz_skip_count: newSkipCount,
            updated_at: new Date().toISOString(),
        }, { onConflict: "player_id,episode_id" });

    if (error) {
        console.error("[starflix] skipQuizWithCoins error:", error);
        return { cost: -1, newSkipCount: currentSkips };
    }

    return { cost, newSkipCount };
}

/* ─── Admin Functions ─── */

export async function adminGetAllSeries(): Promise<VideoSeries[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from("video_series")
        .select("*, video_episodes(id)")
        .order("order_index");
    if (error || !data) return [];
    return (data as (DBVideoSeries & { video_episodes: { id: string }[] })[]).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        thumbnailUrl: s.thumbnail_url,
        category: s.category,
        gradeMin: s.grade_min,
        gradeMax: s.grade_max,
        unlockCost: s.unlock_cost,
        orderIndex: s.order_index,
        episodeCount: s.video_episodes?.length ?? 0,
    }));
}

export async function adminCreateSeries(data: {
    title: string; description: string; thumbnail_url: string;
    category: string; grade_min: number; grade_max: number;
    unlock_cost: number; order_index: number;
}): Promise<DBVideoSeries | null> {
    if (!supabase) return null;
    const { data: result, error } = await supabase
        .from("video_series")
        .insert(data)
        .select()
        .single();
    if (error) { console.error("[starflix] adminCreateSeries error:", error); return null; }
    return result as DBVideoSeries;
}

export async function adminUpdateSeries(id: string, updates: Partial<DBVideoSeries>): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("video_series").update(updates).eq("id", id);
    if (error) { console.error("[starflix] adminUpdateSeries error:", error); return false; }
    return true;
}

export async function adminDeleteSeries(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("video_series").delete().eq("id", id);
    if (error) { console.error("[starflix] adminDeleteSeries error:", error); return false; }
    return true;
}

export async function adminGetEpisodes(seriesId: string): Promise<DBVideoEpisode[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from("video_episodes")
        .select("*")
        .eq("series_id", seriesId)
        .order("order_index");
    if (error || !data) return [];
    return data as DBVideoEpisode[];
}

export async function adminCreateEpisode(data: {
    series_id: string; title: string; youtube_id: string;
    duration_seconds: number; order_index: number;
}): Promise<DBVideoEpisode | null> {
    if (!supabase) return null;
    const { data: result, error } = await supabase
        .from("video_episodes")
        .insert(data)
        .select()
        .single();
    if (error) { console.error("[starflix] adminCreateEpisode error:", error); return null; }
    return result as DBVideoEpisode;
}

export async function adminUpdateEpisode(id: string, updates: Partial<DBVideoEpisode>): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("video_episodes").update(updates).eq("id", id);
    if (error) { console.error("[starflix] adminUpdateEpisode error:", error); return false; }
    return true;
}

export async function adminDeleteEpisode(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("video_episodes").delete().eq("id", id);
    if (error) { console.error("[starflix] adminDeleteEpisode error:", error); return false; }
    return true;
}

export async function adminGetQuizQuestions(episodeId: string): Promise<DBVideoQuizQuestion[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
        .from("video_quiz_questions")
        .select("*")
        .eq("episode_id", episodeId)
        .order("order_index");
    if (error || !data) return [];
    return data as DBVideoQuizQuestion[];
}

export async function adminCreateQuizQuestion(data: {
    episode_id: string; question_text: string;
    options: string[]; correct_index: number; order_index: number;
}): Promise<DBVideoQuizQuestion | null> {
    if (!supabase) return null;
    const { data: result, error } = await supabase
        .from("video_quiz_questions")
        .insert(data)
        .select()
        .single();
    if (error) { console.error("[starflix] adminCreateQuizQuestion error:", error); return null; }
    return result as DBVideoQuizQuestion;
}

export async function adminUpdateQuizQuestion(id: string, updates: Partial<DBVideoQuizQuestion>): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("video_quiz_questions").update(updates).eq("id", id);
    if (error) { console.error("[starflix] adminUpdateQuizQuestion error:", error); return false; }
    return true;
}

export async function adminDeleteQuizQuestion(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from("video_quiz_questions").delete().eq("id", id);
    if (error) { console.error("[starflix] adminDeleteQuizQuestion error:", error); return false; }
    return true;
}
