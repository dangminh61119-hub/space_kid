"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize, Minimize } from "lucide-react";
import type { GameLevel } from "@/lib/services/db";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useGame } from "@/lib/game-context";
import MascotAbilityButton from "@/components/MascotAbilityButton";
import VolumeControl from "./VolumeControl";
import ParticleBurst from "@/components/effects/ParticleBurst";
import FloatingText from "@/components/effects/FloatingText";
import ConfettiShower from "@/components/effects/ConfettiShower";
import WarpSpeed from "@/components/effects/WarpSpeed";

/* ─── Types ─── */
interface MatchPair {
    id: string;
    left: string;   // question side
    right: string;   // answer side
}

interface BridgeRound {
    title: string;
    pairs: MatchPair[];
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
const BONUS_PERFECT = 200;
const PAIR_COLORS = [
    { line: "#00F5FF", bg: "rgba(0,245,255,0.15)", border: "rgb(0,245,255)" },
    { line: "#FF6B9D", bg: "rgba(255,107,157,0.15)", border: "rgb(255,107,157)" },
    { line: "#50E3C2", bg: "rgba(80,227,194,0.15)", border: "rgb(80,227,194)" },
    { line: "#FFD700", bg: "rgba(255,215,0,0.15)", border: "rgb(255,215,0)" },
    { line: "#C084FC", bg: "rgba(192,132,252,0.15)", border: "rgb(192,132,252)" },
    { line: "#FB923C", bg: "rgba(251,146,60,0.15)", border: "rgb(251,146,60)" },
];

/* ─── Generate rounds from question data ─── */
function generateRounds(levels: GameLevel[]): BridgeRound[] {
    const rounds: BridgeRound[] = [];

    for (const level of levels) {
        const qs = level.questions;
        // Take groups of 4-5 questions for each round
        for (let start = 0; start < qs.length; start += 4) {
            const chunk = qs.slice(start, start + 4);
            if (chunk.length < 3) continue;

            rounds.push({
                title: level.title || level.subject,
                pairs: chunk.map((q, i) => ({
                    id: `${start + i}`,
                    left: q.question,
                    right: q.correctWord,
                })),
            });
        }
    }

    return rounds.length > 0 ? rounds : getDefaultRounds();
}

function getDefaultRounds(): BridgeRound[] {
    return [
        {
            title: "Tiếng Anh - Tiếng Việt",
            pairs: [
                { id: "a1", left: "Cat", right: "Mèo" },
                { id: "a2", left: "Dog", right: "Chó" },
                { id: "a3", left: "Fish", right: "Cá" },
                { id: "a4", left: "Bird", right: "Chim" },
            ],
        },
        {
            title: "Thủ đô các nước",
            pairs: [
                { id: "b1", left: "Việt Nam", right: "Hà Nội" },
                { id: "b2", left: "Nhật Bản", right: "Tokyo" },
                { id: "b3", left: "Pháp", right: "Paris" },
                { id: "b4", left: "Thái Lan", right: "Bangkok" },
            ],
        },
        {
            title: "Phép tính",
            pairs: [
                { id: "c1", left: "3 + 4", right: "7" },
                { id: "c2", left: "5 × 2", right: "10" },
                { id: "c3", left: "12 - 5", right: "7" },
                { id: "c4", left: "9 ÷ 3", right: "3" },
            ],
        },
    ];
}

/* ─── Component ─── */
export default function CosmoBridgeGame({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false, paused = false,
}: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const { player, useAbilityCharge, addAbilityCharges } = useGame();
    const useAbilityChargeRef = useRef(useAbilityCharge);
    useEffect(() => { useAbilityChargeRef.current = useAbilityCharge; }, [useAbilityCharge]);
    const [gameState, setGameState] = useState<"ready" | "playing" | "roundComplete" | "gameOver" | "win">("ready");
    const [rounds, setRounds] = useState<BridgeRound[]>([]);
    const [roundIdx, setRoundIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [matches, setMatches] = useState<Record<string, string>>({}); // leftId → rightId
    const [matchColors, setMatchColors] = useState<Record<string, number>>({}); // leftId → colorIdx
    const [wrongFlash, setWrongFlash] = useState<string | null>(null);
    const [shieldUsed, setShieldUsed] = useState(false);
    const [autoMatched, setAutoMatched] = useState(false);
    const [abilityNotice, setAbilityNotice] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [shuffledRight, setShuffledRight] = useState<MatchPair[]>([]);
    const [nextColorIdx, setNextColorIdx] = useState(0);

    // Visual Effects
    const [particleData, setParticleData] = useState<{ x: number; y: number; type: "correct" | "wrong" | "combo" } | null>(null);
    const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; x: number; y: number; color?: string; size?: "sm" | "md" | "lg" | "xl" }[]>([]);
    const spawnText = useCallback((text: string, x: number, y: number, color?: string, size?: "sm" | "md" | "lg" | "xl") => {
        const id = Math.random().toString(36).substring(7);
        setFloatingTexts(prev => [...prev, { id, text, x, y, color, size }]);
    }, []);

    const containerRef = useRef<HTMLDivElement>(null);
    const round = rounds[roundIdx];

    /* ─── Generate rounds ─── */
    useEffect(() => {
        setRounds(generateRounds(levels));
    }, [levels]);

    /* ─── Start ─── */
    const startGame = () => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setShieldUsed(false);
        setAutoMatched(false);
        startRound(0);
    };

