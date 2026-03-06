"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
// useMemo kept for shuffledOptions below
import { motion, AnimatePresence } from "framer-motion";
import type { GameLevel } from "@/lib/services/db";
import { useSoundEffects } from "@/hooks/useSoundEffects";

/* ─── Types ─── */
interface Props {
    levels: GameLevel[];
    onExit?: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete?: (finalScore: number, levelsCompleted: number) => void;
    onAnswered?: (questionId: string, isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
    paused?: boolean;
}

/* ─── Constants ─── */
const BASE_COSMO = 150;               // Higher reward for boss
const BOSS_HP_PER_QUESTION = 100;      // Boss loses 100 HP per correct answer
const TIME_PER_QUESTION = 20;          // Seconds per question (decreases as boss gets weaker)
const COMBO_BONUS = [1, 1, 1.5, 2, 3]; // Combo multiplier

/* ─── Boss Characters ─── */
const BOSSES = [
    { name: "Rồng Mây", emoji: "🐉", color: "#FF6B6B" },
    { name: "Thần Sấm", emoji: "⚡", color: "#FFD93D" },
    { name: "Hắc Tinh", emoji: "🌑", color: "#A855F7" },
    { name: "Phượng Hoàng", emoji: "🔥", color: "#F97316" },
];

/* ─── Component ─── */
export default function BossBattle({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false, paused = false,
}: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();

    const allQuestions = useMemo(() => levels.flatMap(l => l.questions), [levels]);
    const totalQuestions = allQuestions.length;
    const bossMaxHP = totalQuestions * BOSS_HP_PER_QUESTION;
    const bossRef = useRef(BOSSES[Math.floor(Math.random() * BOSSES.length)]);
    const boss = bossRef.current;

    const [gameState, setGameState] = useState<"ready" | "playing" | "win" | "lose">("ready");
    const [questionIdx, setQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [bossHP, setBossHP] = useState(bossMaxHP);
    const [playerHP, setPlayerHP] = useState(3); // 3 lives
    const [combo, setCombo] = useState(0);
    const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
    const [shakeScreen, setShakeScreen] = useState(false);
    const [timer, setTimer] = useState(TIME_PER_QUESTION);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const level = levels[0];

    const question = allQuestions[questionIdx];
    const bossHPPercent = Math.max(0, (bossHP / bossMaxHP) * 100);

    // Shuffle options per question
    const shuffledOptions = useMemo(() => {
        if (!question) return [];
        const opts = new Set<string>();
        opts.add(question.correctWord);
        for (const w of question.wrongWords) {
            if (opts.size >= 4) break;
            opts.add(w);
        }
        return Array.from(opts).sort(() => Math.random() - 0.5);
    }, [questionIdx, question?.correctWord]);

    // Use a ref to always call the latest handleTimeout without stale closures
    const handleTimeoutRef = useRef<() => void>(() => { });
    const advanceQuestionRef = useRef<() => void>(() => { });

    // Timer countdown
    useEffect(() => {
        if (gameState !== "playing" || feedback || paused) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 0.1) {
                    clearInterval(timerRef.current!);
                    // Time out = wrong answer
                    handleTimeoutRef.current();
                    return 0;
                }
                return Math.round((prev - 0.1) * 10) / 10;
            });
        }, 100);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, feedback, questionIdx, paused]);

    const handleTimeout = useCallback(() => {
        setFeedback("wrong");
        setCombo(0);
        setPlayerHP(prev => {
            const next = prev - 1;
            if (next <= 0) {
                setTimeout(() => {
                    stopBGM();
                    onGameComplete?.(score, 0);
                    setGameState("lose");
                }, 800);
            }
            return next;
        });
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 500);
        onAnswered?.(question?.id ?? "", false, level?.subject ?? "", question?.bloomLevel ?? 2);

        setTimeout(() => advanceQuestionRef.current(), 800);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [question, questionIdx, score, level]);

    // Keep refs in sync with the latest callback version
    useEffect(() => { handleTimeoutRef.current = handleTimeout; }, [handleTimeout]);


    /* ─── Handle answer ─── */
    const handleAnswer = useCallback((answer: string) => {
        if (feedback) return;
        if (timerRef.current) clearInterval(timerRef.current);

        const isCorrect = answer === question?.correctWord;

        if (isCorrect) {
            playCorrect();
            setFeedback("correct");
            const mult = COMBO_BONUS[Math.min(combo, COMBO_BONUS.length - 1)];
            const pts = Math.round(BASE_COSMO * mult);
            setScore(s => s + pts);
            setCombo(c => c + 1);
            setBossHP(hp => Math.max(0, hp - BOSS_HP_PER_QUESTION));
            onAnswered?.(question?.id ?? "", true, level?.subject ?? "", question?.bloomLevel ?? 2);
        } else {
            playWrong();
            setFeedback("wrong");
            setCombo(0);
            setShakeScreen(true);
            setTimeout(() => setShakeScreen(false), 500);
            setPlayerHP(prev => {
                const next = prev - 1;
                if (next <= 0) {
                    setTimeout(() => {
                        stopBGM();
                        onGameComplete?.(score, 0);
                        setGameState("lose");
                    }, 800);
                }
                return next;
            });
            onAnswered?.(question?.id ?? "", false, level?.subject ?? "", question?.bloomLevel ?? 2);
        }

        setTimeout(() => advanceQuestionRef.current(), 800);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [feedback, question, combo, questionIdx, score, level, playerHP]);

    const advanceQuestion = useCallback(() => {
        const nextQ = questionIdx + 1;
        if (nextQ >= totalQuestions || bossHP <= BOSS_HP_PER_QUESTION) {
            // Boss defeated or all questions done
            stopBGM();
            const finalScore = score + (bossHP <= BOSS_HP_PER_QUESTION ? 200 : 0); // Bonus for killing boss
            onGameComplete?.(finalScore, levels.length);
            setGameState("win");
        } else {
            setQuestionIdx(nextQ);
            setFeedback(null);
            // Progressive time pressure: timer decreases as boss gets weaker
            const timeScale = Math.max(0.5, bossHP / bossMaxHP);
            setTimer(Math.max(8, Math.round(TIME_PER_QUESTION * timeScale)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questionIdx, totalQuestions, bossHP, bossMaxHP, score, levels.length, stopBGM, onGameComplete]);

    // Keep advanceQuestion ref in sync
    useEffect(() => { advanceQuestionRef.current = advanceQuestion; }, [advanceQuestion]);

    const startGame = () => {
        playBGM();
        setScore(0);
        setCombo(0);
        setPlayerHP(3 + (playerClass === "warrior" ? 1 : 0)); // Warrior gets +1 life
        setBossHP(bossMaxHP);
        setQuestionIdx(0);
        setFeedback(null);
        setTimer(TIME_PER_QUESTION + (playerClass === "wizard" ? 5 : 0));
        setGameState("playing");
    };

    /* ─── Render ─── */
    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
            {/* Boss HP Bar */}
            {gameState === "playing" && (
                <div className="glass-card-strong !rounded-2xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <motion.span
                                className="text-3xl"
                                animate={bossHPPercent < 30 ? {
                                    scale: [1, 1.2, 1],
                                    rotate: [0, -5, 5, 0],
                                } : {}}
                                transition={{ repeat: Infinity, duration: 0.8 }}
                            >
                                {boss.emoji}
                            </motion.span>
                            <div>
                                <p className="text-sm font-bold text-white">{boss.name}</p>
                                <p className="text-[10px] text-white/40">HP: {bossHP}/{bossMaxHP}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {combo > 1 && (
                                <motion.span key={combo} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                    className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                                    🔥 x{combo}
                                </motion.span>
                            )}
                            <span className="text-neon-cyan font-bold">{score}</span>
                            <span className="text-white/40 text-xs">✦</span>
                        </div>
                    </div>

                    {/* Boss HP bar */}
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${boss.color}80, ${boss.color})` }}
                            animate={{ width: `${bossHPPercent}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Player lives + timer */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: 3 + (playerClass === "warrior" ? 1 : 0) }).map((_, i) => (
                                <span key={i} className={`text-lg ${i < playerHP ? "" : "grayscale opacity-30"}`}>
                                    {i < playerHP ? "❤️" : "🖤"}
                                </span>
                            ))}
                        </div>
                        <div className={`text-sm font-mono font-bold ${timer <= 5 ? "text-red-400" : timer <= 10 ? "text-orange-400" : "text-emerald-400"}`}>
                            ⏱ {timer.toFixed(1)}s
                        </div>
                    </div>
                </div>
            )}

            {/* Question area */}
            <motion.div
                animate={shakeScreen ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex flex-col min-h-[400px] sm:min-h-[450px]"
                style={{ filter: calmMode ? "saturate(0.3)" : "none" }}
            >
                {/* Dark bg effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-purple-900/10" />
                    <motion.div
                        className="absolute top-1/4 left-1/3 w-48 h-48 rounded-full blur-[80px]"
                        style={{ background: `${boss.color}15` }}
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                    />
                </div>

                {/* Question display */}
                {gameState === "playing" && question && (
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-5">
                        <div className="flex items-center gap-2 text-white/30 text-xs">
                            <span>Câu {questionIdx + 1}/{totalQuestions}</span>
                        </div>

                        <motion.p
                            key={questionIdx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-xl sm:text-2xl font-bold text-white text-center font-[var(--font-heading)] max-w-lg leading-relaxed"
                        >
                            {question.question}
                        </motion.p>

                        <motion.div
                            key={`opts-${questionIdx}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="grid grid-cols-2 gap-3 w-full max-w-md"
                        >
                            {shuffledOptions.map((opt) => {
                                const isCorrectOpt = feedback && opt === question.correctWord;
                                const isWrongSelected = feedback === "wrong" && opt !== question.correctWord;

                                return (
                                    <motion.button
                                        key={`${questionIdx}-${opt}`}
                                        onClick={() => !feedback && handleAnswer(opt)}
                                        disabled={!!feedback}
                                        whileHover={!feedback ? { scale: 1.05 } : {}}
                                        whileTap={!feedback ? { scale: 0.95 } : {}}
                                        className={`
                                            py-4 px-4 rounded-xl font-bold text-base
                                            transition-all duration-200 border-2 text-center
                                            ${isCorrectOpt
                                                ? "border-emerald-400 bg-emerald-400/20 text-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.4)] scale-105"
                                                : feedback && !isCorrectOpt
                                                    ? "border-white/5 bg-white/3 text-white/20"
                                                    : `border-white/10 bg-white/5 text-white hover:border-red-400/40 hover:bg-red-400/10`
                                            }
                                        `}
                                    >
                                        {opt}
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    </div>
                )}

                {/* Feedback overlay */}
                <AnimatePresence>
                    {feedback === "correct" && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                            <div className="text-center">
                                <div className="text-4xl">⚔️</div>
                                <p className="text-emerald-400 font-bold text-sm">-{BOSS_HP_PER_QUESTION} HP!</p>
                            </div>
                        </motion.div>
                    )}
                    {feedback === "wrong" && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                            <div className="text-center">
                                <div className="text-4xl">💔</div>
                                <p className="text-red-400 font-bold text-sm">-1 ❤️</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── OVERLAYS ─── */}
                <AnimatePresence>
                    {gameState === "ready" && (
                        <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <motion.div
                                className="text-7xl"
                                animate={{ scale: [1, 1.15, 1], y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                {boss.emoji}
                            </motion.div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-purple-400">
                                BOSS: {boss.name}
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Trả lời đúng để <span className="text-red-400 font-bold">gây sát thương</span> cho Boss!<br />
                                Trả lời sai sẽ <span className="text-red-400 font-bold">mất ❤️</span>. Hết trái tim = thua!
                            </p>
                            {playerClass && (
                                <div className="glass-card !p-3 !rounded-xl text-center border border-neon-gold/20">
                                    <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt</p>
                                    <p className="text-sm font-bold text-neon-gold">
                                        {playerClass === "warrior" && "🛡️ +1 trái tim bổ sung"}
                                        {playerClass === "wizard" && "⏳ +5 giây mỗi câu hỏi"}
                                        {playerClass === "hunter" && "🎯 Gây x1.5 sát thương"}
                                    </p>
                                </div>
                            )}
                            <button onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-red-500 to-purple-600 text-white font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-[0_0_25px_rgba(239,68,68,0.5)]">
                                ⚔️ CHIẾN ĐẤU!
                            </button>
                        </motion.div>
                    )}

                    {gameState === "lose" && (
                        <motion.div key="lose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-7xl">💀</div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-red-400">Thất bại...</h2>
                            <div className="text-center space-y-1">
                                <p className="text-white/60">Boss còn <span className="text-red-400 font-bold">{bossHP} HP</span></p>
                                <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} ✦</span></p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-red-500 to-purple-600 text-white font-bold hover:scale-105 transition-transform">
                                    Thử lại ⚔️
                                </button>
                                {onExit && (
                                    <button onClick={() => { onGameComplete?.(score, 0); onExit(); }}
                                        className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors">
                                        Về bản đồ 🗺
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "win" && (
                        <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-7xl animate-float">🏆</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">Boss đã bị đánh bại!</h2>
                            <div className="text-center space-y-1">
                                <p className="text-neon-gold text-xl font-bold">{score} ✦ ⭐</p>
                                <p className="text-white/50 text-sm">❤️ Còn lại: {playerHP} trái tim</p>
                            </div>
                            <div className="flex gap-3">
                                {onExit && (
                                    <button onClick={onExit}
                                        className="px-6 py-3 rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-bold hover:scale-105 transition-transform shadow-[0_0_25px_rgba(0,245,255,0.3)]">
                                        Tiếp tục →
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Bottom info */}
            <div className="flex items-center justify-between glass-card !rounded-xl px-4 py-2">
                <div className="text-xs text-white/40">
                    ⚔️ Boss Battle · {level?.subject ?? ""}
                </div>
                {onExit && gameState === "playing" && (
                    <button onClick={onExit} className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors">
                        ← Thoát
                    </button>
                )}
            </div>
        </div>
    );
}
