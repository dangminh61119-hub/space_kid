"use client";

import StatsCards from "@/components/dashboard/StatsCards";
import ProgressChart from "@/components/dashboard/ProgressChart";
import AIInsights from "@/components/dashboard/AIInsights";
import SubjectBreakdown from "@/components/dashboard/SubjectBreakdown";
import { useGame, MASCOT_INFO, CLASS_ABILITIES } from "@/lib/game-context";
import { usePdfExport } from "@/hooks/usePdfExport";

export default function DashboardPage() {
    const { player } = useGame();
    const { exportPdf } = usePdfExport();

    const mascotEmoji = player.mascot ? MASCOT_INFO[player.mascot].emoji : "🚀";
    const className = player.playerClass
        ? CLASS_ABILITIES[player.playerClass].name
        : "Tân Binh";

    return (
        <div className="space-y-6 max-w-6xl">
            {/* Student info header */}
            <div
                className="rounded-2xl border p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-4"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-3xl">
                    {mascotEmoji}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                        {player.name}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
                        Lớp {player.grade} · {className} · Level {player.level}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={exportPdf}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                        📄 Xuất PDF
                    </button>
                    <span
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-green-50 text-green-600"
                    >
                        🟢 Đang hoạt động
                    </span>
                </div>
            </div>

            {/* Stats */}
            <StatsCards />

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProgressChart />
                <SubjectBreakdown />
            </div>

            {/* AI Insights */}
            <AIInsights />
        </div>
    );
}
