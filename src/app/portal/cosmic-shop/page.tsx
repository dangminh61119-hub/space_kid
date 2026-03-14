"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import StarField from "@/components/StarField";
import Navbar from "@/components/Navbar";
import { useGame } from "@/lib/game-context";
import { useRequireAuth } from "@/hooks/useRequireAuth";

/* ─── Shop Item Definitions ─── */
interface ShopItem {
    id: string;
    name: string;
    description: string;
    emoji: string;
    price: number;
    category: "powerup" | "ai" | "cosmetic";
    action: string; // what happens on purchase
    rarity: "common" | "rare" | "legendary";
}

const SHOP_ITEMS: ShopItem[] = [
    // ⚡ Power-ups
    {
        id: "crystal_pack",
        name: "Crystal Pack",
        description: "3 pha lê cho AI Summon trong Portal",
        emoji: "💎",
        price: 100,
        category: "powerup",
        action: "add_crystals_3",
        rarity: "rare",
    },
    {
        id: "ability_charge",
        name: "Ability Charge",
        description: "1 charge cho Shield, Time Slow, hoặc Eagle Eye",
        emoji: "⚡",
        price: 50,
        category: "powerup",
        action: "add_charge_1",
        rarity: "common",
    },
    {
        id: "crystal_mega",
        name: "Mega Crystal Pack",
        description: "8 pha lê — tiết kiệm 60🪙!",
        emoji: "💎✨",
        price: 200,
        category: "powerup",
        action: "add_crystals_8",
        rarity: "legendary",
    },
    {
        id: "charge_pack",
        name: "Charge Pack x3",
        description: "3 ability charges — tiết kiệm 30🪙!",
        emoji: "⚡⚡⚡",
        price: 120,
        category: "powerup",
        action: "add_charge_3",
        rarity: "rare",
    },
    // 🤖 AI Access
    {
        id: "star_boost",
        name: "Star Magnet",
        description: "Tăng 5 Lucky Stars ngay lập tức",
        emoji: "⭐",
        price: 80,
        category: "ai",
        action: "add_stars_5",
        rarity: "rare",
    },
    {
        id: "cosmo_boost",
        name: "XP Boost x100",
        description: "+100 Cosmo XP — nhảy level nhanh hơn!",
        emoji: "✦",
        price: 150,
        category: "ai",
        action: "add_cosmo_100",
        rarity: "legendary",
    },
];

const CATEGORY_INFO = {
    powerup: { label: "⚡ Power-ups", color: "#A78BFA", glow: "rgba(167,139,250,0.3)" },
    ai: { label: "🚀 Boosters", color: "#34D399", glow: "rgba(52,211,153,0.3)" },
    cosmetic: { label: "🎨 Cosmetics", color: "#F472B6", glow: "rgba(244,114,182,0.3)" },
};

const RARITY_STYLES = {
    common: { border: "rgba(255,255,255,0.15)", bg: "rgba(255,255,255,0.03)", label: "" },
    rare: { border: "rgba(167,139,250,0.3)", bg: "rgba(167,139,250,0.06)", label: "RARE" },
    legendary: { border: "rgba(245,158,11,0.4)", bg: "rgba(245,158,11,0.08)", label: "✨ LEGENDARY" },
};

