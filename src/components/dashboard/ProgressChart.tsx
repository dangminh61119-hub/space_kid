"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useGame } from "@/lib/game-context";

const subjectColors: Record<string, string> = {
    "Toán": "#4F46E5",
    "Tiếng Việt": "#16A34A",
    "Tiếng Anh": "#EA580C",
    "Lịch sử": "#7C3AED",
    "Khoa học": "#059669",
    "Địa lý": "#0891B2",
    "Mỹ thuật": "#DB2777",
    "Tin học": "#7C3AED",
};

export default function ProgressChart() {
    const { player } = useGame();

    /* Build per-subject mastery from masteryByTopic (keyed as "planetId:subject") */
    const subjectMastery = new Map<string, number[]>();
    for (const [key, mastery] of Object.entries(player.masteryByTopic)) {
        const subject = key.split(":")[1];
        if (!subject) continue;
        const existing = subjectMastery.get(subject) || [];
        existing.push(mastery);
        subjectMastery.set(subject, existing);
    }

    /* Build chart data: one bar per subject showing average mastery */
    const chartData = Array.from(subjectMastery.entries()).map(([subject, scores]) => ({
        subject,
        mastery: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        fill: subjectColors[subject] || "#94A3B8",
    }));

    if (chartData.length === 0) {
        return (
            <div className="dash-card p-5 sm:p-6">
                <h3 className="font-bold text-base mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                    📈 Mastery theo Môn học
                </h3>
                <div className="text-center py-12">
                    <div
                        className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)" }}
                    >
                        <span className="text-4xl">📈</span>
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--dash-text)" }}>
                        Chưa có dữ liệu
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--dash-muted)" }}>
                        Hãy chơi game để bắt đầu!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="dash-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                        📈 Mastery theo Môn học
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--dash-muted)" }}>
                        Phần trăm nắm vững kiến thức
                    </p>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                    {chartData.map((d) => (
                        <span
                            key={d.subject}
                            className="text-[10px] font-medium px-2 py-1 rounded-full"
                            style={{ color: d.fill, background: `${d.fill}10` }}
                        >
                            {d.subject}
                        </span>
                    ))}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickFormatter={(v: number) => `${v}%`}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #E2E8F0",
                            fontSize: 12,
                            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
                            padding: "8px 12px",
                        }}
                        formatter={(value: number | string | undefined) => [`${value ?? 0}%`, "Mastery"]}
                        cursor={{ fill: "rgba(99, 102, 241, 0.04)" }}
                    />
                    <Bar
                        dataKey="mastery"
                        name="Mastery %"
                        radius={[8, 8, 0, 0]}
                        label={{ position: "top", fontSize: 10, fill: "#64748B", fontWeight: 600 }}
                    >
                        {chartData.map((entry, index) => (
                            <rect key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
