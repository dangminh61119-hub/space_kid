"use client";

import { useGame, MASCOT_INFO } from "@/lib/game-context";

const typeStyles = {
    strength: { bg: "#F0FFF4", border: "#4ADE8040", accent: "#16A34A" },
    improve: { bg: "#FFFBEB", border: "#FFE06640", accent: "#CA8A04" },
    tip: { bg: "#FFF1F2", border: "#FB923C40", accent: "#EA580C" },
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
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <div className="flex items-center gap-2 mb-5">
                    <span className="text-xl">🤖</span>
                    <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-heading)" }}>
                        AI Insights
                    </h3>
                </div>
                <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">Chơi thêm để Cú Mèo đưa ra nhận xét nhé! 🦉</p>
                </div>
            </div>
        );
    }

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
                {insights.map((insight, i) => {
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
                Phân tích dựa trên dữ liệu hiện tại của bé
            </p>
        </div>
    );
}
