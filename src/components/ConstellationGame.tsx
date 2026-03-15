"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import type { GameLevel } from "@/lib/services/db";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useGame } from "@/lib/game-context";
import MascotAbilityButton from "@/components/MascotAbilityButton";
import VolumeControl from "./VolumeControl";

/* ─── Types ─── */
interface StarNode {
    id: string;
    label: string;       // the text shown on/near the star
    orderIndex: number;   // correct order (0-based)
    x: number;            // position 0-1 (will be multiplied by container size)
    y: number;
}

interface ConstellationRound {
    question: string;         // what to build
    correctSequence: string;  // the full answer displayed after completion
    stars: StarNode[];
    questionId?: string;
}

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
const MAX_HP = 3;
const BASE_COSMO = 80;
const BONUS_PERFECT = 250;
const TIME_PER_ROUND = 30;

const STAR_COLORS = [
    "#00F5FF", "#FF6BFF", "#FFD700", "#00FF88", "#FF8C00", "#C084FC",
];

/* ─── Generate rounds from question data ─── */
function generateRounds(levels: GameLevel[]): ConstellationRound[] {
    const rounds: ConstellationRound[] = [];

    for (const level of levels) {
        for (const q of level.questions) {
            const answer = q.correctWord;
            if (!answer || answer.length < 2) continue;

            // Split answer into parts (characters or words)
            let parts: string[];
            if (answer.includes(" ") && answer.split(" ").length >= 3) {
                // Multi-word: split by words
                parts = answer.split(" ");
            } else {
                // Single word or short: split by characters
                parts = answer.split("");
            }

            // Add some distractor stars from wrong answers
            const allParts = [...parts];
            for (const w of q.wrongWords.slice(0, 2)) {
                if (w.length > 0) {
                    // Take 1-2 chars/words from wrong answers as distractors
                    const wrongParts = w.includes(" ") ? w.split(" ").slice(0, 1) : [w.charAt(0)];
                    allParts.push(...wrongParts);
                }
            }

            // Create star positions (pseudo-random but spread out)
            const stars: StarNode[] = allParts.map((part, i) => ({
                id: `star-${rounds.length}-${i}`,
                label: part,
                orderIndex: i < parts.length ? i : -1, // -1 = distractor
                x: 0.15 + Math.random() * 0.7,
                y: 0.12 + Math.random() * 0.72,
            }));

            // Prevent overlap: push apart stars that are too close
            for (let a = 0; a < stars.length; a++) {
                for (let b = a + 1; b < stars.length; b++) {
                    const dx = stars[a].x - stars[b].x;
                    const dy = stars[a].y - stars[b].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 0.15) {
                        stars[b].x = Math.min(0.85, stars[b].x + 0.12);
                        stars[b].y = Math.min(0.84, stars[b].y + 0.08);
                    }
                }
            }

            // Shuffle
            const shuffled = [...stars].sort(() => Math.random() - 0.5);

            rounds.push({
                question: q.question,
                correctSequence: answer,
                stars: shuffled,
                questionId: q.id,
            });
        }
    }

    return rounds.length > 0 ? rounds : getDefaultRounds();
}

function getDefaultRounds(): ConstellationRound[] {
    return [
        {
            question: "Thủ đô Việt Nam?",
            correctSequence: "Hà Nội",
            stars: [
                { id: "s1", label: "Hà", orderIndex: 0, x: 0.2, y: 0.3 },
                { id: "s2", label: "Nội", orderIndex: 1, x: 0.7, y: 0.5 },
                { id: "s3", label: "Sài", orderIndex: -1, x: 0.5, y: 0.2 },
                { id: "s4", label: "Gòn", orderIndex: -1, x: 0.4, y: 0.7 },
            ],
        },
        {
            question: "2 + 3 = ?",
            correctSequence: "5",
            stars: [
                { id: "s5", label: "5", orderIndex: 0, x: 0.5, y: 0.4 },
                { id: "s6", label: "3", orderIndex: -1, x: 0.3, y: 0.6 },
                { id: "s7", label: "7", orderIndex: -1, x: 0.7, y: 0.3 },
            ],
        },
    ];
}

