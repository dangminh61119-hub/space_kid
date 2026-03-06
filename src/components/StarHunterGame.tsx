"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GameLevel } from "@/lib/services/db";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useGame } from "@/lib/game-context";
import MascotAbilityButton from "@/components/MascotAbilityButton";

// ─── Types ───────────────────────────────────────────────
interface StarData {
    id: string;
    answer: string;
    isCorrect: boolean;
    colorIdx: number;
}

interface StarPos {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface Particle {
    id: string;
    x: number;
    y: number;
    color: string;
    angle: number;
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

// ─── Constants ───────────────────────────────────────────
const MAX_HP = 3;
const BASE_COSMO = 100;
const STAR_D = 112; // star diameter px
const BASE_SPEED = 1.6;
const QUESTION_TIME = 10; // secs
const STAR_STYLES = [
    { bg: "linear-gradient(135deg,#00F5FF 0%,#0077B6 100%)", glow: "#00F5FF55", border: "#00F5FF" },
    { bg: "linear-gradient(135deg,#FF6BFF 0%,#9D174D 100%)", glow: "#FF6BFF55", border: "#FF6BFF" },
    { bg: "linear-gradient(135deg,#FFD700 0%,#D97706 100%)", glow: "#FFD70055", border: "#FFD700" },
    { bg: "linear-gradient(135deg,#00FF88 0%,#065F46 100%)", glow: "#00FF8855", border: "#00FF88" },
    { bg: "linear-gradient(135deg,#FF8C00 0%,#9A3412 100%)", glow: "#FF8C0055", border: "#FF8C00" },
];
const COMBO_MULTIPLIERS = [1, 1, 2, 3, 4];

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Component ───────────────────────────────────────────
export default function StarHunterGame({ levels, onExit, playerClass, onGameComplete, onAnswered, calmMode = false, paused = false }: Props) {
    const { playCorrect, playWrong, playBGM, stopBGM } = useSoundEffects();
    const { player, useAbilityCharge, addAbilityCharges } = useGame();
    const useAbilityChargeRef = useRef(useAbilityCharge);
    useEffect(() => { useAbilityChargeRef.current = useAbilityCharge; }, [useAbilityCharge]);

    // ── Game state ──
    const [hp, setHp] = useState(MAX_HP);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(1);
    const [gameState, setGameState] = useState<"ready" | "playing" | "levelComplete" | "win" | "gameOver">("ready");
    const [levelIdx, setLevelIdx] = useState(0);
    const [qIdx, setQIdx] = useState(0);
    const [stars, setStars] = useState<StarData[]>([]);
    const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
    const [particles, setParticles] = useState<Particle[]>([]);
    const [explodingIds, setExplodingIds] = useState<Set<string>>(new Set());
    const [shakingId, setShakingId] = useState<string | null>(null);
    const [abilityUsed, setAbilityUsed] = useState(false);
    const [shieldActive, setShieldActive] = useState(playerClass === "warrior");
    const [frozenActive, setFrozenActive] = useState(false);
    const [hintStarId, setHintStarId] = useState<string | null>(null);
    const [levelsCompleted, setLevelsCompleted] = useState(0);
    const [showLevelBanner, setShowLevelBanner] = useState(false);

    // ── Refs ──
    const containerRef = useRef<HTMLDivElement>(null);
    const starElemsRef = useRef<(HTMLDivElement | null)[]>([]);
    const starPosRef = useRef<StarPos[]>([]);
    const animRef = useRef<number>(0);
    const frozenRef = useRef(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const gameStateRef = useRef(gameState);
    const interactableRef = useRef(true); // block clicks during transitions

    useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

    const startGame = useCallback(() => {
        playBGM();
        setScore(0);
        setHp(MAX_HP);
        setCombo(1);
        setLevelIdx(0);
        setQIdx(0);
        setLevelsCompleted(0);
        setGameState("playing");
    }, [playBGM]);

    // ── Derived ──
    const currentLevel = levels[levelIdx];
    const currentQ = currentLevel?.questions[qIdx];
    const multiplier = COMBO_MULTIPLIERS[Math.min(combo, COMBO_MULTIPLIERS.length - 1)];

    // ─── Init stars for current question ─────────────────
    const initStars = useCallback(() => {
        if (!currentQ) return;
        const container = containerRef.current;
        if (!container) return;
        const { width, height } = container.getBoundingClientRect();

        // Build answer pool: 1 correct + up to 4 wrong
        const pool: StarData[] = [
            { id: uid(), answer: currentQ.correctWord, isCorrect: true, colorIdx: Math.floor(Math.random() * STAR_STYLES.length) },
            ...currentQ.wrongWords.slice(0, 4).map((w) => ({
                id: uid(), answer: w, isCorrect: false,
                colorIdx: Math.floor(Math.random() * STAR_STYLES.length),
            })),
        ].sort(() => Math.random() - 0.5);

        // Arrange initial positions in ring to avoid overlap
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.32;
        const positions: StarPos[] = pool.map((_, i) => {
            const angle = (i / pool.length) * Math.PI * 2 + Math.random() * 0.5;
            const r = radius + (Math.random() - 0.5) * 60;
            const speed = BASE_SPEED + Math.random() * 0.6;
            const dir = Math.random() * Math.PI * 2;
            return {
                x: Math.max(0, Math.min(cx + Math.cos(angle) * r - STAR_D / 2, width - STAR_D)),
                y: Math.max(0, Math.min(cy + Math.sin(angle) * r - STAR_D / 2, height - STAR_D)),
                vx: Math.cos(dir) * speed,
                vy: Math.sin(dir) * speed,
            };
        });

        starPosRef.current = positions;
        interactableRef.current = true;
        setStars(pool);
        setTimeLeft(QUESTION_TIME);
    }, [currentQ]);

    // Initial star positions applied to DOM after render
    useEffect(() => {
        starPosRef.current.forEach((pos, i) => {
            const el = starElemsRef.current[i];
            if (el) {
                el.style.transform = `translate(${pos.x}px,${pos.y}px)`;
            }
        });
    }, [stars]);

    // Load stars on question change
    useEffect(() => {
        if (currentQ && gameState === "playing") initStars();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [levelIdx, qIdx, gameState]);

    // ─── Physics animation loop ───────────────────────────
    useEffect(() => {
        if (gameState !== "playing") { cancelAnimationFrame(animRef.current); return; }
        if (paused) { cancelAnimationFrame(animRef.current); return; } // BUG-4 FIX: freeze physics when paused
        const container = containerRef.current;
        if (!container) return;

        const loop = () => {
            if (gameStateRef.current !== "playing") return;
            const { width, height } = container.getBoundingClientRect();
            const maxX = width - STAR_D;
            const maxY = height - STAR_D;

            if (!frozenRef.current) {
                starPosRef.current = starPosRef.current.map((s, i) => {
                    let { x, y, vx, vy } = s;
                    x += vx; y += vy;
                    if (x <= 0) { x = 0; vx = Math.abs(vx); }
                    else if (x >= maxX) { x = maxX; vx = -Math.abs(vx); }
                    if (y <= 0) { y = 0; vy = Math.abs(vy); }
                    else if (y >= maxY) { y = maxY; vy = -Math.abs(vy); }
                    const el = starElemsRef.current[i];
                    if (el) el.style.transform = `translate(${x}px,${y}px)`;
                    return { x, y, vx, vy };
                });
            }
            animRef.current = requestAnimationFrame(loop);
        };
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
    }, [gameState, stars, paused]);

    // ─── Timer countdown ─────────────────────────────────
    useEffect(() => {
        if (gameState !== "playing" || paused) { if (timerRef.current) clearInterval(timerRef.current); return; } // BUG-4 FIX: pause timer
        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    setCombo(1);
                    playWrong();
                    // IMP-1: Track timeout as wrong answer via onAnswered
                    onAnswered?.(currentQ?.id ?? "", false, currentLevel?.subject ?? "", currentQ?.bloomLevel ?? 1);
                    setHp(h => {
                        const next = h - 1;
                        if (next <= 0) {
                            setGameState("gameOver");
                        } else {
                            // IMP-1 FIX: Auto-advance to next question on timeout
                            const nextQ = qIdx + 1;
                            if (nextQ >= (currentLevel?.questions.length ?? 0)) {
                                const nextLevel = levelIdx + 1;
                                setLevelsCompleted(l => l + 1);
                                if (nextLevel >= levels.length) {
                                    setGameState("win");
                                } else {
                                    setLevelIdx(nextLevel);
                                    setQIdx(0);
                                }
                            } else {
                                setQIdx(nextQ);
                            }
                        }
                        return Math.max(0, next);
                    });
                    return QUESTION_TIME;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [gameState, qIdx, levelIdx]);

    // ─── Win / Game Over → call onGameComplete ────────────
    useEffect(() => {
        if (gameState === "win" || gameState === "gameOver") {
            stopBGM();
            cancelAnimationFrame(animRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            onGameComplete?.(score, levelsCompleted);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState]);

    // ─── Wizard: frozen stars ─────────────────────────────
    useEffect(() => {
        if (!frozenActive) return;
        frozenRef.current = true;
        const t = setTimeout(() => { frozenRef.current = false; setFrozenActive(false); }, 5000);
        return () => clearTimeout(t);
    }, [frozenActive]);

    // ─── Hunter: hint star ────────────────────────────────
    useEffect(() => {
        if (!hintStarId) return;
        const t = setTimeout(() => setHintStarId(null), 2000);
        return () => clearTimeout(t);
    }, [hintStarId]);

    // ─── Click handler ────────────────────────────────────
    const handleStarClick = useCallback((star: StarData, starIdx: number) => {
        if (gameState !== "playing" || !interactableRef.current || paused) return; // BUG-4: block clicks when paused
        if (explodingIds.has(star.id)) return;

        if (star.isCorrect) {
            playCorrect();
            interactableRef.current = false;
            const newCombo = Math.min(combo + 1, COMBO_MULTIPLIERS.length);
            const mult = COMBO_MULTIPLIERS[Math.min(newCombo - 1, COMBO_MULTIPLIERS.length - 1)];
            const xp = BASE_COSMO * mult;

            // BUG-3 FIX: Track correct answer
            onAnswered?.(currentQ?.id ?? "", true, currentLevel?.subject ?? "", currentQ?.bloomLevel ?? 1);

            // Particle burst at star position
            const pos = starPosRef.current[starIdx];
            const style = STAR_STYLES[star.colorIdx];
            const newParticles = Array.from({ length: calmMode ? 5 : 10 }, (_, i) => ({
                id: uid(), x: pos.x + STAR_D / 2, y: pos.y + STAR_D / 2,
                color: style.border, angle: (i / 10) * 360,
            }));
            setParticles(p => [...p, ...newParticles]);
            setTimeout(() => setParticles(p => p.filter(pp => !newParticles.some(np => np.id === pp.id))), 800);

            // Explode all
            const allIds = new Set(stars.map(s => s.id));
            setExplodingIds(allIds);
            setCombo(newCombo);
            if (newCombo === 4) addAbilityCharges(1); // Combo reward (starts at 1, so 4 = 3 correct)
            setScore(s => s + xp);

            setTimeout(() => {
                setExplodingIds(new Set());
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
                        }, 2200);
                    }
                } else {
                    setQIdx(nextQ);
                }
            }, 650);
        } else {
            // Wrong
            playWrong();
            // BUG-3 FIX: Track wrong answer
            onAnswered?.(currentQ?.id ?? "", false, currentLevel?.subject ?? "", currentQ?.bloomLevel ?? 1);
            if (shieldActive && playerClass === "warrior") {
                setShieldActive(false);
            } else {
                setCombo(1);
                setHp(h => {
                    const next = h - 1;
                    if (next <= 0) setGameState("gameOver");
                    return Math.max(0, next);
                });
            }
            setShakingId(star.id);
            setTimeout(() => setShakingId(null), 500);
        }
    }, [gameState, stars, combo, qIdx, levelIdx, levels, currentLevel, shieldActive, playerClass, explodingIds, paused, onAnswered, currentQ, calmMode]);

    // ─── Ability button ───────────────────────────────────
    const useAbility = useCallback(() => {
        if (abilityUsed || gameState !== "playing") return;
        if (!useAbilityChargeRef.current()) return; // No charges left
        setAbilityUsed(true);
        if (playerClass === "wizard") { setFrozenActive(true); }
        else if (playerClass === "hunter") {
            const wrongStar = stars.find(s => !s.isCorrect);
            if (wrongStar) setHintStarId(wrongStar.id);
        }
    }, [abilityUsed, gameState, playerClass, stars]);

    const abilityInfo = {
        warrior: { label: "Khiên Bất Bại", icon: "🛡️", desc: `Miễn 1 lần sai (⚡${player.abilityCharges})` },
        wizard: { label: "Đóng Băng TG", icon: "❄️", desc: `Đứng yên 5s (⚡${player.abilityCharges})` },
        hunter: { label: "Mắt Đại Bàng", icon: "🎯", desc: `Hé lộ 1 sai (⚡${player.abilityCharges})` },
    };
    const ability = playerClass ? abilityInfo[playerClass] : null;

    // ─── Render overlays ──────────────────────────────────
    if (gameState === "ready") {
        return (
            <div className="w-full max-w-5xl mx-auto min-h-[500px] flex items-center justify-center relative overflow-hidden rounded-2xl border border-white/10 bg-space-deep">
                <div className="absolute inset-0 bg-space-deep/90 flex flex-col items-center justify-center gap-6 z-30 animate-in fade-in duration-500">
                    <div className="text-6xl animate-float">⭐</div>
                    <h2 className="text-3xl sm:text-4xl font-bold font-[var(--font-heading)] neon-text text-center">
                        Săn Sao Vũ Trụ
                    </h2>
                    <p className="text-white/60 text-sm text-center max-w-md px-4 leading-relaxed">
                        Nhấn vào ngôi sao chứa đáp án đúng trước khi hết giờ!<br />
                        Săn trúng mục tiêu, tránh sao <span className="text-neon-magenta font-bold">SAI</span>!
                    </p>
                    {levels[0] && (
                        <div className="glass-card !p-3 !rounded-xl text-center">
                            <p className="text-xs text-white/50">Level {levels[0].level} · {levels[0].planet}</p>
                            <p className="text-sm font-bold text-white">{levels[0].title || "Săn Sao"}</p>
                        </div>
                    )}
                    <button
                        onClick={startGame}
                        className="px-8 py-3 rounded-full text-white font-bold text-lg hover:scale-105 transition-transform"
                        style={{ background: "linear-gradient(90deg, #FFD700, #FF8C00)", boxShadow: "0 0 25px rgba(255,215,0,0.4)" }}
                    >
                        BẮT ĐẦU SĂN ⭐
                    </button>
                    {onExit && (
                        <button onClick={onExit} className="mt-2 text-sm text-white/40 hover:text-white transition-colors">
                            ← Thoát
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === "win" || gameState === "gameOver") {
        const isWin = gameState === "win";
        const stars3 = hp >= 3 ? 3 : hp >= 2 ? 2 : 1;
        return (
            <div className="w-full max-w-5xl mx-auto min-h-[500px] flex items-center justify-center rounded-2xl border border-white/10 bg-space-deep">
                <div className="glass-card text-center space-y-6 max-w-md mx-auto !p-10">
                    <div className="text-6xl">{isWin ? "🏆" : "💫"}</div>
                    <h2 className="text-3xl font-bold text-white font-[var(--font-heading)]">
                        {isWin ? "Chinh phục hoàn toàn!" : "Sứ mệnh dang dở..."}
                    </h2>
                    <div className="flex justify-center gap-1 text-3xl">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <span key={i} className={i < stars3 ? "text-yellow-400" : "text-white/20"}>⭐</span>
                        ))}
                    </div>
                    <div className="glass-card !bg-white/5 !p-4 space-y-2">
                        <div className="flex justify-between text-white/70"><span>Tổng điểm</span><span className="font-bold text-neon-gold">{score.toLocaleString()} ✦</span></div>
                        <div className="flex justify-between text-white/70"><span>Levels hoàn thành</span><span className="font-bold text-white">{levelsCompleted}/{levels.length}</span></div>
                        <div className="flex justify-between text-white/70"><span>Combo cao nhất</span><span className="font-bold text-neon-pink">×{multiplier}</span></div>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={startGame} className="flex-1 py-3 rounded-xl font-bold text-white shadow-[0_0_15px_rgba(255,215,0,0.5)] hover:scale-105 transition-transform"
                            style={{ background: "linear-gradient(90deg,#FFD700,#FF8C00)" }}>
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

    const timerPct = (timeLeft / QUESTION_TIME) * 100;
    const timerColor = timerPct > 60 ? "#00FF88" : timerPct > 30 ? "#FFD700" : "#FF4444";

    return (
        <div className="w-full max-w-5xl mx-auto min-h-[500px] flex flex-col relative select-none rounded-2xl border border-white/10 bg-space-deep overflow-hidden">
            {/* ─── Global style for animations ─── */}
            <style>{`
                @keyframes starFloat { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
                @keyframes starExplode { 0% { transform: scale(1); opacity:1; } 60% { transform: scale(2.5); opacity:0.5; } 100% { transform: scale(4); opacity:0; } }
                @keyframes starShake { 0%,100% { filter: none; } 20%,60% { filter: drop-shadow(0 0 12px #FF4444); transform: rotate(-6deg) scale(1.05); } 40%,80% { filter: drop-shadow(0 0 12px #FF4444); transform: rotate(6deg) scale(1.05); } }
                @keyframes hintPulse { 0%,100% { box-shadow: 0 0 0 0 #FF444488; } 50% { box-shadow: 0 0 0 16px #FF444400; } }
                @keyframes particleFly { 0% { transform: translate(0,0) scale(1); opacity:1; } 100% { transform: translate(var(--dx),var(--dy)) scale(0); opacity:0; } }
                @keyframes comboFlash { 0% { transform: scale(1.5); opacity:1; } 100% { transform: scale(1); opacity:1; } }
                @keyframes levelBanner { 0%,100% { opacity:0; transform:translateY(20px); } 20%,80% { opacity:1; transform:translateY(0); } }
                @keyframes frozenPulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
                .star-floating { animation: starFloat 2.5s ease-in-out infinite; }
                .star-exploding { animation: starExplode 0.65s ease-out forwards !important; pointer-events:none; }
                .star-shaking { animation: starShake 0.5s ease-in-out; }
                .star-hint { animation: hintPulse 0.4s ease-in-out infinite; }
                .star-frozen { animation: frozenPulse 1s ease-in-out infinite; }
            `}</style>

            {/* ─── HUD ─── */}
            <div className="z-10 px-4 pt-2 pb-1 flex items-center justify-between gap-4">
                {/* HP */}
                <div className="flex items-center gap-1">
                    {Array.from({ length: MAX_HP }).map((_, i) => (
                        <span key={i} className="text-xl transition-all duration-300" style={{ filter: i < hp ? "drop-shadow(0 0 6px #FF6B6B)" : "grayscale(1) opacity(0.3)" }}>
                            {i < hp ? "❤️" : "🖤"}
                        </span>
                    ))}
                </div>

                {/* Question */}
                <div className="flex-1 text-center">
                    <div className="glass-card !p-2 !px-5 !rounded-full inline-block">
                        <span className="text-white font-bold text-base sm:text-lg leading-tight">{currentQ?.question}</span>
                    </div>
                </div>

                {/* Score + Combo */}
                <div className="flex items-center gap-2 text-right">
                    {combo > 2 && (
                        <div className="text-neon-gold font-black text-sm px-2 py-1 rounded-lg glass-card" style={{ animation: "comboFlash 0.3s ease-out" }}>
                            ×{COMBO_MULTIPLIERS[Math.min(combo - 1, COMBO_MULTIPLIERS.length - 1)]}
                        </div>
                    )}
                    <div className="glass-card !p-2 !px-3 !rounded-xl">
                        <div className="text-neon-gold font-bold text-sm">{score.toLocaleString()}</div>
                        <div className="text-white/40 text-xs">✦</div>
                    </div>
                </div>
            </div>

            {/* ─── Timer Bar ─── */}
            <div className="mx-4 h-2 rounded-full bg-white/10 overflow-hidden mb-1">
                <div className="h-full rounded-full transition-all" style={{
                    width: `${timerPct}%`,
                    background: timerColor,
                    boxShadow: `0 0 8px ${timerColor}`,
                    transition: "width 1s linear, background 0.3s",
                }} />
            </div>

            {/* ─── Game Field (stars) ─── */}
            <div
                ref={containerRef}
                className="relative flex-1 overflow-hidden rounded-2xl mx-3 mb-3"
                style={{ background: "radial-gradient(ellipse at 50% 30%, #1a0a3a 0%, #06040f 100%)", filter: calmMode ? 'saturate(0.3)' : 'none' }}
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

                {/* Frozen overlay */}
                {frozenActive && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                        <div className="text-5xl animate-pulse" style={{ filter: "drop-shadow(0 0 30px #00F5FF)" }}>❄️</div>
                    </div>
                )}

                {/* Stars */}
                {stars.map((star, i) => {
                    const style = STAR_STYLES[star.colorIdx];
                    const isExploding = explodingIds.has(star.id);
                    const isShaking = shakingId === star.id;
                    const isHinted = hintStarId === star.id;
                    const isFrozen = frozenActive;
                    return (
                        <div
                            key={star.id}
                            ref={(el) => { starElemsRef.current[i] = el; }}
                            onClick={() => handleStarClick(star, i)}
                            className={`absolute cursor-pointer flex items-center justify-center rounded-full transition-none
                                ${isExploding ? "star-exploding" : "star-floating"}
                                ${isShaking ? "star-shaking" : ""}
                                ${isHinted ? "star-hint" : ""}
                                ${isFrozen ? "star-frozen" : ""}
                            `}
                            style={{
                                width: STAR_D, height: STAR_D,
                                background: style.bg,
                                border: `2px solid ${style.border}66`,
                                boxShadow: `0 0 20px ${style.glow}, inset 0 0 15px rgba(255,255,255,0.1)`,
                                willChange: "transform",
                                animationDuration: `${2 + i * 0.4}s`,
                                fontSize: star.answer.length > 10 ? "11px" : star.answer.length > 6 ? "13px" : "15px",
                                transform: "translate(0,0)",
                                zIndex: 5,
                            }}
                        >
                            <span className="font-bold text-white text-center px-2 leading-tight drop-shadow-lg">
                                {star.answer}
                            </span>
                            {/* Shine effect */}
                            <div className="absolute inset-0 rounded-full pointer-events-none"
                                style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.25) 0%, transparent 60%)" }} />
                        </div>
                    );
                })}

                {/* Particles */}
                {particles.map((p) => (
                    <div key={p.id} className="absolute pointer-events-none w-3 h-3 rounded-full"
                        style={{
                            left: p.x, top: p.y,
                            background: p.color,
                            boxShadow: `0 0 6px ${p.color}`,
                            "--dx": `${Math.cos(p.angle * Math.PI / 180) * 80}px`,
                            "--dy": `${Math.sin(p.angle * Math.PI / 180) * 80}px`,
                            animation: "particleFly 0.8s ease-out forwards",
                        } as React.CSSProperties}
                    />
                ))}

                {/* Level Complete Banner */}
                {showLevelBanner && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                        <div className="glass-card !p-6 !px-12 text-center" style={{ animation: "levelBanner 2.2s ease-in-out" }}>
                            <div className="text-4xl mb-2">⭐</div>
                            <div className="text-2xl font-black text-neon-gold">Level {levelIdx + 1} hoàn thành!</div>
                            <div className="text-white/60 text-sm mt-1">Chuẩn bị level tiếp theo...</div>
                        </div>
                    </div>
                )}

                {/* Combo streak visual */}
                {combo > 2 && (
                    <div className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full font-black text-sm text-white"
                        style={{ background: `linear-gradient(90deg, #FF6BFF, #FFD700)`, boxShadow: "0 0 15px #FF6BFF88" }}>
                        🔥 {combo - 1} liên tiếp!
                    </div>
                )}
            </div>
        </div>
    );
}
