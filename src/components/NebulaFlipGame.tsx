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
interface FlipCard {
    id: string;
    text: string;
    pairId: string;      // shared between matching pair
    type: "question" | "answer";
    isFlipped: boolean;
    isMatched: boolean;
}

interface FlipRound {
    title: string;
    cards: FlipCard[];
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
const BONUS_PERFECT = 300;
const TIME_PER_ROUND = 45; // seconds

const NEBULA_COLORS = [
    { bg: "linear-gradient(135deg, #1a0533 0%, #0a0a2e 50%, #1a0533 100%)", glow: "#9333ea" },
    { bg: "linear-gradient(135deg, #0a1628 0%, #0d1117 50%, #1a0533 100%)", glow: "#06b6d4" },
    { bg: "linear-gradient(135deg, #1a0533 0%, #1a0a2e 50%, #0a1628 100%)", glow: "#ec4899" },
];

const CARD_BACKS = [
    "from-purple-600/30 to-indigo-900/30",
    "from-cyan-600/30 to-blue-900/30",
    "from-pink-600/30 to-purple-900/30",
    "from-amber-600/30 to-orange-900/30",
    "from-emerald-600/30 to-teal-900/30",
    "from-rose-600/30 to-red-900/30",
];

/* ─── Generate rounds from question data ─── */
function generateRounds(levels: GameLevel[]): FlipRound[] {
    const rounds: FlipRound[] = [];

    for (const level of levels) {
        const qs = level.questions;
        // Take groups of 4-6 questions for each round (= 8-12 cards)
        for (let start = 0; start < qs.length; start += 4) {
            const chunk = qs.slice(start, start + 4);
            if (chunk.length < 3) continue;

            const cards: FlipCard[] = [];
            chunk.forEach((q, i) => {
                const pairId = `pair-${start + i}`;
                cards.push({
                    id: `q-${start + i}`,
                    text: q.question,
                    pairId,
                    type: "question",
                    isFlipped: false,
                    isMatched: false,
                });
                cards.push({
                    id: `a-${start + i}`,
                    text: q.correctWord,
                    pairId,
                    type: "answer",
                    isFlipped: false,
                    isMatched: false,
                });
            });

            rounds.push({
                title: level.title || level.subject,
                cards: cards.sort(() => Math.random() - 0.5),
            });
        }
    }

    return rounds.length > 0 ? rounds : getDefaultRounds();
}

function getDefaultRounds(): FlipRound[] {
    const pairs = [
        { q: "Hello", a: "Xin chào" },
        { q: "Cat", a: "Mèo" },
        { q: "Dog", a: "Chó" },
        { q: "Sun", a: "Mặt trời" },
    ];
    const cards: FlipCard[] = [];
    pairs.forEach((p, i) => {
        const pairId = `default-${i}`;
        cards.push({ id: `dq-${i}`, text: p.q, pairId, type: "question", isFlipped: false, isMatched: false });
        cards.push({ id: `da-${i}`, text: p.a, pairId, type: "answer", isFlipped: false, isMatched: false });
    });
    return [{ title: "Từ vựng", cards: cards.sort(() => Math.random() - 0.5) }];
}

/* ─── Component ─── */
export default function NebulaFlipGame({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false, paused = false,
}: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const { player, useAbilityCharge, addAbilityCharges } = useGame();
    const useAbilityChargeRef = useRef(useAbilityCharge);
    useEffect(() => { useAbilityChargeRef.current = useAbilityCharge; }, [useAbilityCharge]);

    const [gameState, setGameState] = useState<"ready" | "playing" | "roundComplete" | "gameOver" | "win">("ready");
    const [rounds, setRounds] = useState<FlipRound[]>([]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [cards, setCards] = useState<FlipCard[]>([]);
    const [score, setScore] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [flippedIds, setFlippedIds] = useState<string[]>([]);
    const [isChecking, setIsChecking] = useState(false);
    const [comboCount, setComboCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME_PER_ROUND);
    const [shieldUsed, setShieldUsed] = useState(false);
    const [hintUsed, setHintUsed] = useState(false);
    const [abilityNotice, setAbilityNotice] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [matchFlash, setMatchFlash] = useState<string | null>(null); // pairId that just matched
    const [nebulaIdx, setNebulaIdx] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    /* ─── Generate rounds ─── */
    useEffect(() => {
        setRounds(generateRounds(levels));
    }, [levels]);

    /* ─── Start game ─── */
    const startRound = useCallback((idx: number) => {
        const r = rounds[idx];
        if (!r) return;
        setRoundIdx(idx);
        setCards(r.cards.map(c => ({ ...c, isFlipped: false, isMatched: false })));
        setFlippedIds([]);
        setIsChecking(false);
        setHintUsed(false);
        setTimeLeft(TIME_PER_ROUND + (playerClass === "wizard" ? 10 : 0));
        setNebulaIdx(idx % NEBULA_COLORS.length);
        setGameState("playing");
    }, [rounds, playerClass]);

    const startGame = useCallback(() => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setComboCount(0);
        setShieldUsed(false);
        setHintUsed(false);
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
                    // Time's up → lose
                    stopBGM();
                    onGameComplete?.(score, 0);
                    setGameState("gameOver");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, paused]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ─── Card flip logic ─── */
    const handleCardClick = useCallback((cardId: string) => {
        if (gameState !== "playing" || isChecking || paused) return;

        const card = cards.find(c => c.id === cardId);
        if (!card || card.isFlipped || card.isMatched) return;

        // Flip the card
        const newCards = cards.map(c =>
            c.id === cardId ? { ...c, isFlipped: true } : c
        );
        setCards(newCards);
        const newFlipped = [...flippedIds, cardId];
        setFlippedIds(newFlipped);

        // Check for pair when 2 cards are flipped
        if (newFlipped.length === 2) {
            setIsChecking(true);
            const [firstId, secondId] = newFlipped;
            const first = newCards.find(c => c.id === firstId)!;
            const second = newCards.find(c => c.id === secondId)!;

            if (first.pairId === second.pairId && first.type !== second.type) {
                // Match!
                playCorrect();
                const newCombo = comboCount + 1;
                setComboCount(newCombo);
                if (newCombo === 3) addAbilityCharges(1);
                const bonus = Math.min(newCombo, 5) * 20;
                setScore(s => s + BASE_COSMO + bonus);
                setMatchFlash(first.pairId);
                setTimeout(() => setMatchFlash(null), 600);

                onAnswered?.("", true, levels[0]?.subject ?? "", 3);

                setTimeout(() => {
                    setCards(prev => prev.map(c =>
                        c.pairId === first.pairId ? { ...c, isMatched: true } : c
                    ));
                    setFlippedIds([]);
                    setIsChecking(false);
                }, 500);
            } else {
                // No match
                playWrong();
                setComboCount(0);
                onAnswered?.("", false, levels[0]?.subject ?? "", 3);

                // Shield check
                let blocked = false;
                if (playerClass === "warrior" && !shieldUsed) {
                    const charged = useAbilityChargeRef.current();
                    if (charged) {
                        setShieldUsed(true);
                        setAbilityNotice("🛡️ Lá chắn bảo vệ HP!");
                        setTimeout(() => setAbilityNotice(null), 1500);
                        blocked = true;
                    }
                }

                if (!blocked) {
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

                // Flip back after delay
                setTimeout(() => {
                    setCards(prev => prev.map(c =>
                        newFlipped.includes(c.id) && !c.isMatched
                            ? { ...c, isFlipped: false }
                            : c
                    ));
                    setFlippedIds([]);
                    setIsChecking(false);
                }, 900);
            }
        }
    }, [gameState, isChecking, paused, cards, flippedIds, comboCount, shieldUsed, playerClass, score, levels, onAnswered, onGameComplete, playCorrect, playWrong, stopBGM, addAbilityCharges]);

    /* ─── Check round completion ─── */
    useEffect(() => {
        if (gameState !== "playing") return;
        const allMatched = cards.length > 0 && cards.every(c => c.isMatched);
        if (allMatched) {
            const isPerfect = hp === MAX_HP;
            if (isPerfect) setScore(s => s + BONUS_PERFECT);

            setTimeout(() => {
                if (roundIdx + 1 >= rounds.length) {
                    stopBGM();
                    onGameComplete?.(score + (isPerfect ? BONUS_PERFECT : 0), rounds.length);
                    setGameState("win");
                } else {
                    setGameState("roundComplete");
                }
            }, 800);
        }
    }, [cards, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ─── Hunter ability: reveal one pair briefly ─── */
    const handleHint = () => {
        if (playerClass !== "hunter" || hintUsed) return;
        if (!useAbilityChargeRef.current()) return;
        setHintUsed(true);

        // Find an unmatched pair
        const unmatched = cards.filter(c => !c.isMatched && !c.isFlipped);
        if (unmatched.length < 2) return;

        const targetPairId = unmatched[0].pairId;
        const pairCards = cards.filter(c => c.pairId === targetPairId);

        // Flash reveal
        setCards(prev => prev.map(c =>
            c.pairId === targetPairId ? { ...c, isFlipped: true } : c
        ));
        setAbilityNotice("🎯 Hé lộ 1 cặp!");
        setTimeout(() => setAbilityNotice(null), 1500);

        setTimeout(() => {
            setCards(prev => prev.map(c =>
                c.pairId === targetPairId && !c.isMatched ? { ...c, isFlipped: false } : c
            ));
        }, 1500);
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

    /* ─── Grid size ─── */
    const cardCount = cards.length;
    const cols = cardCount <= 6 ? 3 : cardCount <= 8 ? 4 : cardCount <= 12 ? 4 : 5;

    const timerPct = (timeLeft / (TIME_PER_ROUND + (playerClass === "wizard" ? 10 : 0))) * 100;
    const timerColor = timerPct > 60 ? "#9333ea" : timerPct > 30 ? "#FFD700" : "#FF4444";
    const nebula = NEBULA_COLORS[nebulaIdx];

    /* ─── Render ─── */
    return (
        <div ref={containerRef} className={`w-full max-w-4xl mx-auto flex flex-col gap-4 ${isFullscreen ? 'bg-slate-950 p-4 justify-center py-10 overflow-hidden h-screen overflow-y-auto' : ''}`}>

            {/* HUD */}
            <div className={`flex items-center justify-between glass-card-strong !rounded-2xl px-4 py-3 ${isFullscreen ? 'max-w-[700px] mx-auto w-full' : ''}`}>
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className={`text-xl transition-all ${i < hp ? "opacity-100 scale-100" : "opacity-20 scale-75"}`}>
                            ❤️
                        </span>
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
                            className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">
                            🔥 x{comboCount}
                        </motion.span>
                    )}
                    <span className="text-neon-cyan font-bold text-lg">{score}</span>
                    <span className="text-white/40 text-xs">✦</span>
                    {gameState === "playing" && <VolumeControl />}
                    <button onClick={toggleFullscreen}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                </div>
            </div>

            {/* ─── MAIN AREA ─── */}
            <div className={`relative rounded-2xl overflow-hidden border border-white/10 flex flex-col ${isFullscreen ? 'max-w-[800px] w-full mx-auto flex-1 my-2' : 'min-h-[500px]'}`}
                style={{ background: nebula.bg, filter: calmMode ? 'saturate(0.3)' : 'none' }}>

                {/* Animated nebula background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
                        style={{
                            background: `radial-gradient(ellipse at 30% 40%, ${nebula.glow}15 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, ${nebula.glow}10 0%, transparent 50%)`,
                        }}
                    />
                    {/* Floating stars */}
                    {!calmMode && Array.from({ length: 20 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                            }}
                            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.5, 1.2, 0.5] }}
                            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
                        />
                    ))}
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
                {gameState === "playing" && (
                    <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-4 gap-3">
                        {/* Round info */}
                        <div className="text-center">
                            <p className="text-white/40 text-xs mb-0.5">Vòng {roundIdx + 1}/{rounds.length}</p>
                            <p className="text-lg font-bold text-white font-[var(--font-heading)]">
                                🔮 Lật tìm cặp đáp án!
                            </p>
                            <p className="text-white/40 text-xs">{timeLeft}s còn lại</p>
                        </div>

                        {/* Card Grid */}
                        <div
                            className="grid gap-3 w-full max-w-lg mx-auto flex-1 items-center"
                            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                        >
                            {cards.map((card, i) => {
                                const isFlipped = card.isFlipped || card.isMatched;
                                const isJustMatched = matchFlash === card.pairId && card.isMatched;
                                const backColor = CARD_BACKS[i % CARD_BACKS.length];

                                return (
                                    <motion.div
                                        key={card.id}
                                        layout
                                        className="relative cursor-pointer"
                                        style={{
                                            perspective: "800px",
                                            aspectRatio: "3/4",
                                        }}
                                        onClick={() => handleCardClick(card.id)}
                                        whileHover={!isFlipped ? { scale: 1.05 } : {}}
                                        whileTap={!isFlipped ? { scale: 0.95 } : {}}
                                    >
                                        <motion.div
                                            className="w-full h-full relative"
                                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            transition={{ duration: 0.5, type: "spring", stiffness: 300, damping: 25 }}
                                            style={{ transformStyle: "preserve-3d" }}
                                        >
                                            {/* Card Back */}
                                            <div
                                                className={`absolute inset-0 rounded-xl border-2 border-white/10 bg-gradient-to-br ${backColor} flex items-center justify-center`}
                                                style={{
                                                    backfaceVisibility: "hidden",
                                                    boxShadow: `0 0 15px ${nebula.glow}20, inset 0 0 20px rgba(255,255,255,0.05)`,
                                                }}
                                            >
                                                <div className="text-3xl opacity-30">✦</div>
                                                {/* Nebula pattern */}
                                                <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                                                    <div className="absolute inset-0" style={{
                                                        background: `radial-gradient(circle at 30% 30%, ${nebula.glow}15 0%, transparent 50%)`,
                                                    }} />
                                                </div>
                                            </div>

                                            {/* Card Front */}
                                            <div
                                                className={`absolute inset-0 rounded-xl border-2 flex items-center justify-center p-2 text-center
                                                    ${card.type === "question"
                                                        ? "bg-gradient-to-br from-purple-900/80 to-indigo-950/80 border-purple-400/40"
                                                        : "bg-gradient-to-br from-cyan-900/80 to-blue-950/80 border-cyan-400/40"
                                                    }
                                                    ${isJustMatched ? "border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)]" : ""}
                                                `}
                                                style={{
                                                    backfaceVisibility: "hidden",
                                                    transform: "rotateY(180deg)",
                                                }}
                                            >
                                                <span className={`font-bold text-sm leading-tight ${card.type === "question" ? "text-purple-200" : "text-cyan-200"}`}>
                                                    {card.type === "question" && <span className="text-xs block text-white/40 mb-1">❓</span>}
                                                    {card.text}
                                                </span>
                                                {card.isMatched && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="absolute top-1 right-1 text-emerald-400 text-sm"
                                                    >
                                                        ✓
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.div>

                                        {/* Match glow effect */}
                                        {isJustMatched && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
                                                transition={{ duration: 0.6 }}
                                                className="absolute inset-0 rounded-xl border-2 border-emerald-400 pointer-events-none"
                                                style={{ boxShadow: "0 0 30px rgba(52,211,153,0.5)" }}
                                            />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Hunter ability — Mascot */}
                        {playerClass === "hunter" && !hintUsed && player.abilityCharges > 0 && (
                            <MascotAbilityButton
                                onClick={handleHint}
                                disabled={hintUsed}
                                charges={player.abilityCharges}
                                label="Hé lộ cặp"
                                description="Hé lộ 1 cặp thẻ"
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
                            className="absolute inset-0 bg-[#0a0a2e]/95 flex flex-col items-center justify-center gap-5 z-20">
                            <motion.div
                                animate={{ rotateY: [0, 180, 360], scale: [1, 1.2, 1] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="text-7xl"
                                style={{ filter: "drop-shadow(0 0 30px #9333ea)" }}
                            >
                                🔮
                            </motion.div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                                Lật Tinh Vân
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Lật 2 thẻ để tìm cặp <span className="text-purple-300 font-bold">câu hỏi ↔ đáp án</span>!<br />
                                Nhớ vị trí các thẻ = <span className="text-neon-gold font-bold">combo bonus ✦!</span>
                            </p>
                            {playerClass && (
                                <div className="glass-card !p-3 !rounded-xl text-center border border-neon-gold/20">
                                    <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt</p>
                                    <p className="text-sm font-bold text-neon-gold">
                                        {playerClass === "warrior" && `🛡️ Miễn 1 lần sai (⚡${player.abilityCharges})`}
                                        {playerClass === "wizard" && "⏳ +10 giây mỗi vòng"}
                                        {playerClass === "hunter" && `🎯 Hé lộ 1 cặp thẻ (⚡${player.abilityCharges})`}
                                    </p>
                                </div>
                            )}
                            <button onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_25px_rgba(147,51,234,0.5)]">
                                BẮT ĐẦU LẬT TINH VÂN 🔮
                            </button>
                        </motion.div>
                    )}

                    {gameState === "roundComplete" && (
                        <motion.div key="rc" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0a0a2e]/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-5xl">🎉</div>
                            <h2 className="text-xl font-bold neon-text">Vòng {roundIdx + 1} hoàn thành!</h2>
                            <p className="text-neon-gold font-bold">{score} ✦</p>
                            <button onClick={() => startRound(roundIdx + 1)}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold hover:scale-105 transition-transform">
                                Vòng tiếp →
                            </button>
                        </motion.div>
                    )}

                    {gameState === "gameOver" && (
                        <motion.div key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0a0a2e]/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl">💥</div>
                            <h2 className="text-2xl font-bold text-red-400">Tinh vân vỡ tan!</h2>
                            <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} ✦</span></p>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold hover:scale-105 transition-transform">
                                    Thử lại 🔄
                                </button>
                                {onExit && <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10">Thoát</button>}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "win" && (
                        <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[#0a0a2e]/95 flex flex-col items-center justify-center gap-5 z-20">
                            <motion.div
                                animate={{ rotateY: [0, 360] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-6xl"
                                style={{ filter: "drop-shadow(0 0 30px #9333ea)" }}
                            >
                                🏆
                            </motion.div>
                            <h2 className="text-2xl font-bold neon-text">Tinh vân rực sáng!</h2>
                            <p className="text-neon-gold text-xl font-bold">{score} XP ⭐</p>
                            <div className="flex gap-3">
                                <button onClick={startGame}
                                    className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-bold hover:scale-105 transition-transform">
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
                <div className="text-xs text-white/40">🔮 Lật Tinh Vân · Vòng {roundIdx + 1}/{rounds.length}</div>
                {onExit && <button onClick={onExit} className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10">← Thoát</button>}
            </div>
        </div>
    );
}
