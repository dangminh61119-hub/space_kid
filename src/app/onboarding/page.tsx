"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import StarField from "@/components/StarField";
import NeonButton from "@/components/NeonButton";
import GlassCard from "@/components/GlassCard";
import { mockOnboardingQuestions } from "@/lib/mock-data";
import { useGame } from "@/lib/game-context";

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

const steps = ["welcome", "mascot", "quiz", "class", "ready"] as const;
type Step = (typeof steps)[number];

export default function OnboardingPage() {
    const router = useRouter();
    const { updatePlayer } = useGame();
    const [currentStep, setCurrentStep] = useState<Step>("welcome");
    const [mascot, setMascot] = useState<string | null>(null);
    const [selectedClass, setSelectedClass] = useState<string | null>(null);
    const [quizIndex, setQuizIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState<number | null>(null);

    const stepIndex = steps.indexOf(currentStep);

    const nextStep = () => {
        const next = steps[stepIndex + 1];
        if (next) setCurrentStep(next);
    };

    const handleQuizAnswer = (optionIndex: number) => {
        if (answered !== null) return;
        setAnswered(optionIndex);
        if (optionIndex === mockOnboardingQuestions[quizIndex].correct) {
            setScore((s) => s + 1);
        }
        setTimeout(() => {
            setAnswered(null);
            if (quizIndex < mockOnboardingQuestions.length - 1) {
                setQuizIndex((i) => i + 1);
            } else {
                nextStep();
            }
        }, 1000);
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
                                Chào mừng Tân binh!
                            </h1>
                            <GlassCard glow="cyan" className="mb-8">
                                <p className="text-white/80 text-lg leading-relaxed">
                                    Ta là <span className="text-neon-gold font-bold">Chỉ huy Trưởng Cú Mèo</span>!
                                    Vũ trụ Tri thức đang bị Băng đảng Lười Biếng xâm chiếm!
                                    Ta cần em giúp thu thập các <span className="text-neon-cyan font-bold">Mảnh ghép Mosaic</span> để
                                    thắp sáng lại các hành tinh. Sẵn sàng chưa?
                                </p>
                            </GlassCard>
                            <NeonButton variant="cyan" size="lg" onClick={nextStep}>
                                Sẵn sàng! 🚀
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

                    {/* STEP: Quiz */}
                    {currentStep === "quiz" && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center"
                        >
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="text-3xl">🚀</span>
                                <h2 className="text-xl sm:text-2xl font-bold font-[var(--font-heading)] neon-text">
                                    Khởi động Tàu Vũ trụ!
                                </h2>
                            </div>
                            <p className="text-white/50 mb-6 text-sm">
                                Câu {quizIndex + 1} / {mockOnboardingQuestions.length}
                            </p>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={quizIndex}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                >
                                    <GlassCard glow="gold" className="mb-6">
                                        <p className="text-white text-lg font-semibold">
                                            {mockOnboardingQuestions[quizIndex].question}
                                        </p>
                                    </GlassCard>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {mockOnboardingQuestions[quizIndex].options.map((opt, i) => {
                                            const isCorrect = i === mockOnboardingQuestions[quizIndex].correct;
                                            const isSelected = answered === i;
                                            let bg = "glass-card hover:border-white/30";
                                            if (answered !== null) {
                                                if (isCorrect) bg = "bg-green-500/20 border border-green-400";
                                                else if (isSelected) bg = "bg-red-500/20 border border-red-400";
                                            }
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleQuizAnswer(i)}
                                                    className={`${bg} p-4 rounded-xl text-white text-left transition-all ${answered === null ? "cursor-pointer hover:scale-[1.02]" : ""
                                                        }`}
                                                    disabled={answered !== null}
                                                >
                                                    <span className="text-white/50 text-sm mr-2">{String.fromCharCode(65 + i)}.</span>
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Progress dots */}
                            <div className="flex justify-center gap-2 mt-6">
                                {mockOnboardingQuestions.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2.5 h-2.5 rounded-full transition-all ${i === quizIndex
                                            ? "bg-neon-gold scale-125"
                                            : i < quizIndex
                                                ? "bg-neon-green"
                                                : "bg-white/20"
                                            }`}
                                    />
                                ))}
                            </div>
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
                                Kết quả khởi động: {score}/{mockOnboardingQuestions.length} ⭐ – Mỗi lớp có năng lực đặc biệt!
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
                                onClick={() => {
                                    updatePlayer({
                                        mascot: mascot as "cat" | "dog",
                                        playerClass: selectedClass as "warrior" | "wizard" | "hunter",
                                        onboardingComplete: true,
                                        onboardingQuizScore: score,
                                    });
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
