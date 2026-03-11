"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/services/auth-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useGame } from "@/lib/game-context";
import { getJourneys, type Journey } from "@/lib/services/db";
import { motion, AnimatePresence } from "framer-motion";
import StarRaceGame from "@/components/StarRaceGame";
import NeonButton from "@/components/NeonButton";
import CalmModeToggle from "@/components/CalmModeToggle";
import VolumeControl from "@/components/VolumeControl";
import type { GameLevel } from "@/lib/services/db";

/* ═══════════════════════════════════════════════
 * Helios Play Page — Star Race Multiplayer
 * ═══════════════════════════════════════════════ */

function HeliosContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { playerDbId } = useAuth();
    const { loading: authLoading, allowed, redirecting } = useRequireAuth();
    const { player, spendStars } = useGame();

    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [selectedJourney, setSelectedJourney] = useState<string | null>(
        searchParams.get("journey") || null,
    );
    const [loading, setLoading] = useState(true);
    const [starError, setStarError] = useState("");

    // Load Helios journeys
    useEffect(() => {
        async function load() {
            try {
                if (!playerDbId) return;
                const data = await getJourneys(player.grade, playerDbId, "helios");
                setJourneys(data);
            } catch (e) {
                console.error("[helios] load error:", e);
            } finally {
                // BUG-4 FIX: Always clear loading, even if playerDbId is null
                setLoading(false);
            }
        }
        load();
    }, [playerDbId, player.grade]);

    const handleExit = useCallback(() => {
        if (selectedJourney) {
            setSelectedJourney(null);
        } else {
            router.push("/portal");
        }
    }, [selectedJourney, router]);

    const handleGameComplete = useCallback(
        (score: number, _levelsCompleted: number) => {
            console.log("[helios] Race completed, score:", score);
            // Star Race doesn't follow the normal journey progress system
            // Points/rewards can be added here later
        },
        [],
    );

    const handleAnswered = useCallback(
        (questionId: string, isCorrect: boolean, subject: string, bloomLevel: number) => {
            console.log("[helios]", isCorrect ? "✅" : "❌", questionId, subject, bloomLevel);
        },
        [],
    );

    // Loading state
    if (authLoading || redirecting || !allowed) {
        return (
            <div className="min-h-screen bg-space-deep flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-3" style={{ animation: "pulse 2s infinite" }}>🌌</div>
                    <p className="text-white/50 text-sm">
                        {authLoading ? "Đang kiểm tra đăng nhập..." : "Đang chuyển hướng..."}
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-space-deep flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl animate-float mb-4">☀️</div>
                    <p className="text-white/50 text-sm">Đang tải Helios...</p>
                </div>
            </div>
        );
    }

    // If a journey is selected → show the race game
    if (selectedJourney) {
        // Create a mock level so GameModeController-style works
        const mockLevel: GameLevel = {
            id: `helios-${selectedJourney}`,
            level: 1,
            planet: "helios",
            subject: "Đua",
            title: "Cuộc Đua Sao",
            speed: 1,
            gameMode: "star-race",
            questions: [],
        };

        return (
            <div className="min-h-screen bg-space-deep flex items-center justify-center p-4">
                <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-space-deep flex items-center justify-center">
                    <StarRaceGame
                        levels={[mockLevel]}
                        onExit={handleExit}
                        playerClass={player.playerClass}
                        onGameComplete={handleGameComplete}
                        onAnswered={handleAnswered}
                        journeySlug={selectedJourney}
                    />
                </div>
            </div>
        );
    }

    // Journey selection screen
    const trackColors = [
        "linear-gradient(135deg, #FF6B35, #FF00FF)",
        "linear-gradient(135deg, #00F5FF, #0077B6)",
        "linear-gradient(135deg, #4ADE80, #059669)",
    ];

    return (
        <div className="min-h-screen bg-space-deep flex flex-col">
            {/* Top bar */}
            <div className="glass-card-strong border-b border-white/10" style={{ borderRadius: 0 }}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <NeonButton href="/portal" variant="cyan" size="sm">
                        ← Quay lại
                    </NeonButton>
                    <h1 className="text-sm font-bold text-white/80 font-[var(--font-heading)]">☀️ Helios — Đua Sao</h1>
                    <div className="flex items-center gap-2">
                        <CalmModeToggle />
                        <VolumeControl />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-lg mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Header */}
                        <div className="text-6xl mb-3 animate-float">☀️</div>
                        <h1 className="text-3xl font-bold text-white mb-1 font-[var(--font-heading)]">
                            Helios
                        </h1>
                        <p className="text-white/50 text-sm mb-2">
                            Cuộc Đua Giữa Các Vì Sao — Chọn đường đua!
                        </p>
                        <div className="glass-card !inline-flex !px-4 !py-2 !rounded-full items-center gap-2 mb-6">
                            <span className="text-lg">⭐</span>
                            <span className="text-neon-gold font-bold">{player.luckyStars}</span>
                            <span className="text-white/40 text-xs">sao — mỗi lượt đua tốn 1 ⭐</span>
                        </div>
                        {starError && (
                            <div className="text-red-400 text-sm mb-4 animate-pulse">
                                ⚠️ {starError}
                            </div>
                        )}

                        {/* Journey tracks */}
                        <div className="space-y-4">
                            <AnimatePresence>
                                {journeys.map((j, i) => (
                                    <motion.button
                                        key={j.slug}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        onClick={() => {
                                            // Try to charge 1 star (but allow entry even with 0)
                                            if (player.luckyStars > 0) {
                                                spendStars(1);
                                            }
                                            setStarError("");
                                            setSelectedJourney(j.slug);
                                        }}
                                        className="w-full p-5 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-95 border border-white/10 hover:border-white/30"
                                        style={{
                                            background: trackColors[i] || trackColors[0],
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="text-3xl">{j.emoji}</span>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-white">
                                                    {j.title}
                                                </h3>
                                                <p className="text-white/80 text-xs">
                                                    {j.description}
                                                </p>
                                                <div className="flex gap-2 mt-1.5">
                                                    {j.subjects.map((s: string) => (
                                                        <span
                                                            key={s}
                                                            className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white/90"
                                                        >
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-2xl">🏁</span>
                                        </div>
                                    </motion.button>
                                ))}
                            </AnimatePresence>

                            {journeys.length === 0 && (
                                <div className="glass-card !p-8 !rounded-2xl text-center">
                                    <div className="text-4xl mb-3">🔭</div>
                                    <p className="text-white/50 text-sm">
                                        Chưa có đường đua nào cho lớp {player.grade}. Hãy quay lại sau!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Back button */}
                        <button
                            onClick={() => router.push("/portal")}
                            className="mt-8 text-white/30 text-sm hover:text-white/60 transition-colors"
                        >
                            ← Về Portal
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default function HeliosPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-space-deep flex items-center justify-center">
                    <div className="text-5xl animate-float">☀️</div>
                </div>
            }
        >
            <HeliosContent />
        </Suspense>
    );
}
