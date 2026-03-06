"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useEffect, useState } from "react";
import { getWinMessage, getLoseMessage } from "@/lib/ai/emotion-templates";

interface Props {
    type: "win" | "lose";
    score: number;
    stars?: 0 | 1 | 2 | 3;
    levelCompleted: number;
    totalLevels: number;
    nextGameMode?: string;
    planetEmoji: string;
    planetName: string;
    onContinue: () => void;
    onExit: () => void;
}

const MODE_LABELS: Record<string, { icon: string; label: string }> = {
    "timebomb": { icon: "💣", label: "Bom Hẹn Giờ" },
    "shooter": { icon: "🚀", label: "Bắn Từ Không Gian" },
    "cosmo-bridge": { icon: "🌉", label: "Cầu Nối Tri Thức" },
    "star-hunter": { icon: "⭐", label: "Săn Sao Vũ Trụ" },
    "galaxy-sort": { icon: "🔬", label: "Phân Loại Thiên Hà" },
    "meteor": { icon: "☄️", label: "Mưa Thiên Thạch" },
    "rush": { icon: "⚡", label: "Đố Nhanh Vũ Trụ" },
    "boss": { icon: "⚔️", label: "Boss Battle" },
    "star-race": { icon: "🏁", label: "Cuộc Đua Sao" },
};

// ── Confetti piece component ──────────────────────────────
const CONFETTI_COLORS = [
    "#FFE066", "#00F5FF", "#FF6BFF", "#7BFF7B", "#FF8A4C", "#B07BFF",
    "#FFFFFF", "#FFD700", "#00E5FF", "#FF4081",
];

function ConfettiRain({ count = 40 }: { count?: number }) {
    const pieces = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            dur: `${0.9 + Math.random() * 0.8}s`,
            delay: `${Math.random() * 0.8}s`,
            rot: `${Math.random() > 0.5 ? 360 : -360}deg`,
            size: 6 + Math.random() * 6,
            shape: Math.random() > 0.5 ? "50%" : "2px",
        })), [count]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: p.left,
                        top: -12,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: p.shape,
                        boxShadow: `0 0 ${p.size}px ${p.color}80`,
                        "--dur": p.dur,
                        "--delay": p.delay,
                        "--rot": p.rot,
                    } as React.CSSProperties}
                />
            ))}
        </div>
    );
}

