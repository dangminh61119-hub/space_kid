"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameLevel } from "@/lib/services/db";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useGame } from "@/lib/game-context";
import MascotAbilityButton from "@/components/MascotAbilityButton";

/* ─── Types ─── */
interface Meteor {
    id: string;
    text: string;
    isCorrect: boolean;
    x: number;
    y: number;
    speed: number;
    angle: number; // radians
    size: number;
    colorIdx: number;
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
const BASE_COSMO = 100;
const BASE_SPEED = 2.5;
const METEOR_COLORS = [
    { trail: "#00F5FF", body: "linear-gradient(135deg, #00F5FF, #0077B6)", glow: "0 0 20px #00F5FF88" },
    { trail: "#FF6BFF", body: "linear-gradient(135deg, #FF6BFF, #9D174D)", glow: "0 0 20px #FF6BFF88" },
    { trail: "#FFD700", body: "linear-gradient(135deg, #FFD700, #D97706)", glow: "0 0 20px #FFD70088" },
    { trail: "#7BFF7B", body: "linear-gradient(135deg, #7BFF7B, #065F46)", glow: "0 0 20px #7BFF7B88" },
    { trail: "#FF8C00", body: "linear-gradient(135deg, #FF8C00, #9A3412)", glow: "0 0 20px #FF8C0088" },
];
const COMBO_THRESHOLDS = [1, 1, 2, 3, 4];

let _uid = 0;
function uid() { return `m${++_uid}-${Math.random().toString(36).slice(2, 6)}`; }

/* ─── Component ─── */
export default function MeteorShowerGame({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false, paused = false,
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
    const [meteors, setMeteors] = useState<Meteor[]>([]);
    const [explodedIds, setExplodedIds] = useState<Set<string>>(new Set());
    const [shakenId, setShakenId] = useState<string | null>(null);
    const [levelsCompleted, setLevelsCompleted] = useState(0);
    const [showLevelBanner, setShowLevelBanner] = useState(false);
    const [shieldActive, setShieldActive] = useState(playerClass === "warrior");
    const [slowActive, setSlowActive] = useState(false);
    const [abilityUsed, setAbilityUsed] = useState(false);
    const [missedCorrect, setMissedCorrect] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<number>(0);
    const gameStateRef = useRef(gameState);
    const meteorsRef = useRef<Meteor[]>([]);
    const slowRef = useRef(false);
    const pausedRef = useRef(paused);

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { pausedRef.current = paused; }, [paused]);

    const currentLevel = levels[levelIdx];
    const currentQ = currentLevel?.questions[qIdx];
    const multiplier = COMBO_THRESHOLDS[Math.min(combo, COMBO_THRESHOLDS.length - 1)];

    /* ─── Spawn meteors for current question ─── */
    // Use a ref so the animation loop & handleMeteorClick always have fresh question data
    const currentQRef = useRef(currentQ);
    const levelIdxRef = useRef(levelIdx);
    useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);
    useEffect(() => { levelIdxRef.current = levelIdx; }, [levelIdx]);

