"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import SpaceShooterGame from "./SpaceShooterGame";
import StarHunterGame from "./StarHunterGame";
import MeteorShowerGame from "./MeteorShowerGame";
import WordRushGame from "./WordRushGame";
import TimeBombGame from "./TimeBombGame";
import GalaxySortGame from "./GalaxySortGame";
import CosmoBridgeGame from "./CosmoBridgeGame";
import StarRaceGame from "./StarRaceGame";
import SummonOverlay from "./SummonOverlay";
import LevelIntro from "./LevelIntro";
import PlanetStoryIntro from "./PlanetStoryIntro";
import LevelTransition from "./LevelTransition";
import BossBattle from "./BossBattle";
import type { GameLevel } from "@/lib/services/db";
import { useGame } from "@/lib/game-context";
import { MiniOwlSVG } from "./MascotAbilityButton";
import ComboFlash from "./effects/ComboFlash";
import { useGameSound } from "@/lib/sound/SoundProvider";

type GameMode = "shooter" | "star-hunter" | "meteor" | "rush" | "timebomb" | "galaxy-sort" | "cosmo-bridge" | "boss" | "star-race";
type ControllerState = "planetIntro" | "levelIntro" | "playing" | "levelWin" | "levelLose";

/* ─── 3-Star Scoring System (GDD §9) ───
 * Stars based on accuracy percentage:
 *   100%  → 3 stars ⭐⭐⭐ (hoàn thành không sai)
 *   ≥ 80% → 2 stars ⭐⭐
 *   ≥ 60% → 1 star  ⭐
 *   < 60% → 0 stars
 */
function calculateStars(correct: number, total: number): 0 | 1 | 2 | 3 {
    if (total === 0) return 0;
    const pct = (correct / total) * 100;
    if (pct >= 100) return 3;
    if (pct >= 80) return 2;
    if (pct >= 60) return 1;
    return 0;
}

interface GameModeControllerProps {
    levels: GameLevel[];
    onExit: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete: (finalScore: number, levelsCompleted: number) => void;
    onAnswered?: (questionId: string, isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
    planetName: string;
    planetEmoji: string;
    planetId?: string;
    completedLevels?: number;
    isFirstVisit?: boolean;
    /** Re-fetch questions from server (smart selection) when replaying */
    onRefreshLevels?: () => Promise<void>;
}

/* ─── Floating Mascot Companion (always visible during gameplay) ─── */
import { motion, AnimatePresence } from "framer-motion";
import { useSummon } from "@/components/SummonOverlay";

function FloatingMascot() {
    const { player } = useGame();
    const [showTip, setShowTip] = useState(false);
    const charges = player.abilityCharges ?? 0;
    const playerClass = player.playerClass;

    const classInfo: Record<string, { name: string; desc: string }> = {
        warrior: { name: "Chiến Binh", desc: "🛡️ Lá chắn hấp thụ sát thương" },
        wizard: { name: "Pháp Sư", desc: "⏳ Đóng băng / thêm thời gian" },
        hunter: { name: "Thợ Săn", desc: "🎯 Gợi ý / tự động giải" },
    };
    const info = playerClass ? classInfo[playerClass] : null;

    const { openSummon, canSummon } = useSummon();

    return (
        <div className="absolute bottom-3 right-3 z-30 flex flex-col items-center gap-1">
            <AnimatePresence>
                {showTip && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.9 }}
                        className="glass-card !px-3 !py-2 !rounded-xl text-center whitespace-nowrap mb-1"
                        style={{ boxShadow: "0 0 12px rgba(0,245,255,0.2)" }}
                    >
                        {info ? (
                            <>
                                <p className="text-sm font-bold text-neon-gold">{info.name}</p>
                                <p className="text-xs text-white/70 mt-0.5">{info.desc}</p>
                                <p className="text-xs text-cyan-300 mt-1">⚡ {charges} lần sử dụng</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-cyan-300">🦉 Cú Mèo</p>
                                <p className="text-xs text-white/60 mt-0.5">Đồng hành cùng bạn!</p>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div
                className="relative w-16 h-16 cursor-pointer"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { if (canSummon) openSummon(); else { setShowTip(true); setTimeout(() => setShowTip(false), 2500); } }}
                onMouseEnter={() => setShowTip(true)}
                onMouseLeave={() => setShowTip(false)}
                onTouchStart={() => { if (canSummon) { openSummon(); } else { setShowTip(true); setTimeout(() => setShowTip(false), 2500); } }}
            >
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: "radial-gradient(circle, rgba(0,245,255,0.25), rgba(147,51,234,0.15), transparent)",
                        filter: "blur(10px)",
                        transform: "scale(1.4)",
                    }}
                />
                <div className="relative z-10">
                    <MiniOwlSVG glowing={charges > 0} />
                </div>
                {charges > 0 && (
                    <motion.div
                        key={charges}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 z-20 min-w-[20px] h-5 rounded-full bg-gradient-to-r from-neon-gold to-amber-500 flex items-center justify-center shadow-lg"
                        style={{ boxShadow: "0 0 8px rgba(255,215,0,0.5)" }}
                    >
                        <span className="text-xs font-black text-slate-900 px-1">⚡{charges}</span>
                    </motion.div>
                )}
            </motion.div>
            <span className="text-[11px] text-white/50 font-bold">Cú Mèo</span>
        </div>
    );
}

