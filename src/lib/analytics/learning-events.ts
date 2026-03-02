/**
 * analytics.ts – CosmoMosaic Learning Analytics
 *
 * Fire-and-forget functions to record learning events,
 * quiz attempts, and AI feedback. Uses Supabase when available,
 * silently no-ops in mock mode.
 */

import { supabase, isMockMode } from "../services/supabase";

/* ─── Types ─── */

export type LearningEventType =
    | "session_start"
    | "session_end"
    | "level_complete"
    | "level_failed"
    | "bloom_progression";

export type AITriggerContext =
    | "correct_answer"
    | "wrong_answer"
    | "hint_requested"
    | "encouragement"
    | "general_chat";

/* ─── Learning Events ─── */

/**
 * recordLearningEvent — fire-and-forget logging of a learning session event.
 */
export async function recordLearningEvent(params: {
    playerDbId: string;
    planetId: string;
    subject: string;
    eventType: LearningEventType;
    bloomLevel?: number;
    durationSecs?: number;
    score?: number;
    metadata?: Record<string, unknown>;
}): Promise<void> {
    if (isMockMode || !supabase || !params.playerDbId) {
        if (!isMockMode) console.log("[analytics] recordLearningEvent (mock):", params.eventType);
        return;
    }

    const { error } = await supabase.from("learning_event").insert({
        player_id: params.playerDbId,
        planet_id: params.planetId,
        subject: params.subject,
        event_type: params.eventType,
        bloom_level: params.bloomLevel ?? null,
        duration_secs: params.durationSecs ?? null,
        score: params.score ?? null,
        metadata: params.metadata ?? {},
    });

    if (error) console.error("[analytics] recordLearningEvent error:", error);
}

/* ─── Quiz Attempts ─── */

/**
 * recordQuizAttempt — logs each individual question answer.
 */
export async function recordQuizAttempt(params: {
    playerDbId: string;
    planetId: string;
    subject: string;
    questionId?: string;
    questionText: string;
    answerGiven: string;
    correctAnswer: string;
    isCorrect: boolean;
    bloomLevel?: number;
    timeTakenMs?: number;
    difficulty?: "easy" | "medium" | "hard";
}): Promise<void> {
    if (isMockMode || !supabase || !params.playerDbId) {
        return;
    }

    const { error } = await supabase.from("quiz_attempt").insert({
        player_id: params.playerDbId,
        planet_id: params.planetId,
        subject: params.subject,
        question_id: params.questionId ?? null,
        question_text: params.questionText,
        answer_given: params.answerGiven,
        correct_answer: params.correctAnswer,
        is_correct: params.isCorrect,
        bloom_level: params.bloomLevel ?? 1,
        time_taken_ms: params.timeTakenMs ?? null,
        difficulty: params.difficulty ?? null,
    });

    if (error) console.error("[analytics] recordQuizAttempt error:", error);
}

/* ─── AI Feedback Log ─── */

/**
 * logAIFeedback — logs every AI Mascot response for safety audit.
 */
export async function logAIFeedback(params: {
    playerDbId: string;
    triggerContext: AITriggerContext;
    aiPrompt: string;
    aiResponse: string;
    modelUsed?: string;
    responseTimeMs?: number;
    wasFiltered?: boolean;
}): Promise<void> {
    if (isMockMode || !supabase || !params.playerDbId) {
        return;
    }

    const { error } = await supabase.from("ai_feedback").insert({
        player_id: params.playerDbId,
        trigger_context: params.triggerContext,
        ai_prompt: params.aiPrompt,
        ai_response: params.aiResponse,
        model_used: params.modelUsed ?? null,
        response_time_ms: params.responseTimeMs ?? null,
        was_filtered: params.wasFiltered ?? false,
    });

    if (error) console.error("[analytics] logAIFeedback error:", error);
}

/* ─── Consent Helpers ─── */

/**
 * recordParentConsent — records parental consent in DB.
 */
export async function recordParentConsent(
    playerDbId: string,
    parentEmail: string,
    consentType: string = "full_consent"
): Promise<void> {
    if (isMockMode || !supabase || !playerDbId) return;

    const { error } = await supabase.rpc("record_consent", {
        p_player_id: playerDbId,
        p_parent_email: parentEmail,
        p_consent_type: consentType,
    });

    if (error) console.error("[analytics] recordParentConsent error:", error);
}

/**
 * logAuditEvent — logs a security-relevant event.
 */
export async function logAuditEvent(
    playerDbId: string | null,
    eventType: string,
    eventData: Record<string, unknown> = {}
): Promise<void> {
    if (isMockMode || !supabase) return;

    const { error } = await supabase.from("audit_log").insert({
        player_id: playerDbId,
        event_type: eventType,
        event_data: eventData,
    });

    if (error) console.error("[analytics] logAuditEvent error:", error);
}
