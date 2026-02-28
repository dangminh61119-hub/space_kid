"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import StarField from "@/components/StarField";
import NeonButton from "@/components/NeonButton";
import GlassCard from "@/components/GlassCard";
import { useGame } from "@/lib/game-context";
import { useAuth, markOnboardingCompleted } from "@/lib/auth-context";

const mascots = [
    { id: "cat", emoji: "🐱", name: "Mèo Sao Băng", desc: "Nhanh nhẹn, thông minh, thích khám phá!" },
    { id: "dog", emoji: "🐶", name: "Cún Tinh Vân", desc: "Dũng cảm, trung thành, kiên trì!" },
];

const classes = [
    {
        id: "warrior",
        name: "Chiến binh Sao Băng",
        icon: "⚔️",
        power: "Lá chắn thép",
        desc: "Sai 1 lần không mất máu!",
        color: "#00F5FF",
    },
    {
        id: "wizard",
        name: "Phù thủy Tinh Vân",
        icon: "✨",
        power: "Ngưng đọng thời gian",
        desc: "Thêm thời gian suy nghĩ!",
        color: "#FF6BFF",
    },
    {
        id: "hunter",
        name: "Thợ săn Ngân Hà",
        icon: "🎯",
        power: "Mắt đại bàng",
        desc: "Loại bỏ 1 đáp án sai!",
        color: "#FFE066",
    },
];

// Removed "quiz" step – Smart Survey now handles grade assessment
const steps = ["welcome", "mascot", "class", "ready"] as const;
type Step = (typeof steps)[number];

export default function OnboardingPage() {
    const router = useRouter();
    const { updatePlayer } = useGame();
    const { playerDbId, surveyCompleted, onboardingComplete } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>("welcome");
    const [mascot, setMascot] = useState<string | null>(null);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);

    // Redirect if already completed onboarding
    useEffect(() => {
        if (onboardingComplete) {
            router.push("/portal");
        }
    }, [onboardingComplete, router]);

    // Redirect if survey not completed yet
    useEffect(() => {
        if (!surveyCompleted) {
            router.push("/survey");
        }
    }, [surveyCompleted, router]);

    const stepIndex = steps.indexOf(currentStep);

    const nextStep = () => {
        const next = steps[stepIndex + 1];
        if (next) setCurrentStep(next);
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-20">
            <StarField count={60} />

            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10">
                <motion.div
                    className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta"
                    animate={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            <div className="relative z-10 w-full max-w-2xl">
                <AnimatePresence mode="wait">
                    {/* STEP: Welcome */}
                    {currentStep === "welcome" && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center"
                        >
                            <div className="text-7xl mb-6 animate-float">🦉</div>
                            <h1 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text mb-4">
                                Chuẩn bị Phiêu lưu!
                            </h1>
                            <GlassCard glow="cyan" className="mb-8">
                                <p className="text-white/80 text-lg leading-relaxed">
                                    <span className="text-neon-gold font-bold">Chỉ huy Cú Mèo</span> đã hiểu rõ
                                    năng lực của em từ bài khảo sát! Giờ hãy chọn
                                    <span className="text-neon-cyan font-bold"> bạn đồng hành</span> và
                                    <span className="text-neon-magenta font-bold"> lớp nhân vật</span> để
                                    bắt đầu chinh phục vũ trụ tri thức!
                                </p>
                            </GlassCard>
                            <NeonButton variant="cyan" size="lg" onClick={nextStep}>
                                Bắt đầu! 🚀
                            </NeonButton>
                        </motion.div>
                    )}

                    {/* STEP: Mascot */}
                    {currentStep === "mascot" && (
                        <motion.div
                            key="mascot"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center"
                        >
                            <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] neon-text mb-3">
                                Chọn bạn đồng hành!
                            </h2>
                            <p className="text-white/60 mb-8">Bạn đồng hành sẽ cùng em khám phá vũ trụ</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                {mascots.map((m) => (
                                    <button key={m.id} onClick={() => setMascot(m.id)}>
                                        <GlassCard
                                            glow={m.id === "cat" ? "magenta" : "cyan"}
                                            className={`text-center cursor-pointer transition-all ${mascot === m.id
                                                ? "ring-2 ring-neon-cyan scale-105"
                                                : "hover:scale-[1.02]"
                                                }`}
                                        >
                                            <div className="text-6xl mb-3">{m.emoji}</div>
                                            <h3 className="text-lg font-bold text-white mb-1">{m.name}</h3>
                                            <p className="text-white/60 text-sm">{m.desc}</p>
                                        </GlassCard>
                                    </button>
                                ))}
                            </div>
                            {mascot && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <NeonButton variant="cyan" onClick={nextStep}>
                                        Tiếp tục →
                                    </NeonButton>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP: Class Selection */}
                    {currentStep === "class" && (
                        <motion.div
                            key="class"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center"
                        >
                            <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] neon-text mb-3">
                                Chọn Lớp Nhân Vật!
                            </h2>
                            <p className="text-white/50 mb-8 text-sm">
                                Mỗi lớp có năng lực đặc biệt riêng!
                            </p>

                            <div className="grid grid-cols-1 gap-4 mb-8">
                                {classes.map((cls) => (
                                    <button key={cls.id} onClick={() => setSelectedClass(cls.id)}>
                                        <GlassCard
                                            className={`cursor-pointer text-left flex items-center gap-4 transition-all ${selectedClass === cls.id
                                                ? "ring-2 scale-[1.02]"
                                                : "hover:scale-[1.01]"
                                                }`}
                                            glow="none"
                                        >
                                            <div
                                                className="text-4xl w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: `${cls.color}15`, border: `1px solid ${cls.color}40` }}
                                            >
                                                {cls.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white" style={{ color: cls.color }}>
                                                    {cls.name}
                                                </h3>
                                                <p className="text-white/60 text-sm">
                                                    <span className="font-semibold">{cls.power}</span> – {cls.desc}
                                                </p>
                                            </div>
                                        </GlassCard>
                                    </button>
                                ))}
                            </div>

                            {selectedClass && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <NeonButton variant="magenta" size="lg" onClick={nextStep}>
                                        Xác nhận & Phóng tàu! 🚀
                                    </NeonButton>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* STEP: Ready / Launch */}
                    {currentStep === "ready" && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ y: 0 }}
                                animate={{ y: [-10, 0, -10] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="text-8xl mb-6"
                            >
                                🚀
                            </motion.div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text mb-4">
                                Tàu đã sẵn sàng!
                            </h2>
                            <p className="text-white/70 text-lg mb-2">
                                Bạn đồng hành: {mascots.find((m) => m.id === mascot)?.emoji}{" "}
                                {mascots.find((m) => m.id === mascot)?.name}
                            </p>
                            <p className="text-white/70 text-lg mb-8">
                                Lớp: {classes.find((c) => c.id === selectedClass)?.icon}{" "}
                                {classes.find((c) => c.id === selectedClass)?.name}
                            </p>
                            <NeonButton
                                variant="cyan"
                                size="lg"
                                onClick={async () => {
                                    updatePlayer({
                                        mascot: mascot as "cat" | "dog",
                                        playerClass: selectedClass as "warrior" | "wizard" | "hunter",
                                        onboardingComplete: true,
                                    });
                                    if (playerDbId) {
                                        await markOnboardingCompleted(playerDbId);
                                    }
                                    router.push("/portal");
                                }}
                            >
                                Khám phá Vũ trụ! 🌌
                            </NeonButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
