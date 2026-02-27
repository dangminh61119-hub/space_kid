"use client";

import { mockAIInsights } from "@/lib/mock-data";

const typeStyles = {
    strength: { bg: "#F0FFF4", border: "#4ADE8040", accent: "#16A34A" },
    improve: { bg: "#FFFBEB", border: "#FFE06640", accent: "#CA8A04" },
    tip: { bg: "#FFF1F2", border: "#FB923C40", accent: "#EA580C" },
};

export default function AIInsights() {
    return (
        <div
            className="rounded-2xl border p-5 sm:p-6 bg-white"
            style={{ borderColor: "var(--dash-border)" }}
        >
            <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">🤖</span>
                <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                    AI Insights
                </h3>
                <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600"
                >
                    TỰ ĐỘNG
                </span>
            </div>

            <div className="space-y-3">
                {mockAIInsights.map((insight, i) => {
                    const style = typeStyles[insight.type];
                    return (
                        <div
                            key={i}
                            className="rounded-xl p-4 border transition-all hover:shadow-sm"
                            style={{ background: style.bg, borderColor: style.border }}
                        >
                            <div className="flex gap-3">
                                <span className="text-xl shrink-0">{insight.icon}</span>
                                <p className="text-sm leading-relaxed" style={{ color: "var(--dash-text)" }}>
                                    {insight.message}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="text-[10px] mt-4 text-center" style={{ color: "var(--dash-muted)" }}>
                Phân tích dựa trên dữ liệu 7 ngày gần nhất
            </p>
        </div>
    );
}
