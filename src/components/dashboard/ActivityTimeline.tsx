"use client";

import { useGame } from "@/lib/game-context";

/* ─── Planet names mapping ─── */
const PLANET_NAMES: Record<string, string> = {
    "ha-long": "Vịnh Hạ Long",
    "hue": "Cố đô Huế",
    "giong": "Làng Gióng",
    "phong-nha": "Phong Nha",
    "hoi-an": "Phố cổ Hội An",
    "sapa": "Sa Pa",
    "hanoi": "Hà Nội",
    "mekong": "Đồng bằng Mê Kông",
};

const PLANET_EMOJIS: Record<string, string> = {
    "ha-long": "🏝️",
    "hue": "🏯",
    "giong": "⚔️",
    "phong-nha": "🦇",
    "hoi-an": "🏮",
    "sapa": "🌾",
    "hanoi": "🏙️",
    "mekong": "🌊",
};

interface Activity {
    date: string;
    planetId: string;
    planetName: string;
    emoji: string;
    completedLevels: number;
    totalLevels: number;
}

export default function ActivityTimeline({ maxItems }: { maxItems?: number }) {
    const { player } = useGame();

    /* Build activities from planets that have lastPlayedAt */
    const activities: Activity[] = Object.entries(player.planetsProgress)
        .filter(([, prog]) => prog.lastPlayedAt || prog.completedLevels > 0)
        .map(([id, prog]) => ({
            date: prog.lastPlayedAt || new Date().toISOString(),
            planetId: id,
            planetName: PLANET_NAMES[id] || id,
            emoji: PLANET_EMOJIS[id] || "🪐",
            completedLevels: prog.completedLevels,
            totalLevels: prog.totalLevels,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, maxItems || 50);

    if (activities.length === 0) {
        return (
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <h3 className="font-bold text-base mb-5" style={{ fontFamily: "var(--font-heading)" }}>
                    📅 Hoạt động Gần đây
                </h3>
                <div className="text-center py-10 text-gray-400">
                    <div className="text-5xl mb-3">🪐</div>
                    <p className="text-sm">Bé chưa có hoạt động nào</p>
                    <p className="text-xs mt-1 text-gray-300">Hãy khuyến khích bé bắt đầu khám phá vũ trụ!</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="rounded-2xl border p-5 sm:p-6 bg-white"
            style={{ borderColor: "var(--dash-border)" }}
        >
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                    📅 Hoạt động Gần đây
                </h3>
                <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ color: "#6366f1", background: "#6366f115" }}
                >
                    {activities.length} hoạt động
                </span>
            </div>

            <div className="relative">
                {/* Vertical line */}
                <div
                    className="absolute left-4 top-2 bottom-2 w-0.5 rounded-full"
                    style={{ background: "#e2e8f0" }}
                />

                <div className="space-y-4">
                    {activities.map((act, i) => {
                        const pct = act.totalLevels > 0
                            ? Math.round((act.completedLevels / act.totalLevels) * 100)
                            : 0;
                        const dateStr = new Date(act.date).toLocaleDateString("vi-VN", {
                            day: "numeric",
                            month: "short",
                        });
                        return (
                            <div key={`${act.planetId}-${i}`} className="flex items-start gap-4 relative">
                                {/* Dot */}
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 relative z-10"
                                    style={{
                                        background: pct === 100 ? "#ECFDF5" : "#EFF6FF",
                                        border: `2px solid ${pct === 100 ? "#10B981" : "#60A5FA"}`,
                                    }}
                                >
                                    {act.emoji}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                                            {act.planetName}
                                        </span>
                                        <span className="text-xs" style={{ color: "var(--dash-muted)" }}>
                                            {dateStr}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs" style={{ color: "var(--dash-muted)" }}>
                                            {act.completedLevels}/{act.totalLevels} levels
                                        </span>
                                        {/* Mini progress bar */}
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: pct === 100
                                                        ? "linear-gradient(90deg, #10B981, #34D399)"
                                                        : "linear-gradient(90deg, #60A5FA, #818CF8)",
                                                }}
                                            />
                                        </div>
                                        <span
                                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={{
                                                color: pct === 100 ? "#10B981" : "#6366f1",
                                                background: pct === 100 ? "#ECFDF5" : "#EEF2FF",
                                            }}
                                        >
                                            {pct}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
