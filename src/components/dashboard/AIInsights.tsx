"use client";

import { useGame, MASCOT_INFO } from "@/lib/game-context";

const typeStyles = {
    strength: { bg: "#F0FFF4", border: "#22C55E", accent: "#16A34A", label: "Điểm mạnh" },
    improve: { bg: "#FFFBEB", border: "#F59E0B", accent: "#CA8A04", label: "Cần cải thiện" },
    tip: { bg: "#FFF1F2", border: "#F97316", accent: "#EA580C", label: "Mẹo hay" },
};

interface Insight {
    type: "strength" | "improve" | "tip";
    message: string;
    icon: string;
}

/* Generate insights from real player data */
function generateInsights(player: ReturnType<typeof useGame>["player"]): Insight[] {
    const insights: Insight[] = [];

    // Mastery-based insights
    const masteryEntries = Object.entries(player.masteryByTopic);
    if (masteryEntries.length > 0) {
        // Find best subject
        const best = masteryEntries.reduce((a, b) => (a[1] > b[1] ? a : b));
        const bestSubject = best[0].split(":")[1] || best[0];
        insights.push({
            type: "strength",
            message: `${player.name} rất giỏi ${bestSubject}! Mastery đạt ${best[1]}%.`,
            icon: "💪",
        });

        // Find weakest subject
        const worst = masteryEntries.reduce((a, b) => (a[1] < b[1] ? a : b));
        const worstSubject = worst[0].split(":")[1] || worst[0];
        if (worst[1] < 60) {
            insights.push({
                type: "improve",
                message: `Hãy luyện thêm ${worstSubject} nhé! Mastery hiện tại: ${worst[1]}%.`,
                icon: "💡",
            });
        }
    }

    // Streak tip
    if (player.streak >= 3) {
        insights.push({
            type: "tip",
            message: `Streak ${player.streak} ngày liên tiếp! Tiếp tục giữ streak nhé! 🔥`,
            icon: "🔥",
        });
    } else {
        insights.push({
            type: "tip",
            message: "Hãy chơi mỗi ngày để xây dựng streak và mở quà đặc biệt!",
            icon: "💪",
        });
    }

    // Level-based
    if (player.level >= 5) {
        insights.push({
            type: "strength",
            message: `Phi hành gia level ${player.level}! Đã tích lũy ${player.cosmo} \u2726 rồi đó!`,
            icon: "🚀",
        });
    }

    // Mascot tip
    if (player.mascot) {
        const mascotInfo = MASCOT_INFO[player.mascot];
        insights.push({
            type: "tip",
            message: `${mascotInfo.emoji} ${mascotInfo.name} luôn đồng hành cùng bé trên hành trình tri thức!`,
            icon: mascotInfo.emoji,
        });
    }

    // Return max 3 insights
    return insights.slice(0, 3);
}

export default function AIInsights() {
    const { player } = useGame();
    const insights = generateInsights(player);

    if (insights.length === 0) {
        return (
            <div className="dash-card p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-5">
                    <span className="text-xl">🦉</span>
                    <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                        Cú Mèo nhận xét
                    </h3>
                </div>
                <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">Chơi thêm để Cú Mèo đưa ra nhận xét nhé! 🦉</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dash-card p-5 sm:p-6 dash-fade-up" style={{ animationDelay: "200ms" }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: "linear-gradient(135deg, #EEF2FF, #E0E7FF)" }}
                >
                    🦉
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                        Cú Mèo nhận xét
                    </h3>
                    <p className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
                        Phân tích dựa trên dữ liệu học tập
                    </p>
                </div>
                <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                    style={{ color: "#16A34A", background: "#F0FFF4" }}
                >
                    TỰ ĐỘNG
                </span>
            </div>

            {/* Insight Cards */}
            <div className="space-y-3">
                {insights.map((insight, i) => {
                    const style = typeStyles[insight.type];
                    return (
                        <div
                            key={i}
                            className="rounded-xl p-4 transition-all hover:shadow-sm dash-fade-up flex gap-3"
                            style={{
                                background: style.bg,
                                borderLeft: `3px solid ${style.border}`,
                                animationDelay: `${250 + i * 80}ms`,
                            }}
                        >
                            <span className="text-xl shrink-0">{insight.icon}</span>
                            <div className="flex-1 min-w-0">
                                <span
                                    className="text-[10px] font-bold uppercase tracking-wider"
                                    style={{ color: style.accent }}
                                >
                                    {style.label}
                                </span>
                                <p className="text-sm leading-relaxed mt-0.5" style={{ color: "var(--dash-text)" }}>
                                    {insight.message}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
