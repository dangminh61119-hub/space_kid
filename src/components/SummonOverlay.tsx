"use client";

/**
 * SummonOverlay.tsx — CosmoMosaic v2.0
 *
 * FIXES:
 * - Bug 1: Chat panel is now a small floating sidebar (bottom-right), not fullscreen
 * - Bug 2: Quick-reply hint buttons stay visible after use (never disappear)
 * - Bug 3: AI receives full question context (questionText, bloomLevel, subject)
 */

import { useState, useCallback, useEffect, useRef, createContext, useContext, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGame } from "@/lib/game-context";
import { PLANET_SPELLS, SUMMON_COSTS, type SummonMethod } from "@/lib/data/planet-spells";
import { getEmotionMessage } from "@/lib/ai/emotion-templates";
import { supabase } from "@/lib/services/supabase";

/* ─── Types ─── */
interface SummonOverlayProps {
    children: ReactNode;
    planetId: string;
    bloomLevel?: number;
    currentQuestion?: string;
    currentSubject?: string;
    /** Multiple-choice answer options for the current question */
    currentAnswers?: string[];
    onPause?: () => void;
    onResume?: () => void;
}

/* ─── Context so FloatingMascot can trigger summon ─── */
interface SummonContextValue {
    openSummon: () => void;
    canSummon: boolean;
}
const SummonContext = createContext<SummonContextValue>({ openSummon: () => { }, canSummon: false });
export function useSummon() { return useContext(SummonContext); }

const SUMMON_DURATION = 60; // seconds
const MAX_VOICE_TURNS = 5;

/* ─── Quick-reply hint types ─── */
const QUICK_HINTS = [
    { label: "💡 Gợi ý", prompt: "hint_gợi_ý" },
    { label: "📖 Giải thích", prompt: "hint_giải_thích" },
    { label: "✏️ Ví dụ", prompt: "hint_ví_dụ" },
] as const;

