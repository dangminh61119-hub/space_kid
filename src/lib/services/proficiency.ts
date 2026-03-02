/**
 * proficiency.ts – CosmoMosaic Proficiency Tracking
 *
 * Tracks player mastery per subject, provides difficulty recommendations,
 * and records answer history to avoid repeating mastered questions.
 */

import { supabase, isMockMode } from "../services/supabase";

/* ─── Types ─── */
export interface ProficiencyData {
    subject: string;
    estimatedGrade: number;
    masteryScore: number;
    totalCorrect: number;
    totalAttempted: number;
    level: "beginner" | "intermediate" | "advanced";
}

/* ─── Local proficiency cache (for mock mode) ─── */
const PROFICIENCY_KEY = "cosmomosaic_proficiency";
const ANSWER_HISTORY_KEY = "cosmomosaic_answer_history";

interface LocalProficiency {
    [subject: string]: {
        masteryScore: number;
        totalCorrect: number;
        totalAttempted: number;
    };
}

interface LocalAnswerEntry {
    questionId: string;
    isCorrect: boolean;
    answeredAt: string;
}

function getLocalProficiency(): LocalProficiency {
    try {
        const saved = localStorage.getItem(PROFICIENCY_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
}

function saveLocalProficiency(data: LocalProficiency) {
    try {
        localStorage.setItem(PROFICIENCY_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
}

function getLocalAnswerHistory(): LocalAnswerEntry[] {
    try {
        const saved = localStorage.getItem(ANSWER_HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function saveLocalAnswerHistory(data: LocalAnswerEntry[]) {
    try {
        localStorage.setItem(ANSWER_HISTORY_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
}

/* ─── Update proficiency after an answer ─── */
export async function updateProficiency(
    playerId: string,
    subject: string,
    isCorrect: boolean
): Promise<void> {
    if (isMockMode || !supabase) {
        // Mock mode: update localStorage
        const local = getLocalProficiency();
        const current = local[subject] || { masteryScore: 50, totalCorrect: 0, totalAttempted: 0 };
        current.totalAttempted += 1;
        if (isCorrect) current.totalCorrect += 1;
        // Weighted moving average: 70% old + 30% new
        current.masteryScore = Math.min(100, Math.max(0,
            Math.round((current.masteryScore * 7 + (isCorrect ? 100 : 0) * 3) / 10)
        ));
        local[subject] = current;
        saveLocalProficiency(local);
        return;
    }

    // Use DB function
    await supabase.rpc("update_proficiency", {
        p_player_id: playerId,
        p_subject: subject,
        p_is_correct: isCorrect,
    });
}

/* ─── Get recommended difficulty based on proficiency ─── */
export function getRecommendedDifficulty(masteryScore: number): "easy" | "medium" | "hard" {
    if (masteryScore >= 75) return "hard";
    if (masteryScore >= 40) return "medium";
    return "easy";
}

/* ─── Record game answer (to avoid repeats) ─── */
export async function recordGameAnswer(
    playerId: string,
    questionId: string,
    isCorrect: boolean
): Promise<void> {
    if (!questionId) return;

    if (isMockMode || !supabase) {
        const history = getLocalAnswerHistory();
        history.push({
            questionId,
            isCorrect,
            answeredAt: new Date().toISOString(),
        });
        saveLocalAnswerHistory(history);
        return;
    }

    await supabase.from("answer_history").insert({
        player_id: playerId,
        question_id: questionId,
        is_correct: isCorrect,
    });
}

/* ─── Check if a question was already answered correctly ─── */
export async function wasAnsweredCorrectly(
    playerId: string,
    questionId: string
): Promise<boolean> {
    if (!questionId) return false;

    if (isMockMode || !supabase) {
        const history = getLocalAnswerHistory();
        return history.some(h => h.questionId === questionId && h.isCorrect);
    }

    const { data } = await supabase
        .from("answer_history")
        .select("id")
        .eq("player_id", playerId)
        .eq("question_id", questionId)
        .eq("is_correct", true)
        .limit(1);

    return (data?.length ?? 0) > 0;
}

/* ─── Get all proficiency data for a player ─── */
export async function getPlayerProficiencies(
    playerId: string
): Promise<ProficiencyData[]> {
    if (isMockMode || !supabase) {
        const local = getLocalProficiency();
        return Object.entries(local).map(([subject, data]) => ({
            subject,
            estimatedGrade: data.masteryScore >= 80 ? 5 : data.masteryScore >= 65 ? 4 : data.masteryScore >= 45 ? 3 : data.masteryScore >= 25 ? 2 : 1,
            masteryScore: data.masteryScore,
            totalCorrect: data.totalCorrect,
            totalAttempted: data.totalAttempted,
            level: (data.masteryScore >= 70 ? "advanced" : data.masteryScore >= 40 ? "intermediate" : "beginner") as ProficiencyData["level"],
        }));
    }

    const { data, error } = await supabase
        .from("player_proficiency")
        .select("*")
        .eq("player_id", playerId)
        .order("subject");

    if (error || !data) return [];

    return data.map(p => ({
        subject: p.subject,
        estimatedGrade: p.estimated_grade,
        masteryScore: p.mastery_score,
        totalCorrect: p.total_correct,
        totalAttempted: p.total_attempted,
        level: (p.mastery_score >= 70 ? "advanced" : p.mastery_score >= 40 ? "intermediate" : "beginner") as ProficiencyData["level"],
    }));
}

/* ─── Save proficiency from survey results ─── */
export async function saveSurveyProficiency(
    playerId: string,
    proficiencies: { subject: string; estimatedGrade: number; masteryScore: number; correctCount: number; totalCount: number }[]
): Promise<void> {
    if (isMockMode || !supabase) {
        const local: LocalProficiency = {};
        for (const p of proficiencies) {
            local[p.subject] = {
                masteryScore: p.masteryScore,
                totalCorrect: p.correctCount,
                totalAttempted: p.totalCount,
            };
        }
        saveLocalProficiency(local);
        return;
    }

    // Upsert all proficiencies
    for (const p of proficiencies) {
        await supabase.from("player_proficiency").upsert(
            {
                player_id: playerId,
                subject: p.subject,
                estimated_grade: p.estimatedGrade,
                mastery_score: p.masteryScore,
                total_correct: p.correctCount,
                total_attempted: p.totalCount,
            },
            { onConflict: "player_id,subject" }
        );
    }
}
