/**
 * Daily Missions Service
 *
 * Manages daily missions that rotate each day (VN timezone, UTC+7).
 * Uses localStorage for progress tracking with a deterministic seed
 * to pick consistent missions per day.
 */

/* ─── Mission Definitions ─── */
export interface Mission {
    id: string;
    title: string;
    description: string;
    emoji: string;
    reward: number; // Coins
    target: number; // how many to complete
    type: MissionType;
}

export type MissionType =
    | "quiz_complete"       // Complete N quizzes
    | "flashcard_complete"  // Complete N flashcard sets
    | "english_session"     // Complete an English practice session
    | "portal_level"        // Complete N portal levels
    | "streak_reach"        // Reach N-day streak
    | "lesson_view"         // View N lessons
    | "any_activity";       // Do any learning activity

export interface DailyMissionProgress {
    missionId: string;
    current: number;
    completed: boolean;
    claimed: boolean;
}

export interface DailyMissionsState {
    date: string; // YYYY-MM-DD in VN timezone
    missions: DailyMissionProgress[];
}

/* ─── Mission Pool ─── */
const MISSION_POOL: Mission[] = [
    {
        id: "quiz_1", title: "Nhà Thông Thái", description: "Hoàn thành 1 bài quiz",
        emoji: "📝", reward: 20, target: 1, type: "quiz_complete",
    },
    {
        id: "quiz_2", title: "Quiz Master", description: "Hoàn thành 2 bài quiz",
        emoji: "📝", reward: 35, target: 2, type: "quiz_complete",
    },
    {
        id: "flash_1", title: "Flashcard Fan", description: "Ôn tập 1 bộ flashcard",
        emoji: "🃏", reward: 10, target: 1, type: "flashcard_complete",
    },
    {
        id: "flash_2", title: "Siêu Trí Nhớ", description: "Ôn tập 2 bộ flashcard",
        emoji: "🃏", reward: 20, target: 2, type: "flashcard_complete",
    },
    {
        id: "english_1", title: "English Explorer", description: "Luyện nói tiếng Anh 1 lần",
        emoji: "🦅", reward: 25, target: 1, type: "english_session",
    },
    {
        id: "portal_1", title: "Nhà Thám Hiểm", description: "Chơi 1 level trong Portal",
        emoji: "🎮", reward: 20, target: 1, type: "portal_level",
    },
    {
        id: "portal_2", title: "Game Master", description: "Chơi 2 level trong Portal",
        emoji: "🎮", reward: 35, target: 2, type: "portal_level",
    },
    {
        id: "streak_3", title: "Kiên Trì", description: "Đạt streak 3 ngày",
        emoji: "🔥", reward: 50, target: 3, type: "streak_reach",
    },
    {
        id: "lesson_1", title: "Chăm Học", description: "Xem 1 bài giảng",
        emoji: "📺", reward: 15, target: 1, type: "lesson_view",
    },
    {
        id: "any_2", title: "Năng Động", description: "Hoàn thành 2 hoạt động bất kỳ",
        emoji: "⚡", reward: 15, target: 2, type: "any_activity",
    },
];

const STORAGE_KEY = "cosmomosaic_daily_missions";
const MISSIONS_PER_DAY = 3;

/* ─── Helpers ─── */

/** Get current date string in VN timezone (UTC+7) */
export function getVNDateString(): string {
    const now = new Date();
    // UTC+7
    const vnOffset = 7 * 60; // minutes
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const vnTime = new Date(utc + vnOffset * 60000);
    return vnTime.toISOString().split("T")[0];
}

/** Deterministic pseudo-random from date string → pick missions */
function dateHash(dateStr: string): number {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const char = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
}

/** Pick N missions for a given date (deterministic) */
function pickMissionsForDate(dateStr: string, count: number): Mission[] {
    const hash = dateHash(dateStr);
    const pool = [...MISSION_POOL];
    const picked: Mission[] = [];

    for (let i = 0; i < count && pool.length > 0; i++) {
        const idx = (hash * (i + 7) + i * 13) % pool.length;
        picked.push(pool[idx]);
        pool.splice(idx, 1);
    }

    return picked;
}

/* ─── Public API ─── */

/** Load today's missions with progress. Creates fresh if date changed. */
export function loadDailyMissions(): { missions: Mission[]; progress: DailyMissionProgress[] } {
    const today = getVNDateString();
    const missions = pickMissionsForDate(today, MISSIONS_PER_DAY);

    // Try to load existing progress
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const state: DailyMissionsState = JSON.parse(stored);
            if (state.date === today) {
                // Same day — merge progress with missions
                const progress = missions.map(m => {
                    const existing = state.missions.find(p => p.missionId === m.id);
                    return existing || { missionId: m.id, current: 0, completed: false, claimed: false };
                });
                return { missions, progress };
            }
        }
    } catch { /* ignore parse errors */ }

    // New day or no data — fresh progress
    const progress = missions.map(m => ({
        missionId: m.id, current: 0, completed: false, claimed: false,
    }));
    saveDailyMissions(today, progress);
    return { missions, progress };
}

/** Save progress to localStorage */
function saveDailyMissions(date: string, missions: DailyMissionProgress[]): void {
    try {
        const state: DailyMissionsState = { date, missions };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* silent */ }
}

/** Increment progress for a mission type. Returns updated progress + any newly completed missions. */
export function trackMissionProgress(
    type: MissionType,
    amount: number = 1
): { progress: DailyMissionProgress[]; newlyCompleted: Mission[] } {
    const today = getVNDateString();
    const { missions, progress } = loadDailyMissions();
    const newlyCompleted: Mission[] = [];

    const updated = progress.map(p => {
        const mission = missions.find(m => m.id === p.missionId);
        if (!mission) return p;

        // Check if this mission type matches
        const matches = mission.type === type || mission.type === "any_activity";
        if (!matches || p.completed) return p;

        const newCurrent = Math.min(p.current + amount, mission.target);
        const nowCompleted = newCurrent >= mission.target;

        if (nowCompleted && !p.completed) {
            newlyCompleted.push(mission);
        }

        return { ...p, current: newCurrent, completed: nowCompleted };
    });

    saveDailyMissions(today, updated);
    return { progress: updated, newlyCompleted };
}

/** Check streak-based missions (called when player data loads) */
export function checkStreakMissions(streak: number): { progress: DailyMissionProgress[]; newlyCompleted: Mission[] } {
    const today = getVNDateString();
    const { missions, progress } = loadDailyMissions();
    const newlyCompleted: Mission[] = [];

    const updated = progress.map(p => {
        const mission = missions.find(m => m.id === p.missionId);
        if (!mission || mission.type !== "streak_reach" || p.completed) return p;

        if (streak >= mission.target) {
            newlyCompleted.push(mission);
            return { ...p, current: mission.target, completed: true };
        }

        return { ...p, current: Math.min(streak, mission.target) };
    });

    saveDailyMissions(today, updated);
    return { progress: updated, newlyCompleted };
}

/** Mark a mission's reward as claimed */
export function claimMissionReward(missionId: string): DailyMissionProgress[] {
    const today = getVNDateString();
    const { progress } = loadDailyMissions();

    const updated = progress.map(p =>
        p.missionId === missionId ? { ...p, claimed: true } : p
    );

    saveDailyMissions(today, updated);
    return updated;
}

/** Get mission definition by ID */
export function getMissionById(id: string): Mission | undefined {
    return MISSION_POOL.find(m => m.id === id);
}
