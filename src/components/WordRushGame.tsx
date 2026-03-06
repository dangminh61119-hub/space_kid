"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameLevel } from "@/lib/services/db";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useGame } from "@/lib/game-context";
import MascotAbilityButton from "@/components/MascotAbilityButton";

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
const MAX_HP = 3;
const BASE_COSMO = 100;
const BASE_TIME = 12; // seconds per question
const MIN_TIME = 5;
const COMBO_MULTIPLIERS = [1, 1, 2, 3, 5];
const ANSWER_COLORS = [
    { bg: "linear-gradient(135deg, #00F5FF, #0077B6)", border: "#00F5FF", glow: "#00F5FF44" },
    { bg: "linear-gradient(135deg, #FF6BFF, #9D174D)", border: "#FF6BFF", glow: "#FF6BFF44" },
    { bg: "linear-gradient(135deg, #FFD700, #D97706)", border: "#FFD700", glow: "#FFD70044" },
    { bg: "linear-gradient(135deg, #7BFF7B, #065F46)", border: "#7BFF7B", glow: "#7BFF7B44" },
];

/* ─── Component ─── */
export default function WordRushGame({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false,
}: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const { player, useAbilityCharge, addAbilityCharges } = useGame();
    const useAbilityChargeRef = useRef(useAbilityCharge);
    useEffect(() => { useAbilityChargeRef.current = useAbilityCharge; }, [useAbilityCharge]);

    const [hp, setHp] = useState(MAX_HP);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [gameState, setGameState] = useState<"ready" | "playing" | "levelComplete" | "win" | "gameOver">("ready");
    const [levelIdx, setLevelIdx] = useState(0);
    const [qIdx, setQIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(BASE_TIME);
    const [levelsCompleted, setLevelsCompleted] = useState(0);
    const [showLevelBanner, setShowLevelBanner] = useState(false);
    const [shieldActive, setShieldActive] = useState(playerClass === "warrior");
    const [abilityUsed, setAbilityUsed] = useState(false);
    const [hiddenWrong, setHiddenWrong] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
    const [answers, setAnswers] = useState<Array<{ text: string; isCorrect: boolean }>>([]);
    const [locked, setLocked] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const gameStateRef = useRef(gameState);

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const currentLevel = levels[levelIdx];
    const currentQ = currentLevel?.questions[qIdx];
    const multiplier = COMBO_MULTIPLIERS[Math.min(combo, COMBO_MULTIPLIERS.length - 1)];

    // Dynamic time: decreases as combo grows
    const questionTime = Math.max(MIN_TIME, BASE_TIME - Math.floor(combo / 2));

    /* ─── Shuffle answers ─── */
    const shuffleAnswers = useCallback(() => {
        if (!currentQ) return;
        const pool = [
            { text: currentQ.correctWord, isCorrect: true },
            ...currentQ.wrongWords.slice(0, 3).map(w => ({ text: w, isCorrect: false })),
        ].sort(() => Math.random() - 0.5);
        setAnswers(pool);
        setHiddenWrong(null);
        setLocked(false);
        setLastResult(null);

        // Hunter ability: auto-hide one wrong
        if (abilityUsed && playerClass === "hunter") {
            const wrongItem = pool.find(a => !a.isCorrect);
            if (wrongItem) setHiddenWrong(wrongItem.text);
        }
    }, [currentQ, abilityUsed, playerClass]);

    /* ─── Start ─── */
    const startGame = useCallback(() => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setCombo(0);
        setLevelIdx(0);
        setQIdx(0);
        setLevelsCompleted(0);
        setShieldActive(playerClass === "warrior");
        setAbilityUsed(false);
        setTimeLeft(BASE_TIME);
        setGameState("playing");
    }, [playBGM, playerClass]);

    /* ─── Shuffle on Q change ─── */
    useEffect(() => {
        if (gameState === "playing" && currentQ) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            shuffleAnswers();
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setTimeLeft(Math.max(MIN_TIME, BASE_TIME - Math.floor(combo / 2)));
        }
    }, [gameState, qIdx, levelIdx]);

    /* ─── Advance ─── */
    const advanceQuestion = useCallback(() => {
        const nextQ = qIdx + 1;
        if (nextQ >= (currentLevel?.questions.length ?? 0)) {
            const nextLevel = levelIdx + 1;
            setLevelsCompleted(l => l + 1);
            if (nextLevel >= levels.length) {
                setGameState("win");
            } else {
                setShowLevelBanner(true);
                setTimeout(() => {
                    setShowLevelBanner(false);
                    setLevelIdx(nextLevel);
                    setQIdx(0);
                    setShieldActive(playerClass === "warrior");
                    setAbilityUsed(false);
                }, 2200);
            }
        } else {
            setQIdx(nextQ);
        }
    }, [qIdx, currentLevel, levelIdx, levels.length, playerClass]);
    const advanceQuestionRef = useRef(advanceQuestion);
    useEffect(() => { advanceQuestionRef.current = advanceQuestion; }, [advanceQuestion]);

    /* ─── Timer ─── */
    useEffect(() => {
        if (gameState !== "playing" || locked) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Time's up!
                    setCombo(0);
                    playWrong();
                    setLastResult("wrong");
                    setLocked(true);
                    setHp(h => {
                        const next = h - 1;
                        if (next <= 0) setGameState("gameOver");
                        return Math.max(0, next);
                    });
                    setTimeout(() => advanceQuestionRef.current(), 800);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, qIdx, levelIdx, locked]);

    /* ─── Win/GameOver ─── */
    useEffect(() => {
        if (gameState === "win" || gameState === "gameOver") {
            stopBGM();
            if (timerRef.current) clearInterval(timerRef.current);
            onGameComplete?.(score, levelsCompleted);
        }
    }, [gameState]);

    /* ─── Answer click ─── */
    const handleAnswer = useCallback((answer: { text: string; isCorrect: boolean }) => {
        if (gameState !== "playing" || locked) return;
        setLocked(true);

        if (answer.isCorrect) {
            playCorrect();
            const newCombo = combo + 1;
            const mult = COMBO_MULTIPLIERS[Math.min(newCombo, COMBO_MULTIPLIERS.length - 1)];
            setCombo(newCombo);
            if (newCombo === 3) addAbilityCharges(1); // Combo reward
            setScore(s => s + BASE_COSMO * mult);
            setLastResult("correct");
            onAnswered?.(currentQ?.id ?? "", true, currentLevel?.subject || "", currentQ?.bloomLevel ?? 1);
            setTimeout(() => advanceQuestion(), 600);
        } else {
            playWrong();
            setLastResult("wrong");
            onAnswered?.(currentQ?.id ?? "", false, currentLevel?.subject || "", currentQ?.bloomLevel ?? 1);
            if (shieldActive && playerClass === "warrior") {
                setShieldActive(false);
            } else {
                setCombo(0);
                setHp(h => {
                    const next = h - 1;
                    if (next <= 0) setGameState("gameOver");
                    return Math.max(0, next);
                });
            }
            setTimeout(() => advanceQuestion(), 800);
        }
    }, [gameState, locked, combo, shieldActive, playerClass, currentLevel, advanceQuestion]);

    /* ─── Ability ─── */
    const useAbility = useCallback(() => {
        if (abilityUsed || gameState !== "playing") return;
        if (!useAbilityChargeRef.current()) return; // No charges left
        setAbilityUsed(true);
        if (playerClass === "wizard") {
            setTimeLeft(t => t + 5);
        } else if (playerClass === "hunter") {
            const wrongItem = answers.find(a => !a.isCorrect && a.text !== hiddenWrong);
            if (wrongItem) setHiddenWrong(wrongItem.text);
        }
    }, [abilityUsed, gameState, playerClass, answers, hiddenWrong]);

    const abilityInfo = {
        warrior: { label: "Khiên Thép", icon: "🛡️", desc: `Miễn 1 lần sai (⚡${player.abilityCharges})` },
        wizard: { label: "Thêm Giờ", icon: "⏳", desc: `+5 giây (⚡${player.abilityCharges})` },
        hunter: { label: "Loại Sai", icon: "🎯", desc: `Ẩn 1 sai (⚡${player.abilityCharges})` },
    };
    const ability = playerClass ? abilityInfo[playerClass] : null;

    /* ─── Ready ─── */
    if (gameState === "ready") {
        return (
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-space-deep/90 flex flex-col items-center justify-center gap-6 z-30">
                    <div className="text-6xl animate-float">⚡</div>
                    <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text text-center">
                        Đố Nhanh Vũ Trụ
                    </h2>
                    <p className="text-white/60 text-sm text-center max-w-md px-4 leading-relaxed">
                        Trả lời thật nhanh! Timer giảm dần khi combo tăng.<br />
                        Combo càng cao, <span className="text-neon-gold font-bold">✦ nhân đôi</span>!
                    </p>
                    {levels[0] && (
                        <div className="glass-card !p-3 !rounded-xl text-center">
                            <p className="text-xs text-white/50">Level {levels[0].level} · {levels[0].planet}</p>
                            <p className="text-sm font-bold text-white">{levels[0].title}</p>
                        </div>
                    )}
                    <button
                        onClick={startGame}
                        className="px-8 py-3 rounded-full text-white font-bold text-lg hover:scale-105 transition-transform"
                        style={{ background: "linear-gradient(90deg, #9333EA, #EC4899)", boxShadow: "0 0 25px rgba(147,51,234,0.5)" }}
                    >
                        BẮT ĐẦU ĐỐ ⚡
                    </button>
                    {onExit && (
                        <button onClick={onExit} className="mt-2 text-sm text-white/40 hover:text-white transition-colors">← Thoát</button>
                    )}
                </div>
            </div>
        );
    }

    /* ─── Win / GameOver ─── */
    if (gameState === "win" || gameState === "gameOver") {
        const isWin = gameState === "win";
        const stars = hp >= 3 ? 3 : hp >= 2 ? 2 : 1;
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="glass-card text-center space-y-6 max-w-md mx-auto !p-10">
                    <div className="text-6xl">{isWin ? "🏆" : "⚡"}</div>
                    <h2 className="text-3xl font-bold text-white font-[var(--font-heading)]">
                        {isWin ? "Tốc độ ánh sáng!" : "Hết năng lượng..."}
                    </h2>
                    <div className="flex justify-center gap-1 text-3xl">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <span key={i} className={i < stars ? "text-yellow-400" : "text-white/20"}>⭐</span>
                        ))}
                    </div>
                    <div className="glass-card !bg-white/5 !p-4 space-y-2">
                        <div className="flex justify-between text-white/70"><span>Tổng điểm</span><span className="font-bold text-neon-gold">{score.toLocaleString()} ✦</span></div>
                        <div className="flex justify-between text-white/70"><span>Levels</span><span className="font-bold text-white">{levelsCompleted}/{levels.length}</span></div>
                        <div className="flex justify-between text-white/70"><span>Combo cao nhất</span><span className="font-bold text-neon-pink">×{multiplier}</span></div>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={startGame} className="flex-1 py-3 rounded-xl font-bold text-white shadow-[0_0_15px_rgba(147,51,234,0.5)] hover:scale-105 transition-transform"
                            style={{ background: "linear-gradient(90deg,#9333EA,#EC4899)" }}>
                            Chơi lại 🔄
                        </button>
                        {onExit && (
                            <button onClick={onExit} className="flex-1 py-3 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10 transition-colors">
                                Thoát 🗺
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Playing ─── */
    const timerPct = (timeLeft / questionTime) * 100;
    const timerColor = timerPct > 60 ? "#7BFF7B" : timerPct > 30 ? "#FFD700" : "#FF4444";

    return (
        <div className="flex-1 flex flex-col min-h-0 relative select-none">
            <style>{`
                @keyframes rushCorrect { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
                @keyframes rushWrong { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-6px); } 40%,80% { transform: translateX(6px); } }
                @keyframes comboPopRush { 0% { transform: scale(0.5); opacity: 0; } 60% { transform: scale(1.3); } 100% { transform: scale(1); opacity: 1; } }
            `}</style>

            {/* HUD */}
            <div className="z-10 px-4 pt-3 pb-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className="text-xl transition-all duration-300"
                            style={{ filter: i < hp ? "drop-shadow(0 0 6px #FF6B6B)" : "grayscale(1) opacity(0.3)" }}>
                            {i < hp ? "❤️" : "🖤"}
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {combo >= 3 && (
                        <div className="font-black text-sm px-3 py-1 rounded-full text-white"
                            style={{
                                background: "linear-gradient(90deg, #9333EA, #EC4899)",
                                boxShadow: "0 0 15px #9333EA88",
                                animation: "comboPopRush 0.3s ease-out",
                            }}>
                            🔥 ×{multiplier}
                        </div>
                    )}
                    <div className="glass-card !p-2 !px-3 !rounded-xl">
                        <div className="text-neon-gold font-bold text-sm">{score.toLocaleString()}</div>
                        <div className="text-white/40 text-xs">✦</div>
                    </div>
                </div>
            </div>

            {/* Timer bar */}
            <div className="mx-4 h-2.5 rounded-full bg-white/10 overflow-hidden mb-3">
                <motion.div
                    className="h-full rounded-full"
                    animate={{ width: `${timerPct}%` }}
                    transition={{ duration: 0.8, ease: "linear" }}
                    style={{
                        background: timerColor,
                        boxShadow: `0 0 12px ${timerColor}`,
                    }}
                />
            </div>

            {/* Main quiz area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6 max-w-2xl mx-auto w-full"
                style={{ filter: calmMode ? "saturate(0.3)" : "none" }}>

                {/* Level info */}
                <div className="text-xs text-white/40">
                    {currentLevel?.subject} · Level {currentLevel?.level} · Q{qIdx + 1}/{currentLevel?.questions.length}
                </div>

                {/* Question card */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${levelIdx}-${qIdx}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, animation: lastResult === "wrong" ? "rushWrong 0.4s ease-in-out" : lastResult === "correct" ? "rushCorrect 0.3s ease-out" : "none" }}
                        exit={{ opacity: 0, y: -20 }}
                        className="glass-card !p-6 !rounded-2xl w-full text-center"
                        style={{
                            borderColor: lastResult === "correct" ? "#7BFF7B44" : lastResult === "wrong" ? "#FF444444" : undefined,
                            borderWidth: lastResult ? 2 : 1,
                        }}
                    >
                        <p className="text-white font-bold text-xl sm:text-2xl leading-relaxed">
                            {currentQ?.question}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Answer buttons */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    {answers.map((answer, i) => {
                        const color = ANSWER_COLORS[i % ANSWER_COLORS.length];
                        const isHidden = hiddenWrong === answer.text;
                        if (isHidden) {
                            return (
                                <div key={i}
                                    className="py-4 px-3 rounded-xl opacity-20 border border-white/10 flex items-center justify-center"
                                    style={{ background: "rgba(255,255,255,0.03)" }}>
                                    <span className="text-white/30 text-sm">❌ Loại</span>
                                </div>
                            );
                        }
                        return (
                            <motion.button
                                key={i}
                                whileHover={{ scale: locked ? 1 : 1.03 }}
                                whileTap={{ scale: locked ? 1 : 0.97 }}
                                onClick={() => handleAnswer(answer)}
                                disabled={locked}
                                className="py-4 px-3 rounded-xl font-bold text-white text-sm sm:text-base transition-all relative overflow-hidden"
                                style={{
                                    background: color.bg,
                                    border: `1px solid ${color.border}66`,
                                    boxShadow: color.glow ? `0 4px 15px ${color.glow}` : undefined,
                                    opacity: locked ? 0.6 : 1,
                                    cursor: locked ? "not-allowed" : "pointer",
                                }}
                            >
                                {answer.text}
                                {/* Shine overlay */}
                                <div className="absolute inset-0 pointer-events-none"
                                    style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)" }} />
                            </motion.button>
                        );
                    })}
                </div>

                {/* Ability button — Mascot */}
                {ability && !abilityUsed && player.abilityCharges > 0 && (
                    <MascotAbilityButton
                        onClick={useAbility}
                        disabled={abilityUsed}
                        charges={player.abilityCharges}
                        label={ability.label}
                        description={ability.desc}
                        position="inline"
                        size="sm"
                    />
                )}

                {/* Shield indicator */}
                {playerClass === "warrior" && shieldActive && (
                    <div className="flex items-center gap-2 text-xs text-neon-gold">
                        <span>🛡️</span> Khiên sẵn sàng bảo vệ!
                    </div>
                )}
            </div>

            {/* Level Banner */}
            <AnimatePresence>
                {showLevelBanner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 flex items-center justify-center bg-space-deep/80 pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="glass-card !p-6 !px-12 text-center"
                        >
                            <div className="text-4xl mb-2">⚡</div>
                            <div className="text-2xl font-black text-neon-gold">Level {levelIdx + 1} hoàn thành!</div>
                            <div className="text-white/60 text-sm mt-1">Tốc độ tăng lên...</div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
