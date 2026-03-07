/**
 * student-profile-service.ts — CosmoMosaic Learning Hub
 * 
 * Manages the "Living Student Profile" — an aggregated view of a student's
 * cognitive, learning style, and behavioral characteristics.
 * Updated after every learning session to personalize content.
 */

import { supabase, isMockMode } from "./supabase";

/* ─── Types ─── */

export interface ErrorPattern {
    count: number;
    lastSeen: string;
    examples: string[];
}

export interface StudentProfile {
    id: string;
    playerId: string;

    // Cognitive
    subjectStrengths: Record<string, number>;   // { "math": 85, "english": 42 }
    bloomBySubject: Record<string, number>;      // { "math": 3, "geography": 2 }
    avgResponseTimeMs: Record<string, number>;   // { "math": 8500 }

    // Error tracking — the most important piece
    errorPatterns: Record<string, ErrorPattern>; // { "addition_carry": { count: 12, ... } }

    // Learning style
    preferredGameModes: string[];
    pressureTolerance: number;   // 0–1
    hintDependency: number;      // 0–1
    visualLearner: boolean;

    // Behavioral
    avgSessionMinutes: number;
    frustrationThreshold: number;
    totalSessions: number;
    totalQuestionsAnswered: number;

    // AI cache
    learningSummary: string;
    recommendedFocus: string[];  // ["math_addition_carry", "english_vocabulary"]

    updatedAt: string;
}

const STORAGE_KEY = "cosmomosaic_student_profile";

/* ─── Default profile ─── */

function createDefaultProfile(playerId: string): StudentProfile {
    return {
        id: "",
        playerId,
        subjectStrengths: {},
        bloomBySubject: {},
        avgResponseTimeMs: {},
        errorPatterns: {},
        preferredGameModes: [],
        pressureTolerance: 0.5,
        hintDependency: 0.5,
        visualLearner: true,
        avgSessionMinutes: 15,
        frustrationThreshold: 3,
        totalSessions: 0,
        totalQuestionsAnswered: 0,
        learningSummary: "",
        recommendedFocus: [],
        updatedAt: new Date().toISOString(),
    };
}

/* ─── Local storage helpers (mock mode) ─── */

function getLocalProfile(playerId: string): StudentProfile {
    try {
        const saved = localStorage.getItem(`${STORAGE_KEY}_${playerId}`);
        if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return createDefaultProfile(playerId);
}

function saveLocalProfile(profile: StudentProfile): void {
    try {
        localStorage.setItem(`${STORAGE_KEY}_${profile.playerId}`, JSON.stringify(profile));
    } catch { /* ignore */ }
}

/* ─── DB helpers ─── */

function dbToProfile(row: Record<string, unknown>): StudentProfile {
    return {
        id: row.id as string,
        playerId: row.player_id as string,
        subjectStrengths: (row.subject_strengths as Record<string, number>) || {},
        bloomBySubject: (row.bloom_by_subject as Record<string, number>) || {},
        avgResponseTimeMs: (row.avg_response_time_ms as Record<string, number>) || {},
        errorPatterns: (row.error_patterns as Record<string, ErrorPattern>) || {},
        preferredGameModes: (row.preferred_game_modes as string[]) || [],
        pressureTolerance: (row.pressure_tolerance as number) ?? 0.5,
        hintDependency: (row.hint_dependency as number) ?? 0.5,
        visualLearner: (row.visual_learner as boolean) ?? true,
        avgSessionMinutes: (row.avg_session_minutes as number) ?? 15,
        frustrationThreshold: (row.frustration_threshold as number) ?? 3,
        totalSessions: (row.total_sessions as number) ?? 0,
        totalQuestionsAnswered: (row.total_questions_answered as number) ?? 0,
        learningSummary: (row.learning_summary as string) || "",
        recommendedFocus: (row.recommended_focus as string[]) || [],
        updatedAt: (row.updated_at as string) || new Date().toISOString(),
    };
}

/* ─── Public API ─── */

/**
 * Get or create student profile
 */
export async function getStudentProfile(playerId: string): Promise<StudentProfile> {
    if (isMockMode || !supabase) {
        return getLocalProfile(playerId);
    }

    const { data, error } = await supabase
        .from("student_profile")
        .select("*")
        .eq("player_id", playerId)
        .single();

    if (error || !data) {
        // Create new profile
        const { data: newData } = await supabase
            .from("student_profile")
            .insert({ player_id: playerId })
            .select()
            .single();

        if (newData) return dbToProfile(newData);
        return createDefaultProfile(playerId);
    }

    return dbToProfile(data);
}

/**
 * Update profile after a session — recalculates strengths, errors, etc.
 */
export async function updateProfileAfterSession(
    playerId: string,
    sessionData: {
        subject: string;
        questionsTotal: number;
        questionsCorrect: number;
        avgResponseTimeMs?: number;
        errors?: Array<{ errorType: string; example: string }>;
    }
): Promise<StudentProfile> {
    const profile = await getStudentProfile(playerId);

    // Update subject strengths (weighted moving average: 70% old + 30% new)
    const newAccuracy = sessionData.questionsTotal > 0
        ? Math.round((sessionData.questionsCorrect / sessionData.questionsTotal) * 100)
        : 0;
    const oldStrength = profile.subjectStrengths[sessionData.subject] ?? 50;
    profile.subjectStrengths[sessionData.subject] = Math.round(oldStrength * 0.7 + newAccuracy * 0.3);

    // Update response time
    if (sessionData.avgResponseTimeMs) {
        const oldTime = profile.avgResponseTimeMs[sessionData.subject] ?? sessionData.avgResponseTimeMs;
        profile.avgResponseTimeMs[sessionData.subject] = Math.round(oldTime * 0.7 + sessionData.avgResponseTimeMs * 0.3);
    }

    // Update error patterns
    if (sessionData.errors) {
        for (const err of sessionData.errors) {
            const existing = profile.errorPatterns[err.errorType] || { count: 0, lastSeen: "", examples: [] };
            existing.count += 1;
            existing.lastSeen = new Date().toISOString();
            if (existing.examples.length < 5) {
                existing.examples.push(err.example);
            }
            profile.errorPatterns[err.errorType] = existing;
        }
    }

    // Update session counts
    profile.totalSessions += 1;
    profile.totalQuestionsAnswered += sessionData.questionsTotal;

    // Update recommended focus (top 3 weakest + most error-prone)
    profile.recommendedFocus = getRecommendedFocus(profile);

    profile.updatedAt = new Date().toISOString();

    // Persist
    if (isMockMode || !supabase) {
        saveLocalProfile(profile);
    } else {
        await supabase
            .from("student_profile")
            .upsert({
                player_id: playerId,
                subject_strengths: profile.subjectStrengths,
                bloom_by_subject: profile.bloomBySubject,
                avg_response_time_ms: profile.avgResponseTimeMs,
                error_patterns: profile.errorPatterns,
                preferred_game_modes: profile.preferredGameModes,
                pressure_tolerance: profile.pressureTolerance,
                hint_dependency: profile.hintDependency,
                visual_learner: profile.visualLearner,
                avg_session_minutes: profile.avgSessionMinutes,
                frustration_threshold: profile.frustrationThreshold,
                total_sessions: profile.totalSessions,
                total_questions_answered: profile.totalQuestionsAnswered,
                learning_summary: profile.learningSummary,
                recommended_focus: profile.recommendedFocus,
                updated_at: profile.updatedAt,
            }, { onConflict: "player_id" });
    }

    return profile;
}

/**
 * Get subjects the student is weak at
 */
export function getWeakSubjects(profile: StudentProfile): string[] {
    return Object.entries(profile.subjectStrengths)
        .filter(([, score]) => score < 60)
        .sort(([, a], [, b]) => a - b)
        .map(([subject]) => subject);
}

/**
 * Get the top error patterns to focus on
 */
export function getTopErrors(profile: StudentProfile, limit: number = 5): Array<{ type: string; pattern: ErrorPattern }> {
    return Object.entries(profile.errorPatterns)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, limit)
        .map(([type, pattern]) => ({ type, pattern }));
}

