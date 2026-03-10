"use client";

import { useGame } from "@/lib/game-context";

/* Subject emoji + color mapping */
const SUBJECT_META: Record<string, { icon: string; color: string }> = {
    "Toán": { icon: "🔢", color: "#4F46E5" },
    "Tiếng Việt": { icon: "📝", color: "#16A34A" },
    "Tiếng Anh": { icon: "🌍", color: "#EA580C" },
    "Lịch sử": { icon: "📜", color: "#7C3AED" },
    "Địa lý": { icon: "🗺️", color: "#0891B2" },
    "Khoa học": { icon: "🔬", color: "#059669" },
    "Mỹ thuật": { icon: "🎨", color: "#DB2777" },
    "Tin học": { icon: "💻", color: "#7C3AED" },
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
            <div className="dash-card p-5 sm:p-6">
                <h3 className="font-bold text-base mb-5" style={{ fontFamily: "var(--font-heading)" }}>
                    📚 Tiến độ theo Môn học
                </h3>
                <div className="text-center py-8 text-gray-400">
                    <div className="text-5xl mb-3">📚</div>
                    <p className="text-sm font-medium">Chưa có dữ liệu</p>
                    <p className="text-xs mt-1 text-gray-300">Hãy chơi game để bắt đầu!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dash-card p-5 sm:p-6">
            <h3 className="font-bold text-base mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                📚 Tiến độ theo Môn học
            </h3>

            <div className="space-y-5">
                {subjects.map((subject, i) => (
                    <div
                        key={subject.name}
                        className="dash-fade-up"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                                    style={{ background: `${subject.color}12` }}
                                >
                                    {subject.icon}
                                </div>
                                <div>
                                    <span className="text-sm font-semibold block" style={{ color: "var(--dash-text)" }}>
                                        {subject.name}
                                    </span>
                                    <span className="text-[10px]" style={{ color: "var(--dash-muted)" }}>
                                        {subject.planet}
                                    </span>
                                </div>
                            </div>
                            <span
                                className="text-sm font-bold px-2.5 py-1 rounded-lg"
                                style={{ color: subject.color, background: `${subject.color}10` }}
                            >
                                {subject.progress}%
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700 ease-out relative"
                                style={{
                                    width: `${subject.progress}%`,
                                    background: `linear-gradient(90deg, ${subject.color}, ${subject.color}CC)`,
                                }}
                            >
                                {/* Shine effect */}
                                <div
                                    className="absolute inset-0 rounded-full"
                                    style={{
                                        background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
