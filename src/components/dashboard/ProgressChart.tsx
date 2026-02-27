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
import { mockWeeklyProgress } from "@/lib/mock-data";

const subjectColors: Record<string, string> = {
    math: "#60A5FA",
    viet: "#4ADE80",
    eng: "#FB923C",
    hist: "#A78BFA",
};

const subjectLabels: Record<string, string> = {
    math: "Toán",
    viet: "Tiếng Việt",
    eng: "Tiếng Anh",
    hist: "Lịch sử",
};

export default function ProgressChart() {
    return (
        <div
            className="rounded-2xl border p-5 sm:p-6 bg-white"
            style={{ borderColor: "var(--dash-border)" }}
        >
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                        Tiến độ tuần này 📈
                    </h3>
                    <p className="text-xs" style={{ color: "var(--dash-muted)" }}>
                        Điểm trung bình theo ngày
                    </p>
                </div>
                <div className="flex gap-2">
                    {Object.entries(subjectLabels).map(([key, label]) => (
                        <span
                            key={key}
                            className="text-[10px] font-medium px-2 py-1 rounded-full"
                            style={{ color: subjectColors[key], background: `${subjectColors[key]}15` }}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            </div>

            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={mockWeeklyProgress} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: "#64748B" }}
                        axisLine={{ stroke: "#E2E8F0" }}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #E2E8F0",
                            fontSize: 12,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                        }}
                    />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11 }}
                    />
                    <Bar
                        dataKey="math"
                        name="Toán"
                        fill={subjectColors.math}
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="viet"
                        name="Tiếng Việt"
                        fill={subjectColors.viet}
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="eng"
                        name="Tiếng Anh"
                        fill={subjectColors.eng}
                        radius={[4, 4, 0, 0]}
                    />
                    <Bar
                        dataKey="hist"
                        name="Lịch sử"
                        fill={subjectColors.hist}
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
