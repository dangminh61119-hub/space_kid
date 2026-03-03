"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import SpaceShooterGame from "./SpaceShooterGame";
import StarHunterGame from "./StarHunterGame";
import MeteorShowerGame from "./MeteorShowerGame";
import WordRushGame from "./WordRushGame";
import TimeBombGame from "./TimeBombGame";
import GalaxySortGame from "./GalaxySortGame";
import CosmoBridgeGame from "./CosmoBridgeGame";
import LevelIntro from "./LevelIntro";
import PlanetStoryIntro from "./PlanetStoryIntro";
import LevelTransition from "./LevelTransition";
import type { GameLevel } from "@/lib/services/db";

type GameMode = "shooter" | "star-hunter" | "meteor" | "rush" | "timebomb" | "galaxy-sort" | "cosmo-bridge";
type ControllerState = "planetIntro" | "levelIntro" | "playing" | "levelWin" | "levelLose";

interface GameModeControllerProps {
    levels: GameLevel[];
    onExit: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete: (finalScore: number, levelsCompleted: number) => void;
    onAnswered?: (isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
    planetName: string;
    planetEmoji: string;
    completedLevels?: number;
    isFirstVisit?: boolean;
}

/* ─── Mode rotation: 7 modes ─── */
const MODE_ORDER: GameMode[] = ["timebomb", "shooter", "cosmo-bridge", "star-hunter", "galaxy-sort", "meteor", "rush"];

function getModeForLevel(levelNum: number): GameMode {
    return MODE_ORDER[(levelNum - 1) % MODE_ORDER.length];
}

/* ─── Video intros per planet ─── */
/* Place your video clips in /public/videos/planets/{key}.mp4 */
const PLANET_VIDEOS: Record<string, string> = {
    "Cố đô Huế": "/videos/planets/hue.mp4",
    "Vịnh Hạ Long": "/videos/planets/halong.mp4",
    "Làng Gióng": "/videos/planets/giong.mp4",
    "Phong Nha": "/videos/planets/phongnha.mp4",
    "Phố cổ Hội An": "/videos/planets/hoian.mp4",
    "Ruộng bậc thang Sa Pa": "/videos/planets/sapa.mp4",
    "Thủ đô Hà Nội": "/videos/planets/hanoi.mp4",
};

export default function GameModeController({
    levels,
    onExit,
    playerClass,
    onGameComplete,
    onAnswered,
    calmMode,
    planetName,
    planetEmoji,
    completedLevels = 0,
    isFirstVisit = false,
}: GameModeControllerProps) {
    const [state, setState] = useState<ControllerState>(
        isFirstVisit ? "planetIntro" : "levelIntro"
    );
    const startIdx = Math.min(completedLevels, Math.max(0, levels.length - 1));
    const [currentLevelIdx, setCurrentLevelIdx] = useState(startIdx);
    const [totalScore, setTotalScore] = useState(0);
    const [lastLevelScore, setLastLevelScore] = useState(0);
    // Key to force-remount game components
    const [gameKey, setGameKey] = useState(0);
    // Track if we already handled this game's completion (prevent double-fire)
    const handledRef = useRef(false);

    // Reset handled flag when entering playing state
    useEffect(() => {
        if (state === "playing") {
            handledRef.current = false;
        }
    }, [state, gameKey]);

    if (levels.length === 0) return null;

    const currentLevel = levels[currentLevelIdx];
    const activeMode = getModeForLevel(currentLevel?.level ?? 1);
    const totalLevels = levels.length;

    // Handle game completion — called by each game component
    const handleLevelComplete = (score: number, levelsInGame: number) => {
        // Prevent double-fire (some games call onGameComplete multiple times)
        if (handledRef.current) return;
        handledRef.current = true;

        setLastLevelScore(score);
        setTotalScore(prev => prev + score);

        // levelsInGame > 0 AND score > 0 = win, otherwise lose
        const isWin = levelsInGame > 0 && score > 0;

        if (isWin) {
            onGameComplete(score, currentLevelIdx + 1);
            setState("levelWin");
        } else {
            setState("levelLose");
        }
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
            setState("levelIntro");
        } else if (state === "levelLose") {
            setGameKey(k => k + 1); // Force remount for retry
            setState("levelIntro");
        }
    };

    const handleExitToPortal = () => {
        onGameComplete(totalScore, currentLevelIdx + (state === "levelWin" ? 1 : 0));
        onExit();
    };

    // Get next game mode
    const getNextGameMode = (): string | undefined => {
        const nextIdx = currentLevelIdx + 1;
        if (nextIdx >= totalLevels) return undefined;
        return getModeForLevel(levels[nextIdx]?.level ?? 1);
    };

    /* ─── RENDER ─── */

    // Planet intro
    if (state === "planetIntro") {
        const videoSrc = PLANET_VIDEOS[planetName];
        return (
            <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep">
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
            <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex items-center justify-center">
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
            <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex items-center justify-center">
                <LevelTransition
                    type={state === "levelWin" ? "win" : "lose"}
                    score={lastLevelScore}
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

        const commonProps = {
            key: gameKey, // Force remount on level change
            levels: singleLevel,
            onExit: handleGameExit,
            playerClass,
            onGameComplete: handleLevelComplete,
            onAnswered,
            calmMode,
        };

        switch (activeMode) {
            case "shooter":
                return <SpaceShooterGame {...commonProps} />;
            case "star-hunter":
                return <StarHunterGame key={gameKey} levels={singleLevel} onExit={handleGameExit} playerClass={playerClass} onGameComplete={handleLevelComplete} calmMode={calmMode} />;
            case "meteor":
                return <MeteorShowerGame {...commonProps} />;
            case "rush":
                return <WordRushGame {...commonProps} />;
            case "timebomb":
                return <TimeBombGame {...commonProps} />;
            case "galaxy-sort":
                return <GalaxySortGame {...commonProps} />;
            case "cosmo-bridge":
                return <CosmoBridgeGame {...commonProps} />;
            default:
                return <SpaceShooterGame {...commonProps} />;
        }
    }

    return null;
}
