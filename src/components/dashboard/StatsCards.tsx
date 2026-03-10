"use client";

import { useGame } from "@/lib/game-context";

interface StatItem {
    label: string;
    value: string;
    icon: string;
    gradient: string;
    iconBg: string;
}

export default function StatsCards() {
    const { player } = useGame();

    const stats: StatItem[] = [
        {
            label: "Tổng ✦ Cosmo",
            value: player.cosmo.toLocaleString(),
            icon: "⭐",
            gradient: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
            iconBg: "rgba(245, 158, 11, 0.12)",
        },
        {
            label: "Streak liên tiếp",
            value: `${player.streak} ngày`,
            icon: "🔥",
            gradient: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
            iconBg: "rgba(249, 115, 22, 0.12)",
        },
        {
            label: "Giờ chơi",
            value: `${player.totalPlayHours}h`,
            icon: "⏱️",
            gradient: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
            iconBg: "rgba(59, 130, 246, 0.12)",
        },
        {
            label: "Hành trình",
            value: `${player.journeysCompleted}/10`,
            icon: "🗺️",
            gradient: "linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)",
            iconBg: "rgba(139, 92, 246, 0.12)",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
                <div
                    key={stat.label}
                    className="dash-card p-4 sm:p-5 dash-fade-up relative overflow-hidden group"
                    style={{
                        background: stat.gradient,
                        animationDelay: `${i * 80}ms`,
                    }}
                >
                    {/* Shimmer on hover */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        style={{
                            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                            backgroundSize: "200% 100%",
                            animation: "dash-shimmer 1.5s ease-in-out",
                        }}
                    />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                style={{ background: stat.iconBg }}
                            >
                                {stat.icon}
                            </div>
                        </div>
                        <div
                            className="text-2xl sm:text-3xl font-bold mb-1"
                            style={{ color: "var(--dash-text)", fontFamily: "var(--font-heading)" }}
                        >
                            {stat.value}
                        </div>
                        <div className="text-[11px] font-medium tracking-wide" style={{ color: "var(--dash-muted)" }}>
                            {stat.label}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
