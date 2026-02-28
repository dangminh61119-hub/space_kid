"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import StarField from "@/components/StarField";
import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";
import { useGame } from "@/lib/game-context";
import { useAuth, markSurveyCompleted } from "@/lib/auth-context";
import {
    type SurveyResponse,
    getNextSubject,
    getNextQuestion,
    isSurveyComplete,
    calculateSurveyResults,
    getTotalSurveyQuestions,
    type SurveyResult,
} from "@/lib/survey-engine";
import { SUBJECT_EMOJIS, SURVEY_SUBJECTS } from "@/lib/survey-questions";

type SurveyStep = "intro" | "questioning" | "results";

export default function SurveyPage() {
    const router = useRouter();
    const { updatePlayer } = useGame();
    const { playerDbId, profileCompleted, surveyCompleted, setSurveyDone } = useAuth();

    const [step, setStep] = useState<SurveyStep>("intro");
    const [responses, setResponses] = useState<SurveyResponse[]>([]);
    const [currentSubject, setCurrentSubject] = useState<string | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<ReturnType<typeof getNextQuestion>>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [results, setResults] = useState<SurveyResult | null>(null);

    // Redirect if profile not completed yet
    useEffect(() => {
        if (!profileCompleted) {
            router.push("/profile");
        }
    }, [profileCompleted, router]);

    // Redirect if already completed survey
    useEffect(() => {
        if (surveyCompleted) {
            router.push("/onboarding");
        }
    }, [surveyCompleted, router]);

    const totalQuestions = getTotalSurveyQuestions();
    const answeredCount = responses.length;

    // Load next question
    const loadNextQuestion = useCallback((currentResponses: SurveyResponse[]) => {
        const nextSubject = getNextSubject(currentResponses);
        if (!nextSubject) {
            // Survey complete!
            const surveyResults = calculateSurveyResults(currentResponses);
            setResults(surveyResults);
            setStep("results");
            return;
        }
        setCurrentSubject(nextSubject);
        const question = getNextQuestion(nextSubject, currentResponses);
        setCurrentQuestion(question);
    }, []);

    const startSurvey = () => {
        setStep("questioning");
        loadNextQuestion([]);
    };

    const handleAnswer = (optionIndex: number) => {
        if (selectedAnswer !== null || !currentQuestion) return;

        setSelectedAnswer(optionIndex);
        setShowFeedback(true);

        const isCorrect = optionIndex === currentQuestion.correctAnswer;

        const newResponse: SurveyResponse = {
            questionId: currentQuestion.id,
            subject: currentQuestion.subject,
            difficulty: currentQuestion.difficulty,
            selectedAnswer: optionIndex,
            isCorrect,
        };

        const newResponses = [...responses, newResponse];

        setTimeout(() => {
            setResponses(newResponses);
            setSelectedAnswer(null);
            setShowFeedback(false);

            if (isSurveyComplete(newResponses)) {
                const surveyResults = calculateSurveyResults(newResponses);
                setResults(surveyResults);
                setStep("results");
            } else {
                loadNextQuestion(newResponses);
            }
        }, 1200);
    };

    const handleComplete = async () => {
        if (!results) return;

        // Build proficiency record for GameContext
        const proficiency: Record<string, { estimatedGrade: number; masteryScore: number; level: string }> = {};
        for (const p of results.proficiencies) {
            proficiency[p.subject] = {
                estimatedGrade: p.estimatedGrade,
                masteryScore: p.masteryScore,
                level: p.level,
            };
        }

        // Update GameContext
        updatePlayer({
            grade: results.estimatedGrade,
            onboardingQuizScore: results.totalCorrect,
            // We store proficiency-related info too
        });

        // Mark survey completed in DB
        if (playerDbId) {
            await markSurveyCompleted(playerDbId, results.estimatedGrade);
        }

        // Update auth context state so redirect logic works
        setSurveyDone();

        router.push("/onboarding");
    };

    // Get completed subjects for progress display
    const getSubjectProgress = (subject: string) => {
        const count = responses.filter(r => r.subject === subject).length;
        return count >= 3 ? "done" : count > 0 ? "active" : "pending";
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-20">
            <StarField count={60} />

            {/* Progress bar */}
            <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/10">
                <motion.div
                    className="h-full bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-gold"
                    animate={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            <div className="relative z-10 w-full max-w-2xl">
                <AnimatePresence mode="wait">
                    {/* ─── INTRO ─── */}
                    {step === "intro" && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center"
                        >
                            <div className="text-7xl mb-6 animate-float">🦉</div>
                            <h1 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text mb-4">
                                Khám Phá Năng Lực!
                            </h1>
                            <GlassCard glow="cyan" className="mb-6">
                                <p className="text-white/80 text-lg leading-relaxed">
                                    Chào <span className="text-neon-gold font-bold">Tân Binh</span>!
                                    Ta là <span className="text-neon-cyan font-bold">Chỉ huy Cú Mèo</span> 🦉.
                                    Trước khi khám phá vũ trụ, ta cần kiểm tra năng lực của em
                                    để chuẩn bị những thử thách phù hợp nhất!
                                </p>
                            </GlassCard>

                            <GlassCard glow="none" className="mb-8">
                                <div className="flex flex-wrap justify-center gap-3">
                                    {SURVEY_SUBJECTS.map((s) => (
                                        <div
                                            key={s}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                                        >
                                            <span>{SUBJECT_EMOJIS[s]}</span>
                                            <span className="text-white/70 text-sm">{s}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-white/40 text-sm mt-3">
                                    {totalQuestions} câu hỏi · ~3 phút
                                </p>
                            </GlassCard>

                            <NeonButton variant="cyan" size="lg" onClick={startSurvey}>
                                Bắt đầu Khảo sát! 🚀
                            </NeonButton>
                        </motion.div>
                    )}

                    {/* ─── QUESTIONING ─── */}
                    {step === "questioning" && currentQuestion && (
                        <motion.div
                            key="questioning"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="text-center"
                        >
                            {/* Subject progress pills */}
                            <div className="flex flex-wrap justify-center gap-2 mb-4">
                                {SURVEY_SUBJECTS.map((s) => {
                                    const status = getSubjectProgress(s);
                                    return (
                                        <div
                                            key={s}
                                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all ${status === "done"
                                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                                : s === currentSubject
                                                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 scale-110"
                                                    : "bg-white/5 text-white/40 border border-white/10"
                                                }`}
                                        >
                                            <span>{SUBJECT_EMOJIS[s]}</span>
                                            <span>{s}</span>
                                            {status === "done" && <span>✓</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            <p className="text-white/50 mb-4 text-sm">
                                Câu {answeredCount + 1} / {totalQuestions} · {currentSubject}
                            </p>

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentQuestion.id}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -50 }}
                                >
                                    <GlassCard glow="gold" className="mb-6">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <span className="text-2xl">{SUBJECT_EMOJIS[currentQuestion.subject]}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${currentQuestion.difficulty === "easy"
                                                ? "bg-green-500/20 text-green-400"
                                                : currentQuestion.difficulty === "medium"
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-red-500/20 text-red-400"
                                                }`}>
                                                {currentQuestion.difficulty === "easy" ? "Cơ bản" : currentQuestion.difficulty === "medium" ? "Trung bình" : "Nâng cao"}
                                            </span>
                                        </div>
                                        <p className="text-white text-lg font-semibold">
                                            {currentQuestion.question}
                                        </p>
                                    </GlassCard>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {currentQuestion.options.map((opt, i) => {
                                            const isCorrect = i === currentQuestion.correctAnswer;
                                            const isSelected = selectedAnswer === i;
                                            let bg = "glass-card hover:border-white/30";
                                            if (showFeedback) {
                                                if (isCorrect) bg = "bg-green-500/20 border border-green-400";
                                                else if (isSelected) bg = "bg-red-500/20 border border-red-400";
                                            }
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAnswer(i)}
                                                    className={`${bg} p-4 rounded-xl text-white text-left transition-all ${selectedAnswer === null ? "cursor-pointer hover:scale-[1.02]" : ""
                                                        }`}
                                                    disabled={selectedAnswer !== null}
                                                >
                                                    <span className="text-white/50 text-sm mr-2">
                                                        {String.fromCharCode(65 + i)}.
                                                    </span>
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Progress dots */}
                            <div className="flex justify-center gap-1.5 mt-6">
                                {Array.from({ length: totalQuestions }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-2 h-2 rounded-full transition-all ${i < answeredCount
                                            ? responses[i]?.isCorrect
                                                ? "bg-neon-green"
                                                : "bg-red-400"
                                            : i === answeredCount
                                                ? "bg-neon-gold scale-125"
                                                : "bg-white/20"
                                            }`}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ─── RESULTS ─── */}
                    {step === "results" && results && (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div className="text-6xl mb-4 animate-float">🦉✨</div>
                            <h2 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] neon-text mb-2">
                                Phân Tích Hoàn Tất!
                            </h2>
                            <p className="text-white/60 mb-6">
                                Kết quả: {results.totalCorrect}/{results.totalQuestions} câu đúng
                            </p>

                            {/* Overall grade */}
                            <GlassCard glow="gold" className="mb-6">
                                <div className="text-center">
                                    <p className="text-white/60 text-sm mb-1">Trình độ ước tính</p>
                                    <p className="text-4xl font-bold text-neon-gold">
                                        Lớp {results.estimatedGrade}
                                    </p>
                                </div>
                            </GlassCard>

                            {/* Per-subject breakdown */}
                            <div className="grid grid-cols-1 gap-3 mb-8">
                                {results.proficiencies.map((p) => (
                                    <GlassCard key={p.subject} glow="none" className="!p-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{SUBJECT_EMOJIS[p.subject]}</span>
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-white text-sm font-medium">{p.subject}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.level === "advanced"
                                                        ? "bg-green-500/20 text-green-400"
                                                        : p.level === "intermediate"
                                                            ? "bg-yellow-500/20 text-yellow-400"
                                                            : "bg-red-500/20 text-red-400"
                                                        }`}>
                                                        {p.level === "advanced" ? "Giỏi" : p.level === "intermediate" ? "Khá" : "Cần cải thiện"}
                                                    </span>
                                                </div>
                                                {/* Mastery bar */}
                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className={`h-full rounded-full ${p.masteryScore >= 70
                                                            ? "bg-gradient-to-r from-green-400 to-emerald-500"
                                                            : p.masteryScore >= 40
                                                                ? "bg-gradient-to-r from-yellow-400 to-amber-500"
                                                                : "bg-gradient-to-r from-red-400 to-orange-500"
                                                            }`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${p.masteryScore}%` }}
                                                        transition={{ delay: 0.3, duration: 0.8 }}
                                                    />
                                                </div>
                                                <p className="text-white/40 text-xs mt-1">
                                                    {p.correctCount}/{p.totalCount} đúng · Lớp {p.estimatedGrade}
                                                </p>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                            </div>

                            <GlassCard glow="cyan" className="mb-6">
                                <p className="text-white/80 text-sm leading-relaxed">
                                    🦉 <span className="text-neon-cyan font-bold">Chỉ huy Cú Mèo</span>:
                                    &ldquo;Tuyệt vời! Ta đã hiểu rõ năng lực của em.
                                    Giờ hãy chọn bạn đồng hành và lớp nhân vật để bắt đầu phiêu lưu!&rdquo;
                                </p>
                            </GlassCard>

                            <NeonButton variant="cyan" size="lg" onClick={handleComplete}>
                                Tiếp tục chọn Nhân vật! 🚀
                            </NeonButton>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
