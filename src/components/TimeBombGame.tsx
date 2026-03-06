"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import type { GameLevel } from "@/lib/services/db";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useGame } from "@/lib/game-context";

/* ─── Types ─── */
interface Props {
    levels: GameLevel[];
    onExit?: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete?: (finalScore: number, levelsCompleted: number) => void;
    onAnswered?: (questionId: string, isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
}

/* ─── Constants ─── */
const START_TIME = 15;         // seconds
const TIME_BONUS = 5;          // +5s on correct
const TIME_PENALTY = 3;        // -3s on wrong
const BASE_COSMO = 100;
const COMBO_MULTIPLIERS = [1, 1, 1.5, 2, 3, 5];

/* ─── Component ─── */
export default function TimeBombGame({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false,
}: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const { player, useAbilityCharge, addAbilityCharges } = useGame();
    const [gameState, setGameState] = useState<"ready" | "playing" | "gameOver" | "win">("ready");
    const [currentLevel, setCurrentLevel] = useState(0);
    const [questionIdx, setQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [bombTime, setBombTime] = useState(START_TIME);
    const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
    const [comboCount, setComboCount] = useState(0);
    const [shakeScreen, setShakeScreen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [shieldUsed, setShieldUsed] = useState(false);
    const [abilityNotice, setAbilityNotice] = useState<string | null>(null);
    const [hunterEliminated, setHunterEliminated] = useState<string | null>(null);
    const [timeDelta, setTimeDelta] = useState<{ value: number; id: number } | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const level = levels[currentLevel];
    const allQuestions = useMemo(() => levels.flatMap(l => l.questions), [levels]);
    const question = allQuestions[questionIdx];
    const totalQuestions = allQuestions.length;
    const progressPercent = totalQuestions > 0 ? (questionIdx / totalQuestions) * 100 : 0;

    // Memoize shuffled options — shuffle ONCE per question, not every render
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

    // Bomb urgency level
    const urgency = bombTime <= 3 ? "critical" : bombTime <= 7 ? "warning" : "safe";

    /* ─── Bomb countdown ─── */
    useEffect(() => {
        if (gameState !== "playing" || feedback) return;

        timerRef.current = setInterval(() => {
            setBombTime(prev => {
                const next = Math.round((prev - 0.1) * 10) / 10;
                if (next <= 0) {
                    // BOOM! Signal controller immediately
                    clearInterval(timerRef.current!);
                    stopBGM();
                    onGameComplete?.(score, 0); // 0 = lose
                    setGameState("gameOver");
                    return 0;
                }
                return next;
            });
        }, 100);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gameState, feedback, questionIdx]);

    /* ─── Hunter: eliminate one wrong ─── */
    useEffect(() => {
        if (playerClass !== "hunter" || !question || feedback) return;
        const wrongs = question.wrongWords;
        if (wrongs.length > 0) {
            setHunterEliminated(wrongs[Math.floor(Math.random() * wrongs.length)]);
        }
    }, [playerClass, questionIdx, question, feedback]);

    /* ─── Time penalty helper ─── */
    const applyTimePenalty = useCallback(() => {
        setBombTime(t => {
            const next = t - TIME_PENALTY;
            if (next <= 0) {
                setTimeout(() => {
                    stopBGM();
                    onGameComplete?.(score, 0);
                    setGameState("gameOver");
                }, 600);
                return 0;
            }
            return next;
        });
        setTimeDelta({ value: -TIME_PENALTY, id: Date.now() });
    }, [score, stopBGM, onGameComplete]);

    /* ─── Handle answer ─── */
    const handleAnswer = useCallback((answer: string) => {
        if (feedback) return;
        if (timerRef.current) clearInterval(timerRef.current);

        const isCorrect = answer === question?.correctWord;

        if (isCorrect) {
            playCorrect();
            setFeedback("correct");
            const combo = Math.min(comboCount, COMBO_MULTIPLIERS.length - 1);
            const xp = Math.round(BASE_COSMO * COMBO_MULTIPLIERS[combo]);
            setScore(s => s + xp);
            setComboCount(c => c + 1);
            if (comboCount + 1 === 3) addAbilityCharges(1); // Combo reward
            setTotalCorrect(c => c + 1);
            setBombTime(t => Math.min(t + TIME_BONUS, 30)); // Cap at 30s
            setTimeDelta({ value: TIME_BONUS, id: Date.now() });
            onAnswered?.(question?.id ?? "", true, level?.subject ?? "", question?.bloomLevel ?? 2);
        } else {
            playWrong();
            setFeedback("wrong");
            setComboCount(0);
            setShakeScreen(true);
            onAnswered?.(question?.id ?? "", false, level?.subject ?? "", question?.bloomLevel ?? 2);

            // Warrior shield — costs 1 ability charge
            if (playerClass === "warrior" && !shieldUsed) {
                const charged = useAbilityCharge();
                if (charged) {
                    setShieldUsed(true);
                    setAbilityNotice("🛡️ Bom không mất thời gian!");
                    setTimeDelta({ value: 0, id: Date.now() });
                    setTimeout(() => setAbilityNotice(null), 1500);
                } else {
                    applyTimePenalty();
                }
            } else if (playerClass !== "warrior") {
                applyTimePenalty();
            }
            setTimeout(() => setShakeScreen(false), 500);

            // Auto-advance (fast! This is supposed to be frantic)
            setTimeout(() => {
                const nextQ = questionIdx + 1;
                if (nextQ >= totalQuestions) {
                    stopBGM();
                    onGameComplete?.(score + (isCorrect ? BASE_COSMO : 0), levels.length);
                    setGameState("win");
                } else {
                    setQuestionIdx(nextQ);
                    setFeedback(null);
                    setHunterEliminated(null);
                    // Figure out which level this question belongs to
                    let cumulative = 0;
                    for (let i = 0; i < levels.length; i++) {
                        cumulative += levels[i].questions.length;
                        if (nextQ < cumulative) {
                            setCurrentLevel(i);
                            break;
                        }
                    }
                }
            }, 600); // FAST transition!
        }
    }, [feedback, question, comboCount, questionIdx, totalQuestions, score, levels, playerClass, shieldUsed, useAbilityCharge, applyTimePenalty]);

    /* ─── Start ─── */
    const startGame = () => {
        playBGM();
        setScore(0);
        setTotalCorrect(0);
        setComboCount(0);
        setShieldUsed(false);
        setQuestionIdx(0);
        setCurrentLevel(0);
        setBombTime(START_TIME + (playerClass === "wizard" && player.abilityCharges > 0 ? 5 : 0));
        // Wizard bonus consumes a charge
        if (playerClass === "wizard" && player.abilityCharges > 0) {
            useAbilityCharge();
        }
        setFeedback(null);
        setHunterEliminated(null);
        setGameState("playing");
    };

    /* ─── Fullscreen ─── */
    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const h = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", h);
        return () => document.removeEventListener("fullscreenchange", h);
    }, []);

    /* ─── Bomb bar width ─── */
    const bombPercent = Math.max(0, Math.min(100, (bombTime / 30) * 100));

    /* ─── Render ─── */
    return (
        <div ref={containerRef} className={`w-full max-w-4xl mx-auto flex flex-col gap-4 ${isFullscreen ? 'bg-slate-950 p-4 justify-center py-10 overflow-hidden h-screen overflow-y-auto' : ''}`}>

            {/* ─── BOMB BAR (the star of the show) ─── */}
            {gameState === "playing" && (
                <div className="relative">
                    <div className={`glass-card-strong !rounded-2xl px-4 py-3 ${isFullscreen ? 'max-w-[700px] mx-auto w-full' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <motion.span
                                    className="text-2xl"
                                    animate={urgency === "critical" ? {
                                        scale: [1, 1.3, 1],
                                        rotate: [0, -10, 10, -10, 0],
                                    } : urgency === "warning" ? {
                                        scale: [1, 1.1, 1],
                                    } : {}}
                                    transition={{ repeat: Infinity, duration: urgency === "critical" ? 0.4 : 0.8 }}
                                >
                                    💣
                                </motion.span>
                                <span className={`text-2xl font-mono font-black tabular-nums ${urgency === "critical" ? "text-red-400" :
                                    urgency === "warning" ? "text-orange-400" : "text-emerald-400"
                                    }`}>
                                    {bombTime.toFixed(1)}s
                                </span>
                                {/* Time delta popup */}
                                <AnimatePresence>
                                    {timeDelta && (
                                        <motion.span
                                            key={timeDelta.id}
                                            initial={{ opacity: 1, y: 0, scale: 1.2 }}
                                            animate={{ opacity: 0, y: -30 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.8 }}
                                            className={`text-lg font-black ${timeDelta.value > 0 ? "text-emerald-400" : timeDelta.value < 0 ? "text-red-400" : "text-neon-gold"}`}
                                        >
                                            {timeDelta.value > 0 ? `+${timeDelta.value}s` : timeDelta.value < 0 ? `${timeDelta.value}s` : "🛡️"}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex items-center gap-3">
                                {comboCount > 1 && (
                                    <motion.span key={comboCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="text-xs font-bold text-orange-400 bg-orange-400/10 px-2 py-1 rounded-full">
                                        🔥 x{comboCount}
                                    </motion.span>
                                )}
                                <span className="text-neon-cyan font-bold text-lg">{score}</span>
                                <span className="text-white/40 text-xs">✦</span>
                                {playerClass === "warrior" && !shieldUsed && player.abilityCharges > 0 && (
                                    <span className="text-lg animate-pulse">🛡️</span>
                                )}
                                <button onClick={toggleFullscreen}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
                                    {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Bomb fuse bar */}
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden relative">
                            <motion.div
                                className={`h-full rounded-full ${urgency === "critical" ? "bg-gradient-to-r from-red-600 to-red-400" :
                                    urgency === "warning" ? "bg-gradient-to-r from-orange-600 to-yellow-400" :
                                        "bg-gradient-to-r from-emerald-600 to-emerald-400"
                                    }`}
                                animate={{ width: `${bombPercent}%` }}
                                transition={{ duration: 0.1 }}
                            />
                            {/* Spark at the end of fuse */}
                            {urgency !== "critical" && (
                                <motion.div
                                    className="absolute top-0 h-full w-2 bg-white rounded-full"
                                    style={{ left: `${bombPercent}%` }}
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 0.3 }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Ability notice */}
                    <AnimatePresence>
                        {abilityNotice && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="absolute -bottom-8 left-1/2 -translate-x-1/2 z-30 glass-card !px-4 !py-2 !rounded-xl text-sm font-bold text-neon-gold whitespace-nowrap">
                                {abilityNotice}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Progress */}
            {gameState === "playing" && (
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        animate={{ width: `${progressPercent}%` }} transition={{ duration: 0.2 }} />
                </div>
            )}

            {/* ─── MAIN GAME AREA ─── */}
            <motion.div
                animate={shakeScreen ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className={`relative rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex flex-col ${isFullscreen ? 'max-w-[800px] w-full mx-auto flex-1 my-2 min-h-[400px]' : 'min-h-[400px] sm:min-h-[450px]'}`}
                style={{ filter: calmMode ? 'saturate(0.3)' : 'none' }}
            >
                {/* Background pulses with urgency */}
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div
                        className={`absolute inset-0 ${urgency === "critical" ? "bg-red-900/20" : urgency === "warning" ? "bg-orange-900/10" : ""}`}
                        animate={urgency === "critical" ? { opacity: [0.1, 0.3, 0.1] } : {}}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                    />
                    <div className="absolute top-10 left-10 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-red-500/5 rounded-full blur-3xl" />
                </div>

                {/* Question */}
                {gameState === "playing" && question && (
                    <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-5">
                        {/* Question counter */}
                        <div className="flex items-center gap-2 text-white/30 text-xs">
                            <span>Câu {questionIdx + 1}/{totalQuestions}</span>
                            <span>·</span>
                            <span>✅ {totalCorrect}</span>
                        </div>

                        {/* Question text */}
                        <motion.p
                            key={questionIdx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-xl sm:text-2xl font-bold text-white text-center font-[var(--font-heading)] max-w-lg leading-relaxed"
                        >
                            {question.question}
                        </motion.p>

                        {/* Answer buttons - 2x2 grid */}
                        <motion.div
                            key={`opts-${questionIdx}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="grid grid-cols-2 gap-3 w-full max-w-md"
                        >
                            {shuffledOptions.map((opt) => {
                                if (hunterEliminated === opt) return null;
                                const isCorrectOpt = feedback && opt === question.correctWord;

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
                                                    : "border-white/10 bg-white/5 text-white hover:border-orange-400/40 hover:bg-orange-400/10 hover:shadow-[0_0_15px_rgba(251,146,60,0.2)]"
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

                {/* Feedback flash */}
                <AnimatePresence>
                    {feedback === "correct" && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                            <div className="text-center">
                                <div className="text-4xl">⚡</div>
                                <p className="text-emerald-400 font-bold text-sm">+{TIME_BONUS}s</p>
                            </div>
                        </motion.div>
                    )}
                    {feedback === "wrong" && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute top-8 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                            <div className="text-center">
                                <div className="text-4xl">💥</div>
                                <p className="text-red-400 font-bold text-sm">-{TIME_PENALTY}s</p>
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
                                className="text-6xl"
                                animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                💣
                            </motion.div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
                                Bom Hẹn Giờ
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Trả lời đúng <span className="text-emerald-400 font-bold">+{TIME_BONUS}s</span> ·
                                Trả lời sai <span className="text-red-400 font-bold">-{TIME_PENALTY}s</span><br />
                                Hết giờ = 💥 BOM NỔ!
                            </p>
                            {playerClass && (
                                <div className="glass-card !p-3 !rounded-xl text-center border border-neon-gold/20">
                                    <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt</p>
                                    <p className="text-sm font-bold text-neon-gold">
                                        {playerClass === "warrior" && `🛡️ Bom không mất thời gian 1 lần (⚡${player.abilityCharges})`}
                                        {playerClass === "wizard" && `⏳ Bắt đầu với thêm 5 giây (⚡${player.abilityCharges})`}
                                        {playerClass === "hunter" && "🎯 Loại 1 đáp án sai mỗi câu"}
                                    </p>
                                </div>
                            )}
                            <button onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-[0_0_25px_rgba(249,115,22,0.5)]">
                                KÍCH HOẠT BOM 💣
                            </button>
                        </motion.div>
                    )}

                    {gameState === "gameOver" && (
                        <motion.div key="gameOver" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <motion.div className="text-7xl" initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }}
                                transition={{ type: "spring", duration: 0.6 }}>
                                💥
                            </motion.div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-red-400">BOM NỔ!</h2>
                            <div className="text-center space-y-1">
                                <p className="text-white/60">Đúng: <span className="text-emerald-400 font-bold">{totalCorrect}</span> câu</p>
                                <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} ✦</span></p>
                                {comboCount > 2 && <p className="text-orange-400 text-sm">🔥 Combo cao nhất: x{comboCount}</p>}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:scale-105 transition-transform">
                                    Thử lại 💣
                                </button>
                                {onExit && (
                                    <button onClick={() => { onGameComplete?.(score, currentLevel); onExit(); }} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors">
                                        Về bản đồ 🗺
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "win" && (
                        <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl animate-float">🏆</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">Rỡ bom thành công!</h2>
                            <div className="text-center space-y-1">
                                <p className="text-neon-gold text-xl font-bold">{score} XP ⭐</p>
                                <p className="text-white/50 text-sm">Đúng {totalCorrect}/{totalQuestions} · Còn {bombTime.toFixed(1)}s</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:scale-105 transition-transform">
                                    Chơi lại 🔄
                                </button>
                                {onExit && (
                                    <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors">
                                        Về bản đồ 🗺
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between glass-card !rounded-xl px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-white/40">
                    {level && (
                        <>
                            <span>💣 {level.planet}</span>
                            <span>·</span>
                            <span>📚 {level.subject}</span>
                        </>
                    )}
                </div>
                {onExit && (
                    <button onClick={onExit} className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors">
                        ← Thoát
                    </button>
                )}
            </div>
        </div>
    );
}
