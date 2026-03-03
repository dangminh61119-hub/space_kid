"use client";

import StatsCards from "@/components/dashboard/StatsCards";
import ProgressChart from "@/components/dashboard/ProgressChart";
import AIInsights from "@/components/dashboard/AIInsights";
import SubjectBreakdown from "@/components/dashboard/SubjectBreakdown";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import Link from "next/link";
import { useGame, MASCOT_INFO, CLASS_ABILITIES } from "@/lib/game-context";
import { usePdfExport } from "@/hooks/usePdfExport";

export default function DashboardPage() {
    const { player } = useGame();
    const { exportPdf } = usePdfExport();

    const mascotEmoji = player.mascot ? MASCOT_INFO[player.mascot].emoji : "🚀";
    const className = player.playerClass
        ? CLASS_ABILITIES[player.playerClass].name
        : "Tân Binh";

    const { parentControls } = player;
    const limitLabel = parentControls.dailyPlayLimit === 0
        ? "Không giới hạn"
        : `${parentControls.dailyPlayLimit} phút/ngày`;

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

            {/* Charts + Activity row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProgressChart />
                <SubjectBreakdown />
            </div>

            {/* Activity + Controls row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity (max 3) */}
                <ActivityTimeline maxItems={3} />

                {/* Parental Controls Summary */}
                <div
                    className="rounded-2xl border p-5 sm:p-6 bg-white"
                    style={{ borderColor: "var(--dash-border)" }}
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                            ⏰ Cài đặt Giới hạn
                        </h3>
                        <Link
                            href="/dashboard/controls"
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            Chỉnh sửa →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        <ControlRow
                            icon="⏱️"
                            label="Thời gian chơi"
                            value={limitLabel}
                            color={parentControls.dailyPlayLimit > 0 ? "#2563EB" : "#94A3B8"}
                        />
                        <ControlRow
                            icon="🧘"
                            label="Nhắc nghỉ"
                            value={parentControls.breakReminder ? `Mỗi ${parentControls.breakInterval} phút` : "Tắt"}
                            color={parentControls.breakReminder ? "#16A34A" : "#94A3B8"}
                        />
                        <ControlRow
                            icon="🌙"
                            label="Calm Mode"
                            value={parentControls.allowCalmMode ? "Cho phép" : "Không cho phép"}
                            color={parentControls.allowCalmMode ? "#8B5CF6" : "#94A3B8"}
                        />
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            <AIInsights />
        </div>
    );
}

function ControlRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: `${color}08` }}>
            <div className="flex items-center gap-2">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                    {label}
                </span>
            </div>
            <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ color, background: `${color}15` }}
            >
                {value}
            </span>
        </div>
    );
}
