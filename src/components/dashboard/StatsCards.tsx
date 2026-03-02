"use client";

import { useGame } from "@/lib/game-context";

interface StatItem {
    label: string;
    value: string;
    icon: string;
    color: string;
    bg: string;
}

export default function StatsCards() {
    const { player } = useGame();

    const planetsCompleted = Object.values(player.planetsProgress).filter(
        (p) => p.completedLevels >= p.totalLevels
    ).length;
    const totalPlanets = Object.keys(player.planetsProgress).length;

    const stats: StatItem[] = [
        {
            label: "Tổng XP",
            value: player.xp.toLocaleString(),
            icon: "⭐",
            color: "#FFE066",
            bg: "#FFFBEB",
        },
        {
            label: "Streak",
            value: `${player.streak} ngày`,
            icon: "🔥",
            color: "#FB923C",
            bg: "#FFF7ED",
        },
        {
            label: "Giờ chơi",
            value: `${player.totalPlayHours}h`,
            icon: "⏱️",
            color: "#60A5FA",
            bg: "#EFF6FF",
        },
        {
            label: "Hành tinh",
            value: `${planetsCompleted}/${totalPlanets}`,
            icon: "🪐",
            color: "#A78BFA",
            bg: "#F5F3FF",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <div
                    key={stat.label}
                    className="rounded-2xl p-4 sm:p-5 border transition-all hover:shadow-md"
                    style={{ background: stat.bg, borderColor: `${stat.color}30` }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{stat.icon}</span>
                        <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ color: stat.color, background: `${stat.color}15` }}
                        >
                            {stat.label}
                        </span>
                    </div>
                    <div className="text-2xl font-bold" style={{ color: "var(--dash-text)", fontFamily: "var(--font-heading)" }}>
                        {stat.value}
                    </div>
                </div>
            ))}
        </div>
    );
}