/* ─── Game mode is now per-level (from DB), no more fixed rotation ─── */

import { PLANET_VIDEOS } from "@/lib/data/planet-videos";

export default function GameModeController({
    levels,
    onExit,
    playerClass,
    onGameComplete,
    onAnswered,
    calmMode,
    planetName,
    planetEmoji,
    planetId,
    completedLevels = 0,
    isFirstVisit = false,
    onRefreshLevels,
}: GameModeControllerProps) {
    const [gamePaused, setGamePaused] = useState(false);
    // Always show planet intro if there's a video for this planet
    const hasVideo = !!PLANET_VIDEOS[planetName];
    const [state, setState] = useState<ControllerState>(
        (isFirstVisit || hasVideo) ? "planetIntro" : "levelIntro"
    );
    const safeStartIdx = levels.length > 0 ? Math.min(completedLevels, levels.length - 1) : 0;
    const [currentLevelIdx, setCurrentLevelIdx] = useState(safeStartIdx);
    const [totalScore, setTotalScore] = useState(0);
    const [lastLevelScore, setLastLevelScore] = useState(0);
    const [lastLevelStars, setLastLevelStars] = useState<0 | 1 | 2 | 3>(0);
    // Track correct/total answers for star calculation
    const correctCountRef = useRef(0);
    const totalAnsweredRef = useRef(0);
    // Key to force-remount game components
    const [gameKey, setGameKey] = useState(0);
    // Track if we already handled this game's completion (prevent double-fire)
    const handledRef = useRef(false);
    // Track which question index is currently active in the game
    const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
    // Combo streak — both ref (for sync read) and state (for UI)
    const [comboStreak, setComboStreak] = useState(0);
    const comboRef = useRef(0);
    const { play, stop, stopAll } = useGameSound();

    // Sync currentLevelIdx when completedLevels or levels change (e.g. after async load)
    const prevCompletedRef = useRef(completedLevels);
    useEffect(() => {
        if (levels.length > 0 && completedLevels !== prevCompletedRef.current) {
            const newIdx = Math.min(completedLevels, levels.length - 1);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentLevelIdx(newIdx);
            prevCompletedRef.current = completedLevels;
        }
    }, [completedLevels, levels.length]);

    // Reset handled flag when entering playing state
    useEffect(() => {
        if (state === "playing") {
            handledRef.current = false;
            correctCountRef.current = 0;
            totalAnsweredRef.current = 0;
            comboRef.current = 0;
            setComboStreak(0);
        }
    }, [state, gameKey]);

    // ── Background music: play when game starts, stop when finished ──
    useEffect(() => {
        if (state === "playing" && !calmMode) {
            const isBoss = levels[currentLevelIdx]?.gameMode === "boss";
            const bgTrack = isBoss ? 'boss_loop' : 'space_loop';
            play(bgTrack, { loop: true, volume: isBoss ? 0.4 : 0.3 });
            return () => stop(bgTrack);
        }
        if (state === "levelWin" || state === "levelLose") {
            stop('space_loop');
            stop('boss_loop');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, currentLevelIdx, calmMode]);


    if (levels.length === 0) {
        return (
            <div className="w-full max-w-lg mx-auto text-center py-16 px-6">
                <div className="text-6xl mb-4 animate-float">🔭</div>
                <h2 className="text-xl font-bold text-white/80 mb-2 font-[var(--font-heading)]">
                    Hành tinh đang chuẩn bị!
                </h2>
                <p className="text-white/50 text-sm mb-6">
                    Các thử thách cho {planetName} {planetEmoji} đang được cập nhật. Hãy quay lại sau nhé!
                </p>
                <button
                    onClick={onExit}
                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-neon-cyan to-neon-magenta text-white font-bold text-sm hover:scale-105 transition-transform"
                >
                    ← Quay lại bản đồ
                </button>
            </div>
        );
    }

    const currentLevel = levels[currentLevelIdx];
    // Normalize DB game_mode values to match GameMode type
    const MODE_ALIASES: Record<string, GameMode> = {
        meteorshower: "meteor",
        cosmobridge: "cosmo-bridge",
        galaxysort: "galaxy-sort",
        starhunter: "star-hunter",
        starrace: "star-race",
    };
    const rawMode = currentLevel?.gameMode || "timebomb";
    const activeMode: GameMode = MODE_ALIASES[rawMode] || (rawMode as GameMode);
    const totalLevels = levels.length;

    // Handle game completion — called by each game component
    const handleLevelComplete = (score: number, levelsInGame: number) => {
        // Prevent double-fire (some games call onGameComplete multiple times)
        if (handledRef.current) return;
        handledRef.current = true;

        setLastLevelScore(score);
        setTotalScore(prev => prev + score);

        const passedLevels = 1;
        const isWin = levelsInGame >= passedLevels;

        if (isWin) {
            // Calculate stars based on accuracy tracking
            const totalQ = totalAnsweredRef.current || currentLevel?.questions?.length || 1;
            const stars = calculateStars(correctCountRef.current, totalQ);
            setLastLevelStars(stars);
            onGameComplete(score, currentLevelIdx + 1);
            play('level_win');
            setState("levelWin");
        } else {
            setLastLevelStars(0);
            play('level_lose');
            setState("levelLose");
        }
        stopAll();
    };

    // Continue to next level or retry
    const handleContinue = () => {
        if (state === "levelWin") {
            const nextIdx = currentLevelIdx + 1;
            if (nextIdx >= totalLevels) {
                onExit();
                return;
            }
            setCurrentLevelIdx(nextIdx);
            setGameKey(k => k + 1); // Force remount
            setActiveQuestionIdx(0); // Reset question index for new level
            setState("levelIntro");
        } else if (state === "levelLose") {
            // Re-fetch questions from server for smart selection on retry
            onRefreshLevels?.();
            setGameKey(k => k + 1); // Force remount for retry
            setActiveQuestionIdx(0); // Reset question index for retry
            setState("levelIntro");
        }
    };

    const handleExitToPortal = () => {
        // BUG-5 FIX: Do NOT call onGameComplete again — it was already called
        // in handleLevelComplete when the level ended. Calling it here caused XP dupe.
        onExit();
    };

    // Get next game mode
    const getNextGameMode = (): string | undefined => {
        const nextIdx = currentLevelIdx + 1;
        if (nextIdx >= totalLevels) return undefined;
        return (levels[nextIdx]?.gameMode as string) || "timebomb";
    };

    /* ─── RENDER ─── */

    // Planet intro
    if (state === "planetIntro") {
        const videoSrc = PLANET_VIDEOS[planetName];
        return (
            <div className="w-full max-w-6xl mx-auto relative min-h-[500px]">
                <PlanetStoryIntro
                    planetName={planetName}
                    planetEmoji={planetEmoji}
                    videoSrc={videoSrc}
                    onStart={() => setState("levelIntro")}
                />
            </div>
        );
    }

    // Level intro
    if (state === "levelIntro" && currentLevel) {
        return (
            <div className="w-full max-w-6xl mx-auto relative min-h-[500px] flex items-center justify-center">
                <LevelIntro
                    planetName={planetName}
                    planetEmoji={planetEmoji}
                    levelTitle={currentLevel.title}
                    levelNumber={currentLevelIdx + 1}
                    subject={currentLevel.subject}
                    playerClass={playerClass}
                    gameMode={activeMode}
                    onStart={() => setState("playing")}
                />
            </div>
        );
    }

    // Transition screens
    if ((state === "levelWin" || state === "levelLose")) {
        return (
            <div className="w-full max-w-6xl mx-auto relative min-h-[500px] flex items-center justify-center">
                <LevelTransition
                    type={state === "levelWin" ? "win" : "lose"}
                    score={lastLevelScore}
                    stars={lastLevelStars}
                    levelCompleted={state === "levelWin" ? currentLevelIdx + 1 : currentLevelIdx}
                    totalLevels={totalLevels}
                    nextGameMode={state === "levelWin" ? getNextGameMode() : undefined}
                    planetEmoji={planetEmoji}
                    planetName={planetName}
                    onContinue={handleContinue}
                    onExit={handleExitToPortal}
                />
            </div>
        );
    }

    // Playing — render game for current level only
    if (state === "playing" && currentLevel) {
        const singleLevel = [currentLevel];

        // When game calls onExit (e.g. from "Thoát" button), treat as lose
        const handleGameExit = () => {
            if (!handledRef.current) {
                handledRef.current = true;
                setState("levelLose");
            }
        };

        // Wrap onAnswered to track accuracy for star calculation + sound + combo
        const trackingOnAnswered = (questionId: string, isCorrect: boolean, subject: string, bloomLevel: number) => {
            totalAnsweredRef.current += 1;
            if (isCorrect) {
                correctCountRef.current += 1;
                // Combo logic — use ref for sync read, state for UI update
                const nextCombo = comboRef.current + 1;
                comboRef.current = nextCombo;
                setComboStreak(nextCombo);
                // Play AFTER state update (not inside setter)
                if (nextCombo >= 5) play('combo_big');
                else if (nextCombo >= 3) play('combo_3');
                else if (nextCombo >= 2) play('combo_2');
                else play('correct');
            } else {
                play('wrong');
                comboRef.current = 0;
                setComboStreak(0);
            }
            // Advance active question index so SummonOverlay shows correct context
            setActiveQuestionIdx(prev => prev + 1);
            onAnswered?.(questionId, isCorrect, subject, bloomLevel);
        };

        const commonProps = {
            levels: singleLevel,
            onExit: handleGameExit,
            playerClass,
            onGameComplete: handleLevelComplete,
            onAnswered: trackingOnAnswered,
            calmMode,
            paused: gamePaused, // BUG-4 FIX: Pass pause state to games
        };

        // Determine bloom level for summon eligibility
        // Higher levels = harder questions = higher Bloom (proxy: level ≥ 3 ≈ Bloom 3+)
        const currentBloom = Math.min(5, Math.ceil(currentLevel.level / 2));
        const allQs = currentLevel.questions ?? [];
        // Use activeQuestionIdx to show the question currently on screen (not always Q0)
        const activeQ = allQs[Math.min(activeQuestionIdx, allQs.length - 1)];
        const currentQ = activeQ?.question ?? "";
        const currentAnswers = activeQ
            ? [activeQ.correctWord, ...(activeQ.wrongWords || [])].filter(Boolean)
            : [];

        let gameComponent;
        switch (activeMode) {
            case "shooter":
                gameComponent = <SpaceShooterGame key={gameKey} {...commonProps} />;
                break;
            case "star-hunter":
                gameComponent = <StarHunterGame key={gameKey} {...commonProps} />;
                break;
            case "meteor":
                gameComponent = <MeteorShowerGame key={gameKey} {...commonProps} />;
                break;
            case "rush":
                gameComponent = <WordRushGame key={gameKey} {...commonProps} />;
                break;
            case "timebomb":
                gameComponent = <TimeBombGame key={gameKey} {...commonProps} />;
                break;
            case "galaxy-sort":
                gameComponent = <GalaxySortGame key={gameKey} {...commonProps} />;
                break;
            case "cosmo-bridge":
                gameComponent = <CosmoBridgeGame key={gameKey} {...commonProps} />;
                break;
            case "boss":
                gameComponent = <BossBattle key={gameKey} {...commonProps} />;
                break;
            case "star-race":
                gameComponent = <StarRaceGame key={gameKey} {...commonProps} />;
                break;
            default:
                gameComponent = <SpaceShooterGame key={gameKey} {...commonProps} />;
        }

        // Wrap with SummonOverlay for 🔮 help system
        return (
            <div className="w-full max-w-6xl mx-auto relative min-h-[500px] flex flex-col">
                <SummonOverlay
                    planetId={planetId || "hue"}
                    bloomLevel={currentBloom}
                    currentQuestion={currentQ}
                    currentSubject={currentLevel.subject}
                    currentAnswers={currentAnswers}
                    onPause={() => setGamePaused(true)}
                    onResume={() => setGamePaused(false)}
                >
                    {gameComponent}
                </SummonOverlay>
                {/* Persistent floating mascot companion */}
                <FloatingMascot />
                {/* Combo flash overlay */}
                <ComboFlash combo={comboStreak} calmMode={calmMode} />
            </div>
        );
    }

    // Fallback: should never reach here, but show a loading indicator instead of blank
    return (
        <div className="w-full max-w-6xl mx-auto text-center py-16 px-6">
            <div className="text-4xl animate-bounce mb-4">🚀</div>
            <p className="text-white/60 text-sm">Đang chuẩn bị màn chơi...</p>
        </div>
    );
}