/**
 * Generate recommended focus areas
 */
function getRecommendedFocus(profile: StudentProfile): string[] {
    const focus: Array<{ key: string; priority: number }> = [];

    // Weak subjects
    for (const [subject, score] of Object.entries(profile.subjectStrengths)) {
        if (score < 60) {
            focus.push({ key: `${subject}_weakness`, priority: 100 - score });
        }
    }

    // Frequent errors
    for (const [errorType, pattern] of Object.entries(profile.errorPatterns)) {
        if (pattern.count >= 3) {
            focus.push({ key: errorType, priority: pattern.count * 10 });
        }
    }

    return focus
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 5)
        .map(f => f.key);
}

/**
 * Format profile for AI system prompt context
 */
export function getAIContext(profile: StudentProfile): string {
    const weakSubjects = getWeakSubjects(profile);
    const topErrors = getTopErrors(profile, 3);

    const lines: string[] = [];

    if (Object.keys(profile.subjectStrengths).length > 0) {
        const strengths = Object.entries(profile.subjectStrengths)
            .filter(([, s]) => s >= 70)
            .map(([subj, s]) => `${subj} (${s}%)`)
            .join(", ");
        if (strengths) lines.push(`Môn mạnh: ${strengths}`);
    }

    if (weakSubjects.length > 0) {
        lines.push(`Cần cải thiện: ${weakSubjects.join(", ")}`);
    }

    if (topErrors.length > 0) {
        const errorDescriptions = topErrors.map(
            e => `${formatErrorType(e.type)} (sai ${e.pattern.count} lần)`
        ).join(", ");
        lines.push(`Lỗi thường gặp: ${errorDescriptions}`);
    }

    lines.push(`Tổng câu đã trả lời: ${profile.totalQuestionsAnswered}`);
    lines.push(`Số phiên học: ${profile.totalSessions}`);

    return lines.join("\n");
}

/**
 * Human-readable error type names
 */
export function formatErrorType(errorType: string): string {
    const map: Record<string, string> = {
        addition_carry: "Phép cộng có nhớ",
        subtraction_borrow: "Phép trừ có nhớ",
        multiplication_table: "Bảng cửu chương",
        unit_confusion: "Nhầm đơn vị đo",
        spelling_double_consonant: "Phụ âm đôi (T.Anh)",
        vocabulary_meaning: "Nghĩa từ vựng",
        dau_thanh: "Sai dấu thanh",
        cause_effect: "Nguyên nhân-kết quả",
        location_confusion: "Nhầm vị trí địa lý",
    };
    return map[errorType] || errorType.replace(/_/g, " ");
}
