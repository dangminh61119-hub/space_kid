"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import StarField from "@/components/StarField";
import NeonButton from "@/components/NeonButton";
import GameModeController from "@/components/GameModeController";
import { useGame } from "@/lib/game-context";
import { useAuth } from "@/lib/services/auth-context";
import { getJourneyLevels, updateMastery, saveJourneyProgress, getJourneyProgress, getPlanetForGrade, saveAnsweredQuestion, awardBadge, checkAchievementBadges, type GameLevel, type Ship } from "@/lib/services/db";
import { supabase } from "@/lib/services/supabase";

function PlayContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { player, addCosmo, addCoins, addStars } = useGame();
    const { playerDbId } = useAuth();
    const [levels, setLevels] = useState<GameLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [journeyTitle, setJourneyTitle] = useState("");
    const [journeyEmoji, setJourneyEmoji] = useState("🏛️");
    const [journeyId, setJourneyId] = useState("");
    const [completedLevels, setCompletedLevels] = useState(0);
    const [isFirstVisit, setIsFirstVisit] = useState(true);
    const [earnedBadge, setEarnedBadge] = useState<{ name: string; emoji: string } | null>(null);
    const [unlockedShips, setUnlockedShips] = useState<Ship[]>([]);
    const [starPopup, setStarPopup] = useState(false);
    const [starCollected, setStarCollected] = useState(false);
    const [starPosition, setStarPosition] = useState({ x: 50, y: 50 });
    const starTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const planetRef = useRef<{ id: string } | null>(null);
    // BUG-009 FIX: use ref so handleAnswered doesn't need starPopup in deps
    const starPopupRef = useRef(false);

    const journeySlug = searchParams.get("journey") || "ha-long";

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                // Get journey info by slug
                if (!supabase) return;
                const { data: journeyData } = await supabase
                    .from("journeys")
                    .select("id, title, emoji")
                    .eq("slug", journeySlug)
                    .single();

                if (journeyData) {
                    setJourneyId(journeyData.id);
                    setJourneyTitle(journeyData.title);
                    setJourneyEmoji(journeyData.emoji);

                    const data = await getJourneyLevels(journeyData.id, playerDbId || undefined, player.grade);
                    setLevels(data);

                    // Load saved progress so the player resumes from where they left off
                    if (playerDbId) {
                        const planet = await getPlanetForGrade(player.grade);
                        planetRef.current = planet;
                        if (planet) {
                            const progress = await getJourneyProgress(playerDbId, journeyData.id, planet.id);
                            if (progress) {
                                setCompletedLevels(progress.completed_levels);
                                setIsFirstVisit(progress.completed_levels === 0);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("[play] load error:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [journeySlug, playerDbId, player.grade]);

    const handleGameComplete = async (finalScore: number, levelsCompleted: number) => {
        const cosmoReward = Math.max(100, finalScore);
        addCosmo(cosmoReward);
        // BUG-004 FIX: coins only awarded when a journey makes progress (not on every game completion)

        if (playerDbId && journeyId) {
            const planet = planetRef.current || await getPlanetForGrade(player.grade);
            if (planet) {
                planetRef.current = planet;
                const newCompleted = Math.max(completedLevels, levelsCompleted);
                await saveJourneyProgress(playerDbId, journeyId, planet.id, newCompleted, levels.length);
                setCompletedLevels(newCompleted);

                // 🏅 Award heritage badge when journey fully completed
                let heritageBadge = null;
                if (newCompleted >= levels.length && levels.length > 0) {
                    heritageBadge = await awardBadge(playerDbId, journeySlug);
                    // Reward coins only when a meaningful milestone is reached
                    addCoins(50);
                }

                // 🏅 Check achievement badges (streak, levels milestone)
                // BUG-3 FIX: isPerfectScore was always true (finalScore > 0 && levelsCompleted > 0).
                // Perfect score = 3 stars = 100% accuracy. GMC tracks this internally.
                // We conservatively omit isPerfectScore here; the retroactiveBadgeCheck on portal load
                // will award it when appropriate based on mastery data.
                const achievementBadges = await checkAchievementBadges(playerDbId, {
                    streak: player.streak,
                    totalLevelsCompleted: newCompleted,
                });

                // Show badge modal if any badge was earned
                const firstBadge = heritageBadge || (achievementBadges.length > 0 ? achievementBadges[0] : null);
                if (firstBadge) {
                    const BADGE_EMOJIS: Record<string, string> = {
                        'dragon-badge': '🐉', 'lantern-badge': '🏮', 'sword-badge': '⚔️',
                        'royal-badge': '👑', 'river-badge': '🌊', 'mountain-badge': '🏔️',
                        'cave-badge': '🦇', 'capital-badge': '🌆', 'turtle-badge': '🐢',
                        'temple-badge': '🏛️', 'first-level': '👣', 'streak-3': '🔥',
                        'streak-7': '🔥', 'levels-10': '🗺️', 'levels-30': '🏆',
                        'mastery-80': '🎓', 'perfect-score': '💎',
                    };
                    setEarnedBadge({
                        name: firstBadge.badge_name,
                        emoji: BADGE_EMOJIS[firstBadge.badge_slug] || '🏅',
                    });
                }
            }
        }
    };

    // IMP-2 FIX: Use cached planetRef to avoid stale closure and unnecessary async call
    const correctCountRef = useRef(0);       // Track correct answers in this session
    const lastStarAtRef = useRef(0);          // Which answer # last star appeared at

    const handleAnswered = useCallback((questionId: string, isCorrect: boolean, subject: string, bloomLevel: number) => {
        if (playerDbId) {
            // Track which questions the player has answered (enables smart selection)
            if (questionId) {
                saveAnsweredQuestion(playerDbId, questionId, isCorrect);
            }

            // ⭐ Lucky Star spawn: progressive probability with minimum wait
            if (isCorrect) {
                correctCountRef.current++;
                const answersSinceLastStar = correctCountRef.current - lastStarAtRef.current;

                // Minimum 2 correct answers before first star, then 2+ between stars
                const minWait = lastStarAtRef.current === 0 ? 2 : 2;

                // BUG-009 FIX: read from ref instead of state to avoid stale closure / dep
                if (answersSinceLastStar >= minWait && !starPopupRef.current) {
                    // Progressive probability: 20% base + 5% per extra answer (cap 40%)
                    const extraAnswers = answersSinceLastStar - minWait;
                    const probability = Math.min(0.40, 0.20 + extraAnswers * 0.05);

                    if (Math.random() < probability) {
                        const x = 15 + Math.random() * 70;
                        const y = 20 + Math.random() * 50;
                        setStarPosition({ x, y });
                        starPopupRef.current = true;
                        setStarPopup(true);
                        setStarCollected(false);
                        lastStarAtRef.current = correctCountRef.current;
                        starTimerRef.current = setTimeout(() => {
                            starPopupRef.current = false;
                            setStarPopup(false);
                        }, 3000);
                    }
                }
            }

            // Use cached planet ref instead of calling getPlanetForGrade every time
            const planet = planetRef.current;
            if (planet) {
                updateMastery(playerDbId, planet.id, subject, isCorrect, bloomLevel);
            }
        }
    }, [playerDbId]);  // BUG-009 FIX: starPopup removed from deps (using ref now)

    /* ─── Refresh levels (re-fetch from server for smart question rotation) ─── */
    const refreshLevels = useCallback(async () => {
        if (!journeyId || !supabase) return;
        try {
            const data = await getJourneyLevels(journeyId, playerDbId || undefined, player.grade);
            setLevels(data);
        } catch (e) {
            console.error("[play] refreshLevels error:", e);
        }
    }, [journeyId, playerDbId, player.grade]);

    const handleStarClick = useCallback(() => {
        if (starTimerRef.current) clearTimeout(starTimerRef.current);
        setStarCollected(true);
        starPopupRef.current = false;
        addStars(1);
        // Keep collected animation for 1.5s then dismiss
        setTimeout(() => {
            setStarPopup(false);
            setStarCollected(false);
        }, 1500);
    }, [addStars]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="text-4xl animate-bounce">🚀</div>
                    <p className="text-white/60">Đang tải sứ mệnh...</p>
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
                        {journeyEmoji} {journeyTitle}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="glass-card !p-2 !px-4 !rounded-xl flex items-center gap-2">
                            <span className="text-neon-gold">⭐</span>
                            <span className="text-sm font-bold text-white">{player.cosmo.toLocaleString()} ✦</span>
                        </div>
                        <div className="glass-card !p-2 !px-4 !rounded-xl flex items-center gap-2">
                            <span>🔥</span>
                            <span className="text-sm font-bold text-white">{player.streak} ngày</span>
                        </div>
                        <div className="glass-card !p-2 !px-4 !rounded-xl flex items-center gap-2">
                            <span>⭐</span>
                            <span className="text-sm font-bold text-neon-gold">{player.luckyStars}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game area */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
                <GameModeController
                    levels={levels}
                    onExit={() => router.push("/portal")}
                    playerClass={player.playerClass}
                    onGameComplete={handleGameComplete}
                    onAnswered={handleAnswered}
                    planetName={journeyTitle}
                    planetEmoji={journeyEmoji}
                    planetId={journeySlug}
                    completedLevels={completedLevels}
                    isFirstVisit={isFirstVisit}
                    onRefreshLevels={refreshLevels}
                />
            </div>

            {/* ⭐ Interactive Lucky Star */}
            {starPopup && !starCollected && (
                <div className="fixed inset-0 z-40 pointer-events-none">
                    <button
                        onClick={handleStarClick}
                        className="pointer-events-auto absolute cursor-pointer"
                        style={{
                            left: `${starPosition.x}%`,
                            top: `${starPosition.y}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {/* Countdown ring */}
                        <svg className="absolute -inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(250,204,21,0.15)" strokeWidth="3" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(250,204,21,0.8)" strokeWidth="3"
                                strokeDasharray="283" strokeLinecap="round"
                                style={{
                                    animation: 'starCountdown 3s linear forwards',
                                    transformOrigin: 'center',
                                    transform: 'rotate(-90deg)',
                                }}
                            />
                        </svg>
                        {/* Pulsing glow */}
                        <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl" style={{ animation: 'starPulse 0.6s ease-in-out infinite alternate' }} />
                        {/* Star icon */}
                        <div className="text-5xl sm:text-6xl relative" style={{ animation: 'starBounce 0.8s ease-in-out infinite alternate', filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.8))' }}>
                            ⭐
                        </div>
                        {/* Label */}
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-yellow-300/80">
                            Nhấp để bắt!
                        </div>
                    </button>
                </div>
            )}

            {/* ⭐ Star Collected Animation */}
            {starPopup && starCollected && (
                <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                    <div style={{ animation: 'starCollect 1.4s ease-out forwards' }} className="text-center">
                        <div className="text-7xl mb-1" style={{ filter: 'drop-shadow(0 0 20px rgba(250,204,21,1))' }}>⭐</div>
                        <div className="text-xl font-bold text-yellow-300" style={{
                            textShadow: '0 0 10px rgba(250,204,21,0.8), 0 0 30px rgba(250,204,21,0.4)',
                        }}>
                            +1 Ngôi sao may mắn!
                        </div>
                    </div>
                    {/* Sparkle particles */}
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute" style={{
                            left: '50%', top: '50%',
                            animation: `sparkle 0.8s ease-out ${i * 0.05}s forwards`,
                            transform: `rotate(${i * 45}deg)`,
                        }}>
                            <div className="text-lg" style={{ transform: 'translateY(-40px)' }}>✨</div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes starCountdown {
                    from { stroke-dashoffset: 0; }
                    to { stroke-dashoffset: 283; }
                }
                @keyframes starPulse {
                    from { transform: scale(0.8); opacity: 0.4; }
                    to { transform: scale(1.5); opacity: 0.1; }
                }
                @keyframes starBounce {
                    from { transform: scale(1) translateY(0); }
                    to { transform: scale(1.15) translateY(-4px); }
                }
                @keyframes starCollect {
                    0% { opacity: 1; transform: scale(1); }
                    30% { opacity: 1; transform: scale(1.4); }
                    100% { opacity: 0; transform: scale(0.6) translateY(-80px); }
                }
                @keyframes sparkle {
                    0% { opacity: 1; transform: rotate(var(--r, 0deg)) translateY(0); }
                    100% { opacity: 0; transform: rotate(var(--r, 0deg)) translateY(-80px); }
                }
            `}</style>

            {/* 🏅 Badge Earned Modal */}
            {earnedBadge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                    <div className="glass-card-strong p-8 rounded-3xl text-center max-w-sm mx-4 animate-float">
                        <div className="text-6xl mb-4 animate-glow-pulse">{earnedBadge.emoji}</div>
                        <h2 className="text-2xl font-bold text-neon-gold mb-2">🏅 Huy hiệu mới!</h2>
                        <p className="text-white text-lg mb-1">{earnedBadge.name}</p>
                        <p className="text-white/50 text-sm mb-4">Bạn đã hoàn thành hành trình {journeyEmoji} {journeyTitle}!</p>

                        {unlockedShips.length > 0 && (
                            <div className="glass-card !p-4 !rounded-xl mb-4">
                                <div className="text-sm text-neon-cyan font-bold mb-2">🚀 Mở khóa phi thuyền mới!</div>
                                {unlockedShips.map(ship => (
                                    <div key={ship.id} className="flex items-center justify-center gap-2 text-white">
                                        <span className="text-2xl">{ship.emoji}</span>
                                        <span className="font-bold">{ship.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <NeonButton
                            variant="gold"
                            onClick={() => {
                                setEarnedBadge(null);
                                setUnlockedShips([]);
                            }}
                        >
                            Tuyệt vời! ✨
                        </NeonButton>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PlayPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><span className="text-white/50">Đang tải...</span></div>}>
            <PlayContent />
        </Suspense>
    );
}
