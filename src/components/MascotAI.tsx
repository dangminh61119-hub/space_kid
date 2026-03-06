"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useGame, MASCOT_INFO } from "@/lib/game-context";
import { logAIFeedback } from "@/lib/analytics/learning-events";
import { useAuth } from "@/lib/services/auth-context";
import { useVoice } from "@/hooks/useVoice";

/* ─── Types ─── */
interface MascotMessage {
    text: string;
    type: "encouragement" | "correct" | "wrong" | "hint" | "idle";
}

interface MascotAIProps {
    /** If true, hide the mascot (e.g. during fullscreen game) */
    hidden?: boolean;
}

type Expression = "idle" | "happy" | "sad" | "thinking" | "talking" | "wink" | "surprised";

interface EyeState {
    pupilY: number;
    lidClose: number;
    sparkle: boolean;
    pupilSize: number;
    pupilX?: number;
}

/* ─── Idle messages ─── */
const IDLE_MESSAGES = [
    "Cậu đã sẵn sàng khám phá vũ trụ chưa? 🚀",
    "Mỗi hành tinh là một kiến thức mới, cùng bay nào! 🌟",
    "Cú Mèo sẽ luôn đồng hành cùng cậu nha! ✨",
    "Hãy tiếp tục học nhé bạn nhỏ! 📚",
    "Cú Mèo tin bạn sẽ làm rất tốt! 💪",
];

