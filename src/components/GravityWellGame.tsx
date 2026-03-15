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
interface OrbData {
    id: string;
    text: string;
    isCorrect: boolean;
    angle: number;      // current angle in radians
    orbitRadius: number; // distance from center
    speed: number;       // radians per frame
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
const ORB_SIZE = 70;
const GRAVITY_SHRINK = 0.15; // radius shrinks per second
const MIN_RADIUS = 35;       // black hole radius — orb "absorbed" below this
const INITIAL_RADIUS_MIN = 140;
const INITIAL_RADIUS_MAX = 200;

const ORB_STYLES = [
    { bg: "linear-gradient(135deg, #00F5FF, #0077B6)", glow: "#00F5FF", border: "#00F5FF" },
    { bg: "linear-gradient(135deg, #FF6BFF, #9D174D)", glow: "#FF6BFF", border: "#FF6BFF" },
    { bg: "linear-gradient(135deg, #FFD700, #D97706)", glow: "#FFD700", border: "#FFD700" },
    { bg: "linear-gradient(135deg, #00FF88, #065F46)", glow: "#00FF88", border: "#00FF88" },
    { bg: "linear-gradient(135deg, #FF8C00, #9A3412)", glow: "#FF8C00", border: "#FF8C00" },
    { bg: "linear-gradient(135deg, #C084FC, #6B21A8)", glow: "#C084FC", border: "#C084FC" },
];

function uid() { return Math.random().toString(36).slice(2, 9); }

/* ─── Component ─── */
export default function GravityWellGame({
    levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false, paused = false,
}: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const { player, useAbilityCharge, addAbilityCharges } = useGame();
    const useAbilityChargeRef = useRef(useAbilityCharge);
    useEffect(() => { useAbilityChargeRef.current = useAbilityCharge; }, [useAbilityCharge]);

    const [gameState, setGameState] = useState<"ready" | "playing" | "win" | "gameOver">("ready");
    const [score, setScore] = useState(0);
    const [hp, setHp] = useState(MAX_HP);
    const [combo, setCombo] = useState(0);
    const [levelIdx, setLevelIdx] = useState(0);
    const [qIdx, setQIdx] = useState(0);
    const [orbs, setOrbs] = useState<OrbData[]>([]);
    const [absorbed, setAbsorbed] = useState<Set<string>>(new Set());
    const [shieldUsed, setShieldUsed] = useState(false);
    const [frozenActive, setFrozenActive] = useState(false);
    const [hintOrbId, setHintOrbId] = useState<string | null>(null);
    const [abilityUsed, setAbilityUsed] = useState(false);
    const [abilityNotice, setAbilityNotice] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [blackHolePulse, setBlackHolePulse] = useState(false);
    const [showCorrectFlash, setShowCorrectFlash] = useState<string | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const fieldRef = useRef<HTMLDivElement>(null);
    const orbElemsRef = useRef<(HTMLDivElement | null)[]>([]);
    const orbDataRef = useRef<OrbData[]>([]);
    const animRef = useRef<number>(0);
    const frozenRef = useRef(false);
    const gameStateRef = useRef(gameState);
    const absorbedRef = useRef<Set<string>>(new Set());
    const interactableRef = useRef(true);
    const centerRef = useRef({ x: 0, y: 0 });

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
    useEffect(() => { frozenRef.current = frozenActive; }, [frozenActive]);
    useEffect(() => { absorbedRef.current = absorbed; }, [absorbed]);

    const currentLevel = levels[levelIdx];
    const currentQ = currentLevel?.questions[qIdx];

    /* ─── Init orbs for question ─── */
    const initOrbs = useCallback(() => {
        if (!currentQ || !fieldRef.current) return;
        const { width, height } = fieldRef.current.getBoundingClientRect();
        centerRef.current = { x: width / 2, y: height / 2 };

        const pool: OrbData[] = [
            { id: uid(), text: currentQ.correctWord, isCorrect: true, angle: 0, orbitRadius: 0, speed: 0, colorIdx: 0 },
            ...currentQ.wrongWords.slice(0, 4).map((w) => ({
                id: uid(), text: w, isCorrect: false, angle: 0, orbitRadius: 0, speed: 0,
                colorIdx: Math.floor(Math.random() * ORB_STYLES.length),
            })),
        ].sort(() => Math.random() - 0.5);

        // Distribute on different orbits
        pool.forEach((orb, i) => {
            orb.angle = (i / pool.length) * Math.PI * 2 + Math.random() * 0.3;
            orb.orbitRadius = INITIAL_RADIUS_MIN + Math.random() * (INITIAL_RADIUS_MAX - INITIAL_RADIUS_MIN);
            // Alternating directions, varying speeds
            orb.speed = (0.008 + Math.random() * 0.006) * (i % 2 === 0 ? 1 : -1);
            orb.colorIdx = i % ORB_STYLES.length;
        });

        orbDataRef.current = pool;
        absorbedRef.current = new Set();
        interactableRef.current = true;
        setOrbs(pool);
        setAbsorbed(new Set());
    }, [currentQ]);

    useEffect(() => {
        if (currentQ && gameState === "playing") initOrbs();
    }, [levelIdx, qIdx, gameState]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ─── Start game ─── */
    const startGame = useCallback(() => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setCombo(0);
        setLevelIdx(0);
        setQIdx(0);
        setShieldUsed(false);
        setAbilityUsed(false);
        setGameState("playing");
    }, [playBGM]);

    /* ─── Animation loop ─── */
    useEffect(() => {
        if (gameState !== "playing") { cancelAnimationFrame(animRef.current); return; }
        if (paused) { cancelAnimationFrame(animRef.current); return; }

        let lastTime = performance.now();

        const loop = (now: number) => {
            if (gameStateRef.current !== "playing") return;
            const dt = Math.min((now - lastTime) / 1000, 0.1); // delta in seconds, capped
            lastTime = now;

            const { x: cx, y: cy } = centerRef.current;

            orbDataRef.current = orbDataRef.current.map((orb, i) => {
                if (absorbedRef.current.has(orb.id)) return orb;

                let { angle, orbitRadius, speed } = orb;

                // Rotate
                if (!frozenRef.current) {
                    angle += speed;
                    // Gravity — radius shrinks
                    orbitRadius = Math.max(0, orbitRadius - GRAVITY_SHRINK * dt * 60);
                }

                // Calculate position
                const x = cx + Math.cos(angle) * orbitRadius - ORB_SIZE / 2;
                const y = cy + Math.sin(angle) * orbitRadius - ORB_SIZE / 2;

                const el = orbElemsRef.current[i];
                if (el) {
                    el.style.transform = `translate(${x}px, ${y}px)`;
                    // Scale down as it gets closer
                    const scaleFactor = Math.max(0.4, orbitRadius / INITIAL_RADIUS_MAX);
                    el.style.opacity = String(Math.max(0.3, scaleFactor));
                }

                // Check if absorbed by black hole
                if (orbitRadius <= MIN_RADIUS && !absorbedRef.current.has(orb.id)) {
                    absorbedRef.current = new Set([...absorbedRef.current, orb.id]);
                    setAbsorbed(new Set(absorbedRef.current));

                    if (orb.isCorrect) {
                        // Correct answer was absorbed → lose HP
                        setBlackHolePulse(true);
                        setTimeout(() => setBlackHolePulse(false), 500);
                        playWrong();
                        onAnswered?.("", false, levels[0]?.subject ?? "", 2);
                        setCombo(0);

                        setHp(h => {
                            const next = h - 1;
                            if (next <= 0) {
                                setTimeout(() => {
                                    stopBGM();
                                    onGameComplete?.(score, 0);
                                    setGameState("gameOver");
                                }, 300);
                            } else {
                                // Auto advance to next question
                                setTimeout(() => advanceQuestion(), 500);
                            }
                            return Math.max(0, next);
                        });
                    }
                }

                return { ...orb, angle, orbitRadius };
            });

            animRef.current = requestAnimationFrame(loop);
        };

        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, [gameState, paused]); // eslint-disable-line react-hooks/exhaustive-deps

    /* ─── Advance question ─── */
    const advanceQuestion = useCallback(() => {
        const nextQ = qIdx + 1;
        if (nextQ >= (currentLevel?.questions.length ?? 0)) {
            const nextLevel = levelIdx + 1;
            if (nextLevel >= levels.length) {
                stopBGM();
                onGameComplete?.(score, levels.length);
                setGameState("win");
            } else {
                setLevelIdx(nextLevel);
                setQIdx(0);
            }
        } else {
            setQIdx(nextQ);
        }
        setAbilityUsed(false);
    }, [qIdx, levelIdx, currentLevel, levels, score, onGameComplete, stopBGM]);

    /* ─── Click orb ─── */
    const handleOrbClick = useCallback((orb: OrbData) => {
        if (gameState !== "playing" || !interactableRef.current || paused) return;
        if (absorbed.has(orb.id)) return;

        if (orb.isCorrect) {
            playCorrect();
            interactableRef.current = false;
            const newCombo = combo + 1;
            setCombo(newCombo);
            if (newCombo === 3) addAbilityCharges(1);
            const bonus = Math.min(newCombo, 5) * 20;
            setScore(s => s + BASE_COSMO + bonus);
            setShowCorrectFlash(orb.id);
            setTimeout(() => setShowCorrectFlash(null), 600);

            onAnswered?.("", true, levels[0]?.subject ?? "", 2);

            // Absorb all remaining and advance
            setTimeout(() => {
                advanceQuestion();
            }, 600);
        } else {
            playWrong();
            setCombo(0);
            onAnswered?.("", false, levels[0]?.subject ?? "", 2);
            setBlackHolePulse(true);
            setTimeout(() => setBlackHolePulse(false), 400);

            // Shield check
            if (playerClass === "warrior" && !shieldUsed) {
                const charged = useAbilityChargeRef.current();
                if (charged) {
                    setShieldUsed(true);
                    setAbilityNotice("🛡️ Lá chắn bảo vệ!");
                    setTimeout(() => setAbilityNotice(null), 1500);
                    // Mark orb as absorbed (remove from field)
                    absorbedRef.current = new Set([...absorbedRef.current, orb.id]);
                    setAbsorbed(new Set(absorbedRef.current));
                    return;
                }
            }

            setHp(h => {
                const next = h - 1;
                if (next <= 0) {
                    setTimeout(() => {
                        stopBGM();
                        onGameComplete?.(score, 0);
                        setGameState("gameOver");
                    }, 300);
                }
                return Math.max(0, next);
            });

            // Mark as absorbed
            absorbedRef.current = new Set([...absorbedRef.current, orb.id]);
            setAbsorbed(new Set(absorbedRef.current));
        }
    }, [gameState, paused, absorbed, combo, shieldUsed, playerClass, score, advanceQuestion, levels, onAnswered, onGameComplete, playCorrect, playWrong, stopBGM, addAbilityCharges]);

    /* ─── Wizard: freeze orbs ─── */
    useEffect(() => {
        if (!frozenActive) return;
        frozenRef.current = true;
        const t = setTimeout(() => { frozenRef.current = false; setFrozenActive(false); }, 5000);
        return () => clearTimeout(t);
    }, [frozenActive]);

    /* ─── Hint ─── */
    useEffect(() => {
        if (!hintOrbId) return;
        const t = setTimeout(() => setHintOrbId(null), 2500);
        return () => clearTimeout(t);
    }, [hintOrbId]);

    /* ─── Ability ─── */
    const useAbility = useCallback(() => {
        if (abilityUsed || gameState !== "playing") return;
        if (!useAbilityChargeRef.current()) return;
        setAbilityUsed(true);
        if (playerClass === "wizard") {
            setFrozenActive(true);
            setAbilityNotice("❄️ Đóng băng quỹ đạo!");
            setTimeout(() => setAbilityNotice(null), 1500);
        } else if (playerClass === "hunter") {
            // Highlight wrong orbs
            const wrongOrb = orbs.find(o => !o.isCorrect && !absorbed.has(o.id));
            if (wrongOrb) {
                setHintOrbId(wrongOrb.id);
                setAbilityNotice("🎯 Đáp án sai đang nhấp nháy!");
                setTimeout(() => setAbilityNotice(null), 1500);
            }
        }
    }, [abilityUsed, gameState, playerClass, orbs, absorbed]);

    /* ─── Win/GameOver ─── */
    useEffect(() => {
        if (gameState === "win" || gameState === "gameOver") {
            cancelAnimationFrame(animRef.current);
        }
    }, [gameState]);

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

    const abilityInfo: Record<string, { label: string; desc: string }> = {
        warrior: { label: "Khiên Bất Bại", desc: `Miễn 1 lần sai (⚡${player.abilityCharges})` },
        wizard: { label: "Đóng Băng", desc: `Dừng quỹ đạo 5s (⚡${player.abilityCharges})` },
        hunter: { label: "Mắt Đại Bàng", desc: `Hé lộ sai (⚡${player.abilityCharges})` },
    };
    const ability = playerClass ? abilityInfo[playerClass] : null;

    /* ─── Ready screen ─── */
    if (gameState === "ready") {
        return (
            <div ref={containerRef} className="w-full max-w-5xl mx-auto min-h-[500px] flex items-center justify-center relative overflow-hidden rounded-2xl border border-white/10 bg-[#060012]">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-30">
                    {/* Black hole animation */}
                    <div className="relative">
                        <motion.div
                            animate={{ scale: [1, 1.15, 1], rotate: [0, 360] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-32 h-32 rounded-full"
                            style={{
                                background: "radial-gradient(circle, #000 30%, #1a002e 50%, #4c1d95 70%, transparent 100%)",
                                boxShadow: "0 0 60px #7c3aed, 0 0 120px #4c1d9540, inset 0 0 30px #000",
                            }}
                        />
                        {/* Accretion disk */}
                        <motion.div
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-[-20px] rounded-full pointer-events-none"
                            style={{
                                border: "3px solid transparent",
                                borderTopColor: "#a855f740",
                                borderRightColor: "#06b6d430",
                            }}
                        />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400">
                        Hố Hấp Dẫn
                    </h2>
                    <p className="text-white/60 text-sm text-center max-w-md px-4">
                        Đáp án đang quay quanh lỗ đen! Bấm vào đáp án <span className="text-emerald-400 font-bold">ĐÚNG</span> trước khi nó bị hút vào!<br />
                        Tránh chọn sai 💥
                    </p>
                    {playerClass && ability && (
                        <div className="glass-card !p-3 !rounded-xl text-center border border-neon-gold/20">
                            <p className="text-xs text-white/50 mb-1">Khả năng đặc biệt</p>
                            <p className="text-sm font-bold text-neon-gold">{ability.desc}</p>
                        </div>
                    )}
                    <button onClick={startGame}
                        className="px-8 py-3 rounded-full bg-gradient-to-r from-violet-600 to-purple-800 text-white font-bold text-lg hover:scale-105 transition-transform"
                        style={{ boxShadow: "0 0 30px rgba(124,58,237,0.5)" }}>
                        KHÁM PHÁ HỐ ĐEN 🌀
                    </button>
                    {onExit && <button onClick={onExit} className="text-sm text-white/40 hover:text-white">← Thoát</button>}
                </div>
            </div>
        );
    }

    /* ─── Win / Game Over ─── */
    if (gameState === "win" || gameState === "gameOver") {
        const isWin = gameState === "win";
        return (
            <div ref={containerRef} className="w-full max-w-5xl mx-auto min-h-[500px] flex items-center justify-center rounded-2xl border border-white/10 bg-[#060012]">
                <div className="glass-card text-center space-y-5 max-w-md mx-auto !p-10">
                    <div className="text-6xl">{isWin ? "🏆" : "🌀"}</div>
                    <h2 className="text-3xl font-bold text-white font-[var(--font-heading)]">
                        {isWin ? "Vượt qua hố đen!" : "Bị hút vào lỗ đen..."}
                    </h2>
                    <div className="glass-card !bg-white/5 !p-4 space-y-2">
                        <div className="flex justify-between text-white/70"><span>Tổng điểm</span><span className="font-bold text-neon-gold">{score.toLocaleString()} ✦</span></div>
                        <div className="flex justify-between text-white/70"><span>Combo cao nhất</span><span className="font-bold text-purple-400">×{combo}</span></div>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={startGame}
                            className="flex-1 py-3 rounded-xl font-bold text-white hover:scale-105 transition-transform"
                            style={{ background: "linear-gradient(90deg, #7c3aed, #4c1d95)", boxShadow: "0 0 15px #7c3aed50" }}>
                            Chơi lại 🔄
                        </button>
                        {onExit && (
                            <button onClick={onExit} className="flex-1 py-3 rounded-xl font-bold text-white border border-white/20 hover:bg-white/10">
                                Thoát 🗺
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    /* ─── Playing ─── */
    return (
        <div ref={containerRef} className={`w-full max-w-5xl mx-auto min-h-[500px] flex flex-col relative select-none rounded-2xl border border-white/10 overflow-hidden ${isFullscreen ? 'h-screen' : ''}`}
            style={{ background: "radial-gradient(ellipse at 50% 50%, #0d0025 0%, #060012 40%, #020008 100%)" }}>

            <style>{`
                @keyframes accretionSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes orbPulse { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.4); } }
                @keyframes hintBlink { 0%,100% { opacity: 1; box-shadow: 0 0 20px #FF444488; } 50% { opacity: 0.4; box-shadow: 0 0 40px #FF444488; } }
                .orb-pulse { animation: orbPulse 2s ease-in-out infinite; }
                .orb-hint { animation: hintBlink 0.5s ease-in-out infinite; }
            `}</style>

            {/* HUD */}
            <div className="z-20 px-4 pt-3 pb-1 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className={`text-xl transition-all duration-300 ${i < hp ? "opacity-100" : "opacity-20"}`}>
                            {i < hp ? "❤️" : "🖤"}
                        </span>
                    ))}
                    {playerClass === "warrior" && !shieldUsed && player.abilityCharges > 0 && (
                        <span className="text-xl ml-1 animate-pulse">🛡️</span>
                    )}
                </div>

                <div className="flex-1 text-center">
                    <div className="glass-card !p-2 !px-5 !rounded-full inline-block">
                        <span className="text-white font-bold text-base sm:text-lg">{currentQ?.question}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {combo > 1 && (
                        <motion.span key={combo} initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="text-xs font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">
                            🔥 x{combo}
                        </motion.span>
                    )}
                    <div className="glass-card !p-2 !px-3 !rounded-xl">
                        <div className="text-neon-gold font-bold text-sm">{score.toLocaleString()}</div>
                        <div className="text-white/40 text-[10px]">✦</div>
                    </div>
                    <VolumeControl />
                    <button onClick={toggleFullscreen} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60">
                        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {abilityNotice && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute top-16 left-1/2 -translate-x-1/2 z-30 glass-card !px-4 !py-2 !rounded-xl text-sm font-bold text-neon-gold whitespace-nowrap">
                        {abilityNotice}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Field */}
            <div ref={fieldRef} className="relative flex-1 overflow-hidden mx-3 mb-3 rounded-2xl"
                style={{ filter: calmMode ? 'saturate(0.3)' : 'none' }}>

                {/* Black Hole Center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <motion.div
                        animate={{
                            scale: blackHolePulse ? [1, 1.4, 1] : [1, 1.05, 1],
                            boxShadow: blackHolePulse
                                ? ["0 0 60px #7c3aed", "0 0 100px #ef4444", "0 0 60px #7c3aed"]
                                : ["0 0 40px #7c3aed88", "0 0 60px #7c3aed44", "0 0 40px #7c3aed88"],
                        }}
                        transition={{ duration: blackHolePulse ? 0.4 : 3, repeat: blackHolePulse ? 0 : Infinity }}
                        className="w-16 h-16 rounded-full"
                        style={{
                            background: "radial-gradient(circle, #000 40%, #1a002e 60%, #4c1d95 80%, transparent 100%)",
                        }}
                    />
                    {/* Accretion disk rings */}
                    {[80, 100, 130].map((size, i) => (
                        <div key={i}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                width: size, height: size,
                                left: `calc(50% - ${size / 2}px)`,
                                top: `calc(50% - ${size / 2}px)`,
                                border: `1px solid rgba(124,58,237,${0.15 - i * 0.04})`,
                                animation: `accretionSpin ${6 + i * 3}s linear infinite${i % 2 ? ' reverse' : ''}`,
                            }}
                        />
                    ))}
                </div>

                {/* Orbit rings (decorative) */}
                {[INITIAL_RADIUS_MIN, (INITIAL_RADIUS_MIN + INITIAL_RADIUS_MAX) / 2, INITIAL_RADIUS_MAX].map((r, i) => (
                    <div key={`ring-${i}`}
                        className="absolute rounded-full border border-white/5 pointer-events-none"
                        style={{
                            width: r * 2, height: r * 2,
                            left: `calc(50% - ${r}px)`,
                            top: `calc(50% - ${r}px)`,
                        }}
                    />
                ))}

                {/* Orbs */}
                {orbs.map((orb, i) => {
                    const style = ORB_STYLES[orb.colorIdx];
                    const isAbsorbed = absorbed.has(orb.id);
                    const isFlashing = showCorrectFlash === orb.id;
                    const isHinted = hintOrbId === orb.id;

                    if (isAbsorbed) return null;

                    return (
                        <div
                            key={orb.id}
                            ref={(el) => { orbElemsRef.current[i] = el; }}
                            onClick={() => handleOrbClick(orb)}
                            className={`absolute cursor-pointer flex items-center justify-center rounded-full orb-pulse
                                ${isHinted ? "orb-hint" : ""}
                            `}
                            style={{
                                width: ORB_SIZE, height: ORB_SIZE,
                                background: isFlashing
                                    ? "radial-gradient(circle, #00FF88 0%, #065F46 100%)"
                                    : style.bg,
                                border: `2px solid ${isFlashing ? "#00FF88" : style.border}50`,
                                boxShadow: `0 0 15px ${isFlashing ? "#00FF88" : style.glow}40`,
                                willChange: "transform",
                                zIndex: 5,
                                fontSize: orb.text.length > 10 ? "10px" : orb.text.length > 6 ? "12px" : "14px",
                            }}
                        >
                            <span className="font-bold text-white text-center px-2 leading-tight drop-shadow-lg">
                                {orb.text}
                            </span>
                            <div className="absolute inset-0 rounded-full pointer-events-none"
                                style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.2) 0%, transparent 60%)" }} />
                        </div>
                    );
                })}

                {/* Frozen overlay */}
                {frozenActive && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                        <div className="text-5xl animate-pulse" style={{ filter: "drop-shadow(0 0 30px #00F5FF)" }}>❄️</div>
                    </div>
                )}

                {/* Ability button */}
                {ability && playerClass && !abilityUsed && player.abilityCharges > 0 && (
                    <div className="absolute bottom-3 left-3 z-20">
                        <MascotAbilityButton
                            onClick={useAbility}
                            disabled={abilityUsed}
                            charges={player.abilityCharges}
                            label={ability.label}
                            description={ability.desc}
                            position="inline"
                            size="sm"
                        />
                    </div>
                )}

                {/* Level indicator */}
                <div className="absolute top-3 left-3 glass-card !p-1 !px-3 !rounded-full !text-xs text-white/50 z-10">
                    Q{qIdx + 1}/{currentLevel?.questions.length ?? 0}
                </div>
            </div>
        </div>
    );
}
