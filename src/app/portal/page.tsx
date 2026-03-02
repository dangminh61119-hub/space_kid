"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import PlanetIcon from "@/components/PlanetIcon";
import NeonButton from "@/components/NeonButton";
import { mockDailyQuest } from "@/lib/mock-data";
import { useGame, MASCOT_INFO, CLASS_ABILITIES } from "@/lib/game-context";
import { getPlanetList, type Planet } from "@/lib/db";
import Link from "next/link";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
    }),
};

/* ─── Game type info: icon, label, how-to-play ─── */
const GAME_HOW_TO_PLAY: Record<string, { icon: string; label: string; howTo: string }> = {
    shooter: {
        icon: "🚀",
        label: "Bắn Từ Không Gian",
        howTo: "Di chuyển tàu bằng chuột, nhấn để bắn vào từ ĐÚNG!",
    },
    math: {
        icon: "⚒️",
        label: "Lò Rèn Vũ Trụ",
        howTo: "Kéo thả số vào ô trống hoặc nhấn để chọn đáp án đúng!",
    },
    "star-hunter": {
        icon: "⭐",
        label: "Săn Sao Vũ Trụ",
        howTo: "Nhấn vào ngôi sao chứa đáp án đúng trước khi hết giờ!",
    },
};

/* ─── Route helper: planet.gameType → play URL ─── */
function playUrl(planet: Planet): string {
    switch (planet.gameType) {
        case "math": return `/portal/play/math?planet=${planet.id}`;
        case "star-hunter": return `/portal/play/star?planet=${planet.id}`;
        default: return `/portal/play?planet=${planet.id}`;     // shooter
    }
}