/* ─── Owl SVG Mascot (Reference Style) ─── */
function OwlCharacter({ expression, calmMode }: { expression: Expression; calmMode: boolean }) {
    /* Eye states based on expression */
    const leftEye = useMemo<EyeState>(() => {
        switch (expression) {
            case "happy": return { pupilY: 30, lidClose: 0.4, sparkle: true, pupilSize: 7 };
            case "sad": return { pupilY: 30, lidClose: 0.3, sparkle: false, pupilSize: 7.5 };
            case "thinking": return { pupilY: 30, lidClose: 0, sparkle: false, pupilSize: 6, pupilX: -2 };
            case "talking": return { pupilY: 30, lidClose: 0, sparkle: true, pupilSize: 7 };
            case "wink": return { pupilY: 30, lidClose: 0.9, sparkle: false, pupilSize: 7 };
            case "surprised": return { pupilY: 30, lidClose: 0, sparkle: true, pupilSize: 8.5 };
            default: return { pupilY: 30, lidClose: 0, sparkle: true, pupilSize: 7 };
        }
    }, [expression]);

    const rightEye = useMemo<EyeState>(() => {
        switch (expression) {
            case "happy": return { pupilY: 30, lidClose: 0.4, sparkle: true, pupilSize: 7 };
            case "sad": return { pupilY: 30, lidClose: 0.3, sparkle: false, pupilSize: 7.5 };
            case "thinking": return { pupilY: 30, lidClose: 0, sparkle: false, pupilSize: 6, pupilX: -2 };
            case "talking": return { pupilY: 30, lidClose: 0, sparkle: true, pupilSize: 7 };
            case "wink": return { pupilY: 30, lidClose: 0, sparkle: true, pupilSize: 7 };
            case "surprised": return { pupilY: 30, lidClose: 0, sparkle: true, pupilSize: 8.5 };
            default: return { pupilY: 30, lidClose: 0, sparkle: true, pupilSize: 7 };
        }
    }, [expression]);

    return (
        <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-neon" style={{ filter: `drop-shadow(0 0 16px rgba(0,245,255,${calmMode ? "0.3" : "0.7"}))` }}>
            <defs>
                <radialGradient id="cyberBlue" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#2A4B8C" />
                    <stop offset="60%" stopColor="#1B2A4A" />
                    <stop offset="100%" stopColor="#0B152A" />
                </radialGradient>
                <linearGradient id="bronze" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FAD6A5" />
                    <stop offset="30%" stopColor="#D4A373" />
                    <stop offset="70%" stopColor="#9C6644" />
                    <stop offset="100%" stopColor="#5C3317" />
                </linearGradient>
                <radialGradient id="galaxy" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#6C2B85" />
                    <stop offset="40%" stopColor="#2E1B4A" />
                    <stop offset="100%" stopColor="#0B152A" />
                </radialGradient>
                <linearGradient id="eyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#E0F7FA" />
                    <stop offset="30%" stopColor="#00E5FF" />
                    <stop offset="100%" stopColor="#0077B6" />
                </linearGradient>
                <linearGradient id="scrollGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F5DEB3" />
                    <stop offset="50%" stopColor="#FAEBD7" />
                    <stop offset="100%" stopColor="#E6C280" />
                </linearGradient>
                <filter id="softGlow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* === LEGS & CLAWS (Bronze) === */}
            <g>
                {/* Left Leg */}
                <path d="M 38 78 L 33 92 C 32 96 28 97 28 97 C 32 97 35 99 35 99 C 36 96 39 94 40 92 L 44 78 Z" fill="url(#bronze)" stroke="#5C3317" strokeWidth="1" />
                {/* Knee Joint */}
                <circle cx="38" cy="80" r="3.5" fill="#1B2A4A" stroke="url(#bronze)" strokeWidth="1.5" />
                <circle cx="38" cy="80" r="1.5" fill="#00E5FF" filter="url(#softGlow)" />
                {/* Right Leg */}
                <path d="M 62 78 L 67 92 C 68 96 72 97 72 97 C 68 97 65 99 65 99 C 64 96 61 94 60 92 L 56 78 Z" fill="url(#bronze)" stroke="#5C3317" strokeWidth="1" />
                {/* Knee Joint */}
                <circle cx="62" cy="80" r="3.5" fill="#1B2A4A" stroke="url(#bronze)" strokeWidth="1.5" />
                <circle cx="62" cy="80" r="1.5" fill="#00E5FF" filter="url(#softGlow)" />
            </g>

            {/* === MAIN BODY === */}
            {/* Base Armor Plate */}
            <ellipse cx="50" cy="55" rx="34" ry="36" fill="url(#cyberBlue)" stroke="#0B152A" strokeWidth="2" />

            {/* Galaxy Belly Panel */}
            <path d="M 22 55 C 22 35 78 35 78 55 C 78 75 65 88 50 88 C 35 88 22 75 22 55 Z" fill="url(#galaxy)" stroke="url(#bronze)" strokeWidth="1.5" opacity="0.95" />
            {/* Galaxy Stars */}
            <circle cx="40" cy="50" r="0.8" fill="#FFF" opacity="0.9" filter="url(#softGlow)" />
            <circle cx="60" cy="65" r="1.2" fill="#00E5FF" opacity="0.8" filter="url(#softGlow)" />
            <circle cx="35" cy="60" r="1.5" fill="#FFF" opacity="0.7" filter="url(#softGlow)" />
            <circle cx="55" cy="45" r="0.6" fill="#FFF" opacity="0.9" />
            <circle cx="45" cy="70" r="1" fill="#D946EF" opacity="0.6" filter="url(#softGlow)" />
            <circle cx="65" cy="55" r="0.8" fill="#FFF" opacity="0.5" />
            {/* Nebula swoosh */}
            <path d="M 30 65 Q 45 50 60 70 Q 55 75 45 65" fill="#00E5FF" opacity="0.2" filter="url(#softGlow)" />
            <path d="M 45 45 Q 60 40 65 55 Q 55 50 50 55" fill="#D946EF" opacity="0.15" filter="url(#softGlow)" />

            {/* Bronze Straps across chest */}
            <path d="M 22 45 C 40 65 60 65 78 45" fill="none" stroke="url(#bronze)" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
            <path d="M 30 35 C 45 55 55 55 70 35" fill="none" stroke="url(#bronze)" strokeWidth="3" strokeLinecap="round" opacity="0.9" />

            {/* Shield Emblem on Chest */}
            <g transform="translate(50, 56)">
                <path d="M -10 -10 L 10 -10 L 10 0 C 10 8 0 14 0 14 C 0 14 -10 8 -10 0 Z" fill="url(#cyberBlue)" stroke="url(#bronze)" strokeWidth="2.5" strokeLinejoin="round" />
                {/* Cloud icon inside shield */}
                <path d="M -3 3 Q -3 0 0 0 Q 4 0 4 3 Q 7 3 7 6 L -5 6 Q -7 6 -7 4 Q -7 3 -3 3 Z" fill="url(#bronze)" />
            </g>

            {/* === LEFT WING === */}
            <motion.g
                animate={expression === "happy" ? { rotate: [-5, 5, -5] } : { rotate: [0, 1, 0] }}
                transition={{ duration: expression === "happy" ? 0.4 : 3, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "25px 45px" }}
            >
                <path d="M 22 42 C 10 50 5 65 10 80 C 15 90 28 75 30 65" fill="url(#cyberBlue)" stroke="#0B152A" strokeWidth="1.5" />
                <path d="M 20 50 C 12 58 10 68 15 75 C 20 80 25 70 26 62" fill="#1B2A4A" stroke="#2A4B8C" strokeWidth="1" />
                {/* Shoulder Armor Roundel */}
                <circle cx="25" cy="48" r="8" fill="url(#cyberBlue)" stroke="url(#bronze)" strokeWidth="2" />
                <path d="M 23 45 A 4 4 0 1 1 23 51" fill="none" stroke="#00E5FF" strokeWidth="2" filter="url(#softGlow)" opacity="0.8" />
            </motion.g>

            {/* === RIGHT WING & SCROLL === */}
            <motion.g
                animate={{ y: [0, -2, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
                {/* Right Wing Background */}
                <path d="M 78 42 C 90 50 95 65 90 80 C 85 90 72 75 70 65" fill="url(#cyberBlue)" stroke="#0B152A" strokeWidth="1.5" />

                {/* Detailed Parchment Scroll */}
                <g transform="translate(68, 62) rotate(-15)">
                    {/* Main Paper */}
                    <path d="M 0 0 L 25 -5 L 20 30 L -5 35 Z" fill="url(#scrollGrad)" stroke="#9C6644" strokeWidth="1" />
                    {/* Top Roll */}
                    <path d="M -2 0 C -5 -3 0 -5 2 -3 L 25 -5 C 28 -8 32 -5 30 -2 L 5 0 Z" fill="#FAD6A5" stroke="#9C6644" strokeWidth="1" strokeLinejoin="round" />
                    <circle cx="-1" cy="-2" r="1.5" fill="#5C3317" />
                    {/* Bottom Roll */}
                    <path d="M -5 35 C -8 32 -3 30 -1 32 L 20 30 C 17 27 22 25 24 28 L -1 37 Z" fill="#E6C280" stroke="#9C6644" strokeWidth="1" strokeLinejoin="round" />
                    {/* Scroll Text Data Lines */}
                    <line x1="5" y1="4" x2="20" y2="1" stroke="#5C3317" strokeWidth="1.2" strokeDasharray="3 1 2 2" opacity="0.6" />
                    <line x1="3" y1="9" x2="18" y2="6" stroke="#5C3317" strokeWidth="1.2" strokeDasharray="4 2 1 1" opacity="0.6" />
                    <line x1="1" y1="14" x2="16" y2="11" stroke="#5C3317" strokeWidth="1.2" strokeDasharray="2 2 4 1" opacity="0.6" />
                    <line x1="-1" y1="19" x2="14" y2="16" stroke="#5C3317" strokeWidth="1.2" strokeDasharray="1 3 3 1" opacity="0.6" />
                    <line x1="-3" y1="24" x2="12" y2="21" stroke="#00E5FF" strokeWidth="1.5" strokeDasharray="2 2 1 2" opacity="0.8" filter="url(#softGlow)" />
                </g>

                {/* Robotic Claws gripping the scroll */}
                <path d="M 82 72 C 88 70 92 73 90 75 C 86 76 83 74 82 72 Z" fill="#1B2A4A" stroke="url(#bronze)" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 80 78 C 86 76 90 79 88 81 C 84 82 81 80 80 78 Z" fill="#1B2A4A" stroke="url(#bronze)" strokeWidth="1.5" strokeLinejoin="round" />
            </motion.g>

            {/* === HEAD & FACE BASE === */}
            <ellipse cx="50" cy="32" rx="30" ry="26" fill="url(#cyberBlue)" stroke="#0B152A" strokeWidth="2" />
            {/* Galaxy pattern on forehead */}
            <path d="M 40 10 C 50 18 60 10 50 25 Z" fill="url(#galaxy)" opacity="0.8" filter="url(#softGlow)" />

            {/* V-Shape Blue Metal Brow Armor */}
            <path d="M 24 18 C 35 25 45 32 50 35 C 55 32 65 25 76 18 C 80 20 75 14 74 12 C 65 18 55 24 50 28 C 45 24 35 18 26 12 C 25 14 20 20 24 18 Z" fill="url(#cyberBlue)" stroke="url(#bronze)" strokeWidth="1.5" strokeLinejoin="round" />

            {/* Feathers/Ears sticking out top and sides */}
            {/* Left Ears */}
            <path d="M 28 22 C 20 12 15 5 28 15 Z" fill="url(#cyberBlue)" stroke="#1B2A4A" strokeWidth="1.5" />
            <path d="M 25 20 C 18 12 16 8 26 14" fill="none" stroke="url(#bronze)" strokeWidth="1.5" />
            {/* Right Ears */}
            <path d="M 72 22 C 80 12 85 5 72 15 Z" fill="url(#cyberBlue)" stroke="#1B2A4A" strokeWidth="1.5" />
            <path d="M 75 20 C 82 12 84 8 74 14" fill="none" stroke="url(#bronze)" strokeWidth="1.5" />

            {/* White face feather patch around beak */}
            <path d="M 42 38 C 38 45 46 52 50 54 C 54 52 62 45 58 38 C 52 42 48 42 42 38 Z" fill="#E0F7FA" stroke="#2A4B8C" strokeWidth="1" />

            {/* === BEAK === */}
            <g>
                <motion.path
                    d="M 46 38 C 50 36 50 36 54 38 C 52 45 51 46 50 50 C 49 46 48 45 46 38 Z"
                    fill="#D4A373" stroke="#5C3317" strokeWidth="1.5" strokeLinejoin="round"
                    animate={expression === "talking" ? { scaleY: [1, 0.7, 1] } : { scaleY: 1 }}
                    transition={{ duration: 0.25, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transformOrigin: "50px 38px" }}
                />
                {/* Beak highlight */}
                <path d="M 48 39 C 50 38 50 38 52 39 C 51 44 50.5 45 50 48 Z" fill="#FAD6A5" opacity="0.8" />
            </g>

            {/* === HUGE GLOWING EYES === */}
            {/* Left Eye */}
            <g>
                {/* Bronze Ring Base */}
                <circle cx="34" cy="30" r="16" fill="url(#bronze)" stroke="#5C3317" strokeWidth="1.5" />
                {/* Bronze Mechanical Segments */}
                <path d="M 34 14 L 34 18 M 34 46 L 34 42 M 18 30 L 22 30 M 50 30 L 46 30 M 22 18 L 25 21 M 46 42 L 43 39 M 22 42 L 25 39 M 46 18 L 43 21" stroke="#5C3317" strokeWidth="1.5" strokeLinecap="round" />
                {/* Inner Base */}
                <circle cx="34" cy="30" r="12" fill="#0B152A" stroke="#111" strokeWidth="2" />
                {/* Glowing Iris Base */}
                <circle cx="34" cy="30" r="11" fill="url(#eyeGlow)" opacity="0.9" filter="url(#softGlow)" />
                {/* Inner Tech Ring */}
                <circle cx="34" cy="30" r="8" fill="none" stroke="#FFF" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
                {/* Dark Pupil */}
                <circle cx={34 + (leftEye.pupilX || 0)} cy={leftEye.pupilY} r={leftEye.pupilSize} fill="#0B152A" />
                {/* Highlights */}
                <circle cx={32 + (leftEye.pupilX || 0)} cy={leftEye.pupilY - 2} r="2.5" fill="#FFF" opacity="0.95" />
                {leftEye.sparkle && <circle cx={36 + (leftEye.pupilX || 0)} cy={leftEye.pupilY + 1} r="1" fill="#00E5FF" filter="url(#softGlow)" />}
                {/* Cyan tech arch */}
                <path d="M 28 30 A 6 6 0 0 1 40 30" fill="none" stroke="#00E5FF" strokeWidth="1.5" opacity="0.8" filter="url(#softGlow)" />

                {/* Eyelid for expressions */}
                {leftEye.lidClose > 0 && (
                    <path d={`M 18 30 C 25 ${30 + leftEye.lidClose * 20} 43 ${30 + leftEye.lidClose * 20} 50 30 A 16 16 0 0 0 18 30 Z`} fill="url(#cyberBlue)" stroke="#5C3317" strokeWidth="1.5" />
                )}
            </g>

            {/* Right Eye */}
            <g>
                <circle cx="66" cy="30" r="16" fill="url(#bronze)" stroke="#5C3317" strokeWidth="1.5" />
                <path d="M 66 14 L 66 18 M 66 46 L 66 42 M 50 30 L 54 30 M 82 30 L 78 30 M 54 18 L 57 21 M 78 42 L 75 39 M 54 42 L 57 39 M 78 18 L 75 21" stroke="#5C3317" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="66" cy="30" r="12" fill="#0B152A" stroke="#111" strokeWidth="2" />
                <circle cx="66" cy="30" r="11" fill="url(#eyeGlow)" opacity="0.9" filter="url(#softGlow)" />
                <circle cx="66" cy="30" r="8" fill="none" stroke="#FFF" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 2" />
                <circle cx={66 + (rightEye.pupilX || 0)} cy={rightEye.pupilY} r={rightEye.pupilSize} fill="#0B152A" />
                <circle cx={64 + (rightEye.pupilX || 0)} cy={rightEye.pupilY - 2} r="2.5" fill="#FFF" opacity="0.95" />
                {rightEye.sparkle && <circle cx={68 + (rightEye.pupilX || 0)} cy={rightEye.pupilY + 1} r="1" fill="#00E5FF" filter="url(#softGlow)" />}
                <path d="M 60 30 A 6 6 0 0 1 72 30" fill="none" stroke="#00E5FF" strokeWidth="1.5" opacity="0.8" filter="url(#softGlow)" />

                {/* Eyelid for expressions */}
                {rightEye.lidClose > 0 && (
                    <path d={`M 50 30 C 57 ${30 + rightEye.lidClose * 20} 75 ${30 + rightEye.lidClose * 20} 82 30 A 16 16 0 0 0 50 30 Z`} fill="url(#cyberBlue)" stroke="#5C3317" strokeWidth="1.5" />
                )}
            </g>

            {/* Thinking bubbles (Adapted for Cyber-Owl) */}
            {expression === "thinking" && (
                <g fill="#00E5FF" filter="url(#softGlow)">
                    <motion.circle cx="82" cy="22" r="3" animate={{ y: [0, -4, 0], opacity: [0.5, 0.9, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                    <motion.circle cx="88" cy="14" r="2.5" fill="#FAD6A5" animate={{ y: [0, -5, 0], opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }} />
                    <motion.circle cx="92" cy="8" r="2" animate={{ y: [0, -3, 0], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
                </g>
            )}
        </svg>
    );
}

export default function MascotAI({ hidden = false }: MascotAIProps) {
    const { player } = useGame();
    const { playerDbId, user } = useAuth();
    const [msg, setMsg] = useState<MascotMessage>({
        text: "Chào cậu! Cú Mèo ở đây nè! 🦉",
        type: "idle",
    });
    const [loading, setLoading] = useState(false);
    const [expression, setExpression] = useState<Expression>("idle");
    const [isBlinking, setIsBlinking] = useState(false);
    const [voiceOpen, setVoiceOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
    const [voiceError, setVoiceError] = useState<string | null>(null);
    const guestGreetedRef = useRef(false);

    const isLoggedIn = !!user;
    const mode = isLoggedIn ? "member" : "guest";

    const { isListening, isSpeaking, transcript, startListening, stopListening, speak, isSupported }
        = useVoice({
            defaultLang: "vi",
            defaultTier: "neural",
            onTranscript: (text) => handleVoiceInput(text),
            onError: (e) => setVoiceError(e),
        });

    /* Get mascot emoji/name */
    const mascotInfo = player.mascot ? MASCOT_INFO[player.mascot] : { name: "Cú Mèo", emoji: "🦉" };
    const calmMode = player.calmMode;

    /* Auto blink every few seconds */
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            if (expression === "idle" || expression === "happy") {
                setIsBlinking(true);
                // Random: sometimes wink, sometimes full blink
                const doWink = Math.random() < 0.3;
                if (doWink) {
                    setExpression("wink");
                } else {
                    setExpression("happy"); // squinted = blink
                }
                setTimeout(() => {
                    setIsBlinking(false);
                    setExpression("idle");
                }, 200);
            }
        }, calmMode ? 5000 : 3500);
        return () => clearInterval(blinkInterval);
    }, [expression, calmMode]);

    /* Map message type to expression */
    useEffect(() => {
        if (isBlinking) return;
        if (loading) {
            setExpression("thinking");
            return;
        }
        switch (msg.type) {
            case "correct": setExpression("happy"); break;
            case "wrong": setExpression("sad"); break;
            case "hint": setExpression("thinking"); break;
            case "encouragement": setExpression("happy"); break;
            case "idle": setExpression("idle"); break;
        }
    }, [msg.type, loading, isBlinking]);

    /* Talking animation when message changes */
    useEffect(() => {
        if (isBlinking || loading) return;
        setExpression("talking");
        const timer = setTimeout(() => {
            switch (msg.type) {
                case "correct": setExpression("happy"); break;
                case "wrong": setExpression("sad"); break;
                case "hint": setExpression("thinking"); break;
                default: setExpression("idle"); break;
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [msg.text]); // eslint-disable-line react-hooks/exhaustive-deps

    /* Cycle idle messages */
    useEffect(() => {
        const interval = setInterval(() => {
            const randomMsg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
            setMsg({ text: randomMsg, type: "idle" });
        }, calmMode ? 12000 : 8000);
        return () => clearInterval(interval);
    }, [calmMode]);

    /* ─── Call AI API ─── */
    const askAI = useCallback(async (params: {
        context: string;
        questionText?: string;
        playerAnswer?: string;
        correctAnswer?: string;
        subject?: string;
        bloomLevel?: number;
    }) => {
        setLoading(true);
        setExpression("thinking");
        const startTime = Date.now();
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });
            const data = await res.json();
            const responseText = data.response || "Cú Mèo đang suy nghĩ... 🤔";

            const newType = params.context === "correct_answer" ? "correct"
                : params.context === "wrong_answer" ? "wrong"
                    : params.context === "hint_requested" ? "hint"
                        : "encouragement";

            setMsg({ text: responseText, type: newType as MascotMessage["type"] });

            // Log to analytics
            if (playerDbId) {
                logAIFeedback({
                    playerDbId,
                    triggerContext: params.context as "correct_answer" | "wrong_answer" | "hint_requested" | "encouragement",
                    aiPrompt: JSON.stringify(params),
                    aiResponse: responseText,
                    modelUsed: data.model,
                    responseTimeMs: Date.now() - startTime,
                    wasFiltered: data.wasFiltered,
                });
            }
        } catch {
            setMsg({ text: "Cú Mèo bị trục trặc! Nhưng bạn cứ tiếp tục nhé! 🦉", type: "idle" });
        }
        setLoading(false);
    }, [playerDbId]);

    /* ─── Chat with AI (conversational mode) ─── */
    const chatWithAI = useCallback(async (userMessage: string) => {
        setLoading(true);
        setExpression("thinking");

        const playerContext = isLoggedIn ? {
            name: player.name,
            playerClass: player.playerClass ?? undefined,
            xp: player.cosmo,
        } : undefined;

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: userMessage,
                    mode,
                    playerContext,
                    history: chatHistory.slice(-6),
                }),
            });
            const data = await res.json() as { response: string; lang?: string };
            const responseText = data.response || "Cú Mèo đang suy nghĩ... 🤔";
            const lang = (data.lang === "en" ? "en" : "vi") as "vi" | "en";

            setMsg({ text: responseText, type: "encouragement" });
            setChatHistory(prev => [
                ...prev,
                { role: "user", content: userMessage },
                { role: "assistant", content: responseText },
            ]);

            // Auto-speak response
            await speak(responseText, "neural", lang);
        } catch {
            const fallback = "Ôi, tín hiệu bị nhiễu! Thử lại nhé! 🦉";
            setMsg({ text: fallback, type: "idle" });
            await speak(fallback, "fast", "vi");
        }
        setLoading(false);
    }, [isLoggedIn, player, mode, chatHistory, speak]);

    /* ─── Handle voice transcript finalised ─── */
    const handleVoiceInput = useCallback((text: string) => {
        if (!text.trim()) return;
        chatWithAI(text);
    }, [chatWithAI]);

    /* ─── Guest greeting (auto-trigger once when voice panel opens) ─── */
    useEffect(() => {
        if (!voiceOpen || isLoggedIn || guestGreetedRef.current) return;
        guestGreetedRef.current = true;
        const greeting = "Xin chào bạn nhỏ! Mình là Cú Mèo, người bạn đồng hành trên CosmoMosaic! Bạn có thể gọi mình là Cú Mèo nhé! Bạn tên là gì vậy? 🦉";
        setMsg({ text: greeting, type: "idle" });
        speak(greeting, "hd", "vi");
    }, [voiceOpen, isLoggedIn, speak]);


    if (hidden) return null;

    /* ─── Color by type ─── */
    const borderColor = msg.type === "correct" ? "border-green-400/50"
        : msg.type === "wrong" ? "border-orange-400/50"
            : msg.type === "hint" ? "border-yellow-400/50"
                : "border-cyan-400/30";

    const glowColor = msg.type === "correct" ? "rgba(74,222,128,0.2)"
        : msg.type === "wrong" ? "rgba(251,146,60,0.2)"
            : msg.type === "hint" ? "rgba(250,204,21,0.2)"
                : "rgba(0,245,255,0.15)";

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none ${calmMode ? "opacity-75" : ""}`}>

            {/* ─── Voice Chat Panel ─── */}
            <AnimatePresence>
                {voiceOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 20 }}
                        transition={{ duration: 0.25 }}
                        className="pointer-events-auto w-72 rounded-2xl border border-cyan-400/20 overflow-hidden"
                        style={{
                            background: "rgba(6, 11, 30, 0.92)",
                            backdropFilter: "blur(16px)",
                            boxShadow: "0 0 30px rgba(0,245,255,0.15), 0 8px 32px rgba(0,0,0,0.5)",
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">🦉</span>
                                <div>
                                    <p className="text-xs font-bold text-cyan-300">{mascotInfo.name}</p>
                                    <p className="text-[10px] text-white/40">
                                        {isLoggedIn ? `Đồng hành · ${player.name || "Thành viên"}` : "Khách thăm quan"}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setVoiceOpen(false)}
                                className="text-white/30 hover:text-white/70 transition-colors text-lg leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Mascot message bubble */}
                        <div className="px-4 py-3 min-h-[80px] max-h-[180px] overflow-y-auto space-y-2">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={msg.text}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="flex gap-2"
                                >
                                    <span className="text-base flex-shrink-0 mt-0.5">🦉</span>
                                    <div
                                        className="text-sm text-white/90 leading-relaxed rounded-xl rounded-tl-none px-3 py-2"
                                        style={{ background: "rgba(0,245,255,0.07)", border: "1px solid rgba(0,245,255,0.1)" }}
                                    >
                                        {loading ? (
                                            <span className="text-white/40 flex items-center gap-1.5">
                                                {[0, 0.2, 0.4].map((delay, i) => (
                                                    <motion.span key={i}
                                                        animate={{ opacity: [0.3, 1, 0.3] }}
                                                        transition={{ duration: 1.2, repeat: Infinity, delay }}
                                                    >●</motion.span>
                                                ))}
                                            </span>
                                        ) : msg.text}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* User transcript */}
                            {(isListening || transcript) && (
                                <div className="flex gap-2 justify-end">
                                    <div
                                        className="text-sm text-white/70 leading-relaxed rounded-xl rounded-tr-none px-3 py-2 max-w-[85%]"
                                        style={{ background: "rgba(147,51,234,0.15)", border: "1px solid rgba(147,51,234,0.2)" }}
                                    >
                                        {isListening && !transcript
                                            ? <span className="text-purple-400/60 italic text-xs">Đang nghe...</span>
                                            : transcript}
                                    </div>
                                    <span className="text-base flex-shrink-0 mt-0.5">🧒</span>
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {voiceError && (
                            <div className="px-4 pb-1">
                                <p className="text-xs text-orange-400/70">{voiceError}</p>
                            </div>
                        )}

                        {/* Controls */}
                        <div className="px-4 pb-4 pt-1 flex items-center gap-3">
                            {isSupported ? (
                                <motion.button
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => isListening ? stopListening() : startListening()}
                                    disabled={loading || isSpeaking}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm text-white transition-all"
                                    style={{
                                        background: isListening
                                            ? "linear-gradient(135deg, #9333EA, #EC4899)"
                                            : "rgba(0,245,255,0.08)",
                                        border: isListening
                                            ? "1px solid rgba(147,51,234,0.5)"
                                            : "1px solid rgba(0,245,255,0.2)",
                                        boxShadow: isListening ? "0 0 20px rgba(147,51,234,0.4)" : "none",
                                        opacity: (loading || isSpeaking) ? 0.5 : 1,
                                        cursor: (loading || isSpeaking) ? "not-allowed" : "pointer",
                                    }}
                                >
                                    {isListening && (
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <motion.div key={i}
                                                    className="w-0.5 bg-white rounded-full"
                                                    animate={{ height: [4, 12 + i * 2, 4] }}
                                                    transition={{ duration: 0.4 + i * 0.1, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                    {!isListening && <span>🎙️</span>}
                                    <span>{isListening ? "Dừng" : "Nói chuyện"}</span>
                                </motion.button>
                            ) : (
                                <div className="flex-1 text-center text-xs text-white/30 py-2">
                                    Trình duyệt chưa hỗ trợ giọng nói
                                </div>
                            )}

                            {isSpeaking && (
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                    className="text-cyan-400 text-lg"
                                >
                                    🔊
                                </motion.div>
                            )}
                        </div>

                        {/* Guest CTA */}
                        {!isLoggedIn && (
                            <a
                                href="/login"
                                className="block mx-4 mb-4 py-2 rounded-xl text-center text-xs font-bold text-white hover:scale-105 transition-transform"
                                style={{
                                    background: "linear-gradient(90deg, rgba(0,245,255,0.1), rgba(147,51,234,0.1))",
                                    border: "1px solid rgba(0,245,255,0.2)",
                                }}
                            >
                                🚀 Đăng nhập để bắt đầu hành trình!
                            </a>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Speech Bubble + Mascot row ─── */}
            <div className="flex items-end gap-3">
                {/* Speech Bubble (passive messages) */}
                {!voiceOpen && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={msg.text}
                            initial={{ opacity: 0, scale: 0.8, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: calmMode ? 0.45 : 0.3 }}
                            className={`bg-slate-900/85 backdrop-blur-lg border ${borderColor} text-white text-sm px-4 py-3 rounded-2xl mb-10 max-w-[220px]`}
                            style={{
                                borderBottomRightRadius: "4px",
                                boxShadow: calmMode ? "none" : `0 0 15px ${glowColor}`,
                            }}
                        >
                            {loading ? (
                                <p className="text-white/50 flex items-center gap-2">
                                    <motion.span
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        className="inline-block"
                                    >🔮</motion.span>
                                    Cú Mèo đang suy nghĩ...
                                </p>
                            ) : (
                                <p>{msg.text}</p>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Mascot Character — click to open/close voice panel */}
                <motion.div
                    className="relative w-36 h-36 pointer-events-auto cursor-pointer"
                    animate={{ y: calmMode ? [0, -6, 0] : [0, -12, 0] }}
                    transition={{ duration: calmMode ? 4.5 : 3, repeat: Infinity, ease: "easeInOut" }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setVoiceOpen(v => !v)}
                >
                    {/* Ambient glow */}
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: voiceOpen
                                ? "radial-gradient(circle, rgba(147,51,234,0.4), rgba(0,245,255,0.2), transparent)"
                                : "radial-gradient(circle, rgba(0,245,255,0.25), rgba(217,70,239,0.15), transparent)",
                            filter: `blur(${calmMode ? "16px" : "24px"})`,
                            opacity: calmMode ? 0.6 : 1,
                            transform: "scale(1.4)",
                        }}
                    />
                    {/* Owl SVG */}
                    <div className="relative z-10">
                        <OwlCharacter expression={expression} calmMode={calmMode} />
                    </div>
                    {/* Name label */}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-cyan-400/40 z-20 shadow-[0_0_10px_rgba(0,245,255,0.3)]">
                        <span className="text-[10px] text-cyan-200 font-bold tracking-wider whitespace-nowrap">{mascotInfo.emoji} {mascotInfo.name}</span>
                    </div>
                    {/* Voice indicator dot */}
                    {voiceOpen && (
                        <motion.div
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-slate-900 z-30"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                </motion.div>
            </div>
        </div>
    );
}
