"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useGame } from "@/lib/game-context";
import MascotAbilityButton from "@/components/MascotAbilityButton";

/* ─── Types ─── */
export interface CraftQuestion {
    questionText: string;
    correctWord: string;
    acceptAnswers: string[];    // fuzzy-match list
    bloomLevel?: number;
}

export interface CraftLevel {
    level: number;
    planet: string;
    subject: string;
    title: string;
    timePerQuestion: number;
    questions: CraftQuestion[];
}

interface Props {
    levels: CraftLevel[];
    onExit?: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete?: (finalScore: number, levelsCompleted: number) => void;
    onAnswered?: (questionId: string, isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
}

/* ─── Constants ─── */
const MAX_HP = 3;
const BASE_TIME = 30;

/* ─── Fuzzy match helper ─── */
function normalise(s: string): string {
    return s
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")   // strip diacritics
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/[^a-z0-9\s]/gi, "");
}

function isMatch(input: string, acceptAnswers: string[]): boolean {
    const norm = normalise(input);
    if (!norm) return false;
    return acceptAnswers.some(a => {
        const na = normalise(a);
        return na === norm || norm.includes(na) || na.includes(norm);
    });
}

/* ─── Component ─── */
export default function WordCraftGame({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false,
}: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const { player, useAbilityCharge, addAbilityCharges } = useGame();
    const useAbilityChargeRef = useRef(useAbilityCharge);
    useEffect(() => { useAbilityChargeRef.current = useAbilityCharge; }, [useAbilityCharge]);
    const [gameState, setGameState] = useState<"ready" | "playing" | "levelComplete" | "gameOver" | "win">("ready");
    const [currentLevel, setCurrentLevel] = useState(0);
    const [questionIdx, setQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [timeLeft, setTimeLeft] = useState(BASE_TIME);
    const [userInput, setUserInput] = useState("");
    const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
    const [comboCount, setComboCount] = useState(0);
    const [shakeWrong, setShakeWrong] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [shieldUsed, setShieldUsed] = useState(false);
    const [abilityNotice, setAbilityNotice] = useState<string | null>(null);
    const [hintVisible, setHintVisible] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const level = levels[currentLevel];
    const question = level?.questions[questionIdx];
    const progressPercent = level ? ((questionIdx) / level.questions.length) * 100 : 0;

    /* ─── Timer ─── */
    useEffect(() => {
        if (gameState !== "playing" || feedback) return;

        const t = (level?.timePerQuestion ?? BASE_TIME) + (playerClass === "wizard" ? 10 : 0);
        setTimeLeft(t);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleAnswer();
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

    /* ─── Auto-focus input ─── */
    useEffect(() => {
        if (gameState === "playing" && !feedback) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [gameState, questionIdx, feedback]);

    /* ─── Handle answer ─── */
    const handleAnswer = useCallback(() => {
        if (feedback) return;
        if (timerRef.current) clearInterval(timerRef.current);

        const correct = question
            ? isMatch(userInput, question.acceptAnswers)
            : false;

        if (correct) {
            playCorrect();
            setFeedback("correct");
            const comboBonus = Math.min(comboCount, 5) * 10;
            setScore(s => s + 100 + comboBonus);
            setComboCount(c => c + 1);
            if (comboCount + 1 === 3) addAbilityCharges(1); // Combo reward
            onAnswered?.("", true, level?.subject ?? "", question?.bloomLevel ?? 5);
        } else {
            playWrong();
            setFeedback("wrong");
            setComboCount(0);
            setShakeWrong(true);
            onAnswered?.("", false, level?.subject ?? "", question?.bloomLevel ?? 5);

            // Warrior shield — costs 1 ability charge
            if (playerClass === "warrior" && !shieldUsed) {
                const charged = useAbilityChargeRef.current();
                if (charged) {
                    setShieldUsed(true);
                    setAbilityNotice("🛡️ Lá chắn thép đã bảo vệ bạn!");
                    setTimeout(() => setAbilityNotice(null), 2000);
                } else {
                    setHp(prev => {
                        const newHp = prev - 1;
                        if (newHp <= 0) {
                            setTimeout(() => {
                                stopBGM();
                                onGameComplete?.(score, 0);
                                setGameState("gameOver");
                            }, 800);
                        }
                        return newHp;
                    });
                }
            } else if (playerClass !== "warrior") {
                setHp(prev => {
                    const newHp = prev - 1;
                    if (newHp <= 0) {
                        setTimeout(() => {
                            stopBGM();
                            onGameComplete?.(score, 0);
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
            if (!correct && hp <= 1 && !(playerClass === "warrior" && !shieldUsed)) return;

            const nextQ = questionIdx + 1;
            if (nextQ >= (level?.questions.length ?? 0)) {
                if (currentLevel + 1 >= levels.length) {
                    stopBGM();
                    onGameComplete?.(score + (correct ? 100 : 0), currentLevel + 1);
                    setGameState("win");
                } else {
                    setGameState("levelComplete");
                }
            } else {
                setQuestionIdx(nextQ);
                setFeedback(null);
                setUserInput("");
                setHintVisible(false);
            }
        }, 1800);
    }, [feedback, question, userInput, comboCount, questionIdx, level, currentLevel, levels.length, hp, shieldUsed, playerClass, score, onAnswered, onGameComplete, playCorrect, playWrong, stopBGM]);

    /* ─── Start helpers ─── */
    const startGame = () => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setComboCount(0);
        setShieldUsed(false);
        setHintVisible(false);
        startLevel(0);
    };

    const startLevel = (lvlIdx: number) => {
        setCurrentLevel(lvlIdx);
        setQuestionIdx(0);
        setFeedback(null);
        setUserInput("");
        setShieldUsed(false);
        setHintVisible(false);
        setGameState("playing");
    };

    /* ─── Hunter ability: show hint ─── */
    const showHint = () => {
        if (playerClass !== "hunter" || hintVisible || feedback) return;
        if (!useAbilityChargeRef.current()) return; // No charges
        setHintVisible(true);
        setAbilityNotice("🎯 Mắt Đại Bàng — gợi ý đáp án!");
        setTimeout(() => setAbilityNotice(null), 2000);
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
        } catch (err) {
            console.error("Error toggling fullscreen", err);
        }
    };

    useEffect(() => {
        const h = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", h);
        return () => document.removeEventListener("fullscreenchange", h);
    }, []);

    /* ─── Key handler ─── */
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !feedback) handleAnswer();
    };

    /* ─── Hint text ─── */
    const getHint = (): string => {
        if (!question) return "";
        const word = question.correctWord;
        // Show first 2 chars + dots
        return word.slice(0, 2) + "•".repeat(Math.max(0, word.length - 2));
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
                    {playerClass === "warrior" && !shieldUsed && player.abilityCharges > 0 && (
                        <span className="text-xl ml-1 animate-pulse" title="Lá chắn thép – miễn 1 lần sai">🛡️</span>
                    )}
                </div>

                {/* Ability notice */}
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
                    <div className={`text-sm font-bold font-mono ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white/70"}`}>
                        ⏱ {timeLeft}s
                    </div>
                )}

                {/* Score + Fullscreen */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        {comboCount > 1 && (
                            <motion.span key={comboCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="text-xs font-bold text-neon-orange bg-neon-orange/10 px-2 py-1 rounded-full">
                                🔥 x{comboCount}
                            </motion.span>
                        )}
                        <span className="text-neon-cyan font-bold text-lg">{score}</span>
                        <span className="text-white/40 text-xs">✦</span>
                    </div>
                    {gameState === "playing" && (
                        <button onClick={toggleFullscreen}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}>
                            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            {gameState === "playing" && level && (
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            )}

            {/* Main game area */}
            <div className={`relative rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex flex-col ${isFullscreen ? 'max-w-[800px] w-full mx-auto flex-1 my-4 min-h-[500px]' : 'min-h-[450px] sm:min-h-[500px]'}`} style={{ filter: calmMode ? 'saturate(0.3)' : 'none' }}>
                {/* Background */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-teal-500/5 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-400/3 rounded-full blur-[80px]" />
                </div>

                {/* Game icon + label */}
                {gameState === "playing" && (
                    <div className="relative z-10 text-center pt-6 pb-2">
                        <span className="text-3xl">✍️</span>
                        <p className="text-xs text-white/30 mt-1 uppercase tracking-widest">Xưởng Chữ Vũ Trụ</p>
                    </div>
                )}

                {/* Question area */}
                {gameState === "playing" && question && (
                    <motion.div
                        key={`q-${questionIdx}`}
                        initial={{ opacity: 0, y: -20 }}
                        animate={shakeWrong ? { opacity: 1, y: 0, x: [0, -10, 10, -10, 10, 0] } : { opacity: 1, y: 0 }}
                        transition={shakeWrong ? { duration: 0.5 } : { duration: 0.4 }}
                        className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-6"
                    >
                        {/* Question text */}
                        <div className="text-center max-w-lg">
                            <p className="text-2xl sm:text-3xl font-bold text-white font-[var(--font-heading)] leading-relaxed">
                                {question.questionText}
                            </p>
                            {/* Bloom badge */}
                            {question.bloomLevel && question.bloomLevel >= 4 && (
                                <span className="inline-block mt-3 text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    {question.bloomLevel === 5 ? "⚡ Tư duy bậc cao" : "🔍 Phân tích"}
                                </span>
                            )}
                        </div>

                        {/* Hunter hint */}
                        {hintVisible && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-sm text-neon-gold/70 glass-card !px-4 !py-2 !rounded-xl"
                            >
                                💡 Gợi ý: <span className="font-bold font-mono tracking-widest">{getHint()}</span>
                            </motion.div>
                        )}

                        {/* Input area */}
                        <div className="w-full max-w-md flex flex-col gap-3">
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userInput}
                                    onChange={e => setUserInput(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    disabled={!!feedback}
                                    placeholder="Gõ câu trả lời..."
                                    className={`
                                        w-full px-6 py-4 rounded-2xl text-lg font-semibold text-center
                                        bg-white/5 border-2 outline-none transition-all duration-300
                                        placeholder:text-white/20
                                        ${feedback === "correct"
                                            ? "border-green-400 bg-green-400/10 text-green-400 shadow-[0_0_30px_rgba(74,222,128,0.3)]"
                                            : feedback === "wrong"
                                                ? "border-red-400 bg-red-400/10 text-red-400"
                                                : "border-white/20 text-white focus:border-emerald-400/60 focus:shadow-[0_0_20px_rgba(52,211,153,0.2)]"
                                        }
                                    `}
                                    autoComplete="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                />
                                {/* Character count */}
                                {!feedback && userInput.length > 0 && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-xs">
                                        {userInput.length}
                                    </span>
                                )}
                            </div>

                            {/* Submit + Hunter hint button */}
                            <div className="flex gap-3 justify-center">
                                {!feedback && (
                                    <button
                                        onClick={handleAnswer}
                                        disabled={!userInput.trim()}
                                        className={`
                                            px-8 py-3 rounded-full font-bold text-lg tracking-wide
                                            transition-all duration-300
                                            ${userInput.trim()
                                                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:scale-105 shadow-[0_0_25px_rgba(52,211,153,0.4)]"
                                                : "bg-white/5 text-white/20 cursor-not-allowed"
                                            }
                                        `}
                                    >
                                        Gửi đáp án ✨
                                    </button>
                                )}
                                {playerClass === "hunter" && !hintVisible && !feedback && player.abilityCharges > 0 && (
                                    <MascotAbilityButton
                                        onClick={showHint}
                                        disabled={hintVisible}
                                        charges={player.abilityCharges}
                                        label="Mắt Đại Bàng"
                                        description="Gợi ý chữ đầu"
                                        position="inline"
                                        size="sm"
                                    />
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Feedback overlay */}
                <AnimatePresence>
                    {feedback === "correct" && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute top-1/4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                            <div className="text-center">
                                <div className="text-5xl mb-2">✨</div>
                                <p className="text-green-400 font-bold text-xl">Đúng rồi!</p>
                                <p className="text-neon-gold text-sm font-bold">+100 ✦</p>
                            </div>
                        </motion.div>
                    )}
                    {feedback === "wrong" && (
                        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute top-1/4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                            <div className="text-center">
                                <div className="text-5xl mb-2">💪</div>
                                <p className="text-neon-orange font-bold text-xl">Gần đúng rồi!</p>
                                <p className="text-white/40 text-sm">Đáp án: <span className="text-emerald-400 font-bold">{question?.correctWord}</span></p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ─── OVERLAYS ─── */}
                <AnimatePresence>
                    {gameState === "ready" && (
                        <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-6 z-20">
                            <div className="text-6xl animate-float">✍️</div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text">
                                Xưởng Chữ Vũ Trụ
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Đọc câu hỏi và gõ câu trả lời!<br />
                                Rèn <span className="text-emerald-400 font-bold">tư duy sáng tạo</span> cho phi hành đoàn! 🚀
                            </p>
                            {playerClass && (
                                <div className="glass-card !p-3 !rounded-xl text-center border border-neon-gold/20">
                                    <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt của bạn</p>
                                    <p className="text-sm font-bold text-neon-gold">
                                        {playerClass === "warrior" && `🛡️ Lá Chắn Thép — Miễn 1 lần sai (⚡${player.abilityCharges})`}
                                        {playerClass === "wizard" && "⏳ Ngưng Đọng Thời Gian — +10 giây mỗi câu"}
                                        {playerClass === "hunter" && `🎯 Mắt Đại Bàng — Gợi ý (⚡${player.abilityCharges})`}
                                    </p>
                                </div>
                            )}
                            {level && (
                                <div className="glass-card !p-3 !rounded-xl text-center">
                                    <p className="text-xs text-white/50">Level {level.level} · {level.planet}</p>
                                    <p className="text-sm font-bold text-white">{level.title}</p>
                                </div>
                            )}
                            <button onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg tracking-wide hover:scale-105 transition-transform shadow-[0_0_25px_rgba(52,211,153,0.4)]">
                                BẮT ĐẦU VIẾT ✍️
                            </button>
                        </motion.div>
                    )}

                    {gameState === "levelComplete" && (
                        <motion.div key="levelComplete" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl">🎉</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">
                                Level {levels[currentLevel]?.level} Hoàn thành!
                            </h2>
                            <p className="text-neon-gold text-lg font-bold">+{score} ✦</p>
                            <button onClick={() => startLevel(currentLevel + 1)}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_25px_rgba(52,211,153,0.4)]">
                                Level tiếp theo →
                            </button>
                        </motion.div>
                    )}

                    {gameState === "gameOver" && (
                        <motion.div key="gameOver" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl">💥</div>
                            <h2 className="text-2xl sm:text-3xl font-bold text-red-400">Xưởng chữ quá tải!</h2>
                            <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} ✦</span></p>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:scale-105 transition-transform">
                                    Viết lại 🔄
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
                        <motion.div key="win" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl animate-float">🏆</div>
                            <h2 className="text-2xl sm:text-3xl font-bold neon-text">Viết hoàn hảo!</h2>
                            <p className="text-neon-gold text-xl font-bold">Tổng: {score} XP ⭐</p>
                            <p className="text-white/50 text-sm">Hoàn thành tất cả {levels.length} levels!</p>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:scale-105 transition-transform">
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
                            <span>✍️ {level.planet}</span>
                            <span>·</span>
                            <span>📚 {level.subject}</span>
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
