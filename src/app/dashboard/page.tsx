"use client";

import StatsCards from "@/components/dashboard/StatsCards";
import ProgressChart from "@/components/dashboard/ProgressChart";
import AIInsights from "@/components/dashboard/AIInsights";
import SubjectBreakdown from "@/components/dashboard/SubjectBreakdown";
import { mockStudent } from "@/lib/mock-data";

export default function DashboardPage() {
    return (
        <div className="space-y-6 max-w-6xl">
            {/* Student info header */}
            <div
                className="rounded-2xl border p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center gap-4"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-3xl">
                    {mockStudent.avatar}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                        {mockStudent.name}
                    </h2>
                    <p className="text-sm" style={{ color: "var(--dash-muted)" }}>
                        Lớp {mockStudent.grade} · {mockStudent.class} · Level {mockStudent.level}
                    </p>
                </div>
                <div className="flex items-center gap-2">
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
