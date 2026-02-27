"use client";

import { mockSubjects } from "@/lib/mock-data";

export default function SubjectBreakdown() {
    return (
        <div
            className="rounded-2xl border p-5 sm:p-6 bg-white"
            style={{ borderColor: "var(--dash-border)" }}
        >
            <h3 className="font-bold text-base mb-5" style={{ fontFamily: "var(--font-heading)" }}>
                Tiến độ theo Môn học 📚
            </h3>

            <div className="space-y-5">
                {mockSubjects.map((subject) => (
                    <div key={subject.name}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">{subject.icon}</span>
                                <span className="text-sm font-semibold" style={{ color: "var(--dash-text)" }}>
                                    {subject.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: "var(--dash-muted)" }}>
                                    {subject.planet}
                                </span>
                                <span
                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                    style={{ color: subject.color, background: `${subject.color}15` }}
                                >
                                    {subject.progress}%
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${subject.progress}%`,
                                    backgroundColor: subject.color,
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
