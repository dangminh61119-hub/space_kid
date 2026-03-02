"use client";

import { useGame } from "@/lib/game-context";

/* Subject emoji + color mapping */
const SUBJECT_META: Record<string, { icon: string; color: string }> = {
    "Toán": { icon: "🔢", color: "#60A5FA" },
    "Tiếng Việt": { icon: "📝", color: "#4ADE80" },
    "Tiếng Anh": { icon: "🌍", color: "#FB923C" },
    "Lịch sử": { icon: "📜", color: "#A78BFA" },
    "Địa lý": { icon: "🗺️", color: "#06B6D4" },
    "Khoa học": { icon: "🔬", color: "#10B981" },
    "Mỹ thuật": { icon: "🎨", color: "#F472B6" },
    "Tin học": { icon: "💻", color: "#8B5CF6" },
};

/* Planet ID → Vietnamese name */
const PLANET_NAMES: Record<string, string> = {
    "ha-long": "Vịnh Hạ Long",
    "hue": "Cố đô Huế",
    "giong": "Làng Gióng",
    "phong-nha": "Phong Nha",
    "hoi-an": "Phố cổ Hội An",
    "sapa": "Sa Pa",
    "hanoi": "Hà Nội",
    "mekong": "Đồng bằng Mê Kông",
};

interface SubjectStat {
    name: string;
    icon: string;
    color: string;
    progress: number;
    planet: string;
}

export default function SubjectBreakdown() {
    const { player } = useGame();

    /* Build subject stats from masteryByTopic keyed as "planetId:subject" */
    const subjectMap = new Map<string, { totalMastery: number; count: number; planet: string }>();

    for (const [key, mastery] of Object.entries(player.masteryByTopic)) {
        const [planetId, subject] = key.split(":");
        if (!subject) continue;
        const existing = subjectMap.get(subject) || { totalMastery: 0, count: 0, planet: PLANET_NAMES[planetId] || planetId };
        existing.totalMastery += mastery;
        existing.count += 1;
        subjectMap.set(subject, existing);
    }

    const subjects: SubjectStat[] = Array.from(subjectMap.entries()).map(([name, data]) => ({
        name,
        icon: SUBJECT_META[name]?.icon || "📖",
        color: SUBJECT_META[name]?.color || "#94A3B8",
        progress: Math.round(data.totalMastery / data.count),
        planet: data.planet,
    }));

    /* If no mastery data, show a friendly empty state */
    if (subjects.length === 0) {
        return (
            <div
                className="rounded-2xl border p-5 sm:p-6 bg-white"
                style={{ borderColor: "var(--dash-border)" }}
            >
                <h3 className="font-bold text-base mb-5" style={{ fontFamily: "var(--font-heading)" }}>
                    Tiến độ theo Môn học 📚
                </h3>
                <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">📚</div>
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
            <h3 className="font-bold text-base mb-5" style={{ fontFamily: "var(--font-heading)" }}>
                Tiến độ theo Môn học 📚
            </h3>

            <div className="space-y-5">
                {subjects.map((subject) => (
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
