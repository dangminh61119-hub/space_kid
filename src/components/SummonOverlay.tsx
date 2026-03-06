"use client";

/**
 * SummonOverlay.tsx — CosmoMosaic v2.0
 * Overlay wrapper for game components. Shows a 🔮 summon button
 * on eligible levels (Bloom ≥ 3). When activated:
 * 1. Game pauses
 * 2. Player chooses summon method (spell/rune/constellation)
 * 3. Cú Mèo appears for 30s voice chat
 * 4. Cú Mèo fades out → game resumes
 */

import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { PLANET_SPELLS, SUMMON_COSTS, matchSpell, type SummonMethod } from "@/lib/data/planet-spells";
import { getEmotionMessage } from "@/lib/ai/emotion-templates";

/* ─── Types ─── */
interface SummonOverlayProps {
    children: ReactNode;
    planetId: string;
    /** Current question's Bloom level — summon only shows for ≥ 3 */
    bloomLevel?: number;
    /** Current question text — sent to AI for context */
    currentQuestion?: string;
    /** Current question subject */
    currentSubject?: string;
    /** Callback to pause/resume the game */
    onPause?: () => void;
    onResume?: () => void;
}

/* ─── Timer constants ─── */
const SUMMON_DURATION = 30; // seconds
const MAX_VOICE_TURNS = 3;

