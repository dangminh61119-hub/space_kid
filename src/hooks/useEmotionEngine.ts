/**
 * hooks/useEmotionEngine.ts — CosmoMosaic v2.0
 * Client-side state machine that determines Cú Mèo's emotion
 * based on player behavior. Zero API calls.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { type Emotion, getEmotionMessage, type MessageContext } from "@/lib/ai/emotion-templates";

/* ─── Types ─── */
export interface EmotionState {
    emotion: Emotion;
    message: string;
    intensity: number;  // 0-1, affects animation speed
}

interface EmotionSignals {
    streak: number;
    errorBurst: number;       // consecutive wrong answers
    idleSeconds: number;
    sessionDuration: number;  // seconds
    lastAction: "correct" | "wrong" | "idle" | "levelWin" | "levelLose" | null;
}

/* ─── Hook ─── */
export function useEmotionEngine() {
    const [emotionState, setEmotionState] = useState<EmotionState>({
        emotion: "happy",
        message: "Cú Mèo sẵn sàng! 🦉",
        intensity: 0.5,
    });

    const [signals, setSignals] = useState<EmotionSignals>({
        streak: 0,
        errorBurst: 0,
        idleSeconds: 0,
        sessionDuration: 0,
        lastAction: null,
    });

    const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Track idle time
    useEffect(() => {
        idleTimerRef.current = setInterval(() => {
            setSignals(prev => ({ ...prev, idleSeconds: prev.idleSeconds + 1 }));
        }, 1000);

        sessionTimerRef.current = setInterval(() => {
            setSignals(prev => ({ ...prev, sessionDuration: prev.sessionDuration + 1 }));
        }, 1000);

        return () => {
            if (idleTimerRef.current) clearInterval(idleTimerRef.current);
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        };
    }, []);

    // Compute emotion from signals
    const computeEmotion = useCallback((sig: EmotionSignals): { emotion: Emotion; context: MessageContext; intensity: number } => {
        const hour = new Date().getHours();
        const isNight = hour >= 21 || hour <= 5;

        // Priority-based emotion resolution
        if (isNight && sig.idleSeconds > 15) {
            return { emotion: "sleepy", context: "nightTime", intensity: 0.2 };
        }
        if (sig.idleSeconds > 30) {
            return { emotion: "sleepy", context: "idle", intensity: 0.3 };
        }
        if (sig.lastAction === "levelWin") {
            if (sig.streak >= 5) return { emotion: "celebrating", context: "levelWin", intensity: 1.0 };
            return { emotion: "excited", context: "levelWin", intensity: 0.9 };
        }
        if (sig.lastAction === "levelLose") {
            if (sig.errorBurst >= 3) return { emotion: "encouraging", context: "levelLose", intensity: 0.8 };
            return { emotion: "worried", context: "levelLose", intensity: 0.6 };
        }
        if (sig.streak >= 5) {
            return { emotion: "excited", context: "bigStreak", intensity: 1.0 };
        }
        if (sig.streak >= 3) {
            return { emotion: "excited", context: "streak", intensity: 0.8 };
        }
        if (sig.errorBurst >= 3) {
            return { emotion: "encouraging", context: "wrong", intensity: 0.7 };
        }
        if (sig.errorBurst >= 2) {
            return { emotion: "worried", context: "wrong", intensity: 0.5 };
        }
        if (sig.lastAction === "correct") {
            return { emotion: "happy", context: "correct", intensity: 0.6 };
        }
        if (sig.lastAction === "wrong") {
            return { emotion: "worried", context: "wrong", intensity: 0.5 };
        }

        return { emotion: "happy", context: "idle", intensity: 0.4 };
    }, []);

    // Update emotion state when signals change
    useEffect(() => {
        const { emotion, context, intensity } = computeEmotion(signals);
        const message = getEmotionMessage(emotion, context, {
            count: signals.streak,
        });
        setEmotionState({ emotion, message, intensity });
    }, [signals, computeEmotion]);

    // --- Public API ---

    /** Call when player answers correctly */
    const onCorrect = useCallback(() => {
        setSignals(prev => ({
            ...prev,
            streak: prev.streak + 1,
            errorBurst: 0,
            idleSeconds: 0,
            lastAction: "correct",
        }));
    }, []);

    /** Call when player answers wrong */
    const onWrong = useCallback(() => {
        setSignals(prev => ({
            ...prev,
            streak: 0,
            errorBurst: prev.errorBurst + 1,
            idleSeconds: 0,
            lastAction: "wrong",
        }));
    }, []);

    /** Call when player completes a level */
    const onLevelWin = useCallback(() => {
        setSignals(prev => ({
            ...prev,
            idleSeconds: 0,
            lastAction: "levelWin",
        }));
    }, []);

    /** Call when player loses a level */
    const onLevelLose = useCallback(() => {
        setSignals(prev => ({
            ...prev,
            streak: 0,
            idleSeconds: 0,
            lastAction: "levelLose",
        }));
    }, []);

    /** Reset idle timer (e.g., on any user interaction) */
    const onActivity = useCallback(() => {
        setSignals(prev => ({ ...prev, idleSeconds: 0 }));
    }, []);

    /** Reset all signals (e.g., on game start) */
    const reset = useCallback(() => {
        setSignals({
            streak: 0,
            errorBurst: 0,
            idleSeconds: 0,
            sessionDuration: 0,
            lastAction: null,
        });
    }, []);

    return {
        emotionState,
        signals,
        onCorrect,
        onWrong,
        onLevelWin,
        onLevelLose,
        onActivity,
        reset,
    };
}
