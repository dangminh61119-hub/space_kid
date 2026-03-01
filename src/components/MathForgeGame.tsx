"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

/* ─── Types ─── */
interface MathQuestion {
    equation: string;
    answer: number;
    options: number[];
}

interface MathLevel {
    level: number;
    planet: string;
    subject: string;
    title: string;
    timePerQuestion: number;
    questions: MathQuestion[];
}

interface Props {
    levels: MathLevel[];
    onExit?: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete?: (finalScore: number, levelsCompleted: number) => void;
    onAnswered?: (isCorrect: boolean, subject: string, bloomLevel: number) => void;
}

/* ─── Constants ─── */
const MAX_HP = 3;

/* ─── Component ─── */
export default function MathForgeGame({ levels, onExit, playerClass, onGameComplete, onAnswered }: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const [gameState, setGameState] = useState<"ready" | "playing" | "levelComplete" | "gameOver" | "win">("ready");
    const [currentLevel, setCurrentLevel] = useState(0);
    const [questionIdx, setQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [timeLeft, setTimeLeft] = useState(15);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
    const [droppedAnswer, setDroppedAnswer] = useState<number | null>(null);
    const [comboCount, setComboCount] = useState(0);
    const [shakeWrong, setShakeWrong] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [shieldUsed, setShieldUsed] = useState(false);
    const [abilityNotice, setAbilityNotice] = useState<string | null>(null);
    const [hunterEliminated, setHunterEliminated] = useState<number | null>(null);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const level = levels[currentLevel];
    const question = level?.questions[questionIdx];
    const progressPercent = level ? ((questionIdx) / level.questions.length) * 100 : 0;

    /* ─── Timer ─── */
    useEffect(() => {
        if (gameState !== "playing" || feedback) return;

        const t = (level?.timePerQuestion ?? 15) + (playerClass === "wizard" ? 5 : 0);
        setTimeLeft(t);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up — wrong answer
                    handleAnswer(-1);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, questionIdx, currentLevel, feedback]);

    /* ─── Hunter ability: eliminate one wrong option per question ─── */
    useEffect(() => {
        if (playerClass !== "hunter" || !question || feedback) return;
        const wrongOptions = question.options.filter(o => o !== question.answer);
        if (wrongOptions.length > 0) {
            const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            setHunterEliminated(randomWrong);
        }
    }, [playerClass, questionIdx, currentLevel, question, feedback]);

    /* ─── Handle answer ─── */
    const handleAnswer = useCallback((value: number) => {
        if (feedback) return;
        if (timerRef.current) clearInterval(timerRef.current);

        const isCorrect = value === question?.answer;
        setSelectedAnswer(value);

        if (isCorrect) {
            playCorrect();
            setFeedback("correct");
            const comboBonus = Math.min(comboCount, 5) * 10;
            setScore(s => s + 100 + comboBonus);
            setComboCount(c => c + 1);
            setDroppedAnswer(value);
            // Record mastery (bloom=2 for Apply-level math; exact bloom would come from question record)
            onAnswered?.(true, level?.subject ?? "", 2);
        } else {
            playWrong();
            setFeedback("wrong");
            setComboCount(0);
            setShakeWrong(true);
            onAnswered?.(false, level?.subject ?? "", 2);

            // Warrior shield: absorb first wrong
            if (playerClass === "warrior" && !shieldUsed) {
                setShieldUsed(true);
                setAbilityNotice("🛡️ Lá chắn thép đã bảo vệ bạn!");
                setTimeout(() => setAbilityNotice(null), 2000);
                // Don't lose HP
            } else {
                setHp(prev => {
                    const newHp = prev - 1;
                    if (newHp <= 0) {
                        setTimeout(() => {
                            stopBGM();
                            onGameComplete?.(score, currentLevel);
                            setGameState("gameOver");
                        }, 800);
                    }
                    return newHp;
                });
            }
            setTimeout(() => setShakeWrong(false), 500);
        }

        // Advance after delay
        setTimeout(() => {
            if (!isCorrect && hp <= 1 && !(playerClass === "warrior" && !shieldUsed)) return; // game over handled above

            const nextQ = questionIdx + 1;
            if (nextQ >= (level?.questions.length ?? 0)) {
                if (currentLevel + 1 >= levels.length) {
                    stopBGM();
                    onGameComplete?.(score + (isCorrect ? 100 : 0), currentLevel + 1);
                    setGameState("win");
                } else {
                    setGameState("levelComplete");
                }
            } else {
                setQuestionIdx(nextQ);
                setFeedback(null);
                setSelectedAnswer(null);
                setDroppedAnswer(null);
                setHunterEliminated(null);
            }
        }, 1200);
    }, [feedback, question, comboCount, questionIdx, level, currentLevel, levels.length, hp]);

    /* ─── Start helpers ─── */
    const startGame = () => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setComboCount(0);
        setShieldUsed(false);
        setHunterEliminated(null);
        startLevel(0);
    };

    const startLevel = (lvlIdx: number) => {
        setCurrentLevel(lvlIdx);
        setQuestionIdx(0);
        setFeedback(null);
        setSelectedAnswer(null);
        setDroppedAnswer(null);
        setShieldUsed(false);  // Warrior shield resets every level
        setGameState("playing");
    };

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
        } catch (err) {
            console.error("Error toggling fullscreen", err);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    /* ─── Drag handler ─── */
    const handleDragEnd = (value: number, info: { point: { x: number; y: number } }) => {
        if (!dropZoneRef.current || feedback) return;
        const rect = dropZoneRef.current.getBoundingClientRect();
        const { x, y } = info.point;

        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            handleAnswer(value);
        }
    };

    /* ─── Render equation with blank ─── */
    const renderEquation = () => {
        if (!question) return null;
        const parts = question.equation.split("_");

        return (
            <div className="flex items-center justify-center gap-2 flex-wrap">
                {parts.map((part, i) => (
                    <span key={i} className="flex items-center gap-2">
                        <span className="text-3xl sm:text-5xl font-bold text-white font-[var(--font-heading)] tracking-wider">
                            {part}
                        </span>
                        {i < parts.length - 1 && (
                            <div
                                ref={i === 0 ? dropZoneRef : undefined}
                                className={`
                                    w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-dashed
                                    flex items-center justify-center transition-all duration-300
                                    ${feedback === "correct" && droppedAnswer !== null
                                        ? "border-green-400 bg-green-400/20 shadow-[0_0_30px_rgba(74,222,128,0.3)]"
                                        : feedback === "wrong"
                                            ? "border-red-400 bg-red-400/20"
                                            : "border-neon-gold/50 bg-neon-gold/5 shadow-[0_0_20px_rgba(255,224,102,0.1)]"
                                    }
                                `}
                            >
                                <AnimatePresence>
                                    {droppedAnswer !== null && (
                                        <motion.span
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            className={`text-3xl sm:text-4xl font-bold ${feedback === "correct" ? "text-green-400" : "text-red-400"
                                                }`}
                                        >
                                            {droppedAnswer}
                                        </motion.span>
                                    )}
                                    {droppedAnswer === null && (
                                        <motion.span
                                            animate={{ opacity: [0.3, 0.7, 0.3] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="text-neon-gold/40 text-2xl"
                                        >
                                            ?
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </span>
                ))}
            </div>
        );
    };

    /* ─── Render ─── */
    return (
        <div ref={containerRef} className={`w-full max-w-4xl mx-auto flex flex-col gap-4 ${isFullscreen ? 'bg-slate-950 p-4 justify-center py-10 overflow-hidden h-screen overflow-y-auto' : ''}`}>
            {/* HUD */}
            <div className={`flex items-center justify-between gap-3 glass-card-strong !rounded-2xl px-4 py-3 ${isFullscreen ? 'max-w-[700px] mx-auto w-full shrink-0' : ''}`}>
                {/* HP */}
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className={`text-xl transition-all ${i < hp ? "opacity-100 scale-100" : "opacity-20 scale-75"}`}>
                            ❤️
                        </span>
                    ))}
                    {/* Warrior shield indicator */}
                    {playerClass === "warrior" && !shieldUsed && (
                        <span className="text-xl ml-1 animate-pulse" title="Lá chắn thép – miễn 1 lần sai">🛡️</span>
                    )}
                </div>

                {/* Ability notice overlay */}
                <AnimatePresence>
                    {abilityNotice && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 glass-card !px-4 !py-2 !rounded-xl text-sm font-bold text-neon-gold whitespace-nowrap"
                        >
                            {abilityNotice}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Timer */}
                {gameState === "playing" && (
                    <div className="flex items-center gap-2">
                        <div className={`text-sm font-bold font-mono ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-white/70"}`}>
                            ⏱ {timeLeft}s
                        </div>
                    </div>
                )}

                {/* Score + Combo + Fullscreen */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        {comboCount > 1 && (
                            <motion.span
                                key={comboCount}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="text-xs font-bold text-neon-orange bg-neon-orange/10 px-2 py-1 rounded-full"
                            >
                                🔥 x{comboCount}
                            </motion.span>
                        )}
                        <span className="text-neon-cyan font-bold text-lg">{score}</span>
                        <span className="text-white/40 text-xs">XP</span>
                    </div>
                    {gameState === "playing" && (
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                        >
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            {gameState === "playing" && level && (
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-neon-gold to-neon-orange rounded-full"
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            )}

            {/* Main game area */}
            <div className={`relative rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex flex-col ${isFullscreen ? 'max-w-[800px] w-full mx-auto flex-1 my-4 min-h-[500px]' : 'min-h-[450px] sm:min-h-[500px]'}`}>
                {/* Background decorations */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-neon-gold/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-neon-orange/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neon-gold/3 rounded-full blur-[80px]" />
                </div>

                {/* Anvil icon & level label */}
                {gameState === "playing" && (
                    <div className="relative z-10 text-center pt-6 pb-2">
                        <span className="text-3xl">⚒️</span>
                        <p className="text-xs text-white/30 mt-1 uppercase tracking-widest">Lò Rèn Vũ Trụ</p>
                    </div>
                )}

                {/* Equation area */}
                {gameState === "playing" && question && (
                    <motion.div
                        key={`q-${questionIdx}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={shakeWrong ? { opacity: 1, y: 0, x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
                        transition={shakeWrong ? { duration: 0.5 } : { duration: 0.4 }}
                        className="relative z-10 flex-1 flex items-center justify-center px-4"
                    >
                        {renderEquation()}
                    </motion.div>
                )}

                {/* Draggable options */}
                {gameState === "playing" && question && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10 flex items-center justify-center gap-4 sm:gap-6 pb-8 pt-4 px-4 flex-wrap"
                    >
                        {question.options.map((opt, i) => {
                            // Hunter ability: skip the eliminated option
                            if (hunterEliminated === opt) return null;
                            const isSelected = selectedAnswer === opt;
                            const isCorrectOpt = feedback && opt === question.answer;
                            const isWrongSelected = feedback === "wrong" && isSelected;

                            return (
                                <motion.div
                                    key={`${questionIdx}-${opt}-${i}`}
                                    drag={!feedback}
                                    dragSnapToOrigin
                                    dragElastic={0.6}
                                    onDragEnd={(_, info) => handleDragEnd(opt, info)}
                                    onClick={() => !feedback && handleAnswer(opt)}
                                    whileHover={!feedback ? { scale: 1.1, y: -5 } : {}}
                                    whileTap={!feedback ? { scale: 0.95 } : {}}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{
                                        opacity: feedback && !isCorrectOpt && !isWrongSelected ? 0.3 : 1,
                                        y: 0,
                                        scale: isCorrectOpt ? 1.15 : 1,
                                    }}
                                    transition={{ delay: i * 0.08, duration: 0.3 }}
                                    className={`
                                        w-16 h-16 sm:w-20 sm:h-20 rounded-2xl cursor-grab active:cursor-grabbing
                                        flex items-center justify-center text-2xl sm:text-3xl font-bold
                                        select-none transition-shadow duration-300
                                        ${isCorrectOpt
                                            ? "bg-green-500/20 border-2 border-green-400 text-green-400 shadow-[0_0_25px_rgba(74,222,128,0.4)]"
                                            : isWrongSelected
                                                ? "bg-red-500/20 border-2 border-red-400 text-red-400 shadow-[0_0_25px_rgba(248,113,113,0.4)]"
                                                : "glass-card-strong text-white hover:shadow-[0_0_20px_rgba(255,224,102,0.3)] border border-white/10"
                                        }
                                    `}
                                >
                                    {opt}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}

                {/* Instruction text */}
                {gameState === "playing" && !feedback && (
                    <p className="relative z-10 text-center text-white/30 text-xs pb-4">
                        Kéo số vào ô trống hoặc nhấn để chọn ✨
                    </p>
                )}

                {/* Feedback overlay */}
                <AnimatePresence>
                    {feedback === "correct" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-1/4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                        >
                            <div className="text-center">
                                <div className="text-5xl mb-2">✨</div>
                                <p className="text-green-400 font-bold text-xl">Đúng rồi!</p>
                                <p className="text-neon-gold text-sm font-bold">+100 XP</p>
                            </div>
                        </motion.div>
                    )}
                    {feedback === "wrong" && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute top-1/4 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
                        >
                            <div className="text-center">
                                <div className="text-5xl mb-2">💪</div>
                                <p className="text-neon-orange font-bold text-xl">Gần đúng rồi!</p>
                                <p className="text-white/40 text-sm">Đáp án: <span className="text-neon-cyan font-bold">{question?.answer}</span></p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── OVERLAYS ─── */}
                <AnimatePresence>
                    {gameState === "ready" && (
                        <motion.div
                            key="ready"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-6 z-20"
                        >
                            <div className="text-6xl animate-float">⚔️</div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text">
                                Lò Rèn Vũ Trụ
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Kéo thả số vào ô trống để hoàn thành phương trình!<br />
                                Rèn vũ khí <span className="text-neon-gold font-bold">tri thức</span> cho đội vũ trụ! ⚡
                            </p>
                            {/* Class ability intro */}
                            {playerClass && (
                                <div className="glass-card !p-3 !rounded-xl text-center border border-neon-gold/20">
                                    <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt của bạn</p>
                                    <p className="text-sm font-bold text-neon-gold">
                                        {playerClass === "warrior" && "🛡️ Lá Chắn Thép — Miễn 1 lần sai mỗi level"}
                                        {playerClass === "wizard" && "⏳ Ngưng Đọng Thời Gian — +5 giây mỗi câu"}
                                        {playerClass === "hunter" && "🎯 Mắt Đại Bàng — Loại 1 đáp án sai mỗi câu"}
                                    </p>
                                </div>
                            )}
                            {level && (
                                <div className="glass-card !p-3 !rounded-xl text-center">
                                    <p className="text-xs text-white/50">Level {level.level} · {level.planet}</p>
                                    <p className="text-sm font-bold text-white">{level.title}</p>
                                </div>
                            )}
                            <button
                                onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-neon-gold to-neon-orange text-white font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-[0_0_25px_rgba(255,224,102,0.4)]"
                            >
                                BẮT ĐẦU RÈN ⚒️
                            </button>
                        </motion.div>
                    )}

                    {gameState === "levelComplete" && (
                        <motion.div
                            key="levelComplete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20"
                        >
                            <div className="text-6xl">🎉</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">
                                Level {levels[currentLevel]?.level} Hoàn thành!
                            </h2>
                            <p className="text-neon-gold text-lg font-bold">+{score} XP</p>
                            <button
                                onClick={() => startLevel(currentLevel + 1)}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-neon-gold to-neon-orange text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_25px_rgba(255,224,102,0.4)]"
                            >
                                Level tiếp theo →
                            </button>
                        </motion.div>
                    )}

                    {gameState === "gameOver" && (
                        <motion.div
                            key="gameOver"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20"
                        >
                            <div className="text-6xl">💥</div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-red-400">Lò rèn quá tải!</h2>
                            <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} XP</span></p>
                            <div className="flex gap-3">
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-neon-gold to-neon-orange text-white font-bold hover:scale-105 transition-transform"
                                >
                                    Rèn lại 🔄
                                </button>
                                {onExit && (
                                    <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10 transition-colors">
                                        Thoát
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "win" && (
                        <motion.div
                            key="win"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20"
                        >
                            <div className="text-6xl animate-float">🏆</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">Rèn hoàn hảo!</h2>
                            <p className="text-neon-gold text-xl font-bold">Tổng: {score} XP ⭐</p>
                            <p className="text-white/50 text-sm">Hoàn thành tất cả {levels.length} levels!</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-neon-gold to-neon-orange text-white font-bold hover:scale-105 transition-transform"
                                >
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
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-between glass-card !rounded-xl px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-white/40">
                    {level && (
                        <>
                            <span>⚔️ {level.planet}</span>
                            <span>·</span>
                            <span>🔢 {level.subject}</span>
                            <span>·</span>
                            <span>Level {level.level}/{levels.length}</span>
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
