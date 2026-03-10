"use client";

import StatsCards from "@/components/dashboard/StatsCards";
import ProgressChart from "@/components/dashboard/ProgressChart";
import AIInsights from "@/components/dashboard/AIInsights";
import SubjectBreakdown from "@/components/dashboard/SubjectBreakdown";
import ActivityTimeline from "@/components/dashboard/ActivityTimeline";
import Link from "next/link";
import { useGame, MASCOT_INFO, CLASS_ABILITIES } from "@/lib/game-context";
import { usePdfExport } from "@/hooks/usePdfExport";

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
}

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

    // Average mastery
    const masteryValues = Object.values(player.masteryByTopic);
    const avgMastery = masteryValues.length > 0
        ? Math.round(masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length)
        : 0;

    return (
        <div className="space-y-6 max-w-6xl">
            {/* ── Hero Banner ── */}
            <div
                className="dash-hero rounded-2xl p-6 sm:p-8 relative overflow-hidden dash-fade-up"
            >
                {/* Decorative circles */}
                <div
                    className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-20"
                    style={{ background: "radial-gradient(circle, rgba(255,255,255,0.3), transparent 70%)" }}
                />
                <div
                    className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
                    style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent 70%)" }}
                />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    {/* Avatar */}
                    <div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-4xl sm:text-5xl shrink-0"
                        style={{
                            background: "rgba(255,255,255,0.15)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        {mascotEmoji}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white/60 text-sm font-medium mb-0.5">
                            {getGreeting()}, phụ huynh của
                        </p>
                        <h2
                            className="text-2xl sm:text-3xl font-bold text-white truncate"
                            style={{ fontFamily: "var(--font-heading)" }}
                        >
                            {player.name} 👋
                        </h2>
                        <p className="text-white/50 text-sm mt-1">
                            Lớp {player.grade} · {className} · Level {player.level}
                        </p>
                    </div>

                    {/* Quick mastery badge + PDF */}
                    <div className="flex items-center gap-3 shrink-0">
                        {avgMastery > 0 && (
                            <div
                                className="text-center px-4 py-2.5 rounded-xl"
                                style={{
                                    background: "rgba(255,255,255,0.12)",
                                    backdropFilter: "blur(8px)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                }}
                            >
                                <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-heading)" }}>
                                    {avgMastery}%
                                </div>
                                <div className="text-[10px] text-white/50 font-medium">
                                    TB Mastery
                                </div>
                            </div>
                        )}
                        <button
                            onClick={exportPdf}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                color: "white",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(255,255,255,0.2)",
                            }}
                        >
                            📄 Xuất PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stats Cards ── */}
            <StatsCards />

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProgressChart />
                <SubjectBreakdown />
            </div>

            {/* ── Activity + Controls Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ActivityTimeline maxItems={3} />

                {/* Parental Controls Summary */}
                <div className="dash-card p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                            ⏰ Cài đặt Giới hạn
                        </h3>
                        <Link
                            href="/dashboard/controls"
                            className="text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:shadow-sm"
                            style={{ color: "var(--dash-accent)", background: "var(--dash-accent-light)" }}
                        >
                            Chỉnh sửa →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        <ControlRow
                            icon="⏱️"
                            label="Thời gian chơi"
                            value={limitLabel}
                            color={parentControls.dailyPlayLimit > 0 ? "#4F46E5" : "#94A3B8"}
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

            {/* ── AI Insights ── */}
            <AIInsights />
        </div>
    );
}

function ControlRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
    return (
        <div
            className="flex items-center justify-between p-3.5 rounded-xl transition-colors"
            style={{ background: `${color}08` }}
        >
            <div className="flex items-center gap-2.5">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ background: `${color}12` }}
                >
                    {icon}
                </div>
                <span className="text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                    {label}
                </span>
            </div>
            <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={{ color, background: `${color}12` }}
            >
                {value}
            </span>
        </div>
    );
}
