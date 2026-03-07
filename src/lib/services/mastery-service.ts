/**
 * mastery-service.ts — Track per-topic mastery for students
 * 
 * Updates `student_topic_mastery` after practice sessions.
 * Provides mastery data for the recommendation engine.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getClient(userToken?: string) {
    if (userToken) {
        return createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: `Bearer ${userToken}` } },
        });
    }
    return createClient(supabaseUrl, supabaseKey);
}

/* ─── Types ─── */
export interface TopicMastery {
    id: string;
    player_id: string;
    topic_id: string;
    total_attempts: number;
    correct_count: number;
    mastery_score: number;
    last_practiced_at: string | null;
    bloom_reached: number;
}

export interface MasteryUpdate {
    topic_id: string;
    correct: number;
    total: number;
    bloom_level?: number; // highest bloom level of questions answered correctly
}

/* ─── Update mastery after practice ─── */
export async function updateTopicMastery(
    playerId: string,
    update: MasteryUpdate,
    userToken?: string
): Promise<TopicMastery | null> {
    const supabase = getClient(userToken);

    // Get existing mastery or create new
    const { data: existing } = await supabase
        .from("student_topic_mastery")
        .select("*")
        .eq("player_id", playerId)
        .eq("topic_id", update.topic_id)
        .single();

    const newTotal = (existing?.total_attempts || 0) + update.total;
    const newCorrect = (existing?.correct_count || 0) + update.correct;
    const newScore = newTotal > 0 ? newCorrect / newTotal : 0;
    const currentBloom = existing?.bloom_reached || 0;
    const newBloom = Math.max(currentBloom, update.bloom_level || 0);

    if (existing) {
        // Update existing
        const { data, error } = await supabase
            .from("student_topic_mastery")
            .update({
                total_attempts: newTotal,
                correct_count: newCorrect,
                mastery_score: Math.round(newScore * 100) / 100,
                bloom_reached: newBloom,
                last_practiced_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single();

        if (error) console.error("Mastery update error:", error);
        return data;
    } else {
        // Insert new
        const { data, error } = await supabase
            .from("student_topic_mastery")
            .insert({
                player_id: playerId,
                topic_id: update.topic_id,
                total_attempts: update.total,
                correct_count: update.correct,
                mastery_score: Math.round(newScore * 100) / 100,
                bloom_reached: update.bloom_level || 0,
                last_practiced_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) console.error("Mastery insert error:", error);
        return data;
    }
}

/* ─── Get all mastery for a player ─── */
export async function getPlayerMastery(
    playerId: string,
    grade?: number,
    userToken?: string
): Promise<TopicMastery[]> {
    const supabase = getClient(userToken);

    let query = supabase
        .from("student_topic_mastery")
        .select("*, curriculum_topics(topic_name, topic_slug, subject, grade, chapter)")
        .eq("player_id", playerId);

    const { data, error } = await query;
    if (error) { console.error("Get mastery error:", error); return []; }

    // Filter by grade if provided (through joined topic)
    if (grade && data) {
        return data.filter((m: Record<string, unknown>) => {
            const topic = m.curriculum_topics as Record<string, unknown> | null;
            return topic?.grade === grade;
        });
    }

    return data || [];
}

/* ─── Get mastery for a specific topic ─── */
export async function getTopicMastery(
    playerId: string,
    topicId: string,
    userToken?: string
): Promise<TopicMastery | null> {
    const supabase = getClient(userToken);

    const { data } = await supabase
        .from("student_topic_mastery")
        .select("*")
        .eq("player_id", playerId)
        .eq("topic_id", topicId)
        .single();

    return data;
}
