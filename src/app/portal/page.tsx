"use client";

import { motion } from "framer-motion";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import PlanetIcon from "@/components/PlanetIcon";
import NeonButton from "@/components/NeonButton";
import { mockPlanets, mockStudent, mockDailyQuest } from "@/lib/mock-data";
import Link from "next/link";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
    }),
};

export default function PortalPage() {
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
                                <div className="text-5xl mb-2">{mockStudent.avatar}</div>
                                <h3 className="text-lg font-bold text-white">{mockStudent.name}</h3>
                                <p className="text-white/50 text-sm">{mockStudent.class}</p>
                            </div>

                            <div className="space-y-3">
                                {/* Level */}
                                <div>
                                    <div className="flex justify-between text-xs text-white/60 mb-1">
                                        <span>Level {mockStudent.level}</span>
                                        <span>{mockStudent.xp} / {mockStudent.xpToNext} XP</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full transition-all"
                                            style={{ width: `${(mockStudent.xp / mockStudent.xpToNext) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div className="glass-card !p-3 text-center !rounded-xl">
                                        <div className="text-xl font-bold text-neon-gold">{mockStudent.streak}🔥</div>
                                        <div className="text-[10px] text-white/50">STREAK</div>
                                    </div>
                                    <div className="glass-card !p-3 text-center !rounded-xl">
                                        <div className="text-xl font-bold text-neon-cyan">{mockStudent.planetsCompleted}/{mockStudent.totalPlanets}</div>
                                        <div className="text-[10px] text-white/50">HÀNH TINH</div>
                                    </div>
                                </div>

                                {/* Grade */}
                                <div className="text-center pt-2">
                                    <span className="text-xs text-white/40">Lớp {mockStudent.grade} · Cấp {mockStudent.level}</span>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {mockPlanets.map((planet, i) => (
                                <motion.div
                                    key={planet.id}
                                    custom={i}
                                    variants={fadeUp}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    <Link href="/portal/play">
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
                                                    {/* Progress */}
                                                    <div>
                                                        <div className="flex justify-between text-[10px] text-white/50 mb-1">
                                                            <span>{planet.completedLevels}/{planet.totalLevels} cấp</span>
                                                            <span>{planet.progress}%</span>
                                                        </div>
                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all"
                                                                style={{
                                                                    width: `${planet.progress}%`,
                                                                    background: `linear-gradient(90deg, ${planet.color1}, ${planet.color2})`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