    const startRound = (idx: number) => {
        setRoundIdx(idx);
        const r = rounds[idx];
        if (!r) return;
        setMatches({});
        setMatchColors({});
        setSelectedLeft(null);
        setWrongFlash(null);
        setAutoMatched(false);
        setNextColorIdx(0);
        setShuffledRight([...r.pairs].sort(() => Math.random() - 0.5));
        setGameState("playing");
    };

    /* ─── Select left ─── */
    const handleSelectLeft = (pairId: string) => {
        if (matches[pairId]) return; // already matched
        setSelectedLeft(prev => prev === pairId ? null : pairId);
    };

    /* ─── Select right (attempt match) ─── */
    const handleSelectRight = useCallback((rightPairId: string, ev: React.MouseEvent) => {
        if (!selectedLeft || !round) return;
        // Check: is rightPairId already matched?
        if (Object.values(matches).includes(rightPairId)) return;

        const isCorrect = selectedLeft === rightPairId;

        // Position for effects
        const rect = (ev.currentTarget as HTMLElement).getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top;

        if (isCorrect) {
            playCorrect();
            const colorIdx = nextColorIdx;
            setNextColorIdx(c => (c + 1) % PAIR_COLORS.length);
            setMatches(prev => ({ ...prev, [selectedLeft]: rightPairId }));
            setMatchColors(prev => ({ ...prev, [selectedLeft]: colorIdx }));

            // Visuals
            setParticleData({ x, y, type: "correct" });
            const color = PAIR_COLORS[colorIdx];
            spawnText(`+${BASE_COSMO}`, x, y, color.line, "md");

            setScore(s => s + BASE_COSMO);
            onAnswered?.("", true, levels[0]?.subject ?? "", 2);
        } else {
            playWrong();
            setWrongFlash(rightPairId);
            setParticleData({ x, y, type: "wrong" });
            spawnText("Trượt!", x, y, "#FF4444", "sm");

            onAnswered?.("", false, levels[0]?.subject ?? "", 2);

            if (playerClass === "warrior" && !shieldUsed) {
                const charged = useAbilityChargeRef.current();
                if (charged) {
                    setShieldUsed(true);
                    setAbilityNotice("🛡️ Lá chắn bảo vệ!");
                    setTimeout(() => setAbilityNotice(null), 1500);
                } else {
                    setHp(prev => {
                        const n = prev - 1;
                        if (n <= 0) {
                            setTimeout(() => {
                                stopBGM();
                                onGameComplete?.(score, 0);
                                setGameState("gameOver");
                            }, 500);
                        }
                        return n;
                    });
                }
            } else if (playerClass !== "warrior") {
                setHp(prev => {
                    const n = prev - 1;
                    if (n <= 0) {
                        setTimeout(() => {
                            stopBGM();
                            onGameComplete?.(score, 0); // 0 = lose
                            setGameState("gameOver");
                        }, 500);
                    }
                    return n;
                });
            }

            setTimeout(() => setWrongFlash(null), 600);
        }

        setSelectedLeft(null);
    }, [selectedLeft, round, matches, nextColorIdx, playerClass, shieldUsed, score, roundIdx, hp, playCorrect, playWrong, spawnText, onGameComplete, levels, onAnswered, stopBGM]);

