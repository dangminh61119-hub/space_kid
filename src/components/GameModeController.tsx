"use client";

import { useState, useCallback } from "react";
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

/* ─── Story intros per planet ─── */
const PLANET_STORIES: Record<string, string> = {
    "Cố đô Huế": "Kinh thành Huế đang bị Băng đảng Lười Biếng phá hủy các văn bản cổ! Hãy dùng sức mạnh ngôn ngữ để khôi phục chúng! Mỗi màn sẽ là một thử thách mới, từ dễ đến khó!",
    "Vịnh Hạ Long": "Vịnh Hạ Long bị phong ấn bởi ma thuật tối! Chúng ta phải vượt qua nhiều thử thách để phá phong ấn từng lớp một!",
    "Làng Gióng": "Lò rèn của Thánh Gióng cần năng lượng! Mỗi màn chơi sẽ rèn luyện cho bạn một sức mạnh mới!",
    "Phong Nha": "Hang động Phong Nha ẩn chứa bí mật khoa học! Càng đi sâu, thử thách càng lớn!",
    "Phố cổ Hội An": "Đèn lồng Hội An đang tắt dần! Thắp sáng từng đèn bằng tri thức qua mỗi màn chơi!",
    "Ruộng bậc thang Sa Pa": "Ruộng bậc thang bị mã hóa! Giải mã từng tầng bằng Toán học!",
    "Thủ đô Hà Nội": "Thăng Long đang bị xóa trí nhớ! Hãy viết lại lịch sử qua từng sứ mệnh!",
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
    // Start with planet intro if first visit, otherwise go to level intro
    const [state, setState] = useState<ControllerState>(
        isFirstVisit ? "planetIntro" : "levelIntro"
    );
    // Start from the level AFTER the ones already completed (0-indexed)
    const [currentLevelIdx, setCurrentLevelIdx] = useState(
        Math.min(completedLevels, levels.length - 1)
    );
    const [totalScore, setTotalScore] = useState(0);
    const [lastLevelScore, setLastLevelScore] = useState(0);

    if (levels.length === 0) return null;

    const currentLevel = levels[currentLevelIdx];
    const activeMode = getModeForLevel(currentLevel?.level ?? 1);
    const totalLevels = levels.length;

    // Handle game completion for a single level
    const handleLevelComplete = useCallback((score: number, _levelsInGame: number) => {
        setLastLevelScore(score);
        setTotalScore(prev => prev + score);

        // If score > 0, they completed the level (win)
        if (score > 0) {
            // Report progress to parent
            onGameComplete(score, currentLevelIdx + 1);
            setState("levelWin");
        } else {
            setState("levelLose");
        }
    }, [currentLevelIdx, onGameComplete]);

    // Go to next level
    const handleContinue = useCallback(() => {
        if (state === "levelWin") {
            const nextIdx = currentLevelIdx + 1;
            if (nextIdx >= totalLevels) {
                // All levels done! Exit to portal
                onExit();
                return;
            }
            setCurrentLevelIdx(nextIdx);
            setState("levelIntro");
        } else if (state === "levelLose") {
            // Retry same level
            setState("levelIntro");
        }
    }, [state, currentLevelIdx, totalLevels, onExit]);

    // Get next game mode label for transition preview
    const getNextGameMode = (): string | undefined => {
        const nextIdx = currentLevelIdx + 1;
        if (nextIdx >= totalLevels) return undefined;
        const nextLevel = levels[nextIdx];
        return getModeForLevel(nextLevel?.level ?? 1);
    };

    /* ─── RENDER based on state ─── */

    // Planet story intro (first visit only)
    if (state === "planetIntro") {
        const story = PLANET_STORIES[planetName] || "Hành tinh này cần sự giúp đỡ của bạn! Hãy vượt qua các thử thách!";
        return (
            <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep">
                <PlanetStoryIntro
                    planetName={planetName}
                    planetEmoji={planetEmoji}
                    storyText={story}
                    onStart={() => setState("levelIntro")}
                />
            </div>
        );
    }

    // Level intro (before each level)
    if (state === "levelIntro" && currentLevel) {
        return (
            <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex items-center justify-center">
                <LevelIntro
                    planetName={planetName}
                    planetEmoji={planetEmoji}
                    levelTitle={currentLevel.title}
                    levelNumber={currentLevel.level}
                    subject={currentLevel.subject}
                    playerClass={playerClass}
                    gameMode={activeMode}
                    onStart={() => setState("playing")}
                />
            </div>
        );
    }

    // Level complete / fail transition
    if ((state === "levelWin" || state === "levelLose") && currentLevel) {
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
                    onExit={() => { onGameComplete(totalScore, currentLevelIdx + 1); onExit(); }}
                />
            </div>
        );
    }

    // Playing — render the game for CURRENT level only
    if (state === "playing" && currentLevel) {
        const singleLevelArr = [currentLevel]; // Pass only 1 level to game

        const commonProps = {
            levels: singleLevelArr,
            onExit: () => setState("levelLose"), // exiting mid-game = lose
            playerClass,
            onGameComplete: handleLevelComplete,
            onAnswered,
            calmMode,
        };

        switch (activeMode) {
            case "shooter":
                return <SpaceShooterGame {...commonProps} />;
            case "star-hunter":
                return <StarHunterGame levels={singleLevelArr} onExit={() => setState("levelLose")} playerClass={playerClass} onGameComplete={handleLevelComplete} calmMode={calmMode} />;
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
