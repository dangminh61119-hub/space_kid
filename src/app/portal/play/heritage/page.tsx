"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import StarField from "@/components/StarField";
import NeonButton from "@/components/NeonButton";
import HeritagePuzzleGame from "@/components/HeritagePuzzleGame";
import { useGame } from "@/lib/game-context";

function HeritagePuzzleContent() {
    const router = useRouter();
    const { player, addXP } = useGame();
    const [showIntro, setShowIntro] = useState(true);

    const handleGameComplete = (finalScore: number, _levelsCompleted: number) => {
        addXP(finalScore);
    };

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
                        🏛️ Ghép Di Sản Việt Nam
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="glass-card !p-2 !px-4 !rounded-xl flex items-center gap-2">
                            <span className="text-neon-gold">⭐</span>
                            <span className="text-sm font-bold text-white">{player.xp.toLocaleString()} XP</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game area */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
                <HeritagePuzzleGame
                    onExit={() => router.push("/portal")}
                    onGameComplete={handleGameComplete}
                    calmMode={player.calmMode}
                />
            </div>
        </div>
    );
}

export default function HeritagePuzzlePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-white/50">Đang tải...</span></div>}>
            <HeritagePuzzleContent />
        </Suspense>
    );
}
