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

/* ─── Tech Cyber-Owl Mascot ─── */
function OwlCharacter({ expression, calmMode }: { expression: Expression; calmMode: boolean }) {

    // Render high-tech digital eyes
    const renderDigitalEye = (cx: number, cy: number, side: "left" | "right") => {
        const isWinkLeft = expression === "wink" && side === "left";

        if (expression === "happy") {
            return <path d={`M ${cx - 4} ${cy + 1} Q ${cx} ${cy - 4} ${cx + 4} ${cy + 1}`} fill="none" stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" filter="url(#neonGlow)" />
        }
        if (expression === "sad") {
            return <path d={`M ${cx - 4} ${cy - 1} Q ${cx} ${cy + 4} ${cx + 4} ${cy - 1}`} fill="none" stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" filter="url(#neonGlow)" />
        }
        if (isWinkLeft) {
            return <line x1={cx - 5} y1={cy} x2={cx + 5} y2={cy} stroke="#00F5FF" strokeWidth="2.5" strokeLinecap="round" filter="url(#neonGlow)" />
        }
        if (expression === "thinking") {
            // Processing/loading eye
            return (
                <g filter="url(#neonGlow)">
                    <circle cx={cx} cy={cy} r="3.5" fill="none" stroke="#00F5FF" strokeWidth="1.5" strokeDasharray="3 3" />
                    <circle cx={cx + 2} cy={cy - 2} r="2" fill="#00F5FF" />
                </g>
            )
        }
        if (expression === "surprised") {
            return <circle cx={cx} cy={cy} r="4.5" fill="none" stroke="#00F5FF" strokeWidth="2" filter="url(#neonGlow)" />
        }
        // Default (idle, talking)
        return <circle cx={cx} cy={cy} r="3.5" fill="#00F5FF" filter="url(#neonGlow)" />
    };

    return (
        <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-neon" style={{ filter: `drop-shadow(0 0 12px rgba(0,245,255,${calmMode ? "0.2" : "0.5"}))` }}>
            <defs>
                {/* Tech Armor Gradient */}
                <linearGradient id="armorGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1A2A54" />
                    <stop offset="100%" stopColor="#080D1C" />
                </linearGradient>
                {/* Visor Glass Subsurface */}
                <linearGradient id="visorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#111B3D" />
                    <stop offset="100%" stopColor="#040914" />
                </linearGradient>
                {/* Core Glow Effects */}
                <filter id="neonGlow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="orangeGlow">
                    <feGaussianBlur stdDeviation="2" result="blur2" />
                    <feComposite in="SourceGraphic" in2="blur2" operator="over" />
                </filter>
            </defs>

            {/* === TECH EARS (Antennae/Fins) === */}
            <g>
                <path d="M 33 28 L 20 10 L 38 22 Z" fill="#080D1C" stroke="#00F5FF" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 31 25 L 23 15 L 35 21 Z" fill="#00F5FF" opacity="0.4" filter="url(#neonGlow)" />
                <path d="M 67 28 L 80 10 L 62 22 Z" fill="#080D1C" stroke="#00F5FF" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M 69 25 L 77 15 L 65 21 Z" fill="#00F5FF" opacity="0.4" filter="url(#neonGlow)" />
            </g>

            {/* === HOVER WINGS (Anti-Gravity Panels) === */}
            <motion.g animate={expression === 'happy' ? { rotate: [-15, 15, -15] } : { y: [0, -4, 0] }} transition={{ duration: expression === 'happy' ? 0.3 : 2.5, repeat: Infinity, ease: "easeInOut" }} style={{ transformOrigin: "13px 50px" }}>
                <rect x="7" y="45" width="12" height="30" rx="6" fill="url(#armorGlow)" stroke="#00F5FF" strokeWidth="1.5" />
                <rect x="11" y="50" width="4" height="20" rx="2" fill="#00F5FF" opacity="0.3" />
                <rect x="11" y="50" width="4" height="20" rx="2" fill="none" stroke="#00F5FF" strokeWidth="1" filter="url(#neonGlow)" />
            </motion.g>
            <motion.g animate={expression === 'happy' ? { rotate: [15, -15, 15] } : { y: [0, -4, 0] }} transition={{ duration: expression === 'happy' ? 0.3 : 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }} style={{ transformOrigin: "87px 50px" }}>
                <rect x="81" y="45" width="12" height="30" rx="6" fill="url(#armorGlow)" stroke="#00F5FF" strokeWidth="1.5" />
                <rect x="85" y="50" width="4" height="20" rx="2" fill="#00F5FF" opacity="0.3" />
                <rect x="85" y="50" width="4" height="20" rx="2" fill="none" stroke="#00F5FF" strokeWidth="1" filter="url(#neonGlow)" />
            </motion.g>

            {/* === BODY (Sleek Drone Capsule) === */}
            <rect x="25" y="25" width="50" height="60" rx="25" fill="url(#armorGlow)" stroke="#00F5FF" strokeWidth="2" />
            <path d="M 25 50 Q 50 60 75 50" fill="none" stroke="#00F5FF" strokeWidth="1.5" opacity="0.5" />

            {/* === CHEST ARMOR PLATING === */}
            <path d="M 35 58 L 65 58 L 60 80 L 40 80 Z" fill="#040914" stroke="#00F5FF" strokeWidth="1" opacity="0.6" />
            <path d="M 40 64 L 60 64" stroke="#00F5FF" strokeWidth="1" opacity="0.3" />
            <path d="M 42 69 L 58 69" stroke="#00F5FF" strokeWidth="1" opacity="0.3" />
            <path d="M 44 74 L 56 74" stroke="#00F5FF" strokeWidth="1" opacity="0.3" />

            {/* === POWER CORE (Heart) === */}
            <circle cx="50" cy="73" r="6" fill="#1A2A54" stroke="#00F5FF" strokeWidth="1.5" />
            <motion.circle cx="50" cy="73" r="3" fill="#00F5FF" filter="url(#neonGlow)"
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* === VISOR GOGGLES (Screens for eyes) === */}
            <rect x="27" y="32" width="20" height="15" rx="5" fill="url(#visorGrad)" stroke="#00F5FF" strokeWidth="1.5" />
            <rect x="53" y="32" width="20" height="15" rx="5" fill="url(#visorGrad)" stroke="#00F5FF" strokeWidth="1.5" />

            {/* === DIGITAL LED EYES === */}
            {renderDigitalEye(37, 39.5, "left")}
            {renderDigitalEye(63, 39.5, "right")}

            {/* === MECHANICAL BEAK === */}
            <g>
                <motion.polygon
                    points="46,50 54,50 50,56"
                    fill="#FF8C00"
                    stroke="#FF8C00"
                    strokeWidth="1"
                    filter="url(#orangeGlow)"
                    animate={expression === 'talking' ? { scaleY: [1, 0.4, 1] } : { scaleY: 1 }}
                    transition={{ duration: 0.25, repeat: Infinity }}
                    style={{ transformOrigin: "50px 50px" }}
                />
            </g>

            {/* === FEET (Thruster Jets) === */}
            <g>
                <motion.path d="M 36 84 L 42 84 L 39 96 Z" fill="#FF8C00" opacity="0.8" filter="url(#orangeGlow)" animate={{ y: [0, 3, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} />
                <path d="M 34 81 L 44 81 L 41 87 L 37 87 Z" fill="#1A2A54" stroke="#00F5FF" strokeWidth="1.5" strokeLinejoin="round" />
            </g>
            <g>
                <motion.path d="M 58 84 L 64 84 L 61 96 Z" fill="#FF8C00" opacity="0.8" filter="url(#orangeGlow)" animate={{ y: [0, 3, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.15 }} />
                <path d="M 56 81 L 66 81 L 63 87 L 59 87 Z" fill="#1A2A54" stroke="#00F5FF" strokeWidth="1.5" strokeLinejoin="round" />
            </g>

            {/* === DIGITAL THINKING DATA BLOCKS === */}
            {expression === "thinking" && (
                <g fill="#00F5FF" filter="url(#neonGlow)">
                    <motion.rect x="75" y="24" width="4" height="4" rx="1" animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.rect x="82" y="15" width="3" height="3" rx="1" animate={{ y: [0, -6, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.3 }} />
                    <motion.rect x="88" y="8" width="2" height="2" rx="0.5" animate={{ y: [0, -4, 0], opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }} />
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
            xp: player.xp,
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