export default function SummonOverlay({
    children,
    planetId,
    bloomLevel = 1,
    currentQuestion,
    currentSubject,
    onPause,
    onResume,
}: SummonOverlayProps) {
    const { player, spendCrystals, addCrystals } = useGame();
    const [isActive, setIsActive] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<SummonMethod | null>(null);
    const [phase, setPhase] = useState<"idle" | "choosing" | "activating" | "chatting" | "farewell">("idle");
    const [timer, setTimer] = useState(SUMMON_DURATION);
    const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "owl"; text: string }>>([]);
    const [isListening, setIsListening] = useState(false);
    const [voiceTurns, setVoiceTurns] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const spell = PLANET_SPELLS[planetId];
    const showButton = bloomLevel >= 3 && player.crystals >= 1;

    // Countdown timer
    useEffect(() => {
        if (phase === "chatting") {
            timerRef.current = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        handleDismiss();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    // Cleanup speech recognition on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    /* ─── Open summon picker ─── */
    const handleOpenSummon = useCallback(() => {
        setPhase("choosing");
        setIsActive(true);
        onPause?.();
    }, [onPause]);

    /* ─── Select a summon method ─── */
    const handleSelectMethod = useCallback((method: SummonMethod) => {
        const cost = SUMMON_COSTS[method];
        if (player.crystals < cost) return;

        const success = spendCrystals(cost);
        if (!success) return;

        setSelectedMethod(method);
        setPhase("activating");

        // After activation animation (1.5s), enter chat mode
        setTimeout(() => {
            setPhase("chatting");
            setTimer(SUMMON_DURATION);
            setVoiceTurns(0);
            setChatMessages([{
                role: "owl",
                text: spell?.hintPrefix || "Cú Mèo đây! Bạn cần gợi ý gì? 🦉",
            }]);
        }, 1500);
    }, [player.crystals, spendCrystals, spell]);

    /* ─── Voice input via Web Speech API ─── */
    const startListening = useCallback(() => {
        if (voiceTurns >= MAX_VOICE_TURNS) return;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const SpeechRecognitionCtor = (window as Record<string, any>).SpeechRecognition
            || (window as Record<string, any>).webkitSpeechRecognition;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (!SpeechRecognitionCtor) {
            // Fallback: text input could be added here
            setChatMessages(prev => [...prev, {
                role: "owl",
                text: "Trình duyệt không hỗ trợ giọng nói! Hãy thử lại trên Chrome 🦉",
            }]);
            return;
        }

        const recognition = new SpeechRecognitionCtor();
        recognition.lang = "vi-VN";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognitionRef.current = recognition;

        recognition.onstart = () => setIsListening(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            setIsListening(false);
            setVoiceTurns(prev => prev + 1);

            // Add user message
            setChatMessages(prev => [...prev, { role: "user", text: transcript }]);

            // Check if player says "cảm ơn" to dismiss early
            const normalized = transcript.toLowerCase();
            if (normalized.includes("cảm ơn") || normalized.includes("cam on") || normalized.includes("xong")) {
                handleDismiss();
                return;
            }

            // Call AI for hint (1 API call)
            await fetchAIHint(transcript);
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    }, [voiceTurns]);

    /* ─── AI Hint via API ─── */
    const fetchAIHint = async (userQuestion: string) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    context: "hint_requested",
                    questionText: currentQuestion || "câu hỏi hiện tại",
                    subject: currentSubject || "chung",
                    bloomLevel: bloomLevel,
                    // playerMessage is appended to questionText so buildUserMessage can use it
                    playerAnswer: userQuestion,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // BUG FIX: API returns `response` not `message`
                setChatMessages(prev => [...prev, {
                    role: "owl",
                    text: data.response || getEmotionMessage("happy", "idle"),
                }]);
            } else {
                // Fallback
                setChatMessages(prev => [...prev, {
                    role: "owl",
                    text: getEmotionMessage("encouraging", "wrong"),
                }]);
            }
        } catch {
            setChatMessages(prev => [...prev, {
                role: "owl",
                text: "Cú Mèo gặp trục trặc... Hãy đọc kỹ câu hỏi nhé! 📖",
            }]);
        }
        setIsLoading(false);
    };

    /* ─── Dismiss Cú Mèo ─── */
    const handleDismiss = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (recognitionRef.current) recognitionRef.current.abort();

        setPhase("farewell");
        setChatMessages(prev => [...prev, {
            role: "owl",
            text: "Hết giờ rồi! Cú Mèo phải đi! Chúc bạn may mắn! 🦉✨",
        }]);

        setTimeout(() => {
            setPhase("idle");
            setIsActive(false);
            setSelectedMethod(null);
            setChatMessages([]);
            onResume?.();
        }, 2000);
    }, [onResume]);

    /* ─── Cancel without spending ─── */
    const handleCancel = useCallback(() => {
        setPhase("idle");
        setIsActive(false);
        setSelectedMethod(null);
        onResume?.();
    }, [onResume]);

    /* ─── RENDER ─── */
    return (
        <div className="relative w-full h-full flex-1 flex flex-col min-h-0">
            {children}

            {/* 🔮 Summon Button — only shows for Bloom ≥ 3 */}
            {showButton && phase === "idle" && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenSummon}
                    className="absolute top-3 right-14 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full
                        bg-gradient-to-r from-purple-600/80 to-indigo-600/80 border border-purple-400/30
                        text-white text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.4)]
                        hover:shadow-[0_0_25px_rgba(139,92,246,0.6)] transition-shadow"
                    title="Triệu hồi Cú Mèo"
                >
                    <span>🔮</span>
                    <span>{player.crystals}💎</span>
                </motion.button>
            )}

            <AnimatePresence>
                {/* ─── Choosing Method ─── */}
                {phase === "choosing" && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-space-deep/90 backdrop-blur-sm flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="max-w-sm w-full mx-4"
                        >
                            <div className="glass-card !p-5 border border-purple-500/30">
                                <h3 className="text-center text-lg font-bold text-white mb-1 font-[var(--font-heading)]">
                                    🔮 Triệu hồi Cú Mèo
                                </h3>
                                <p className="text-center text-white/50 text-xs mb-4">
                                    Chọn cách triệu hồi · 💎 {player.crystals} pha lê
                                </p>

                                <div className="grid grid-cols-2 gap-2">
                                    {/* Spell */}
                                    <SummonMethodButton
                                        icon="🪄"
                                        label="Thần Chú"
                                        cost={SUMMON_COSTS.spell}
                                        description={spell?.spellText || "Nói thần chú"}
                                        disabled={player.crystals < SUMMON_COSTS.spell}
                                        onClick={() => handleSelectMethod("spell")}
                                    />
                                    {/* Rune */}
                                    <SummonMethodButton
                                        icon="✍️"
                                        label="Phù Chú"
                                        cost={SUMMON_COSTS.rune}
                                        description="Vẽ ký hiệu"
                                        disabled={player.crystals < SUMMON_COSTS.rune}
                                        onClick={() => handleSelectMethod("rune")}
                                    />
                                    {/* Constellation */}
                                    <SummonMethodButton
                                        icon="🌌"
                                        label="Chòm Sao"
                                        cost={SUMMON_COSTS.constellation}
                                        description="Nối chòm sao"
                                        disabled={player.crystals < SUMMON_COSTS.constellation}
                                        onClick={() => handleSelectMethod("constellation")}
                                    />
                                    {/* Magic Lens */}
                                    <SummonMethodButton
                                        icon="🔮"
                                        label="Kính Thần"
                                        cost={SUMMON_COSTS.lens}
                                        description="Soi câu hỏi"
                                        disabled={player.crystals < SUMMON_COSTS.lens}
                                        onClick={() => handleSelectMethod("lens")}
                                    />
                                </div>

                                <button
                                    onClick={handleCancel}
                                    className="w-full mt-3 py-2 rounded-lg border border-white/10 text-white/40 text-sm hover:bg-white/5 transition"
                                >
                                    Hủy
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* ─── Activating Animation ─── */}
                {phase === "activating" && spell && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-space-deep/95 flex flex-col items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [0, 1.5, 1] }}
                            transition={{ duration: 1, times: [0, 0.6, 1] }}
                            className="text-8xl mb-4"
                        >
                            {spell.effectEmoji}
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-xl font-bold text-white font-[var(--font-heading)]"
                            style={{ textShadow: `0 0 20px ${spell.glowColor}` }}
                        >
                            &ldquo;{spell.spellText}!&rdquo;
                        </motion.p>
                    </motion.div>
                )}

                {/* ─── Chatting with Cú Mèo ─── */}
                {(phase === "chatting" || phase === "farewell") && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 bg-space-deep/90 backdrop-blur-sm flex items-center justify-center"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="max-w-md w-full mx-4"
                        >
                            <div className="glass-card !p-4 border border-cyan-500/30">
                                {/* Header with timer */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🦉</span>
                                        <span className="text-sm font-bold text-white">Cú Mèo</span>
                                    </div>
                                    <div className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${timer <= 10 ? "text-red-400 animate-pulse" : "text-neon-cyan"
                                        }`}>
                                        ⏱️ {timer}s
                                    </div>
                                </div>

                                {/* Chat messages */}
                                <div className="space-y-2 max-h-[200px] overflow-y-auto mb-3 pr-1">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${msg.role === "user"
                                                ? "bg-neon-cyan/20 text-white border border-neon-cyan/30"
                                                : "bg-white/10 text-white/80 border border-white/10"
                                                }`}>
                                                {msg.role === "owl" && <span className="mr-1">🦉</span>}
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/10 px-3 py-2 rounded-xl text-sm text-white/60 border border-white/10">
                                                🦉 Cú Mèo đang suy nghĩ...
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Voice input button */}
                                {phase === "chatting" && voiceTurns < MAX_VOICE_TURNS && (
                                    <div className="flex gap-2">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={startListening}
                                            disabled={isListening || isLoading}
                                            className={`flex-1 py-2.5 rounded-full font-bold text-sm transition-all ${isListening
                                                ? "bg-red-500/80 text-white animate-pulse"
                                                : "bg-gradient-to-r from-neon-cyan to-neon-magenta text-white hover:scale-[1.02]"
                                                } disabled:opacity-50`}
                                        >
                                            {isListening ? "🎤 Đang nghe..." : `🎤 Hỏi Cú Mèo (${MAX_VOICE_TURNS - voiceTurns} lượt)`}
                                        </motion.button>
                                        <button
                                            onClick={handleDismiss}
                                            className="px-3 py-2 rounded-full border border-white/20 text-white/40 text-xs hover:bg-white/5"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {/* Out of turns */}
                                {phase === "chatting" && voiceTurns >= MAX_VOICE_TURNS && (
                                    <button
                                        onClick={handleDismiss}
                                        className="w-full py-2.5 rounded-full bg-white/10 text-white/60 text-sm border border-white/10"
                                    >
                                        Cảm ơn Cú Mèo! 🦉
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Sub-component: Summon Method Button ─── */
function SummonMethodButton({
    icon,
    label,
    cost,
    description,
    disabled,
    onClick,
}: {
    icon: string;
    label: string;
    cost: number;
    description: string;
    disabled: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`p-3 rounded-xl border text-center transition-all ${disabled
                ? "border-white/5 opacity-30 cursor-not-allowed"
                : "border-purple-500/30 hover:bg-purple-500/10 hover:border-purple-400/50 hover:scale-[1.02]"
                }`}
        >
            <div className="text-2xl mb-1">{icon}</div>
            <div className="text-xs font-bold text-white">{label}</div>
            <div className="text-[10px] text-white/40 mb-1">{description}</div>
            <div className="text-[10px] text-neon-gold font-bold">{cost}💎</div>
        </button>
    );
}