export default function SummonOverlay({
    children,
    planetId,
    bloomLevel = 1,
    currentQuestion,
    currentSubject,
    currentAnswers,
    onPause,
    onResume,
}: SummonOverlayProps) {
    const { player, spendCrystals } = useGame();
    const [isActive, setIsActive] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<SummonMethod | null>(null);
    const [phase, setPhase] = useState<"idle" | "choosing" | "activating" | "chatting" | "farewell">("idle");
    const [timer, setTimer] = useState(SUMMON_DURATION);
    const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "owl"; text: string }>>([]);
    const [isListening, setIsListening] = useState(false);
    const [voiceTurns, setVoiceTurns] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    const spell = PLANET_SPELLS[planetId];
    const showButton = player.crystals >= 1;

    /* ─── Auto-scroll chat to bottom ─── */
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    /* ─── Countdown timer ─── */
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
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase]);

    /* ─── Cleanup on unmount ─── */
    useEffect(() => {
        return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
    }, []);

    /* ─── Open summon picker ─── */
    const handleOpenSummon = useCallback(() => {
        if (!showButton) return;
        setPhase("choosing");
        setIsActive(true);
        onPause?.();
    }, [onPause, showButton]);

    /* ─── Select a summon method ─── */
    const handleSelectMethod = useCallback((method: SummonMethod) => {
        const cost = SUMMON_COSTS[method];
        if (player.crystals < cost) return;
        const success = spendCrystals(cost);
        if (!success) return;

        setSelectedMethod(method);
        setPhase("activating");

        setTimeout(() => {
            setPhase("chatting");
            setTimer(SUMMON_DURATION);
            setVoiceTurns(0);
            setChatMessages([{
                role: "owl",
                text: currentQuestion
                    ? `Cú Mèo đây! 🦉 Câu hỏi:\n"${currentQuestion}"\nBạn cần gợi ý gì? Chọn bên dưới hoặc hỏi Cú Mèo!`
                    : (spell?.hintPrefix || "Cú Mèo đây! Bạn cần gợi ý gì? 🦉"),
            }]);
        }, 1500);
    }, [player.crystals, spendCrystals, spell, currentQuestion]);

    /* ─── AI Hint via API ─── */
    const fetchAIHint = useCallback(async (userPrompt: string, promptType?: string) => {
        setIsLoading(true);
        let context = "hint_requested";
        let playerAnswer = userPrompt;

        if (promptType === "hint_gợi_ý") {
            playerAnswer = "Cho tôi gợi ý để trả lời câu hỏi này.";
        } else if (promptType === "hint_giải_thích") {
            playerAnswer = "Giải thích câu hỏi này cho tôi hiểu.";
            context = "hint_requested";
        } else if (promptType === "hint_ví_dụ") {
            playerAnswer = "Cho tôi một ví dụ tương tự để hiểu câu hỏi này.";
        }

        // Get JWT token for API auth
        const session = supabase ? (await supabase.auth.getSession()).data.session : null;
        const authHeader = session?.access_token ? `Bearer ${session.access_token}` : "";

        try {
            const response = await fetch("/api/ai", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(authHeader ? { "Authorization": authHeader } : {}),
                },
                body: JSON.stringify({
                    context,
                    questionText: currentQuestion || "câu hỏi hiện tại",
                    subject: currentSubject || "chung",
                    bloomLevel: bloomLevel,
                    playerAnswer,
                    answerOptions: currentAnswers || [],
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setChatMessages(prev => [...prev, {
                    role: "owl",
                    text: data.response || getEmotionMessage("happy", "idle"),
                }]);
            } else {
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
    }, [currentQuestion, currentSubject, bloomLevel]);

    /* ─── Quick-reply handler ─── */
    const handleQuickHint = useCallback((hint: typeof QUICK_HINTS[number]) => {
        if (isLoading) return;
        setChatMessages(prev => [...prev, { role: "user", text: hint.label }]);
        setVoiceTurns(prev => prev + 1);
        fetchAIHint(hint.label, hint.prompt);
    }, [isLoading, fetchAIHint]);

    /* ─── Voice input ─── */
    const startListening = useCallback(() => {
        if (voiceTurns >= MAX_VOICE_TURNS || isLoading) return;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        const SpeechRecognitionCtor = (window as Record<string, any>).SpeechRecognition
            || (window as Record<string, any>).webkitSpeechRecognition;
        /* eslint-enable @typescript-eslint/no-explicit-any */

        if (!SpeechRecognitionCtor) {
            setChatMessages(prev => [...prev, {
                role: "owl",
                text: "Trình duyệt không hỗ trợ giọng nói! Hãy thử Chrome 🦉",
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
            setChatMessages(prev => [...prev, { role: "user", text: transcript }]);

            const normalized = transcript.toLowerCase();
            if (normalized.includes("cảm ơn") || normalized.includes("cam on") || normalized.includes("xong")) {
                handleDismiss();
                return;
            }
            await fetchAIHint(transcript);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    }, [voiceTurns, isLoading, fetchAIHint]);

    /* ─── Dismiss Cú Mèo ─── */
    const handleDismiss = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (recognitionRef.current) recognitionRef.current.abort();

        setPhase("farewell");
        setChatMessages(prev => [...prev, {
            role: "owl",
            text: "Cú Mèo phải đi rồi! Chúc bạn nhỏ làm bài tốt! 🦉✨",
        }]);

        setTimeout(() => {
            setPhase("idle");
            setIsActive(false);
            setSelectedMethod(null);
            setChatMessages([]);
            onResume?.();
        }, 1800);
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
        <SummonContext.Provider value={{ openSummon: handleOpenSummon, canSummon: showButton }}>
            {/* FIX: use relative + h-full so children fill the space normally */}
            <div className="relative w-full h-full flex-1 flex flex-col min-h-0">
                {children}

                {/* 🔮 Summon Button */}
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
                    {/* ─── Choosing Method (fullscreen modal — game is paused) ─── */}
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
                                        <SummonMethodButton
                                            icon="🪄" label="Thần Chú" cost={SUMMON_COSTS.spell}
                                            description={spell?.spellText || "Nói thần chú"}
                                            disabled={player.crystals < SUMMON_COSTS.spell}
                                            onClick={() => handleSelectMethod("spell")}
                                        />
                                        <SummonMethodButton
                                            icon="✍️" label="Phù Chú" cost={SUMMON_COSTS.rune}
                                            description="Vẽ ký hiệu"
                                            disabled={player.crystals < SUMMON_COSTS.rune}
                                            onClick={() => handleSelectMethod("rune")}
                                        />
                                        <SummonMethodButton
                                            icon="🌌" label="Chòm Sao" cost={SUMMON_COSTS.constellation}
                                            description="Nối chòm sao"
                                            disabled={player.crystals < SUMMON_COSTS.constellation}
                                            onClick={() => handleSelectMethod("constellation")}
                                        />
                                        <SummonMethodButton
                                            icon="🔮" label="Kính Thần" cost={SUMMON_COSTS.lens}
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

                    {/* ─── Chatting — floating panel, max-height viewport-aware ─── */}
                    {(phase === "chatting" || phase === "farewell") && (
                        <motion.div
                            key="chat-panel"
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.95 }}
                            className="absolute bottom-16 right-2 z-50 w-[min(340px,92vw)]"
                            style={{ maxHeight: "min(50vh, 420px)" }}
                        >
                            {/* flex-col: header + messages (scrollable) + buttons (fixed at bottom) */}
                            <div className="glass-card !p-3 border border-cyan-500/40 shadow-[0_0_20px_rgba(0,245,255,0.15)] flex flex-col" style={{ maxHeight: "inherit" }}>
                                {/* Header — always visible */}
                                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xl">🦉</span>
                                        <span className="text-xs font-bold text-white">Cú Mèo</span>
                                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${timer <= 10 ? "text-red-400 animate-pulse bg-red-400/10" : "text-neon-cyan bg-cyan-400/5"}`}>
                                            ⏱️ {timer}s
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleDismiss}
                                        className="w-5 h-5 rounded-full border border-white/10 text-white/30 text-[10px] hover:bg-white/10 flex items-center justify-center"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Chat messages — fills available space, scrolls internally */}
                                <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 mb-2 pr-0.5">
                                    {chatMessages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[90%] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                                                ? "bg-neon-cyan/20 text-white border border-neon-cyan/30"
                                                : "bg-white/10 text-white/90 border border-white/10"
                                                }`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white/10 px-2.5 py-1.5 rounded-xl text-xs text-white/50 border border-white/10 flex items-center gap-1">
                                                <span className="animate-bounce">🦉</span>
                                                <span>Đang suy nghĩ...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Quick-reply + voice — always pinned at bottom, never clipped */}
                                {phase === "chatting" && (
                                    <div className="flex-shrink-0 space-y-1.5">
                                        <div className="flex gap-1 flex-wrap">
                                            {QUICK_HINTS.map(hint => (
                                                <button
                                                    key={hint.prompt}
                                                    onClick={() => handleQuickHint(hint)}
                                                    disabled={isLoading}
                                                    className="px-2 py-1 rounded-full text-[10px] font-bold border border-purple-400/30 text-purple-300 hover:bg-purple-500/20 transition disabled:opacity-40"
                                                >
                                                    {hint.label}
                                                </button>
                                            ))}
                                        </div>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={startListening}
                                            disabled={isListening || isLoading || voiceTurns >= MAX_VOICE_TURNS}
                                            className={`w-full py-2 rounded-full font-bold text-xs transition-all ${isListening
                                                ? "bg-red-500/80 text-white animate-pulse"
                                                : voiceTurns >= MAX_VOICE_TURNS
                                                    ? "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                                                    : "bg-gradient-to-r from-neon-cyan/80 to-neon-magenta/80 text-white hover:opacity-90"
                                                } disabled:opacity-40`}
                                        >
                                            {isListening ? "🎤 Đang nghe..." : voiceTurns >= MAX_VOICE_TURNS ? "Hết lượt hỏi" : `🎤 Hỏi Cú Mèo (${MAX_VOICE_TURNS - voiceTurns} lượt)`}
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </SummonContext.Provider>
    );
}

/* ─── Sub-component: Summon Method Button ─── */
function SummonMethodButton({
    icon, label, cost, description, disabled, onClick,
}: {
    icon: string; label: string; cost: number; description: string; disabled: boolean; onClick: () => void;
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