    const spawnMeteors = useCallback(() => {
        const q = currentQRef.current;
        if (!q || !containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();

        const answers = [
            { text: q.correctWord, isCorrect: true },
            ...q.wrongWords.slice(0, 3).map((w: string) => ({ text: w, isCorrect: false })),
        ].sort(() => Math.random() - 0.5);

        const newMeteors: Meteor[] = answers.map((a, i) => {
            const fromRight = Math.random() > 0.3;
            const x = fromRight ? width + 50 : -120;
            const y = 60 + (i / answers.length) * (height - 160) + Math.random() * 40;
            const angle = fromRight
                ? Math.PI + (Math.random() - 0.5) * 0.6
                : (Math.random() - 0.5) * 0.6;
            return {
                id: uid(),
                text: a.text,
                isCorrect: a.isCorrect,
                x, y,
                speed: BASE_SPEED + (levelIdxRef.current * 0.3) + Math.random() * 0.8,
                angle,
                size: 56 + Math.random() * 16,
                colorIdx: Math.floor(Math.random() * METEOR_COLORS.length),
            };
        });
        meteorsRef.current = newMeteors;
        setMeteors(newMeteors);
        setMissedCorrect(false);
    }, []);

    /* ─── Start game ─── */
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
        setGameState("playing");
    }, [playBGM, playerClass]);

    /* ─── Advance question ─── */
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

    /* ─── Spawn on question change ─── */
    useEffect(() => {
        if (gameState === "playing" && currentQRef.current) spawnMeteors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, qIdx, levelIdx]);

    /* ─── Animation loop ─── */
    useEffect(() => {
        if (gameState !== "playing") { cancelAnimationFrame(animRef.current); return; }
        const container = containerRef.current;
        if (!container) return;

        const loop = () => {
            if (gameStateRef.current !== "playing") return;
            // Pause the animation when SummonOverlay is open
            if (pausedRef.current) {
                animRef.current = requestAnimationFrame(loop);
                return;
            }
            const { width } = container.getBoundingClientRect();
            const speedMult = slowRef.current ? 0.4 : 1;

            let correctMissed = false;
            meteorsRef.current = meteorsRef.current.map(m => {
                const nx = m.x + Math.cos(m.angle) * m.speed * speedMult;
                const ny = m.y + Math.sin(m.angle) * m.speed * speedMult * 0.3;

                // Check if meteor left the screen
                if (nx < -150 || nx > width + 150) {
                    if (m.isCorrect) correctMissed = true;
                }
                return { ...m, x: nx, y: ny };
            });

            if (correctMissed) {
                setMissedCorrect(true);
                setCombo(0);
                playWrong();
                setHp(h => {
                    const next = h - 1;
                    if (next <= 0) setGameState("gameOver");
                    return Math.max(0, next);
                });
                // Advance to next question
                setTimeout(() => advanceQuestionRef.current(), 600);
            }

            setMeteors([...meteorsRef.current]);
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);

    // advanceQuestion is defined above before the animation loop

    /* ─── Win/GameOver ─── */
    useEffect(() => {
        if (gameState === "win" || gameState === "gameOver") {
            stopBGM();
            cancelAnimationFrame(animRef.current);
            onGameComplete?.(score, levelsCompleted);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, score, levelsCompleted]);

    /* ─── Wizard slow ─── */
    useEffect(() => {
        if (!slowActive) return;
        slowRef.current = true;
        const t = setTimeout(() => { slowRef.current = false; setSlowActive(false); }, 5000);
        return () => clearTimeout(t);
    }, [slowActive]);

    /* ─── Click meteor ─── */
    const handleMeteorClick = useCallback((meteor: Meteor) => {
        if (gameState !== "playing" || explodedIds.has(meteor.id)) return;

        if (meteor.isCorrect) {
            playCorrect();
            const newCombo = combo + 1;
            const mult = COMBO_THRESHOLDS[Math.min(newCombo, COMBO_THRESHOLDS.length - 1)];
            setCombo(newCombo);
            if (newCombo === 3) addAbilityCharges(1); // Combo reward
            setScore(s => s + BASE_COSMO * mult);
            setExplodedIds(new Set(meteorsRef.current.map(m => m.id)));
            onAnswered?.(currentQRef.current?.id ?? "", true, currentLevel?.subject || "", currentQRef.current?.bloomLevel ?? 1);
            setTimeout(() => {
                setExplodedIds(new Set());
                advanceQuestionRef.current();
            }, 600);
        } else {
            playWrong();
            onAnswered?.(currentQRef.current?.id ?? "", false, currentLevel?.subject || "", currentQRef.current?.bloomLevel ?? 1);
            if (shieldActive && playerClass === "warrior") {
                setShieldActive(false);
                // Shield consumed passively, charge was spent on game start
            } else {
                setCombo(0);
                setHp(h => {
                    const next = h - 1;
                    if (next <= 0) setGameState("gameOver");
                    return Math.max(0, next);
                });
            }
            setShakenId(meteor.id);
            setTimeout(() => setShakenId(null), 500);
        }
    }, [gameState, combo, explodedIds, shieldActive, playerClass, currentLevel]);

    /* ─── Ability ─── */
    const useAbility = useCallback(() => {
        if (abilityUsed || gameState !== "playing") return;
        if (!useAbilityChargeRef.current()) return; // No charges left
        setAbilityUsed(true);
        if (playerClass === "wizard") setSlowActive(true);
        else if (playerClass === "hunter") {
            // Highlight wrong meteors in red
        }
    }, [abilityUsed, gameState, playerClass]);

    const abilityInfo = {
        warrior: { label: "Khiên Thép", icon: "🛡️", desc: `Miễn 1 lần sai (⚡${player.abilityCharges})` },
        wizard: { label: "Hạ Tốc Độ", icon: "🌀", desc: `Chậm 60% 5s (⚡${player.abilityCharges})` },
        hunter: { label: "Tầm Nhiệt", icon: "🔥", desc: `Soi sáng sao sai (⚡${player.abilityCharges})` },
    };
    const ability = playerClass ? abilityInfo[playerClass] : null;

    /* ─── Main render (always mounts container for proper height) ─── */
    const isWin = gameState === "win";
    const endStars = hp >= 3 ? 3 : hp >= 2 ? 2 : 1;
    return (
        <div className="flex-1 flex flex-col min-h-0 relative select-none min-h-[500px]">
            <style>{`
                @keyframes meteorTrail { 0% { opacity: 0.8; transform: scaleX(1); } 100% { opacity: 0; transform: scaleX(0); } }
                @keyframes meteorExplode { 0% { transform: scale(1); opacity:1; } 50% { transform: scale(2); opacity:0.6; } 100% { transform: scale(3); opacity:0; } }
                @keyframes meteorShake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
                @keyframes missFlash { 0%,100% { opacity: 0; } 50% { opacity: 0.15; } }
                .meteor-exploding { animation: meteorExplode 0.6s ease-out forwards !important; pointer-events: none; }
                .meteor-shaking { animation: meteorShake 0.4s ease-in-out; }
            `}</style>

            {/* HUD */}
            <div className="z-10 px-4 pt-2 pb-1 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className="text-xl transition-all duration-300"
                            style={{ filter: i < hp ? "drop-shadow(0 0 6px #FF6B6B)" : "grayscale(1) opacity(0.3)" }}>
                            {i < hp ? "❤️" : "🖤"}
                        </span>
                    ))}
                </div>
                <div className="flex-1 text-center">
                    <div className="glass-card !p-2 !px-5 !rounded-full inline-block">
                        <span className="text-white font-bold text-base sm:text-lg">{currentQ?.question}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {combo >= 3 && (
                        <div className="text-neon-gold font-black text-sm px-2 py-1 rounded-lg glass-card animate-pulse">
                            ×{multiplier} 🔥
                        </div>
                    )}
                    <div className="glass-card !p-2 !px-3 !rounded-xl">
                        <div className="text-neon-gold font-bold text-sm">{score.toLocaleString()}</div>
                        <div className="text-white/40 text-xs">✦</div>
                    </div>
                </div>
            </div>

            {/* Game Field */}
            <div
                ref={containerRef}
                className="relative flex-1 overflow-hidden rounded-2xl mx-3 mb-3"
                style={{
                    background: "radial-gradient(ellipse at 50% 20%, #1a0533 0%, #06020d 100%)",
                    filter: calmMode ? "saturate(0.3)" : "none",
                }}
            >
                {/* Level indicator */}
                <div className="absolute top-3 left-3 glass-card !p-1 !px-3 !rounded-full !text-xs text-white/50 z-10">
                    {currentLevel?.subject} · Level {currentLevel?.level}
                </div>

                {/* Ability button — Mascot */}
                {ability && (
                    <MascotAbilityButton
                        onClick={useAbility}
                        disabled={abilityUsed || gameState !== "playing"}
                        charges={player.abilityCharges}
                        label={ability.label}
                        description={ability.desc}
                        position="bottom-right"
                    />
                )}

                {/* Shield indicator */}
                {playerClass === "warrior" && shieldActive && (
                    <div className="absolute bottom-4 left-4 glass-card !p-2 !rounded-xl z-10 flex items-center gap-2">
                        <span className="text-lg">🛡️</span>
                        <span className="text-xs text-neon-gold">Khiên sẵn sàng</span>
                    </div>
                )}

                {/* Slow overlay */}
                {slowActive && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                        <div className="text-5xl animate-pulse" style={{ filter: "drop-shadow(0 0 30px #FF8C00)" }}>🌀</div>
                    </div>
                )}

                {/* Miss flash */}
                <AnimatePresence>
                    {missedCorrect && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.15 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-red-500 z-20 pointer-events-none"
                        />
                    )}
                </AnimatePresence>

                {/* Meteors */}
                {meteors.map((m) => {
                    const color = METEOR_COLORS[m.colorIdx];
                    const isExploding = explodedIds.has(m.id);
                    const isShaking = shakenId === m.id;
                    const isHunterHighlight = abilityUsed && playerClass === "hunter" && !m.isCorrect;
                    return (
                        <div
                            key={m.id}
                            onClick={() => handleMeteorClick(m)}
                            className={`absolute cursor-pointer transition-none
                                ${isExploding ? "meteor-exploding" : ""}
                                ${isShaking ? "meteor-shaking" : ""}
                            `}
                            style={{
                                left: m.x,
                                top: m.y,
                                width: m.size * 2,
                                height: m.size,
                                zIndex: 5,
                            }}
                        >
                            {/* Trail */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 right-0 h-3/5 rounded-full pointer-events-none"
                                style={{
                                    width: "120%",
                                    background: `linear-gradient(to left, ${color.trail}00, ${color.trail}88)`,
                                    filter: `blur(4px)`,
                                }}
                            />
                            {/* Body */}
                            <div
                                className="absolute top-0 left-0 flex items-center justify-center rounded-full"
                                style={{
                                    width: m.size,
                                    height: m.size,
                                    background: color.body,
                                    boxShadow: isHunterHighlight
                                        ? "0 0 20px #FF4444, 0 0 40px #FF444466"
                                        : color.glow,
                                    border: isHunterHighlight ? "2px solid #FF4444" : "1px solid rgba(255,255,255,0.2)",
                                }}
                            >
                                <span
                                    className="font-bold text-white text-center px-1 leading-tight drop-shadow-lg"
                                    style={{ fontSize: m.text.length > 10 ? "10px" : m.text.length > 6 ? "12px" : "14px" }}
                                >
                                    {m.text}
                                </span>
                                {/* Shine */}
                                <div className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />
                            </div>
                        </div>
                    );
                })}

                {/* Level Banner */}
                {showLevelBanner && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="glass-card !p-6 !px-12 text-center"
                        >
                            <div className="text-4xl mb-2">☄️</div>
                            <div className="text-2xl font-black text-neon-gold">Level {levelIdx + 1} hoàn thành!</div>
                            <div className="text-white/60 text-sm mt-1">Chuẩn bị đợt thiên thạch tiếp...</div>
                        </motion.div>
                    </div>
                )}

                {/* Combo streak */}
                {combo >= 3 && (
                    <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full font-black text-sm text-white"
                        style={{ background: "linear-gradient(90deg, #FF8C00, #FF4444)", boxShadow: "0 0 15px #FF8C0088" }}>
                        🔥 {combo} liên tiếp!
                    </div>
                )}
            </div>

            {/* ─── OVERLAYS: Ready / Win / GameOver ─── */}
            <AnimatePresence>
                {gameState === "ready" && (
                    <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-6 z-30">
                        <div className="text-6xl animate-float">☄️</div>
                        <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text text-center">
                            Mưa Thiên Thạch
                        </h2>
                        <p className="text-white/60 text-sm text-center max-w-md px-4 leading-relaxed">
                            Thiên thạch mang đáp án bay qua bầu trời!<br />
                            Nhấn vào thiên thạch <span className="text-neon-gold font-bold">ĐÚNG</span> trước khi nó bay mất!
                        </p>
                        {levels[0] && (
                            <div className="glass-card !p-3 !rounded-xl text-center">
                                <p className="text-xs text-white/50">Level {levels[0].level} · {levels[0].title}</p>
                                <p className="text-sm font-bold text-white">{levels[0].subject}</p>
                            </div>
                        )}
                        <button
                            onClick={startGame}
                            className="px-8 py-3 rounded-full text-white font-bold text-lg hover:scale-105 transition-transform"
                            style={{ background: "linear-gradient(90deg, #FF8C00, #FF4444)", boxShadow: "0 0 25px rgba(255,140,0,0.5)" }}
                        >
                            SĂN THIÊN THẠCH ☄️
                        </button>
                        {onExit && (
                            <button onClick={onExit} className="mt-2 text-sm text-white/40 hover:text-white transition-colors">
                                ← Thoát
                            </button>
                        )}
                    </motion.div>
                )}

                {(gameState === "win" || gameState === "gameOver") && (
                    <motion.div key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-space-deep/95 flex flex-col items-center justify-center gap-5 z-30">
                        <div className="text-6xl">{isWin ? "🏆" : "☄️"}</div>
                        <h2 className="text-3xl font-bold text-white font-[var(--font-heading)]">
                            {isWin ? "Bão thiên thạch đã qua!" : "Thiên thạch quá mạnh..."}
                        </h2>
                        <div className="flex justify-center gap-1 text-3xl">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i} className={i < endStars ? "text-yellow-400" : "text-white/20"}>⭐</span>
                            ))}
                        </div>
                        <div className="glass-card !bg-white/5 !p-4 space-y-2 min-w-[280px]">
                            <div className="flex justify-between text-white/70"><span>Tổng điểm</span><span className="font-bold text-neon-gold">{score.toLocaleString()} ✦</span></div>
                            <div className="flex justify-between text-white/70"><span>Levels hoàn thành</span><span className="font-bold text-white">{levelsCompleted}/{levels.length}</span></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={startGame} className="px-6 py-3 rounded-full font-bold text-white shadow-[0_0_15px_rgba(255,140,0,0.5)] hover:scale-105 transition-transform"
                                style={{ background: "linear-gradient(90deg,#FF8C00,#FF4444)" }}>
                                Chơi lại 🔄
                            </button>
                            {onExit && (
                                <button onClick={onExit} className="px-6 py-3 rounded-full font-bold text-white border border-white/20 hover:bg-white/10 transition-colors">
                                    Thoát 🗺
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
