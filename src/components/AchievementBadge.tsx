"use client";

import { motion } from "framer-motion";

export interface Achievement {
    id: string;
    name: string;
    description: string;
    emoji: string;
    rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: "first_win",
        name: "Chiến thắng đầu tiên",
        description: "Hoàn thành level đầu tiên",
        emoji: "🏆",
        rarity: "common",
    },
    {
        id: "streak_3",
        name: "Lửa nhiệt huyết",
        description: "Đạt streak 3 ngày liên tiếp",
        emoji: "🔥",
        rarity: "common",
    },
    {
        id: "xp_1000",
        name: "Tri thức dồi dào",
        description: "Tích lũy 1000 XP",
        emoji: "💎",
        rarity: "rare",
    },
    {
        id: "level_5",
        name: "Phi hành gia xuất sắc",
        description: "Đạt cấp độ 5",
        emoji: "⭐",
        rarity: "rare",
    },
    {
        id: "planet_master",
        name: "Chinh phục hành tinh",
        description: "Hoàn thành 100% một hành tinh",
        emoji: "🪐",
        rarity: "epic",
    },
    {
        id: "calm_explorer",
        name: "Thám hiểm bình yên",
        description: "Kích hoạt Calm Mode 🌙",
        emoji: "🌙",
        rarity: "common",
    },
    {
        id: "multi_planet",
        name: "Đô đốc Thiên hà",
        description: "Hoàn thành 3 hành tinh",
        emoji: "🚀",
        rarity: "epic",
    },
    {
        id: "galaxy_legend",
        name: "Huyền thoại Thiên hà",
        description: "Đạt cấp độ 10",
        emoji: "🌌",
        rarity: "legendary",
    },
];

const RARITY_STYLES: Record<
    Achievement["rarity"],
    { border: string; glow: string; label: string; labelColor: string }
> = {
    common: {
        border: "border-white/20",
        glow: "",
        label: "Phổ thông",
        labelColor: "text-white/40",
    },
    rare: {
        border: "border-cyan-500/40",
        glow: "0 0 12px rgba(0,245,255,0.25)",
        label: "Hiếm",
        labelColor: "text-cyan-400",
    },
    epic: {
        border: "border-purple-500/50",
        glow: "0 0 15px rgba(168,85,247,0.3)",
        label: "Sử thi",
        labelColor: "text-purple-400",
    },
    legendary: {
        border: "border-amber-400/60",
        glow: "0 0 20px rgba(255,224,102,0.4)",
        label: "Huyền thoại",
        labelColor: "text-amber-400",
    },
};

interface AchievementBadgeProps {
    achievement: Achievement;
    unlocked: boolean;
    index?: number;
}

export default function AchievementBadge({
    achievement,
    unlocked,
    index = 0,
}: AchievementBadgeProps) {
    const style = RARITY_STYLES[achievement.rarity];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
            className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all
        ${unlocked
                    ? `bg-white/5 ${style.border}`
                    : "bg-white/[0.02] border-white/10 grayscale opacity-40"
                }`}
            style={unlocked && style.glow ? { boxShadow: style.glow } : {}}
            title={achievement.description}
        >
            {/* Unlocked shimmer overlay */}
            {unlocked && (
                <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    animate={{ opacity: [0, 0.15, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        background:
                            "radial-gradient(circle at center, rgba(255,255,255,0.3), transparent 70%)",
                    }}
                />
            )}

            {/* Emoji */}
            <div
                className={`text-3xl leading-none ${unlocked ? "animate-float" : ""}`}
                style={unlocked ? { animationDelay: `${index * 0.2}s` } : {}}
            >
                {unlocked ? achievement.emoji : "🔒"}
            </div>

            {/* Name */}
            <div className="text-center">
                <p
                    className={`text-[11px] font-bold leading-tight ${unlocked ? "text-white" : "text-white/30"
                        }`}
                >
                    {achievement.name}
                </p>
                {unlocked && (
                    <p className={`text-[9px] mt-0.5 ${style.labelColor}`}>
                        {style.label}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
