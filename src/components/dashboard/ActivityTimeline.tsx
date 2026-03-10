"use client";

import { useGame } from "@/lib/game-context";

interface Activity {
    date: string;
    name: string;
    emoji: string;
    detail: string;
}

export default function ActivityTimeline({ maxItems }: { maxItems?: number }) {
    const { player } = useGame();

    /* For now, show a placeholder since journey progress is in Supabase.
       This component will be enhanced later to fetch from journey_progress table. */
    const activities: Activity[] = [];

    if (activities.length === 0) {
        return (
            <div className="dash-card p-5 sm:p-6">
                <h3 className="font-bold text-base mb-5" style={{ fontFamily: "var(--font-heading)" }}>
                    📅 Hoạt động Gần đây
                </h3>
                <div className="text-center py-8">
                    {/* Premium empty state */}
                    <div
                        className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)" }}
                    >
                        <span className="text-4xl">🗺️</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                        Bé chưa có hoạt động nào
                    </p>
                    <p className="text-xs mt-1.5" style={{ color: "var(--dash-muted)" }}>
                        Hãy khuyến khích bé bắt đầu khám phá hành trình di sản!
                    </p>
                    <div
                        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-full text-xs font-medium"
                        style={{ color: "var(--dash-accent)", background: "var(--dash-accent-light)" }}
                    >
                        🚀 Bắt đầu ngay
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="dash-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                    📅 Hoạt động Gần đây
                </h3>
                <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{ color: "var(--dash-accent)", background: "var(--dash-accent-light)" }}
                >
                    {activities.length} hoạt động
                </span>
            </div>
            <div className="space-y-2">
                {activities.map((act, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-gray-50 dash-fade-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ background: "var(--dash-accent-light)" }}
                        >
                            {act.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block truncate">{act.name}</span>
                            <p className="text-xs truncate" style={{ color: "var(--dash-muted)" }}>{act.detail}</p>
                        </div>
                        <span className="text-[10px] font-medium shrink-0" style={{ color: "var(--dash-muted)" }}>
                            {act.date}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
