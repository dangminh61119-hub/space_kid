"use client";

import { useState } from "react";
import SpaceShooterGame from "./SpaceShooterGame";
import StarHunterGame from "./StarHunterGame";
import MeteorShowerGame from "./MeteorShowerGame";
import WordRushGame from "./WordRushGame";
import TimeBombGame from "./TimeBombGame";
import GalaxySortGame from "./GalaxySortGame";
import CosmoBridgeGame from "./CosmoBridgeGame";
import LevelIntro from "./LevelIntro";
import type { GameLevel } from "@/lib/services/db";

type GameMode = "shooter" | "star-hunter" | "meteor" | "rush" | "timebomb" | "galaxy-sort" | "cosmo-bridge";

interface GameModeControllerProps {
    levels: GameLevel[];
    onExit: () => void;
    playerClass?: "warrior" | "wizard" | "hunter" | null;
    onGameComplete: (finalScore: number, levelsCompleted: number) => void;
    onAnswered?: (isCorrect: boolean, subject: string, bloomLevel: number) => void;
    calmMode?: boolean;
    planetName: string;
    planetEmoji: string;
}

/* ─── Mode rotation: 7 modes – new games appear early ─── */
const MODE_ORDER: GameMode[] = ["timebomb", "shooter", "cosmo-bridge", "star-hunter", "galaxy-sort", "meteor", "rush"];

function getModeForLevel(levelNum: number): GameMode {
    return MODE_ORDER[(levelNum - 1) % MODE_ORDER.length];
}

export default function GameModeController({
    levels,
    onExit,
    playerClass,
    onGameComplete,
    onAnswered,
    calmMode,
    planetName,
    planetEmoji,
}: GameModeControllerProps) {
    const [showIntro, setShowIntro] = useState(true);

    if (levels.length === 0) return null;

    const firstLevelNum = levels[0].level;
    const activeMode = getModeForLevel(firstLevelNum);

    if (showIntro) {
        return (
            <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex items-center justify-center">
                <LevelIntro
                    planetName={planetName}
                    planetEmoji={planetEmoji}
                    levelTitle={levels[0].title}
                    levelNumber={levels[0].level}
                    subject={levels[0].subject}
                    playerClass={playerClass}
                    gameMode={activeMode}
                    onStart={() => setShowIntro(false)}
                />
            </div>
        );
    }

    const commonProps = {
        levels,
        onExit,
        playerClass,
        onGameComplete,
        onAnswered,
        calmMode,
    };

    switch (activeMode) {
        case "shooter":
            return <SpaceShooterGame {...commonProps} />;
        case "star-hunter":
            return <StarHunterGame levels={levels} onExit={onExit} playerClass={playerClass} onGameComplete={onGameComplete} calmMode={calmMode} />;
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