    /* ─── Hunter: auto-match one pair ─── */
    const handleAutoMatch = () => {
        if (playerClass !== "hunter" || autoMatched || !round) return;
        if (!useAbilityChargeRef.current()) return; // No charges
        const unmatched = round.pairs.filter(p => !matches[p.id]);
        if (unmatched.length === 0) return;

        const pair = unmatched[0];
        const colorIdx = nextColorIdx;
        setNextColorIdx(c => (c + 1) % PAIR_COLORS.length);
        setAutoMatched(true);
        setMatches(prev => ({ ...prev, [pair.id]: pair.id }));
        setMatchColors(prev => ({ ...prev, [pair.id]: colorIdx }));
        setScore(s => s + BASE_COSMO);
        setAbilityNotice("🎯 Tự nối 1 cặp!");
        setTimeout(() => setAbilityNotice(null), 1500);
    };

    /* ─── Check round completion ─── */
    useEffect(() => {
        if (gameState !== "playing" || !round) return;

        const unmatched = round.pairs.filter(p => !matches[p.id]);
        if (unmatched.length === 0) {
            setTimeout(() => {
                if (roundIdx + 1 >= rounds.length) {
                    stopBGM();
                    onGameComplete?.(score + BONUS_PERFECT, rounds.length);
                    setGameState("win");
                } else {
                    setGameState("roundComplete");
                }
            }, 600);
        }
    }, [matches, gameState]);

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