// ── Owl mascot with emotion ───────────────────────────────
function OwlMascot({ isWin }: { isWin: boolean }) {
    return (
        <motion.div
            animate={isWin
                ? { y: [0, -12, 0], rotate: [0, -8, 8, 0] }
                : { y: [0, -4, 0], rotate: [-3, 3, -3] }
            }
            transition={{ duration: isWin ? 1.2 : 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl select-none"
            title={isWin ? "Cú Mèo vui mừng!" : "Cú Mèo động viên bạn!"}
        >
            {isWin ? "🦉" : "🦉"}
        </motion.div>
    );
}

export default function LevelTransition({
    type, score, stars = 0, levelCompleted, totalLevels,
    nextGameMode, planetEmoji, planetName,
    onContinue, onExit,
}: Props) {
    const isWin = type === "win";
    const nextMode = nextGameMode ? MODE_LABELS[nextGameMode] : null;
    const progressPercent = Math.min(100, (levelCompleted / totalLevels) * 100);
    const [scorePop, setScorePop] = useState(false);

    const owlMessage = useMemo(() => {
        if (isWin) return getWinMessage(0);
        return getLoseMessage(0);
    }, [isWin]);

    // Trigger score pop animation after mount
    useEffect(() => {
        const t = setTimeout(() => setScorePop(true), 400);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className={`relative w-full h-full min-h-[600px] flex items-center justify-center z-30 py-10 px-4 overflow-hidden
            ${isWin
                ? "bg-gradient-to-b from-[#030d1f] via-[#041824] to-[#040d0d]"
                : "bg-gradient-to-b from-[#17030a] via-[#130210] to-[#050316]"
            }`}
        >
            {/* ── Background ambience ── */}
            <div className="absolute inset-0 pointer-events-none">
                {isWin ? (
                    <>
                        <motion.div
                            className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full blur-[80px]"
                            style={{ background: "rgba(0,245,255,0.12)" }}
                            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                        />
                        <motion.div
                            className="absolute bottom-1/3 right-1/4 w-52 h-52 rounded-full blur-[80px]"
                            style={{ background: "rgba(255,224,102,0.10)" }}
                            animate={{ opacity: [0.2, 0.6, 0.2] }}
                            transition={{ repeat: Infinity, duration: 4, delay: 1 }}
                        />
                        <ConfettiRain count={50} />
                    </>
                ) : (
                    <>
                        <motion.div
                            className="absolute inset-0"
                            style={{ background: "rgba(139,0,0,0.08)" }}
                            animate={{ opacity: [0.04, 0.14, 0.04] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                        />
                        {/* Pulsing red vignette */}
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                background: "radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0.18) 100%)",
                            }}
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                    </>
                )}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 28 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.55, stiffness: 280, damping: 24 }}
                className="relative z-10 flex flex-col items-center gap-5 max-w-md w-full px-6"
            >
                {/* ── Owl + Hero icon ── */}
                <div className="flex items-center gap-4">
                    <OwlMascot isWin={isWin} />
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", delay: 0.1, stiffness: 300 }}
                        className="text-6xl"
                    >
                        {isWin ? "🎉" : "💥"}
                    </motion.div>
                </div>

                {/* ── Title ── */}
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className={`text-3xl sm:text-4xl font-black font-[var(--font-heading)] text-center
                        ${isWin ? "neon-text" : "text-red-400"}`}
                >
                    {isWin ? "✨ Sứ mệnh hoàn thành!" : "💫 Chưa đủ lần này..."}
                </motion.h2>

                {/* ── Owl message ── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="text-base text-white/70 italic text-center"
                >
                    {owlMessage}
                </motion.p>

                {/* ── Score & Stars card ── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card-strong w-full !rounded-2xl !p-5 text-center"
                    style={{
                        border: isWin
                            ? "1px solid rgba(0,245,255,0.2)"
                            : "1px solid rgba(255,100,100,0.15)",
                        boxShadow: isWin
                            ? "0 0 30px rgba(0,245,255,0.08)"
                            : "0 0 30px rgba(255,80,80,0.06)",
                    }}
                >
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-3xl">{planetEmoji}</span>
                        <span className="text-white/60 text-base font-bold">{planetName}</span>
                    </div>

                    {/* Score */}
                    <div
                        className={scorePop ? "animate-score-pop" : ""}
                        onAnimationEnd={() => setScorePop(false)}
                    >
                        <p className="text-neon-gold text-5xl font-black">{score} ✦</p>
                    </div>

                    {/* Stars */}
                    {isWin && (
                        <div className="flex items-center justify-center gap-2 mt-3 mb-2">
                            {[1, 2, 3].map(i => (
                                <motion.span
                                    key={i}
                                    className={`text-3xl animate-star-drop ${i <= stars ? "" : "opacity-20"}`}
                                    style={{ animationDelay: `${0.35 + i * 0.18}s` }}
                                    initial={{ opacity: 0, y: -20, scale: 0.5 }}
                                    animate={i <= stars
                                        ? { opacity: 1, y: 0, scale: 1 }
                                        : { opacity: 0.2, y: 0, scale: 0.75 }
                                    }
                                    transition={{ type: "spring", delay: 0.35 + i * 0.18, stiffness: 300 }}
                                >
                                    {i <= stars ? "⭐" : "☆"}
                                </motion.span>
                            ))}
                        </div>
                    )}

                    <p className="text-white/40 text-sm mt-3 font-semibold">Màn {levelCompleted} / {totalLevels}</p>

                    {/* Progress bar */}
                    <div className="mt-4 h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${isWin
                                ? "bg-gradient-to-r from-emerald-400 to-cyan-400"
                                : "bg-gradient-to-r from-red-600 to-orange-500"
                                }`}
                            initial={{ width: `${Math.max(0, ((levelCompleted - (isWin ? 1 : 0)) / totalLevels) * 100)}%` }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
                        />
                    </div>
                </motion.div>

                {/* ── Next mode preview ── */}
                {isWin && nextMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className="glass-card !rounded-2xl !p-4 border border-neon-cyan/20 text-center w-full"
                    >
                        <p className="text-sm text-white/50 mb-2 font-semibold">Sứ mệnh tiếp theo</p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl">{nextMode.icon}</span>
                            <span className="text-lg font-bold text-neon-cyan">{nextMode.label}</span>
                        </div>
                        <p className="text-sm text-white/40 mt-1.5">Màn {levelCompleted + 1}</p>
                    </motion.div>
                )}

                {!isWin && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, type: "spring" }}
                        className="glass-card !rounded-2xl !p-4 border border-orange-500/30 text-center w-full"
                        style={{ boxShadow: "0 0 20px rgba(249,115,22,0.1)" }}
                    >
                        <p className="text-orange-300 font-bold text-base">
                            💪 Không sao cả! Mỗi lần thử là một lần học hỏi!
                        </p>
                    </motion.div>
                )}

                {/* ── Buttons ── */}
                <div className="flex gap-4 w-full mt-2">
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", delay: 0.65, stiffness: 300 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={onContinue}
                        className={`flex-1 py-4 rounded-full font-black text-white text-lg tracking-wide shadow-lg ${isWin
                            ? "bg-gradient-to-r from-neon-cyan to-neon-magenta shadow-[0_0_28px_rgba(0,245,255,0.35)]"
                            : "bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_28px_rgba(249,115,22,0.35)]"
                            }`}
                        style={!isWin ? {
                            animation: "glow-pulse 1.8s ease-in-out infinite",
                        } : {}}
                    >
                        {isWin
                            ? levelCompleted >= totalLevels ? "🏆 Hoàn thành!" : "Tiếp tục →"
                            : "🔄 Thử lại!"
                        }
                    </motion.button>

                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", delay: 0.75 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={onExit}
                        className="py-4 px-6 rounded-full border border-white/20 text-white/70 hover:bg-white/10 transition-colors text-base font-bold whitespace-nowrap"
                    >
                        🗺 Bản đồ
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