export default function CosmicShopPage() {
    const { player, spendCoins, addCrystals, addAbilityCharges, addStars, addCosmo } = useGame();
    const { loading: authLoading, allowed, redirecting } = useRequireAuth();
    const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; item: ShopItem } | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const handlePurchase = useCallback((item: ShopItem) => {
        if (player.coins < item.price) return;

        const success = spendCoins(item.price, "shop-purchase", item.name);
        if (!success) return;

        // Execute item action
        switch (item.action) {
            case "add_crystals_3": addCrystals(3, "shop"); break;
            case "add_crystals_8": addCrystals(8, "shop"); break;
            case "add_charge_1": addAbilityCharges(1); break;
            case "add_charge_3": addAbilityCharges(3); break;
            case "add_stars_5": addStars(5); break;
            case "add_cosmo_100": addCosmo(100); break;
        }

        setPurchaseResult({ success: true, item });
        setTimeout(() => setPurchaseResult(null), 2500);
    }, [player.coins, spendCoins, addCrystals, addAbilityCharges, addStars, addCosmo]);

    const filteredItems = selectedCategory === "all"
        ? SHOP_ITEMS
        : SHOP_ITEMS.filter(i => i.category === selectedCategory);

    if (authLoading || redirecting || !allowed) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0612" }}>
                <div className="text-center">
                    <div className="text-5xl mb-3" style={{ animation: "pulse 2s infinite" }}>🌌</div>
                    <p className="text-white/50 text-sm">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative">
            <StarField count={50} />
            <Navbar />

            <div className="relative z-10 pt-20 pb-10 max-w-5xl mx-auto px-4">
                {/* Back Button */}
                <Link
                    href="/portal"
                    className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-6"
                >
                    ← Quay lại Portal
                </Link>

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="relative overflow-hidden rounded-3xl p-8"
                        style={{
                            background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(167,139,250,0.06) 50%, rgba(0,212,255,0.04) 100%)",
                            border: "1px solid rgba(245,158,11,0.2)",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(245,158,11,0.08)",
                        }}
                    >
                        {/* Glow orbs */}
                        <div style={{
                            position: "absolute", top: -60, right: -40, width: 240, height: 240,
                            background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
                            borderRadius: "50%", pointerEvents: "none",
                        }} />
                        <div style={{
                            position: "absolute", bottom: -40, left: -20, width: 200, height: 200,
                            background: "radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)",
                            borderRadius: "50%", pointerEvents: "none",
                        }} />

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                            <motion.div
                                className="text-7xl"
                                animate={{ rotateY: [0, 360] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                style={{ filter: "drop-shadow(0 0 20px rgba(245,158,11,0.5))" }}
                            >
                                🪙
                            </motion.div>
                            <div className="flex-1">
                                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2"
                                    style={{ fontFamily: "var(--font-heading)", letterSpacing: "-0.5px" }}>
                                    Cosmic Shop
                                </h1>
                                <p className="text-white/50 text-sm mb-4">
                                    Tiêu Coins để nâng cấp sức mạnh và mở khóa tính năng mới
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl"
                                        style={{
                                            background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))",
                                            border: "1px solid rgba(245,158,11,0.3)",
                                            boxShadow: "0 0 20px rgba(245,158,11,0.1)",
                                        }}>
                                        <span className="text-2xl">🪙</span>
                                        <span className="text-2xl font-black text-yellow-400"
                                            style={{ fontFamily: "var(--font-heading)" }}>
                                            {player.coins.toLocaleString()}
                                        </span>
                                    </div>
                                    {/* Quick stats */}
                                    <div className="hidden sm:flex gap-3 text-xs text-white/40">
                                        <span>💎 {player.crystals}</span>
                                        <span>⚡ {player.abilityCharges}</span>
                                        <span>⭐ {player.luckyStars}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Category Tabs */}
                <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                    <button
                        onClick={() => setSelectedCategory("all")}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                        style={{
                            background: selectedCategory === "all" ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.04)",
                            border: `1.5px solid ${selectedCategory === "all" ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`,
                            color: selectedCategory === "all" ? "#FBBF24" : "rgba(255,255,255,0.5)",
                            boxShadow: selectedCategory === "all" ? "0 0 16px rgba(245,158,11,0.15)" : "none",
                        }}
                    >
                        🛒 Tất cả
                    </button>
                    {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap"
                            style={{
                                background: selectedCategory === key ? `${info.color}15` : "rgba(255,255,255,0.04)",
                                border: `1.5px solid ${selectedCategory === key ? `${info.color}66` : "rgba(255,255,255,0.08)"}`,
                                color: selectedCategory === key ? info.color : "rgba(255,255,255,0.5)",
                                boxShadow: selectedCategory === key ? `0 0 16px ${info.glow}` : "none",
                            }}
                        >
                            {info.label}
                        </button>
                    ))}
                </div>

                {/* Items Grid */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    layout
                >
                    <AnimatePresence mode="popLayout">
                        {filteredItems.map((item, i) => {
                            const canAfford = player.coins >= item.price;
                            const rarity = RARITY_STYLES[item.rarity];
                            const catInfo = CATEGORY_INFO[item.category];

                            return (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative group"
                                >
                                    <div
                                        className="rounded-2xl p-5 h-full transition-all duration-300"
                                        style={{
                                            background: rarity.bg,
                                            border: `1.5px solid ${rarity.border}`,
                                            backdropFilter: "blur(12px)",
                                            boxShadow: item.rarity === "legendary"
                                                ? "0 8px 32px rgba(245,158,11,0.12), inset 0 1px 0 rgba(255,255,255,0.06)"
                                                : "0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                                        }}
                                    >
                                        {/* Rarity badge */}
                                        {rarity.label && (
                                            <div className="absolute top-3 right-3 text-[9px] font-bold px-2.5 py-1 rounded-lg"
                                                style={{
                                                    background: item.rarity === "legendary"
                                                        ? "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.2))"
                                                        : "rgba(167,139,250,0.2)",
                                                    color: item.rarity === "legendary" ? "#FBBF24" : "#A78BFA",
                                                    border: `1px solid ${item.rarity === "legendary" ? "rgba(245,158,11,0.3)" : "rgba(167,139,250,0.3)"}`,
                                                    letterSpacing: "0.5px",
                                                }}>
                                                {rarity.label}
                                            </div>
                                        )}

                                        {/* Item icon */}
                                        <div className="text-5xl mb-4"
                                            style={{
                                                filter: `drop-shadow(0 0 12px ${catInfo.glow})`,
                                            }}>
                                            {item.emoji}
                                        </div>

                                        {/* Info */}
                                        <h3 className="text-base font-bold text-white mb-1"
                                            style={{ fontFamily: "var(--font-heading)" }}>
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-white/50 mb-4 leading-relaxed">
                                            {item.description}
                                        </p>

                                        {/* Price + Buy button */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-lg">🪙</span>
                                                <span className="text-lg font-black"
                                                    style={{
                                                        fontFamily: "var(--font-heading)",
                                                        color: canAfford ? "#FBBF24" : "rgba(255,255,255,0.3)",
                                                    }}>
                                                    {item.price}
                                                </span>
                                            </div>

                                            <motion.button
                                                onClick={() => handlePurchase(item)}
                                                disabled={!canAfford}
                                                whileHover={canAfford ? { scale: 1.05 } : {}}
                                                whileTap={canAfford ? { scale: 0.95 } : {}}
                                                className="px-5 py-2 rounded-xl text-xs font-bold transition-all"
                                                style={{
                                                    background: canAfford
                                                        ? "linear-gradient(135deg, rgba(245,158,11,0.3), rgba(217,119,6,0.2))"
                                                        : "rgba(255,255,255,0.05)",
                                                    border: `1.5px solid ${canAfford ? "rgba(245,158,11,0.4)" : "rgba(255,255,255,0.08)"}`,
                                                    color: canAfford ? "#FBBF24" : "rgba(255,255,255,0.2)",
                                                    cursor: canAfford ? "pointer" : "not-allowed",
                                                    boxShadow: canAfford ? "0 4px 16px rgba(245,158,11,0.2)" : "none",
                                                    fontFamily: "var(--font-heading)",
                                                    letterSpacing: "0.3px",
                                                }}
                                            >
                                                {canAfford ? "Mua" : "Thiếu 🪙"}
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>

                {/* Earn more coins hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 text-center"
                >
                    <p className="text-xs text-white/30 mb-2">💡 Kiếm thêm Coins bằng cách:</p>
                    <div className="flex flex-wrap justify-center gap-3 text-xs text-white/40">
                        <Link href="/learn/practice" className="hover:text-white/70 transition-colors">📝 Quiz +10-30🪙</Link>
                        <span>•</span>
                        <Link href="/learn/english-buddy" className="hover:text-white/70 transition-colors">🦅 English +10-25🪙</Link>
                        <span>•</span>
                        <Link href="/portal/play" className="hover:text-white/70 transition-colors">🎮 Journey +50🪙</Link>
                    </div>
                </motion.div>
            </div>

            {/* ─── Purchase Success Overlay ─── */}
            <AnimatePresence>
                {purchaseResult && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="text-center"
                            initial={{ scale: 0.5, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.8, y: -30, opacity: 0 }}
                            transition={{ type: "spring", damping: 15 }}
                            style={{
                                background: "rgba(10, 22, 40, 0.95)",
                                backdropFilter: "blur(20px)",
                                border: "1px solid rgba(16,185,129,0.3)",
                                borderRadius: 28,
                                padding: "36px 56px",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 40px rgba(16,185,129,0.15)",
                            }}
                        >
                            <motion.div
                                className="text-6xl mb-3"
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 0.6 }}
                            >
                                {purchaseResult.item.emoji}
                            </motion.div>
                            <div className="text-lg font-bold text-emerald-400 mb-1"
                                style={{ fontFamily: "var(--font-heading)" }}>
                                Mua thành công!
                            </div>
                            <div className="text-sm text-white/60">
                                {purchaseResult.item.name}
                            </div>
                            {/* Sparkles */}
                            {[...Array(8)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute text-sm"
                                    style={{ left: "50%", top: "50%" }}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{
                                        opacity: [0, 1, 0],
                                        scale: [0, 1, 0],
                                        x: Math.cos((i / 8) * Math.PI * 2) * 80 - 8,
                                        y: Math.sin((i / 8) * Math.PI * 2) * 80 - 8,
                                    }}
                                    transition={{ duration: 1, delay: i * 0.06 }}
                                >
                                    ✨
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