    /* ─── Render ─── */
    return (
        <div ref={containerRef} className={`w-full max-w-4xl mx-auto flex flex-col gap-4 ${isFullscreen ? 'bg-slate-950 p-4 justify-center py-10 overflow-hidden h-screen overflow-y-auto' : ''}`}>

            {/* HUD */}
            <div className={`flex items-center justify-between glass-card-strong !rounded-2xl px-4 py-3 ${isFullscreen ? 'max-w-[700px] mx-auto w-full' : ''}`}>
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className={`text-xl transition-all ${i < hp ? "opacity-100 scale-100" : "opacity-20 scale-75"}`}>❤️</span>
                    ))}
                    {playerClass === "warrior" && !shieldUsed && player.abilityCharges > 0 && <span className="text-xl ml-1 animate-pulse">🛡️</span>}
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
                    <span className="text-neon-cyan font-bold text-lg">{score}</span>
                    <span className="text-white/40 text-xs">✦</span>
                    {gameState === "playing" && <VolumeControl />}
                    <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition-colors">
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                </div>
            </div>

            {/* ─── MAIN AREA ─── */}
            <div className={`relative rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex flex-col ${isFullscreen ? 'max-w-[800px] w-full mx-auto flex-1 my-2' : 'min-h-[450px]'}`}
                style={{ filter: calmMode ? 'saturate(0.3)' : 'none' }}>

                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-pink-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl" />
                </div>

                {/* Global Overlays */}
                {particleData && <ParticleBurst x={particleData.x} y={particleData.y} type={particleData.type} count={20} onDone={() => setParticleData(null)} />}
                {floatingTexts.map(t => (
                    <FloatingText key={t.id} id={t.id} text={t.text} x={t.x} y={t.y} color={t.color} size={t.size} onComplete={(id) => setFloatingTexts(p => p.filter(x => x.id !== id))} />
                ))}

                {/* Playing */}
                {gameState === "playing" && round && (
                    <div className="relative z-10 flex-1 flex flex-col items-center px-6 py-6 gap-4">
                        {/* Round info */}
                        <div className="text-center">
                            <p className="text-white/40 text-xs">Vòng {roundIdx + 1}/{rounds.length}</p>
                            <p className="text-lg font-bold text-white font-[var(--font-heading)]">🌉 {round.title}</p>
                            <p className="text-white/40 text-xs mt-1">Chọn bên trái → chọn bên phải để nối</p>
                        </div>

                        {/* Matching area: two columns */}
                        <div className="flex gap-6 sm:gap-10 w-full max-w-lg justify-center flex-1 items-center">
                            {/* Left column */}
                            <div className="flex flex-col gap-3 flex-1">
                                {round.pairs.map((pair) => {
                                    const matched = !!matches[pair.id];
                                    const colorIdx = matchColors[pair.id];
                                    const color = colorIdx !== undefined ? PAIR_COLORS[colorIdx] : null;

                                    return (
                                        <motion.button
                                            key={`L-${pair.id}`}
                                            onClick={() => !matched && handleSelectLeft(pair.id)}
                                            disabled={matched}
                                            whileHover={!matched ? { scale: 1.03 } : {}}
                                            whileTap={!matched ? { scale: 0.97 } : {}}
                                            className={`
                                                py-3 px-4 rounded-xl font-semibold text-sm text-left
                                                border-2 transition-all duration-200
                                                ${matched
                                                    ? `text-white/70`
                                                    : selectedLeft === pair.id
                                                        ? "border-cyan-400 bg-cyan-400/20 text-cyan-200 shadow-[0_0_20px_rgba(0,245,255,0.3)]"
                                                        : "border-white/10 bg-white/5 text-white hover:border-cyan-400/30"
                                                }
                                            `}
                                            style={matched && color ? {
                                                borderColor: color.border,
                                                backgroundColor: color.bg,
                                            } : {}}
                                        >
                                            {matched && <span className="mr-1.5">✓</span>}
                                            {pair.left}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Bridge indicator */}
                            <div className="flex flex-col justify-center items-center gap-3 w-4">
                                {round.pairs.map((pair) => {
                                    const matched = !!matches[pair.id];
                                    const colorIdx = matchColors[pair.id];
                                    const color = colorIdx !== undefined ? PAIR_COLORS[colorIdx] : null;

                                    return (
                                        <motion.div
                                            key={`bridge-${pair.id}`}
                                            className="w-full h-8 flex items-center justify-center"
                                        >
                                            {matched ? (
                                                <motion.div
                                                    initial={{ scaleX: 0 }}
                                                    animate={{ scaleX: 1 }}
                                                    className="w-full h-0.5 rounded-full"
                                                    style={{ backgroundColor: color?.line ?? "#fff" }}
                                                />
                                            ) : (
                                                <div className="w-full border-t border-dashed border-white/10" />
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Right column (shuffled) */}
                            <div className="flex flex-col gap-3 flex-1">
                                {shuffledRight.map((pair) => {
                                    const matchedId = Object.entries(matches).find(([, v]) => v === pair.id)?.[0];
                                    const matched = !!matchedId;
                                    const colorIdx = matchedId ? matchColors[matchedId] : undefined;
                                    const color = colorIdx !== undefined ? PAIR_COLORS[colorIdx] : null;
                                    const isWrong = wrongFlash === pair.id;

                                    return (
                                        <motion.button
                                            key={`R-${pair.id}`}
                                            onClick={(ev) => !matched && handleSelectRight(pair.id, ev as any)}
                                            disabled={matched || !selectedLeft}
                                            whileHover={!matched && selectedLeft ? { scale: 1.03 } : {}}
                                            whileTap={!matched && selectedLeft ? { scale: 0.97 } : {}}
                                            animate={isWrong ? {
                                                x: [0, -6, 6, -6, 6, 0],
                                                borderColor: ["rgb(248,113,113)", "rgb(248,113,113)"],
                                            } : {}}
                                            transition={isWrong ? { duration: 0.4 } : {}}
                                            className={`
                                                py-3 px-4 rounded-xl font-semibold text-sm text-right
                                                border-2 transition-all duration-200
                                                ${matched
                                                    ? `text-white/70`
                                                    : isWrong
                                                        ? "border-red-400 bg-red-400/10 text-red-300"
                                                        : selectedLeft
                                                            ? "border-white/10 bg-white/5 text-white hover:border-pink-400/30 hover:bg-pink-400/10 cursor-pointer"
                                                            : "border-white/10 bg-white/5 text-white/40 cursor-default"
                                                }
                                            `}
                                            style={matched && color ? {
                                                borderColor: color.border,
                                                backgroundColor: color.bg,
                                            } : {}}
                                        >
                                            {pair.right}
                                            {matched && <span className="ml-1.5">✓</span>}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Hunter ability — Mascot */}
                        {playerClass === "hunter" && !autoMatched && player.abilityCharges > 0 && (
                            <MascotAbilityButton
                                onClick={handleAutoMatch}
                                disabled={autoMatched}
                                charges={player.abilityCharges}
                                label="Tự nối cặp"
                                description="Nối đúng 1 cặp"
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
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl animate-float">🌉</div>
                            <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-cyan-400">
                                Cầu Nối Tri Thức
                            </h2>
                            <p className="text-white/60 text-sm text-center max-w-md px-4">
                                Chọn bên trái, rồi nối với bên phải!<br />
                                Nối đúng hết = <span className="text-neon-gold font-bold">bonus ✦!</span> 🌟
                            </p>
                            {playerClass && (
                                <div className="glass-card !p-3 !rounded-xl text-center border border-neon-gold/20">
                                    <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt</p>
                                    <p className="text-sm font-bold text-neon-gold">
                                        {playerClass === "warrior" && `🛡️ 1 cặp sai không mất HP (⚡${player.abilityCharges})`}
                                        {playerClass === "wizard" && "⏳ +15 giây mỗi vòng"}
                                        {playerClass === "hunter" && `🎯 Tự nối 1 cặp (⚡${player.abilityCharges})`}
                                    </p>
                                </div>
                            )}
                            <button onClick={startGame}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_25px_rgba(236,72,153,0.4)]">
                                BẮT ĐẦU NỐI CẦU 🌉
                            </button>
                        </motion.div>
                    )}

                    {gameState === "roundComplete" && (
                        <motion.div key="rc" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20 overflow-hidden">
                            <WarpSpeed active={true} color="#FF6BFF" />
                            <div className="text-5xl z-10">🎉</div>
                            <h2 className="text-xl font-bold neon-text z-10">Vòng {roundIdx + 1} hoàn thành!</h2>
                            <p className="text-neon-gold font-bold z-10">{score} ✦</p>
                            <button onClick={() => startRound(roundIdx + 1)}
                                className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold hover:scale-105 transition-transform z-10">
                                Vòng tiếp →
                            </button>
                        </motion.div>
                    )}

                    {gameState === "gameOver" && (
                        <motion.div key="go" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <div className="text-6xl">💥</div>
                            <h2 className="text-2xl font-bold text-red-400">Cầu bị sập!</h2>
                            <p className="text-white/60">Điểm: <span className="text-neon-cyan font-bold">{score} ✦</span></p>
                            <div className="flex gap-3">
                                <button onClick={startGame} className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold hover:scale-105 transition-transform">Thử lại 🔄</button>
                                {onExit && <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10">Thoát</button>}
                            </div>
                        </motion.div>
                    )}

                    {gameState === "win" && (
                        <motion.div key="win" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-20">
                            <ConfettiShower />
                            <div className="text-6xl animate-float z-10">🏆</div>
                            <h2 className="text-2xl font-bold neon-text z-10">Cầu nối hoàn hảo!</h2>
                            <p className="text-neon-gold text-xl font-bold z-10">{score} XP ⭐</p>
                            <div className="flex gap-3 z-10">
                                <button onClick={startGame} className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-bold hover:scale-105 transition-transform">Chơi lại 🔄</button>
                                {onExit && <button onClick={onExit} className="px-6 py-3 rounded-full border border-white/20 text-white/60 hover:bg-white/10">Về bản đồ 🗺</button>}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between glass-card !rounded-xl px-4 py-2">
                <div className="text-xs text-white/40">🌉 Cầu Nối Tri Thức · Vòng {roundIdx + 1}/{rounds.length}</div>
                {onExit && <button onClick={onExit} className="text-xs px-3 py-1.5 rounded-full border border-white/20 text-white/60 hover:bg-white/10">← Thoát</button>}
            </div>
        </div>
    );
}
