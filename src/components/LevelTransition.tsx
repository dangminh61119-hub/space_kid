"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { getWinMessage, getLoseMessage } from "@/lib/ai/emotion-templates";

interface Props {
    type: "win" | "lose";
    score: number;
    levelCompleted: number;
    totalLevels: number;
    nextGameMode?: string;
    planetEmoji: string;
    planetName: string;
    onContinue: () => void;  // next level (win) or retry (lose)
    onExit: () => void;      // back to portal
}

const MODE_LABELS: Record<string, { icon: string; label: string }> = {
    "timebomb": { icon: "💣", label: "Bom Hẹn Giờ" },
    "shooter": { icon: "🚀", label: "Bắn Từ Không Gian" },
    "cosmo-bridge": { icon: "🌉", label: "Cầu Nối Tri Thức" },
    "star-hunter": { icon: "⭐", label: "Săn Sao Vũ Trụ" },
    "galaxy-sort": { icon: "🔬", label: "Phân Loại Thiên Hà" },
    "meteor": { icon: "☄️", label: "Mưa Thiên Thạch" },
    "rush": { icon: "⚡", label: "Đố Nhanh Vũ Trụ" },
};

export default function LevelTransition({
    type, score, levelCompleted, totalLevels,
    nextGameMode, planetEmoji, planetName,
    onContinue, onExit,
}: Props) {
    const isWin = type === "win";
    const nextMode = nextGameMode ? MODE_LABELS[nextGameMode] : null;
    const progressPercent = Math.min(100, (levelCompleted / totalLevels) * 100);

    // 🎭 Dynamic Cú Mèo message (emotion-aware)
    const owlMessage = useMemo(() => {
        if (isWin) return getWinMessage(0);
        return getLoseMessage(0);
    }, [isWin]);

    return (
        <div className="absolute inset-0 bg-space-deep/98 flex items-center justify-center z-30 overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none">
                {isWin && (
                    <>
                        <motion.div className="absolute top-1/4 left-1/3 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px]"
                            animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 3 }} />
                        <motion.div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px]"
                            animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ repeat: Infinity, duration: 4 }} />
                    </>
                )}
                {!isWin && (
                    <motion.div className="absolute inset-0 bg-red-900/10"
                        animate={{ opacity: [0.05, 0.15, 0.05] }} transition={{ repeat: Infinity, duration: 2 }} />
                )}
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="relative z-10 flex flex-col items-center gap-5 max-w-md px-6"
            >
                {/* Hero icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.1 }}
                    className="text-7xl"
                >
                    {isWin ? "🎉" : "💥"}
                </motion.div>

                {/* Title */}
                <h2 className={`text-2xl sm:text-3xl font-bold font-[var(--font-heading)] ${isWin ? "neon-text" : "text-red-400"}`}>
                    {isWin ? "Sứ mệnh hoàn thành!" : "Sứ mệnh thất bại!"}
                </h2>

                {/* Score */}
                <div className="glass-card !rounded-2xl !p-4 border border-white/10 text-center w-full">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-2xl">{planetEmoji}</span>
                        <span className="text-white/60 text-sm">{planetName}</span>
                    </div>
                    <p className="text-neon-gold text-3xl font-bold mb-1">{score} XP</p>
                    <p className="text-white/40 text-xs">Màn {levelCompleted} / {totalLevels}</p>

                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className={`h-full rounded-full ${isWin
                                ? "bg-gradient-to-r from-emerald-500 to-cyan-400"
                                : "bg-gradient-to-r from-red-600 to-orange-500"
                                }`}
                            initial={{ width: `${Math.max(0, ((levelCompleted - (isWin ? 1 : 0)) / totalLevels) * 100)}%` }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                        />
                    </div>
                </div>

                {/* Next level preview (win only) */}
                {isWin && nextMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card !rounded-xl !p-3 border border-neon-cyan/20 text-center w-full"
                    >
                        <p className="text-xs text-white/40 mb-1.5">Sứ mệnh tiếp theo</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-xl">{nextMode.icon}</span>
                            <span className="text-sm font-bold text-neon-cyan">{nextMode.label}</span>
                        </div>
                        <p className="text-xs text-white/30 mt-1">Màn {levelCompleted + 1}</p>
                    </motion.div>
                )}

                {/* Owl encouragement */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-2 text-sm"
                >
                    <span className="text-xl">🦉</span>
                    <span className="text-white/60 italic">
                        {owlMessage}
                    </span>
                </motion.div>

                {/* Action buttons */}
                <div className="flex gap-3 w-full">
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.6 }}
                        onClick={onContinue}
                        className={`flex-1 py-3.5 rounded-full font-bold text-white text-base hover:scale-105 transition-transform shadow-lg ${isWin
                            ? "bg-gradient-to-r from-neon-cyan to-neon-magenta shadow-[0_0_25px_rgba(0,245,255,0.3)]"
                            : "bg-gradient-to-r from-orange-500 to-red-500 shadow-[0_0_25px_rgba(249,115,22,0.3)]"
                            }`}
                    >
                        {isWin
                            ? levelCompleted >= totalLevels
                                ? "🏆 Hoàn thành!"
                                : "Tiếp tục →"
                            : "🔄 Thử lại"
                        }
                    </motion.button>

                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.7 }}
                        onClick={onExit}
                        className="py-3.5 px-5 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors text-sm"
                    >
                        🗺 Về bản đồ
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
}