/* ─── Component ─── */
export default function ConstellationGame({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false, paused = false,
}: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const { player, useAbilityCharge, addAbilityCharges } = useGame();
    const useAbilityChargeRef = useRef(useAbilityCharge);
    useEffect(() => { useAbilityChargeRef.current = useAbilityCharge; }, [useAbilityCharge]);

    const [gameState, setGameState] = useState<"ready" | "playing" | "roundComplete" | "gameOver" | "win">("ready");
    const [rounds, setRounds] = useState<ConstellationRound[]>([]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [selectedStars, setSelectedStars] = useState<string[]>([]); // ordered star IDs
    const [nextExpectedOrder, setNextExpectedOrder] = useState(0);
    const [wrongFlashId, setWrongFlashId] = useState<string | null>(null);
    const [completedLine, setCompletedLine] = useState(false);
    const [comboCount, setComboCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
    const [shieldUsed, setShieldUsed] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);
    const [abilityNotice, setAbilityNotice] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [shootingStar, setShootingStar] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const round = rounds[roundIdx];

    /* ─── Generate rounds ─── */
    useEffect(() => {
        setRounds(generateRounds(levels));
    }, [levels]);

    /* ─── Start game ─── */
    const startRound = useCallback((idx: number) => {
        const r = rounds[idx];
        if (!r) return;
        setRoundIdx(idx);
        setSelectedStars([]);
        setNextExpectedOrder(0);
        setCompletedLine(false);
        setHintUsed(false);
        setTimeLeft(TIME_PER_ROUND + (playerClass === "wizard" ? 10 : 0));
        setGameState("playing");
    }, [rounds, playerClass]);

    const startGame = useCallback(() => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setComboCount(0);
        setShieldUsed(false);
        startRound(0);
    }, [playBGM, startRound]);

    /* ─── Timer ─── */
    useEffect(() => {
        if (gameState !== "playing" || paused) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // Defer state updates to avoid setState-during-render
                    setTimeout(() => {
                        setHp(h => {
                            const next = h - 1;
                            if (next <= 0) {
                                stopBGM();
                                onGameComplete?.(score, 0);
                                setGameState("gameOver");
                            } else {
                                onAnswered?.(round?.questionId ?? "", false, levels[0]?.subject ?? "", 3);
                                handleRoundAdvance(false);
                            }
                            return Math.max(0, next);
                        });
                    }, 0);
                    return TIME_PER_ROUND;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, paused, roundIdx]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ─── Round advance ─── */
    const handleRoundAdvance = useCallback((success: boolean) => {
        setTimeout(() => {
            if (roundIdx + 1 >= rounds.length) {
                stopBGM();
                onGameComplete?.(score + (success ? BONUS_PERFECT : 0), rounds.length);
                setGameState("win");
            } else {
                setGameState("roundComplete");
            }
        }, success ? 1200 : 500);
    }, [roundIdx, rounds.length, score, onGameComplete, stopBGM]);

    /* ─── Star click ─── */
    const handleStarClick = useCallback((star: StarNode) => {
        if (gameState !== "playing" || paused || completedLine) return;
        if (selectedStars.includes(star.id)) return; // already selected

        if (star.orderIndex === nextExpectedOrder) {
            // Correct!
            playCorrect();
            const newSelected = [...selectedStars, star.id];
            setSelectedStars(newSelected);
            setNextExpectedOrder(prev => prev + 1);

            const newCombo = comboCount + 1;
            setComboCount(newCombo);
            if (newCombo === 3) addAbilityCharges(1);
            const bonus = Math.min(newCombo, 5) * 15;
            setScore(s => s + BASE_COSMO + bonus);

            // Check if constellation is complete
            const totalCorrectStars = round?.stars.filter(s => s.orderIndex >= 0).length ?? 0;
            if (newSelected.length >= totalCorrectStars) {
                // Constellation complete!
                setCompletedLine(true);
                setShootingStar(true);
                setTimeout(() => setShootingStar(false), 2000);

                onAnswered?.(round?.questionId ?? "", true, levels[0]?.subject ?? "", 3);
                handleRoundAdvance(true);
            }
        } else {
            // Wrong star!
            playWrong();
            setWrongFlashId(star.id);
            setTimeout(() => setWrongFlashId(null), 600);
            setComboCount(0);

            if (star.orderIndex === -1) {
                // Clicked a distractor
                onAnswered?.(round?.questionId ?? "", false, levels[0]?.subject ?? "", 3);
            }

            // Shield check
            if (playerClass === "warrior" && !shieldUsed) {
                const charged = useAbilityChargeRef.current();
                if (charged) {
                    setShieldUsed(true);
                    setAbilityNotice("🛡️ Lá chắn bảo vệ!");
                    setTimeout(() => setAbilityNotice(null), 1500);
                    return;
                }
            }

            setHp(prev => {
                const n = prev - 1;
                if (n <= 0) {
                    setTimeout(() => {
                        stopBGM();
                        onGameComplete?.(score, 0);
                        setGameState("gameOver");
                    }, 500);
                }
                return Math.max(0, n);
            });
        }
    }, [gameState, paused, completedLine, selectedStars, nextExpectedOrder, comboCount, round, levels, shieldUsed, playerClass, score, handleRoundAdvance, onAnswered, onGameComplete, playCorrect, playWrong, stopBGM, addAbilityCharges]);

    /* ─── Hunter hint: highlight next star ─── */
    const handleHint = () => {
        if (playerClass !== "hunter" || hintUsed) return;
        if (!useAbilityChargeRef.current()) return;
        setHintUsed(true);
        setAbilityNotice("🎯 Ngôi sao tiếp theo đang sáng!");
        setTimeout(() => setAbilityNotice(null), 2500);
    };

    // Find the next correct star for hint
    const hintStarId = hintUsed && round
        ? round.stars.find(s => s.orderIndex === nextExpectedOrder)?.id
        : null;

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

    /* ─── Get star positions ─── */
    const getStarPos = (star: StarNode) => {
        return { left: `${star.x * 100}%`, top: `${star.y * 100}%` };
    };

    /* ─── Build SVG lines between selected stars ─── */
    const getLines = (): { x1: number; y1: number; x2: number; y2: number }[] => {
        if (!round || selectedStars.length < 2) return [];
        const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

        for (let i = 0; i < selectedStars.length - 1; i++) {
            const s1 = round.stars.find(s => s.id === selectedStars[i]);
            const s2 = round.stars.find(s => s.id === selectedStars[i + 1]);
            if (s1 && s2) {
                lines.push({
                    x1: s1.x * 100, y1: s1.y * 100,
                    x2: s2.x * 100, y2: s2.y * 100,
                });
            }
        }
        return lines;
    };

    const timerPct = (timeLeft / (TIME_PER_ROUND + (playerClass === "wizard" ? 10 : 0))) * 100;
    const timerColor = timerPct > 60 ? "#FFD700" : timerPct > 30 ? "#FF8C00" : "#FF4444";
    const lines = getLines();

    /* ─── Render ─── */
    return (
        <div ref={containerRef} className={`w-full max-w-4xl mx-auto flex flex-col gap-4 ${isFullscreen ? 'bg-[#020010] p-4 justify-center py-10 overflow-hidden h-screen overflow-y-auto' : ''}`}>

            {/* HUD */}
            <div className={`flex items-center justify-between glass-card-strong !rounded-2xl px-4 py-3 ${isFullscreen ? 'max-w-[700px] mx-auto w-full' : ''}`}>
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className={`text-xl transition-all ${i < hp ? "opacity-100 scale-100" : "opacity-20 scale-75"}`}>❤️</span>
                    ))}
                    {playerClass === "warrior" && !shieldUsed && player.abilityCharges > 0 && (
                        <span className="text-xl ml-1 animate-pulse">🛡️</span>
                    )}
                </div>

                <AnimatePresence>
                    {abilityNotice && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="absolute top-14 left-1/2 -translate-x-1/2 z-30 glass-card !px-4 !py-2 !rounded-xl text-sm font-bold text-neon-gold whitespace-nowrap">
                            {abilityNotice}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-3">
                    {comboCount > 1 && (
                        <motion.span key={comboCount} initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                            ✨ x{comboCount}
                        </motion.span>
                    )}
                    <span className="text-neon-cyan font-bold text-lg">{score}</span>
                    <span className="text-white/40 text-xs">✦</span>
                    {gameState === "playing" && <VolumeControl />}
                    <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60">
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                </div>
            </div>

            {/* ─── MAIN AREA ─── */}
            <div className={`relative rounded-2xl overflow-hidden border border-white/10 flex flex-col ${isFullscreen ? 'max-w-[800px] w-full mx-auto flex-1 my-2' : 'min-h-[500px]'}`}
                style={{ background: "radial-gradient(ellipse at 50% 0%, #0a0628 0%, #020010 60%)", filter: calmMode ? 'saturate(0.3)' : 'none' }}>

                {/* Twinkling background stars */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {!calmMode && Array.from({ length: 50 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute rounded-full bg-white"
                            style={{
                                width: Math.random() > 0.8 ? 2 : 1,
                                height: Math.random() > 0.8 ? 2 : 1,
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{ opacity: [0.1, 0.7, 0.1] }}
                            transition={{ duration: 1.5 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
                        />
                    ))}
                    {/* Shooting star */}
                    {shootingStar && (
                        <motion.div
                            initial={{ x: "-10%", y: "10%", opacity: 1 }}
                            animate={{ x: "110%", y: "80%", opacity: 0 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="absolute w-20 h-0.5 bg-gradient-to-r from-transparent via-white to-amber-300 rounded-full"
                            style={{ boxShadow: "0 0 10px #FFD700, 0 0 20px #FFD70060" }}
                        />
                    )}
                </div>

                {/* Timer bar */}
                {gameState === "playing" && (
                    <div className="mx-4 mt-3 h-2 rounded-full bg-white/10 overflow-hidden relative z-10">
                        <motion.div
                            className="h-full rounded-full"
                            animate={{ width: `${timerPct}%` }}
                            transition={{ duration: 1, ease: "linear" }}
                            style={{ background: timerColor, boxShadow: `0 0 8px ${timerColor}` }}
                        />
                    </div>
                )}

                {/* Playing */}
                {gameState === "playing" && round && (
                    <div className="relative z-10 flex-1 flex flex-col px-4 py-4 gap-2">
                        {/* Question */}
                        <div className="text-center">
                            <p className="text-white/40 text-xs">Vòng {roundIdx + 1}/{rounds.length} · {timeLeft}s</p>
                            <p className="text-lg font-bold text-white font-[var(--font-heading)]">
                                ✨ {round.question}
                            </p>
                            <p className="text-white/40 text-xs mt-1">
                                Bấm vào các sao theo đúng thứ tự để tạo chòm sao!
                            </p>
                        </div>

                        {/* Progress: what's been selected */}
                        <div className="flex items-center justify-center gap-1 min-h-[32px]">
                            {round.stars.filter(s => s.orderIndex >= 0).sort((a, b) => a.orderIndex - b.orderIndex).map((star, i) => {
                                const isSelected = selectedStars.includes(star.id);
                                return (
                                    <motion.span
                                        key={star.id}
                                        animate={isSelected ? { scale: [0.5, 1.2, 1], opacity: 1 } : { opacity: 0.3 }}
                                        className={`px-2 py-1 rounded-lg text-sm font-bold ${isSelected
                                            ? "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                                            : "bg-white/5 text-white/30 border border-white/10"
                                            }`}
                                    >
                                        {isSelected ? star.label : "?"}
                                    </motion.span>
                                );
                            })}
                        </div>

                        {/* Star field */}
                        <div ref={fieldRef} className="relative flex-1 min-h-[300px]">
                            {/* SVG Lines */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                                <defs>
                                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#FFD700" />
                                        <stop offset="100%" stopColor="#FF8C00" />
                                    </linearGradient>
                                    <filter id="lineGlow">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                {lines.map((line, i) => (
                                    <motion.line
                                        key={i}
                                        x1={`${line.x1}%`} y1={`${line.y1}%`}
                                        x2={`${line.x2}%`} y2={`${line.y2}%`}
                                        stroke="url(#lineGrad)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        filter="url(#lineGlow)"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{ duration: 0.4 }}
                                    />
                                ))}
                            </svg>

                            {/* Stars */}
                            {round.stars.map((star, i) => {
                                const isSelected = selectedStars.includes(star.id);
                                const isDistractor = star.orderIndex === -1;
                                const isWrong = wrongFlashId === star.id;
                                const isHinted = hintStarId === star.id;
                                const color = STAR_COLORS[i % STAR_COLORS.length];
                                const isCompleted = completedLine;

                                return (
                                    <motion.div
                                        key={star.id}
                                        className="absolute z-10 cursor-pointer"
                                        style={{ ...getStarPos(star), transform: "translate(-50%, -50%)" }}
                                        onClick={() => handleStarClick(star)}
                                        whileHover={!isSelected ? { scale: 1.2 } : {}}
                                        whileTap={!isSelected ? { scale: 0.9 } : {}}
                                    >
                                        {/* Star glow */}
                                        <motion.div
                                            animate={isHinted ? {
                                                scale: [1, 1.5, 1],
                                                opacity: [0.3, 0.8, 0.3],
                                            } : isSelected ? {
                                                scale: 1.2,
                                            } : {
                                                opacity: [0.4, 0.8, 0.4],
                                            }}
                                            transition={isHinted ? { duration: 0.6, repeat: Infinity } : { duration: 2 + i * 0.3, repeat: Infinity }}
                                            className="absolute inset-[-12px] rounded-full pointer-events-none"
                                            style={{
                                                background: `radial-gradient(circle, ${isSelected ? "#FFD700" : color}40 0%, transparent 70%)`,
                                            }}
                                        />

                                        {/* Star body */}
                                        <motion.div
                                            animate={isWrong ? {
                                                x: [-4, 4, -4, 4, 0],
                                                borderColor: ["#FF4444", "#FF4444"],
                                            } : isCompleted && isSelected ? {
                                                scale: [1, 1.3, 1],
                                            } : {}}
                                            transition={isWrong ? { duration: 0.4 } : isCompleted ? { duration: 0.5 } : {}}
                                            className={`
                                                relative w-14 h-14 rounded-full flex items-center justify-center
                                                border-2 transition-all duration-200
                                                ${isSelected
                                                    ? "border-amber-400 bg-amber-400/20"
                                                    : isWrong
                                                        ? "border-red-400 bg-red-400/20"
                                                        : isDistractor
                                                            ? "border-white/15 bg-white/5 hover:border-white/30"
                                                            : "border-white/20 bg-white/5 hover:border-amber-400/40"
                                                }
                                            `}
                                            style={{
                                                boxShadow: isSelected
                                                    ? `0 0 20px #FFD70060, 0 0 40px #FFD70020`
                                                    : isHinted
                                                        ? `0 0 20px ${color}80, 0 0 40px ${color}40`
                                                        : `0 0 10px ${color}20`,
                                            }}
                                        >
                                            {/* Star icon */}
                                            <div className="absolute -top-1 -right-1 text-xs">
                                                {isSelected ? "⭐" : "✦"}
                                            </div>
                                            <span className={`font-bold text-xs text-center leading-tight ${isSelected ? "text-amber-200" : "text-white/80"
                                                }`}>
                                                {star.label}
                                            </span>
                                        </motion.div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Hunter ability */}
                        {playerClass === "hunter" && !hintUsed && player.abilityCharges > 0 && (
                            <MascotAbilityButton
                                onClick={handleHint}
                                disabled={hintUsed}
                                charges={player.abilityCharges}
                                label="Sao gợi ý"
                                description="Sáng ngôi sao tiếp theo"
                                position="inline"
                                size="sm"
                            />
                        )}
                    </div>
                )}

                {/* ─── OVERLAYS ─── */}
                <AnimatePresence>
                    {gameState === "ready" && (
                        <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#020010]/95 flex flex-col items-center justify-center gap-5 z-20">
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="text-7xl"
                                style={{ filter: "drop-shadow(0 0 30px #FFD700)" }}
                            >
                                ✨
                            </motion.div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-400">
                                Vẽ Chòm Sao
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Bấm vào các ngôi sao theo <span className="text-amber-300 font-bold">đúng thứ tự</span> để vẽ chòm sao!<br />
                                Tránh sao lạc = <span className="text-neon-gold font-bold">bonus ✦!</span>
                            </p>
                            {playerClass && (
                                <div className="glass-card !p-3 !rounded-xl text-center border border-neon-gold/20">
                                    <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt</p>
                                    <p className="text-sm font-bold text-neon-gold">
                                        {playerClass === "warrior" && `🛡️ Miễn 1 lần sai (⚡${player.abilityCharges})`}
                                        {playerClass === "wizard" && "⏳ +10 giây mỗi vòng"}
                                        {playerClass === "hunter" && `🎯 Gợi ý sao tiếp theo (⚡${player.abilityCharges})`}
                                    </p>
                                </div>
                            )}
                            <button onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 text-white font-bold text-lg hover:scale-105 transition-transform"
                                style={{ boxShadow: "0 0 30px rgba(255,215,0,0.4)" }}>
                                BẮT ĐẦU VẼ CHÒM SAO ✨
                            </button>
                        </motion.div>
                    )}

                    {gameState === "roundComplete" && (
                        <motion.div key="rc" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#020010]/95 flex flex-col items-center justify-center gap-5 z-20">
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="text-5xl"
                            >
                                🌟
                            </motion.div>
                            <h2 className="text-xl font-bold neon-text">Chòm sao hoàn thành!</h2>
                            <p className="text-amber-300 font-bold text-lg">&ldquo;{rounds[roundIdx]?.correctSequence}&rdquo;</p>
                            <p className="text-neon-gold font-bold">{score} ✦</p>
                            <button onClick={() => startRound(roundIdx + 1)}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:scale-105 transition-transform">
                                Chòm sao tiếp →
                            </button>
                        </motion.div>
                    )}

                    {gameState === "gameOver" && (
                        <motion.div key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#020010]/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl">💫</div>
                            <h2 className="text-2xl font-bold text-red-400">Chòm sao vỡ tan!</h2>
                            <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} ✦</span></p>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:scale-105 transition-transform">
                                    Thử lại 🔄
                                </button>
                                {onExit && <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10">Thoát</button>}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "win" && (
                        <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#020010]/95 flex flex-col items-center justify-center gap-5 z-20">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-6xl"
                                style={{ filter: "drop-shadow(0 0 30px #FFD700)" }}
                            >
                                🏆
                            </motion.div>
                            <h2 className="text-2xl font-bold neon-text">Bầu trời rực sáng!</h2>
                            <p className="text-neon-gold text-xl font-bold">{score} XP ⭐</p>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:scale-105 transition-transform">
                                    Chơi lại 🔄
                                </button>
                                {onExit && <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10">Về bản đồ 🗺</button>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between glass-card !rounded-xl px-4 py-2">
                <div className="text-xs text-white/40">✨ Vẽ Chòm Sao · Vòng {roundIdx + 1}/{rounds.length}</div>
                {onExit && <button onClick={onExit} className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10">← Thoát</button>}
            </div>
        </div>
    );
}
