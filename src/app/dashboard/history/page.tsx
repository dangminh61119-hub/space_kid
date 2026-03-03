"use client";

import ActivityTimeline from "@/components/dashboard/ActivityTimeline";

export default function HistoryPage() {
    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                    Lịch sử Hoạt động 📅
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--dash-muted)" }}>
                    Theo dõi hành trình khám phá vũ trụ của bé
                </p>
            </div>

            <ActivityTimeline />
        </div>
    );
}
