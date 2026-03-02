"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useGame, MASCOT_INFO } from "@/lib/game-context";
import { logAIFeedback } from "@/lib/analytics";
import { useAuth } from "@/lib/auth-context";

/* ─── Types ─── */
interface MascotMessage {
    text: string;
    type: "encouragement" | "correct" | "wrong" | "hint" | "idle";
}

interface MascotAIProps {
    /** If true, hide the mascot (e.g. during fullscreen game) */
    hidden?: boolean;
}

/* ─── Idle messages ─── */
const IDLE_MESSAGES = [
    "Cậu đã sẵn sàng khám phá vũ trụ chưa? 🚀",
    "Mỗi hành tinh là một kiến thức mới, cùng bay nào! 🌟",
    "Cú Mèo sẽ luôn đồng hành cùng cậu nha! ✨",
    "Hãy tiếp tục học nhé bạn nhỏ! 📚",
    "Cú Mèo tin bạn sẽ làm rất tốt! 💪",
];

export default function MascotAI({ hidden = false }: MascotAIProps) {
    const { player } = useGame();
    const { playerDbId } = useAuth();
    const [msg, setMsg] = useState<MascotMessage>({
        text: "Chào cậu! Cú Mèo ở đây nè! 🦉",
        type: "idle",
    });
    const [loading, setLoading] = useState(false);

    /* Get mascot emoji/name */
    const mascotInfo = player.mascot ? MASCOT_INFO[player.mascot] : { name: "Cú Mèo", emoji: "🦉" };
    const calmMode = player.calmMode;

    /* Cycle idle messages */
    useEffect(() => {
        const interval = setInterval(() => {
            const randomMsg = IDLE_MESSAGES[Math.floor(Math.random() * IDLE_MESSAGES.length)];
            setMsg({ text: randomMsg, type: "idle" });
        }, calmMode ? 12000 : 8000); // Slower in calm mode
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
        const startTime = Date.now();
        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(params),
            });
            const data = await res.json();
            const responseText = data.response || "Cú Mèo đang suy nghĩ... 🤔";

            setMsg({
                text: responseText,
                type: params.context === "correct_answer" ? "correct"
                    : params.context === "wrong_answer" ? "wrong"
                        : params.context === "hint_requested" ? "hint"
                            : "encouragement",
            });

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

    /* Expose askAI globally so game components can trigger it */
    useEffect(() => {
        (window as unknown as Record<string, unknown>).__mascotAskAI = askAI;
        return () => { delete (window as unknown as Record<string, unknown>).__mascotAskAI; };
    }, [askAI]);

    if (hidden) return null;

    /* ─── Color by type ─── */
    const borderColor = msg.type === "correct" ? "border-green-400/50"
        : msg.type === "wrong" ? "border-orange-400/50"
            : msg.type === "hint" ? "border-yellow-400/50"
                : "border-neon-cyan/50";

    const glowColor = msg.type === "correct" ? "rgba(74,222,128,0.2)"
        : msg.type === "wrong" ? "rgba(251,146,60,0.2)"
            : msg.type === "hint" ? "rgba(250,204,21,0.2)"
                : "rgba(0,245,255,0.2)";

    return (
        <div className={`fixed bottom-8 right-8 z-50 flex items-end gap-3 pointer-events-none ${calmMode ? "opacity-75" : ""}`}>
            {/* Speech Bubble */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={msg.text}
                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: calmMode ? 0.45 : 0.3 }}
                    className={`bg-slate-900/80 backdrop-blur-md border ${borderColor} text-white text-sm px-4 py-3 rounded-2xl mb-8 max-w-[220px]`}
                    style={{
                        borderBottomRightRadius: "4px",
                        boxShadow: calmMode ? "none" : `0 0 15px ${glowColor}`,
                    }}
                >
                    {loading ? (
                        <p className="text-white/50">Cú Mèo đang suy nghĩ... 🤔</p>
                    ) : (
                        <p>{msg.text}</p>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Mascot Character */}
            <motion.div
                className="relative w-24 h-24 pointer-events-auto cursor-pointer"
                animate={{
                    y: calmMode ? [0, -5, 0] : [0, -10, 0], // Gentler in calm mode
                }}
                transition={{
                    duration: calmMode ? 4.5 : 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                whileHover={{ scale: 1.1 }}
                onClick={() => askAI({ context: "encouragement" })}
            >
                {/* Glow - reduced in calm mode */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: "rgba(0,245,255,0.2)",
                        filter: `blur(${calmMode ? "8px" : "16px"})`,
                        opacity: calmMode ? 0.5 : 1,
                    }}
                />

                {/* Robot body/head */}
                <div className="absolute inset-2 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl border-2 border-white/50 flex flex-col items-center justify-center overflow-hidden"
                    style={{
                        boxShadow: calmMode ? "none" : "0 0 20px rgba(0,245,255,0.4)",
                    }}
                >
                    {/* Eyes */}
                    <div className="flex gap-3 mb-2">
                        <motion.div
                            className="w-4 h-5 bg-white rounded-full shadow-[0_0_10px_white]"
                            animate={{ scaleY: [1, 0.1, 1], scaleX: [1, 1.2, 1] }}
                            transition={{ duration: calmMode ? 6 : 4, repeat: Infinity, times: [0, 0.05, 0.1] }}
                        />
                        <motion.div
                            className="w-4 h-5 bg-white rounded-full shadow-[0_0_10px_white]"
                            animate={{ scaleY: [1, 0.1, 1], scaleX: [1, 1.2, 1] }}
                            transition={{ duration: calmMode ? 6 : 4, repeat: Infinity, times: [0, 0.05, 0.1] }}
                        />
                    </div>
                    {/* Smile */}
                    <svg width="24" height="12" viewBox="0 0 24 12" className="mt-1">
                        <path d="M 4 2 Q 12 10 20 2" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    {/* Mascot label */}
                    <span className="text-[8px] text-white/60 mt-1 font-bold">{mascotInfo.emoji}</span>
                </div>
            </motion.div>
        </div>
    );
}
