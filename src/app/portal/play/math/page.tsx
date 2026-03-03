"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback } from "react";
import StarField from "@/components/StarField";
import NeonButton from "@/components/NeonButton";
import MathForgeGame from "@/components/MathForgeGame";
import LevelIntro from "@/components/LevelIntro";
import PlanetStoryIntro from "@/components/PlanetStoryIntro";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import { getMathLevels, updateMastery, type MathLevel } from "@/lib/services/db";
import { getPlanetVideo } from "@/lib/data/planet-videos";

const PLANET_NAMES: Record<string, { name: string; emoji: string }> = {
    "giong": { name: "Làng Gióng", emoji: "⚔️" },
    "sapa": { name: "Ruộng bậc thang Sa Pa", emoji: "🌾" },
};

function MathPlayContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { player, addXP, updatePlanetProgress } = useGame();
    const { playerDbId } = useAuth();
    const planetId = searchParams.get("planet") || "giong";
    const planetInfo = PLANET_NAMES[planetId] || { name: "Làng Gióng", emoji: "⚔️" };

    const videoSrc = getPlanetVideo(planetInfo.name);
    const [phase, setPhase] = useState<"video" | "intro" | "playing">(videoSrc ? "video" : "intro");
    const [levels, setLevels] = useState<MathLevel[]>([]);
    const [loading, setLoading] = useState(true);

    // Load levels with mastery-adaptive Bloom selection
    useEffect(() => {
        setLoading(true);
        getMathLevels(planetId, player.grade, player.masteryByTopic)
            .then((data) => {
                setLevels(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [planetId, player.grade, player.masteryByTopic]);

    const handleGameComplete = (finalScore: number, levelsCompleted: number) => {
        addXP(finalScore);
        const currentProgress = player.planetsProgress[planetId];
        if (currentProgress) {
            const newCompleted = Math.max(currentProgress.completedLevels, levelsCompleted);
            updatePlanetProgress(planetId, newCompleted, currentProgress.totalLevels);
        }
    };

    // Fire-and-forget mastery update after each answer
    const handleAnswered = useCallback((isCorrect: boolean, subject: string, bloomLevel: number) => {
        if (playerDbId) {
            updateMastery(playerDbId, planetId, subject, isCorrect, bloomLevel);
        }
    }, [playerDbId, planetId]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-4xl animate-bounce">⚔️</div>
                    <p className="text-white/60">Đang tải lò rèn...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative flex flex-col">
            <StarField count={40} />

            {/* Top bar */}
            <div className="relative z-10 glass-card-strong" style={{ borderRadius: 0 }}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <NeonButton href="/portal" variant="cyan" size="sm">
                        ← Quay lại
                    </NeonButton>
                    <h1 className="text-sm sm:text-base font-bold text-white/80 font-[var(--font-heading)]">
                        {planetInfo.emoji} {planetInfo.name}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="glass-card !p-2 !px-4 !rounded-xl flex items-center gap-2">
                            <span className="text-neon-gold">⭐</span>
                            <span className="text-sm font-bold text-white">{player.xp.toLocaleString()} XP</span>
                        </div>
                        <div className="glass-card !p-2 !px-4 !rounded-xl flex items-center gap-2">
                            <span>🔥</span>
                            <span className="text-sm font-bold text-white">{player.streak} ngày</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game area */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
                {phase === "video" && videoSrc ? (
                    <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep">
                        <PlanetStoryIntro
                            planetName={planetInfo.name}
                            planetEmoji={planetInfo.emoji}
                            videoSrc={videoSrc}
                            onStart={() => setPhase("intro")}
                        />
                    </div>
                ) : phase === "intro" ? (
                    <div className="w-full max-w-4xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex items-center justify-center">
                        <LevelIntro
                            planetName={planetInfo.name}
                            planetEmoji={planetInfo.emoji}
                            levelTitle={levels[0]?.title || ""}
                            levelNumber={levels[0]?.level || 1}
                            subject={levels[0]?.subject || ""}
                            playerClass={player.playerClass}
                            gameMode="math-forge"
                            onStart={() => setPhase("playing")}
                        />
                    </div>
                ) : (
                    <MathForgeGame
                        levels={levels}
                        onExit={() => router.push("/portal")}
                        playerClass={player.playerClass}
                        onGameComplete={handleGameComplete}
                        onAnswered={handleAnswered}
                    />
                )}
            </div>
        </div>
    );
}

export default function MathPlayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-white/50">Đang tải...</span></div>}>
            <MathPlayContent />
        </Suspense>
    );
}
