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
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <h3 className="font-bold text-base mb-5" style={{ fontFamily: "var(--font-heading)" }}>
                    📅 Hoạt động Gần đây
                </h3>
                <div className="text-center py-10 text-gray-400">
                    <div className="text-5xl mb-3">🗺️</div>
                    <p className="text-sm">Bé chưa có hoạt động nào</p>
                    <p className="text-xs mt-1 text-gray-300">Hãy khuyến khích bé bắt đầu khám phá hành trình di sản!</p>
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
            <div className="space-y-3">
                {activities.map((act, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                        <span className="text-xl">{act.emoji}</span>
                        <div className="flex-1">
                            <span className="text-sm font-medium">{act.name}</span>
                            <p className="text-xs text-gray-400">{act.detail}</p>
                        </div>
                        <span className="text-xs text-gray-400">{act.date}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
