"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";
import { mockDailyQuest } from "@/lib/data/mock-data";
import { useGame, MASCOT_INFO } from "@/lib/game-context";
import { getPlanetForGrade, getPlanetList, getJourneys, getPlayerBadges, getAllBadges, getShips, getPlayerShips, getUnlockedPlanetIds, exchangeStarsForBadge, retroactiveBadgeCheck, exchangeBadgesForShip, type Planet, type Journey, type Ship, type Badge } from "@/lib/services/db";
import { type DBPlayerBadge } from "@/lib/services/supabase";
import { useAuth } from "@/lib/services/auth-context";
import Link from "next/link";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
    }),
};

export default function PortalPage() {
    const { player, updatePlayer, spendStars } = useGame();
    const { playerDbId } = useAuth();
    const [planet, setPlanet] = useState<Planet | null>(null);
    const [allPlanets, setAllPlanets] = useState<Planet[]>([]);
    const [journeys, setJourneys] = useState<Journey[]>([]);
    const [selectedPlanetId, setSelectedPlanetId] = useState<string>('earth');
    const [unlockedPlanetIds, setUnlockedPlanetIds] = useState<string[]>(['earth']);
    const [playerBadges, setPlayerBadges] = useState<DBPlayerBadge[]>([]);
    const [allShips, setAllShips] = useState<Ship[]>([]);
    const [ownedShipIds, setOwnedShipIds] = useState<string[]>([]);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [exchangeAnim, setExchangeAnim] = useState(false);
    const [unlockedShipModal, setUnlockedShipModal] = useState<{ ship: Ship; planets: Planet[] } | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial load of all data
    useEffect(() => {
        async function load() {
            try {
                const [p, planets, j, unlocked, badges, ships, ownedShips, badgeCatalog] = await Promise.all([
                    getPlanetForGrade(player.grade),
                    getPlanetList(),
                    getJourneys(player.grade, playerDbId || undefined, 'earth'),
                    getUnlockedPlanetIds(playerDbId || ''),
                    getPlayerBadges(playerDbId || ''),
                    getShips(),
                    getPlayerShips(playerDbId || ''),
                    getAllBadges(),
                ]);
                setPlanet(p);
                setAllPlanets(planets);
                setJourneys(j);
                setUnlockedPlanetIds(unlocked);
                setPlayerBadges(badges);
                setAllShips(ships);
                setOwnedShipIds(ownedShips);
                setAllBadges(badgeCatalog);

                // 🏅 Retroactive badge check: award badges for journeys completed before badge system existed
                if (playerDbId) {
                    const retroBadges = await retroactiveBadgeCheck(playerDbId, player.grade);
                    if (retroBadges.length > 0) {
                        // Refresh badges after retroactive awards
                        const refreshed = await getPlayerBadges(playerDbId);
                        setPlayerBadges(refreshed);
                    }
                }
            } catch (e) {
                console.error("[portal] load error:", e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [player.grade, playerDbId]);

    // Reload journeys when selected planet changes
    useEffect(() => {
        async function loadJourneys() {
            setLoading(true);
            try {
                const j = await getJourneys(player.grade, playerDbId || undefined, selectedPlanetId);
                setJourneys(j);
            } catch (e) {
                console.error("[portal] loadJourneys error:", e);
            } finally {
                setLoading(false);
            }
        }
        if (allPlanets.length > 0) {
            loadJourneys();
        }
    }, [selectedPlanetId, player.grade, playerDbId, allPlanets.length]);

    const mascotEmoji = player.mascot ? MASCOT_INFO[player.mascot].emoji : "🚀";
    const completedJourneys = journeys.filter(j => j.completedLevels >= j.totalLevels && j.totalLevels > 0).length;
    const selectedPlanet = allPlanets.find(p => p.id === selectedPlanetId) || planet;

    return (
        <div className="min-h-screen relative">
            <StarField count={70} />
            <Navbar />

            <div className="relative z-10 pt-20 pb-10">
                {/* Daily Quest Banner */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-6xl mx-auto px-4 mb-8"
                >
                    <div className="glass-card-strong p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 border-l-4" style={{ borderLeftColor: "var(--neon-gold)" }}>
                        <div className="text-4xl animate-glow-pulse">⚠️</div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs uppercase tracking-wider text-neon-gold font-bold">Nhiệm vụ Khẩn cấp!</span>
                                <span className="text-[10px] text-white/40 bg-white/10 px-2 py-0.5 rounded-full">{mockDailyQuest.timeLeft}</span>
                            </div>
                            <h3 className="text-white font-bold text-lg">{mockDailyQuest.title}</h3>
                            <p className="text-white/60 text-sm">{mockDailyQuest.description}</p>
                            <p className="text-neon-gold text-xs mt-1">🎁 {mockDailyQuest.reward}</p>
                        </div>
                        <NeonButton variant="gold" size="sm" href="/portal/play">
                            Tham gia!
                        </NeonButton>
                    </div>
                </motion.div>

                {/* ── Planet Galaxy Bar ── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="max-w-6xl mx-auto px-4 mb-6"
                >
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {allPlanets.map((p) => {
                            const isEarth = p.id === 'earth';
                            const isUnlocked = unlockedPlanetIds.includes(p.id);
                            // Find which ship unlocks this planet
                            const requiredShip = allShips.find(s => s.id === p.shipRequired);
                            const badgesNeeded = requiredShip?.requiredBadges ?? 0;
                            const badgesHave = playerBadges.length;
                            const isSelected = p.id === selectedPlanetId;
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        if (isUnlocked || isEarth) setSelectedPlanetId(p.id);
                                    }}
                                    className={`flex-shrink-0 rounded-2xl px-4 py-3 min-w-[140px] text-center transition-all duration-300 ${isSelected
                                        ? 'glass-card-strong border-2 border-neon-cyan shadow-[0_0_25px_rgba(0,245,255,0.25)] scale-105'
                                        : isEarth || isUnlocked
                                            ? 'glass-card border border-white/10 cursor-pointer hover:scale-105 hover:border-neon-cyan/30'
                                            : 'glass-card opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className={`text-3xl mb-1 ${!isUnlocked && !isEarth ? 'grayscale' : ''}`}>{p.emoji}</div>
                                    <div className={`text-xs font-bold ${isSelected ? 'text-neon-cyan' : isUnlocked || isEarth ? 'text-white/80' : 'text-white/40'
                                        }`}>
                                        {p.name}
                                    </div>
                                    {isEarth && isSelected ? (
                                        <div className="text-[9px] text-neon-cyan/60 mt-0.5">Lớp {player.grade}</div>
                                    ) : isUnlocked || isEarth ? (
                                        <div className="text-[9px] text-neon-green/60 mt-0.5">✅ Đã mở khóa</div>
                                    ) : (
                                        <div className="text-[9px] text-white/30 mt-0.5">🔒 {badgesHave}/{badgesNeeded} huy hiệu</div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <div className="max-w-6xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
                    {/* Player Stats Sidebar */}
                    <motion.aside
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:w-72 shrink-0"
                    >
                        <GlassCard glow="magenta" className="lg:sticky lg:top-24">
                            <div className="text-center mb-4">
                                <div className="text-5xl mb-2">{mascotEmoji}</div>
                                <h3 className="text-lg font-bold text-white">{player.name}</h3>
                                <p className="text-white/50 text-sm">
                                    {player.playerClass === "warrior" && "Chiến binh Sao Băng"}
                                    {player.playerClass === "wizard" && "Phù thủy Tinh Vân"}
                                    {player.playerClass === "hunter" && "Thợ săn Ngân Hà"}
                                    {!player.playerClass && "Tân Binh"}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {/* Level */}
                                <div>
                                    <div className="flex justify-between text-xs text-white/60 mb-1">
                                        <span>Level {player.level}</span>
                                        <span>{player.cosmoInLevel} / 500 ✦</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta rounded-full transition-all"
                                            style={{ width: `${(player.cosmoInLevel / 500) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    <div className="glass-card !p-3 text-center !rounded-xl">
                                        <div className="text-xl font-bold text-neon-gold">{player.streak}🔥</div>
                                        <div className="text-[10px] text-white/50">STREAK</div>
                                    </div>
                                    <div className="glass-card !p-3 text-center !rounded-xl">
                                        <div className="text-xl font-bold text-neon-cyan">{completedJourneys}/{journeys.length}</div>
                                        <div className="text-[10px] text-white/50">HÀNH TRÌNH</div>
                                    </div>
                                </div>

                                {/* ── Badge Gallery ── */}
                                <div className="glass-card !p-3 !rounded-xl">
                                    <div className="text-[10px] text-white/50 mb-2 font-bold uppercase tracking-wider">🏅 Huy hiệu ({playerBadges.length}/{allBadges.length})</div>
                                    <div className="grid grid-cols-4 gap-1.5">
                                        {[...allBadges]
                                            .sort((a, b) => {
                                                const aEarned = playerBadges.some(pb => pb.badge_slug === a.id || pb.badge_slug.startsWith(a.id)) ? 0 : 1;
                                                const bEarned = playerBadges.some(pb => pb.badge_slug === b.id || pb.badge_slug.startsWith(b.id)) ? 0 : 1;
                                                if (aEarned !== bEarned) return aEarned - bEarned;
                                                // Within same group: heritage first, then special
                                                const typeOrder = { heritage: 0, planet: 1, special: 2 };
                                                const aType = typeOrder[a.badgeType as keyof typeof typeOrder] ?? 1;
                                                const bType = typeOrder[b.badgeType as keyof typeof typeOrder] ?? 1;
                                                if (aType !== bType) return aType - bType;
                                                return a.orderIndex - b.orderIndex;
                                            })
                                            .map((badge) => {
                                                const earned = playerBadges.some(pb => pb.badge_slug === badge.id || pb.badge_slug.startsWith(badge.id));
                                                return (
                                                    <div
                                                        key={badge.id}
                                                        className={`relative rounded-lg p-1.5 text-center transition-all duration-300 ${earned
                                                            ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                                                            : 'bg-white/5 border border-white/5 opacity-40 grayscale'
                                                            }`}
                                                        title={`${badge.name}\n${badge.description}${earned ? '\n✅ Đã đạt!' : ''}`}
                                                    >
                                                        <div className={`text-lg ${earned ? 'animate-glow-pulse' : ''}`}>{badge.emoji}</div>
                                                        <div className="text-[8px] text-white/60 truncate leading-tight mt-0.5">{badge.name}</div>
                                                        {!earned && <div className="absolute top-0.5 right-0.5 text-[8px]">🔒</div>}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* ── Star Exchange ── */}
                                <div className="glass-card !p-3 !rounded-xl">
                                    <div className="text-[10px] text-white/50 mb-2 font-bold uppercase tracking-wider">⭐ Ngôi sao may mắn</div>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(Math.min(player.luckyStars, 5))].map((_, i) => (
                                                <span key={i} className="text-lg" style={{
                                                    animation: `pulse 2s ease-in-out ${i * 0.15}s infinite`,
                                                    filter: 'drop-shadow(0 0 4px rgba(250,204,21,0.6))'
                                                }}>⭐</span>
                                            ))}
                                            {player.luckyStars > 5 && <span className="text-xs text-white/50 ml-1">+{player.luckyStars - 5}</span>}
                                            {player.luckyStars === 0 && <span className="text-xs text-white/40">Chưa có sao</span>}
                                        </div>
                                        <span className="text-sm font-bold text-neon-gold">{player.luckyStars}</span>
                                    </div>
                                    <div className="text-[10px] text-white/40 mb-2">3 ⭐ = 1 🏅 huy hiệu</div>

                                    {/* Exchange animation */}
                                    {exchangeAnim && (
                                        <div className="text-center py-3">
                                            <div className="text-3xl animate-bounce">🏅</div>
                                            <div className="text-xs text-neon-gold font-bold mt-1 animate-pulse">Huy hiệu mới!</div>
                                        </div>
                                    )}

                                    {!exchangeAnim && (player.luckyStars >= 3 ? (
                                        <button
                                            onClick={async () => {
                                                if (!playerDbId) return;
                                                setExchangeAnim(true);
                                                const badge = await exchangeStarsForBadge(playerDbId);
                                                if (badge) {
                                                    // BUG-2 FIX: Use spendStars() which correctly deducts from local context
                                                    // (exchangeStarsForBadge already handled the DB deduction)
                                                    spendStars(3);
                                                    const newBadges = await getPlayerBadges(playerDbId);
                                                    setPlayerBadges(newBadges);
                                                }
                                                setTimeout(() => setExchangeAnim(false), 2000);
                                            }}
                                            className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                                            style={{
                                                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                                                boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
                                            }}
                                        >
                                            ⭐ → 🏅 Đổi 3 sao lấy huy hiệu
                                        </button>
                                    ) : (
                                        <div className="w-full py-2 rounded-xl text-xs text-center text-white/30 bg-white/5">
                                            Cần thêm {3 - player.luckyStars} ⭐ nữa
                                        </div>
                                    ))}
                                </div>

                                {/* ── Ship Dock ── */}
                                {allShips.length > 0 && (() => {
                                    // Calculate available badges (total - spent on owned ships)
                                    const spentOnShips = allShips
                                        .filter(s => ownedShipIds.includes(s.id))
                                        .reduce((sum, s) => sum + s.requiredBadges, 0);
                                    const availableBadges = Math.max(0, playerBadges.length - spentOnShips);

                                    return (
                                        <div className="glass-card !p-3 !rounded-xl">
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="text-[10px] text-white/50 font-bold uppercase tracking-wider">🚀 Bến phi thuyền</div>
                                                <div className="text-[9px] text-neon-gold">🏅 {availableBadges} có thể đổi</div>
                                            </div>
                                            <div className="space-y-2">
                                                {allShips.map((ship) => {
                                                    const owned = ownedShipIds.includes(ship.id);
                                                    const canUnlock = !owned && availableBadges >= ship.requiredBadges;
                                                    const progress = ship.requiredBadges > 0 ? Math.min(100, (availableBadges / ship.requiredBadges) * 100) : 100;
                                                    return (
                                                        <div key={ship.id} className={`rounded-xl p-2.5 transition-all ${owned
                                                            ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 border border-cyan-500/30'
                                                            : canUnlock
                                                                ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 ring-1 ring-yellow-500/20'
                                                                : 'bg-white/5 border border-white/10'
                                                            }`}>
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className={`text-2xl ${owned ? '' : canUnlock ? '' : 'grayscale opacity-50'}`} style={{
                                                                    filter: owned ? 'drop-shadow(0 0 8px rgba(0,245,255,0.5))' : canUnlock ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' : undefined
                                                                }}>{ship.emoji}</span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className={`text-xs font-bold truncate ${owned ? 'text-neon-cyan' : canUnlock ? 'text-neon-gold' : 'text-white/50'}`}>{ship.name}</div>
                                                                    <div className="text-[9px] text-white/40">{ship.description}</div>
                                                                </div>
                                                                {owned && <span className="text-xs text-neon-green">✅</span>}
                                                            </div>
                                                            {/* Show accessible planets for owned ships */}
                                                            {owned && (() => {
                                                                const shipPlanets = allPlanets.filter(p => p.shipRequired === ship.id);
                                                                if (shipPlanets.length === 0) return null;
                                                                return (
                                                                    <div className="flex gap-1 mt-1">
                                                                        {shipPlanets.map(p => (
                                                                            <button
                                                                                key={p.id}
                                                                                onClick={() => { setSelectedPlanetId(p.id); }}
                                                                                className="flex-1 py-1 px-1.5 rounded-lg text-[9px] text-white/70 bg-white/5 hover:bg-cyan-500/20 hover:text-neon-cyan transition-all text-center truncate"
                                                                                title={p.name}
                                                                            >
                                                                                {p.emoji} {p.name.replace('Planet ', '')}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                );
                                                            })()}
                                                            {!owned && (
                                                                <div>
                                                                    <div className="flex justify-between text-[9px] text-white/40 mb-1">
                                                                        <span>🏅 {availableBadges}/{ship.requiredBadges} huy hiệu</span>
                                                                        <span>{Math.round(progress)}%</span>
                                                                    </div>
                                                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                                                                        <div className="h-full rounded-full transition-all duration-500" style={{
                                                                            width: `${progress}%`,
                                                                            background: canUnlock
                                                                                ? 'linear-gradient(90deg, #00F5FF, #FF00FF)'
                                                                                : 'linear-gradient(90deg, #f59e0b, #ef4444)'
                                                                        }} />
                                                                    </div>
                                                                    {canUnlock ? (
                                                                        <button
                                                                            onClick={async () => {
                                                                                if (!playerDbId) return;
                                                                                const result = await exchangeBadgesForShip(playerDbId, ship.id);
                                                                                if (result.success) {
                                                                                    const updatedShipIds = await getPlayerShips(playerDbId);
                                                                                    setOwnedShipIds(updatedShipIds);
                                                                                    // Also refresh unlocked planet IDs
                                                                                    const newUnlocked = await getUnlockedPlanetIds(playerDbId);
                                                                                    setUnlockedPlanetIds(newUnlocked);
                                                                                    // Show unlock celebration with accessible planets
                                                                                    const shipPlanets = allPlanets.filter(p => p.shipRequired === ship.id);
                                                                                    setUnlockedShipModal({ ship, planets: shipPlanets });
                                                                                }
                                                                            }}
                                                                            className="w-full py-1.5 rounded-lg text-[10px] font-bold text-white transition-all hover:scale-[1.02] active:scale-95"
                                                                            style={{
                                                                                background: 'linear-gradient(135deg, #00F5FF, #FF00FF)',
                                                                                boxShadow: '0 4px 15px rgba(0,245,255,0.3)'
                                                                            }}
                                                                        >
                                                                            🏅 × {ship.requiredBadges} → {ship.emoji} Mở khoá!
                                                                        </button>
                                                                    ) : (
                                                                        <div className="text-[9px] text-white/30 text-center">
                                                                            Cần thêm {ship.requiredBadges - availableBadges} 🏅
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Grade */}
                                <div className="text-center pt-2">
                                    <span className="text-xs text-white/40">Lớp {player.grade} · Cấp {player.level}</span>
                                </div>

                                {/* Profile link */}
                                <div className="pt-2">
                                    <NeonButton variant="cyan" size="sm" href="/portal/player" className="w-full">
                                        👤 Hồ sơ của tôi
                                    </NeonButton>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.aside>

                    {/* Journey Map */}
                    <main className="flex-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6"
                        >
                            <h1 className="text-2xl sm:text-3xl font-bold font-[var(--font-heading)] neon-text">
                                {selectedPlanet ? `${selectedPlanet.emoji} ${selectedPlanet.name}` : "🌌 Bản đồ Vũ trụ"}
                            </h1>
                            <p className="text-white/50 text-sm mt-1">
                                {selectedPlanetId === 'earth' ? 'Hành trình di sản Việt Nam' :
                                    selectedPlanet?.description || 'Khám phá kiến thức mới'}
                            </p>
                        </motion.div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center space-y-3">
                                    <div className="text-4xl" style={{ animation: "spin 1.5s linear infinite" }}>🪐</div>
                                    <p className="text-white/50 text-sm">Đang tải hành trình...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {journeys.map((journey, i) => (
                                    <motion.div
                                        key={journey.id}
                                        custom={i}
                                        variants={fadeUp}
                                        initial="hidden"
                                        animate="visible"
                                    >
                                        {journey.isUnlocked ? (
                                            <Link href={selectedPlanetId === 'helios' ? `/portal/play/helios?journey=${journey.slug}` : `/portal/play?journey=${journey.slug}`}>
                                                <GlassCard
                                                    glow="none"
                                                    className="planet-card cursor-pointer group relative overflow-hidden"
                                                >
                                                    <div className="relative">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-3xl">{journey.emoji}</span>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-base font-bold text-white truncate">{journey.title}</h3>
                                                                <p className="text-white/50 text-xs">{journey.description}</p>
                                                            </div>
                                                        </div>

                                                        {/* Subjects */}
                                                        <div className="flex flex-wrap gap-1 mb-3">
                                                            {journey.subjects.map((s) => (
                                                                <span
                                                                    key={s}
                                                                    className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60"
                                                                >
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Progress */}
                                                        <div>
                                                            <div className="flex justify-between text-[10px] text-white/50 mb-1">
                                                                <span>{journey.completedLevels}/{journey.totalLevels} cấp</span>
                                                                <span>{journey.totalLevels > 0 ? Math.round((journey.completedLevels / journey.totalLevels) * 100) : 0}%</span>
                                                            </div>
                                                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all bg-gradient-to-r from-neon-cyan to-neon-magenta"
                                                                    style={{
                                                                        width: `${journey.totalLevels > 0 ? (journey.completedLevels / journey.totalLevels) * 100 : 0}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </GlassCard>
                                            </Link>
                                        ) : (
                                            <GlassCard
                                                glow="none"
                                                className="relative overflow-hidden opacity-40 cursor-not-allowed"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl grayscale">{journey.emoji}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-base font-bold text-white/60 truncate">{journey.title}</h3>
                                                            <span className="text-xs">🔒</span>
                                                        </div>
                                                        <p className="text-white/30 text-xs">
                                                            Hoàn thành hành trình trước để mở khóa
                                                        </p>
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* 🚀 Ship Unlock Celebration Modal */}
            {unlockedShipModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setUnlockedShipModal(null)}>
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card !rounded-2xl !p-8 max-w-sm mx-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-6xl mb-3 animate-bounce">
                            {unlockedShipModal.ship.emoji}
                        </div>
                        <h3 className="text-xl font-bold text-neon-cyan mb-1 font-[var(--font-heading)]">
                            {unlockedShipModal.ship.name} đã mở khoá!
                        </h3>
                        <p className="text-xs text-white/50 mb-1">
                            Đã dùng {unlockedShipModal.ship.requiredBadges} 🏅 huy hiệu
                        </p>
                        <p className="text-sm text-white/70 mb-4">
                            Chọn hành tinh để bay đến:
                        </p>
                        <div className="space-y-2">
                            {unlockedShipModal.planets.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setSelectedPlanetId(p.id);
                                        setUnlockedShipModal(null);
                                    }}
                                    className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-3 justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(255,0,255,0.15))',
                                        border: '1px solid rgba(0,245,255,0.3)',
                                    }}
                                >
                                    <span className="text-2xl">{p.emoji}</span>
                                    <span>{p.name}</span>
                                    <span className="text-white/40 text-xs ml-auto">{p.description}</span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setUnlockedShipModal(null)}
                            className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors"
                        >
                            Đóng
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
