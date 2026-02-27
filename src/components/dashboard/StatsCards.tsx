"use client";

import { mockStudent } from "@/lib/mock-data";

const stats = [
    {
        label: "Tổng XP",
        value: mockStudent.xp.toLocaleString(),
        icon: "⭐",
        color: "#FFE066",
        bg: "#FFFBEB",
    },
    {
        label: "Streak",
        value: `${mockStudent.streak} ngày`,
        icon: "🔥",
        color: "#FB923C",
        bg: "#FFF7ED",
    },
    {
        label: "Giờ chơi",
        value: `${mockStudent.totalPlayHours}h`,
        icon: "⏱️",
        color: "#60A5FA",
        bg: "#EFF6FF",
    },
    {
        label: "Hành tinh",
        value: `${mockStudent.planetsCompleted}/${mockStudent.totalPlanets}`,
        icon: "🪐",
        color: "#A78BFA",
        bg: "#F5F3FF",
    },
];

export default function StatsCards() {
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
