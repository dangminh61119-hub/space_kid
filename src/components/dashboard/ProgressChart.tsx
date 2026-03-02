"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { useGame } from "@/lib/game-context";

const subjectColors: Record<string, string> = {
    "Toán": "#60A5FA",
    "Tiếng Việt": "#4ADE80",
    "Tiếng Anh": "#FB923C",
    "Lịch sử": "#A78BFA",
    "Khoa học": "#10B981",
    "Địa lý": "#06B6D4",
    "Mỹ thuật": "#F472B6",
    "Tin học": "#8B5CF6",
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
    }));

    const activeSubjects = chartData
        .map((d) => d.subject)
        .filter((s) => subjectColors[s]);

    if (chartData.length === 0) {
        return (
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <h3 className="font-bold text-base mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                    Tiến độ theo Môn học 📈
                </h3>
                <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">📈</div>
                    <p className="text-sm">Chưa có dữ liệu. Hãy chơi game để bắt đầu!</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="rounded-2xl border p-5 sm:p-6 bg-white"
            style={{ borderColor: "var(--dash-border)" }}
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                        Mastery theo Môn học 📈
                    </h3>
                    <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                        Phần trăm nắm vững kiến thức
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {activeSubjects.map((subject) => (
                        <span
                            key={subject}
                            className="text-[10px] font-medium px-2 py-1 rounded-full"
                            style={{ color: subjectColors[subject], background: `${subjectColors[subject]}15` }}
                        >
                            {subject}
                        </span>
                    ))}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #E2E8F0",
                            fontSize: 12,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                        formatter={(value: number | string | undefined) => [`${value ?? 0}%`, "Mastery"]}
                    />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11 }}
                    />
                    <Bar
                        dataKey="mastery"
                        name="Mastery %"
                        radius={[6, 6, 0, 0]}
                        fill="#60A5FA"
                        label={{ position: "top", fontSize: 10, fill: "#64748B" }}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