export default function PortalPage() {
    const { player } = useGame();
    const [planets, setPlanets] = useState<Planet[]>([]);
    const [loading, setLoading] = useState(true);

    /* ── Fetch planet list from Supabase (or mock fallback) ── */
    useEffect(() => {
        getPlanetList()
            .then((data) => setPlanets(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    /* ── Filter planets by player grade ── */
    const availablePlanets = planets.filter(
        (p) => player.grade >= p.gradeRange[0] && player.grade <= p.gradeRange[1]
    );
    const lockedPlanets = planets.filter(
        (p) => player.grade < p.gradeRange[0] || player.grade > p.gradeRange[1]
    );

    const mascotEmoji = player.mascot ? MASCOT_INFO[player.mascot].emoji : "🚀";
    const classInfo = player.playerClass ? CLASS_ABILITIES[player.playerClass] : null;
    const planetsCompleted = Object.values(player.planetsProgress).filter(
        p => p.completedLevels >= p.totalLevels
    ).length;
    const totalPlanets = planets.length || Object.keys(player.planetsProgress).length;

    return (
        <div className="min-h-screen relative">
            <StarField count={70} />
            <Navbar />

            <div className="relative z-10 pt-20 pb-10">
                {/* Daily Quest Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-6xl mx-auto px-4 mb-8"
                >
                    <div className="glass-card-strong p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-l-4" style={{ borderLeftColor: "var(--neon-gold)" }}>
                        <div className="text-4xl animate-glow-pulse">⚠️</div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs uppercase tracking-wider text-neon-gold font-bold">Nhiệm vụ Khẩn cấp!</span>
                                <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{mockDailyQuest.timeLeft}</span>
                            </div>
                            <h3 className="text-white font-bold text-lg">{mockDailyQuest.title}</h3>
                            <p className="text-white/60 text-sm">{mockDailyQuest.description}</p>
                            <p className="text-neon-gold text-xs mt-1">🎁 {mockDailyQuest.reward}</p>
                        </div>
                        <NeonButton variant="gold" size="sm" href="/portal/play">
                            Tham gia!
                        </NeonButton>
                    </div>
                </motion.div>

                <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
                    {/* Player Stats Sidebar */}
                    <motion.aside
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:w-72 shrink-0"
                    >
                        <GlassCard glow="magenta" className="lg:sticky lg:top-24">
                            <div className="text-center mb-4">
                                <div className="text-5xl mb-2">{mascotEmoji}</div>
                                <h3 className="text-lg font-bold text-white">{player.name}</h3>
                                <p className="text-white/50 text-sm">
                                    {player.playerClass === "warrior" && "Chiến binh Sao Băng"}
                                    {player.playerClass === "wizard" && "Phù thủy Tinh Vân"}
                                    {player.playerClass === "hunter" && "Thợ săn Ngân Hà"}
                                    {!player.playerClass && "Tân Binh"}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* Level */}
                                <div>
                                    <div className="flex justify-between text-xs text-white/60 mb-1">
                                        <span>Level {player.level}</span>
                                        <span>{player.xp} / {player.xpToNext} XP</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full transition-all"
                                            style={{ width: `${(player.xp / player.xpToNext) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div className="glass-card !p-3 text-center !rounded-xl">
                                        <div className="text-xl font-bold text-neon-gold">{player.streak}🔥</div>
                                        <div className="text-[10px] text-white/50">STREAK</div>
                                    </div>
                                    <div className="glass-card !p-3 text-center !rounded-xl">
                                        <div className="text-xl font-bold text-neon-cyan">{planetsCompleted}/{totalPlanets}</div>
                                        <div className="text-[10px] text-white/50">HÀNH TINH</div>
                                    </div>
                                </div>

                                {/* Class Ability */}
                                {classInfo && (
                                    <div className="glass-card !p-3 !rounded-xl mt-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg">{classInfo.icon}</span>
                                            <span className="text-xs font-bold text-neon-gold">{classInfo.name}</span>
                                        </div>
                                        <p className="text-[10px] text-white/40">{classInfo.description}</p>
                                    </div>
                                )}

                                {/* Grade */}
                                <div className="text-center pt-2">
                                    <span className="text-xs text-white/40">Lớp {player.grade} · Cấp {player.level}</span>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.aside>

                    {/* Planet Map */}
                    <main className="flex-1">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] neon-text mb-6"
                        >
                            Bản đồ Vũ trụ 🌌
                        </motion.h1>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center space-y-3">
                                    <div className="text-4xl" style={{ animation: "spin 1.5s linear infinite" }}>🪐</div>
                                    <p className="text-white/50 text-sm">Đang tải bản đồ vũ trụ...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {availablePlanets.map((planet, i) => (
                                        <motion.div
                                            key={planet.id}
                                            custom={i}
                                            variants={fadeUp}
                                            initial="hidden"
                                            animate="visible"
                                        >
                                            <Link href={playUrl(planet)}>
                                                <GlassCard
                                                    glow="none"
                                                    className="planet-card cursor-pointer group relative overflow-hidden"
                                                >
                                                    {/* Glow background */}
                                                    <div
                                                        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-2xl"
                                                        style={{
                                                            background: `radial-gradient(circle at center, ${planet.color1}, transparent 70%)`,
                                                        }}
                                                    />

                                                    <div className="relative flex items-start gap-4">
                                                        <div className="shrink-0 animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                                                            <PlanetIcon
                                                                color1={planet.color1}
                                                                color2={planet.color2}
                                                                ringColor={planet.ringColor}
                                                                size={70}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="text-lg">{planet.emoji}</span>
                                                                <h3 className="text-base font-bold text-white truncate">{planet.name}</h3>
                                                            </div>
                                                            <p className="text-white/50 text-xs mb-2">{planet.description}</p>
                                                            <div className="flex flex-wrap gap-1 mb-3">
                                                                {planet.subjects.map((s) => (
                                                                    <span
                                                                        key={s}
                                                                        className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60"
                                                                    >
                                                                        {s}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            {/* Cách chơi */}
                                                            {(() => {
                                                                const info = GAME_HOW_TO_PLAY[planet.gameType];
                                                                if (!info) return null;
                                                                return (
                                                                    <div
                                                                        className="flex items-start gap-2 mb-3 p-2 rounded-xl border border-white/5"
                                                                        style={{ background: `linear-gradient(135deg, ${planet.color1}10, ${planet.color2}08)` }}
                                                                    >
                                                                        <span className="text-base shrink-0">{info.icon}</span>
                                                                        <div className="min-w-0">
                                                                            <div className="text-[10px] font-bold text-white/70 uppercase tracking-wider">{info.label}</div>
                                                                            <p className="text-[10px] text-white/40 leading-tight">{info.howTo}</p>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                            {/* Progress */}
                                                            {(() => {
                                                                const pp = player.planetsProgress[planet.id];
                                                                const completed = pp?.completedLevels ?? 0;
                                                                const total = pp?.totalLevels ?? planet.totalLevels;
                                                                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                                                                return (
                                                                    <div>
                                                                        <div className="flex justify-between text-[10px] text-white/50 mb-1">
                                                                            <span>{completed}/{total} cấp</span>
                                                                            <span>{progress}%</span>
                                                                        </div>
                                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                            <div
                                                                                className="h-full rounded-full transition-all"
                                                                                style={{
                                                                                    width: `${progress}%`,
                                                                                    background: `linear-gradient(90deg, ${planet.color1}, ${planet.color2})`,
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                </GlassCard>
                                            </Link>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Locked planets */}
                                {lockedPlanets.length > 0 && (
                                    <div className="mt-8">
                                        <h2 className="text-lg font-bold text-white/40 mb-4 flex items-center gap-2">
                                            🔒 Hành tinh chưa mở khóa
                                        </h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            {lockedPlanets.map((planet, i) => (
                                                <motion.div
                                                    key={planet.id}
                                                    custom={i + availablePlanets.length}
                                                    variants={fadeUp}
                                                    initial="hidden"
                                                    animate="visible"
                                                >
                                                    <GlassCard
                                                        glow="none"
                                                        className="relative overflow-hidden opacity-50 cursor-not-allowed"
                                                    >
                                                        <div className="flex items-start gap-4">
                                                            <div className="shrink-0">
                                                                <PlanetIcon
                                                                    color1={planet.color1}
                                                                    color2={planet.color2}
                                                                    ringColor={planet.ringColor}
                                                                    size={60}
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-lg">{planet.emoji}</span>
                                                                    <h3 className="text-base font-bold text-white/60 truncate">{planet.name}</h3>
                                                                    <span className="text-xs">🔒</span>
                                                                </div>
                                                                <p className="text-white/30 text-xs">
                                                                    Dành cho lớp {planet.gradeRange[0]}–{planet.gradeRange[1]}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </GlassCard>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

