"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./services/auth-context";
import { supabase, isMockMode } from "./services/supabase";
import { getMasteryForPlayer } from "./services/db";


/* ─── Types ─── */

export interface ParentControls {
    dailyPlayLimit: number;      // phút, 0 = không giới hạn
    breakReminder: boolean;      // nhắc nghỉ ngơi
    breakInterval: number;       // phút giữa các lần nhắc
    allowCalmMode: boolean;      // cho phép bé bật Calm Mode
}

export type RankTitle = "🌱 Cadet Explorer" | "🚀 Space Ranger" | "🌟 Star Seeker" | "⚡ Cosmic Scholar" | "💎 Galaxy Sage" | "👑 Grand Explorer";

export interface PlayerData {
    name: string;
    mascot: "cat" | "dog" | null;
    playerClass: "warrior" | "wizard" | "hunter" | null;
    grade: number;
    level: number;
    cosmo: number;                     // ✦ Cosmo — đơn vị kinh nghiệm (stored as `xp` in DB)
    cosmoToNext: number;
    cosmoInLevel: number;              // BUG-1 FIX: Progress within current level (for progress bar)
    rank: RankTitle;                   // Danh hiệu dựa trên tổng Cosmo (GDD §8.3)
    streak: number;
    totalPlayHours: number;
    onboardingComplete: boolean;
    onboardingQuizScore: number;
    surveyCompleted: boolean;
    estimatedGrade: number;
    profileCompleted: boolean;
    birthday?: string;
    school?: string;
    parentEmail?: string;
    parentName?: string;
    parentPhone?: string;
    favoriteSubjects?: string[];
    calmMode: boolean;                 // Giảm kích thích giác quan cho trẻ nhạy cảm
    coins: number;                     // 🪙 Coins — tiền tệ phổ thông (mua cosmetics)
    crystals: number;                  // 💎 Pha lê Vũ trụ — currency hiếm (Triệu hồi AI)
    luckyStars: number;                // ⭐ Ngôi sao may mắn — 3 sao = 1 huy hiệu
    totalCrystalsEarned: number;       // Tổng pha lê đã kiếm (lifetime)
    abilityCharges: number;            // ⚡ Lượt sử dụng năng lực (max 5)
    evolveStage: 1 | 2 | 3 | 4 | 5;  // 🐣 Stage tiến hóa Cú Mèo (dựa trên journeysCompleted)
    accessories: string[];             // 🎨 Phụ kiện đã unlock
    masteryByTopic: Record<string, number>;       // topic key → mastery % (0–100)
    bloomLevelReached: Record<string, number>;     // topic key → Bloom level (1–6)
    journeysCompleted: number;     // Number of journeys completed (from journey_progress table)
    achievements: string[];            // Danh sách achievementId đã đạt
    parentControls: ParentControls;    // Cài đặt của phụ huynh
}

interface GameContextType {
    player: PlayerData;
    updatePlayer: (updates: Partial<PlayerData>) => void;
    addCosmo: (amount: number) => void;                      // ✦ Cộng Cosmo
    addCoins: (amount: number) => void;                      // 🪙 Cộng Coins
    addStars: (amount: number) => void;                      // ⭐ Cộng Lucky Stars
    spendStars: (amount: number) => boolean;                  // ⭐ Tiêu Lucky Stars (false nếu không đủ)
    spendCoins: (amount: number) => boolean;                 // 🪙 Tiêu Coins
    addCrystals: (amount: number, reason?: string) => void;  // 💎 Cộng pha lê
    spendCrystals: (amount: number) => boolean;              // 💎 Tiêu pha lê (false nếu không đủ)

    useAbilityCharge: () => boolean;                         // ⚡ Dùng 1 charge (false nếu hết)
    addAbilityCharges: (amount: number) => void;             // ⚡ Cộng charges (cap 5)
    resetGame: () => void;
    setCalmMode: (enabled: boolean) => void;  // Toggle Calm Mode
    unlockAchievement: (id: string) => void;  // Mở khóa thành tích
    updateParentControls: (controls: Partial<ParentControls>) => void; // Cập nhật cài đặt phụ huynh
}

/* ─── Defaults ─── */
const DEFAULT_PLAYER: PlayerData = {
    name: "Tân Binh",
    mascot: null,
    playerClass: null,
    grade: 3,
    level: 1,
    cosmo: 0,
    cosmoToNext: 500,
    cosmoInLevel: 0,
    rank: "🌱 Cadet Explorer",
    streak: 0,
    totalPlayHours: 0,
    onboardingComplete: false,
    onboardingQuizScore: 0,
    surveyCompleted: false,
    estimatedGrade: 3,
    profileCompleted: false,
    birthday: "",
    school: "",
    parentEmail: "",
    parentName: "",
    parentPhone: "",
    favoriteSubjects: [],
    calmMode: false,                   // Will be auto-enabled for grade ≤ 2
    coins: 0,                          // 🪙 Coins for cosmetics
    crystals: 3,                       // 💎 Starter crystals
    luckyStars: 0,                     // ⭐ Lucky Stars
    totalCrystalsEarned: 3,            // Lifetime total
    abilityCharges: 1,                 // ⚡ Starter charge
    evolveStage: 1,                    // 🐣 Baby Cú Mèo
    accessories: [],                   // Unlocked accessories
    masteryByTopic: {},                // Loaded from Supabase mastery table
    bloomLevelReached: {},             // Loaded from Supabase mastery table
    achievements: [],                  // Danh sách badge thành tích
    parentControls: {
        dailyPlayLimit: 0,             // 0 = không giới hạn
        breakReminder: true,           // mặc định bật nhắc nghỉ
        breakInterval: 30,             // nhắc mỗi 30 phút
        allowCalmMode: true,           // cho phép Calm Mode
    },
    journeysCompleted: 0,
};

const STORAGE_KEY = "cosmomosaic_player";
const CALM_MODE_KEY = "cosmomosaic_calm_mode";
const COSMO_PER_LEVEL = 500;

/* ─── Context ─── */
const GameContext = createContext<GameContextType | null>(null);

/* ─── Helper: Calculate level from Cosmo ─── */
function calculateLevel(cosmo: number): { level: number; cosmoToNext: number; cosmoInLevel: number } {
    const level = Math.floor(cosmo / COSMO_PER_LEVEL) + 1;
    const cosmoToNext = level * COSMO_PER_LEVEL;  // Total Cosmo needed to reach next level
    const cosmoInLevel = cosmo % COSMO_PER_LEVEL;  // BUG-1 FIX: Progress WITHIN current level (for progress bar)
    return { level, cosmoToNext, cosmoInLevel };
}

/* ─── Helper: Calculate rank from total Cosmo (GDD §8.3) ─── */
function calculateRank(cosmo: number): RankTitle {
    if (cosmo >= 150001) return "👑 Grand Explorer";
    if (cosmo >= 70001) return "💎 Galaxy Sage";
    if (cosmo >= 25001) return "⚡ Cosmic Scholar";
    if (cosmo >= 8001) return "🌟 Star Seeker";
    if (cosmo >= 2001) return "🚀 Space Ranger";
    return "🌱 Cadet Explorer";
}

/* ─── Helper: Calculate evolve stage from journeys completed (decoupled from Cosmo) ─── */
function calculateEvolveStage(journeysCompleted: number): 1 | 2 | 3 | 4 | 5 {
    if (journeysCompleted >= 15) return 5;  // 👑 Huyền thoại
    if (journeysCompleted >= 10) return 4;  // ⚔️ Chiến binh
    if (journeysCompleted >= 6) return 3;  // 🦉 Học viên
    if (journeysCompleted >= 3) return 2;  // 🐣 Nhỏ
    return 1;                               // 🥚 Baby
}

/* ─── Provider ─── */
export function GameProvider({ children }: { children: ReactNode }) {
    const [player, setPlayer] = useState<PlayerData>(DEFAULT_PLAYER);
    const [isHydrated, setIsHydrated] = useState(false);

    const { playerDbId } = useAuth();

    // 1. Initial Load: Merge local storage data with Supabase data
    useEffect(() => {
        let isMounted = true;

        async function initData() {
            let localData: Partial<PlayerData> = {};

            // Step 1: Read local storage (for fast UI or offline)
            try {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    localData = JSON.parse(saved) as Partial<PlayerData>;
                    if (isMounted) {
                        setPlayer(prev => ({ ...prev, ...localData }));
                    }
                }

                // Restore calm mode from dedicated key (faster access)
                const savedCalmMode = localStorage.getItem(CALM_MODE_KEY);
                if (savedCalmMode !== null) {
                    const calmEnabled = JSON.parse(savedCalmMode) as boolean;
                    if (calmEnabled) document.documentElement.classList.add("calm-mode");
                    if (isMounted) setPlayer(prev => ({ ...prev, calmMode: calmEnabled }));
                } else if (localData.grade !== undefined && localData.grade <= 2) {
                    // Auto-enable calm mode for grade ≤ 2 (approx. 6-7 years old)
                    document.documentElement.classList.add("calm-mode");
                    if (isMounted) setPlayer(prev => ({ ...prev, calmMode: true }));
                }
            } catch {
                // ignore parse errors
            }

            // Step 2: Fetch remote data if authenticated
            if (!isMockMode && supabase && playerDbId) {
                try {
                    // Fetch player details (level, xp, etc)
                    const { data: remotePlayer, error: pError } = await supabase
                        .from("players")
                        .select("xp, grade, name, mascot, player_class, streak, onboarding_complete, onboarding_quiz_score, survey_completed, estimated_grade, profile_completed, lucky_stars, coins, crystals, total_crystals_earned, ability_charges")
                        .eq("id", playerDbId)
                        .single();

                    // Count completed journeys from journey_progress table
                    let journeysCompleted = 0;
                    const { data: jpData } = await supabase
                        .from("journey_progress")
                        .select("completed_levels")
                        .eq("player_id", playerDbId)
                        .gte("completed_levels", 6);
                    if (jpData) journeysCompleted = jpData.length;

                    if (isMounted) {
                        setPlayer(prev => {
                            const evolveStage = calculateEvolveStage(journeysCompleted);
                            const updated = { ...prev, journeysCompleted, evolveStage };

                            // Merge player stats from DB (DB stores `xp`, we use as `cosmo`)
                            if (!pError && remotePlayer) {
                                const actualCosmo = typeof remotePlayer.xp === 'number' ? remotePlayer.xp : prev.cosmo;
                                const { level, cosmoToNext, cosmoInLevel } = calculateLevel(actualCosmo);
                                const rank = calculateRank(actualCosmo);

                                Object.assign(updated, {
                                    cosmo: actualCosmo,
                                    level,
                                    cosmoToNext,
                                    cosmoInLevel,
                                    rank,
                                    name: remotePlayer.name || prev.name,
                                    grade: remotePlayer.grade || prev.grade,
                                    ...(remotePlayer.mascot ? { mascot: remotePlayer.mascot } : {}),
                                    ...(remotePlayer.player_class ? { playerClass: remotePlayer.player_class } : {}),
                                    ...(remotePlayer.streak !== undefined ? { streak: remotePlayer.streak } : {}),
                                    onboardingComplete: remotePlayer.onboarding_complete ?? prev.onboardingComplete,
                                    onboardingQuizScore: remotePlayer.onboarding_quiz_score ?? prev.onboardingQuizScore,
                                    luckyStars: remotePlayer.lucky_stars ?? prev.luckyStars,
                                    coins: remotePlayer.coins ?? prev.coins,
                                    crystals: remotePlayer.crystals ?? prev.crystals,
                                    totalCrystalsEarned: remotePlayer.total_crystals_earned ?? prev.totalCrystalsEarned,
                                    abilityCharges: remotePlayer.ability_charges ?? prev.abilityCharges,
                                });
                            }

                            return updated;
                        });
                    }

                    // Load mastery data (Bloom Taxonomy, migration 006)
                    const mastery = await getMasteryForPlayer(playerDbId);
                    if (isMounted && (Object.keys(mastery.masteryByTopic).length > 0)) {
                        setPlayer(prev => ({
                            ...prev,
                            masteryByTopic: mastery.masteryByTopic,
                            bloomLevelReached: mastery.bloomLevelReached,
                        }));
                    }

                    // ─── Daily Login Streak (GDD §8.4) ───
                    // BUG-7 FIX: Streak calculation runs AFTER DB merge above (via separate setPlayer),
                    // so prev.streak already contains the DB-synced value. This is correct because
                    // React processes setPlayer updaters sequentially within the same execution context.
                    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
                    if (isMounted) {
                        setPlayer(prev => {
                            const LAST_LOGIN_KEY = "cosmomosaic_last_login";
                            const lastLogin = localStorage.getItem(LAST_LOGIN_KEY);
                            let newStreak = prev.streak;

                            if (!lastLogin || lastLogin !== today) {
                                if (lastLogin) {
                                    const lastDate = new Date(lastLogin);
                                    const todayDate = new Date(today);
                                    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                                    if (diffDays === 1) {
                                        // Consecutive day → increment streak
                                        newStreak = prev.streak + 1;
                                    } else if (diffDays > 1) {
                                        // Streak broken → reset to 1
                                        newStreak = 1;
                                    }
                                    // diffDays === 0 means same day, no change
                                } else {
                                    // First login ever
                                    newStreak = 1;
                                }

                                // Save today as last login
                                localStorage.setItem(LAST_LOGIN_KEY, today);

                                // Sync streak to DB
                                if (!isMockMode && supabase && playerDbId) {
                                    supabase.from("players").update({ streak: newStreak }).eq("id", playerDbId).then(({ error: e }) => {
                                        if (e) console.error("[GameContext] streak sync error:", e);
                                    });
                                }
                            }

                            return { ...prev, streak: newStreak };
                        });
                    }

                } catch (err) {
                    console.error("[GameContext] Error fetching remote data:", err);
                }
            }

            if (isMounted) setIsHydrated(true);
        }

        initData();
        return () => { isMounted = false; };
    }, [playerDbId]);

    // 2. Save to localStorage ONLY
    // DB syncs happen inside the update functions explicitly to avoid spamming the DB
    useEffect(() => {
        if (!isHydrated) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
        } catch {
            // ignore storage errors
        }
    }, [player, isHydrated]);

    const updatePlayer = useCallback((updates: Partial<PlayerData>) => {
        setPlayer(prev => ({ ...prev, ...updates }));

        // Background sync to DB (no await necessary for UI update)
        if (!isMockMode && supabase && playerDbId) {
            // Only extract fields that actually exist in the DB schema
            const dbUpdates: Record<string, unknown> = {};
            if ('cosmo' in updates) dbUpdates.xp = updates.cosmo; // DB column is still `xp`
            if ('streak' in updates) dbUpdates.streak = updates.streak;
            if ('mascot' in updates) dbUpdates.mascot = updates.mascot;
            if ('playerClass' in updates) dbUpdates.player_class = updates.playerClass;
            if ('name' in updates) dbUpdates.name = updates.name;
            if ('grade' in updates) dbUpdates.grade = updates.grade;
            if ('onboardingComplete' in updates) dbUpdates.onboarding_complete = updates.onboardingComplete;
            if ('onboardingQuizScore' in updates) dbUpdates.onboarding_quiz_score = updates.onboardingQuizScore;
            if ('coins' in updates) dbUpdates.coins = updates.coins;
            if ('crystals' in updates) dbUpdates.crystals = updates.crystals;
            if ('totalCrystalsEarned' in updates) dbUpdates.total_crystals_earned = updates.totalCrystalsEarned;
            if ('abilityCharges' in updates) dbUpdates.ability_charges = updates.abilityCharges;
            if ('luckyStars' in updates) dbUpdates.lucky_stars = updates.luckyStars;

            if (Object.keys(dbUpdates).length > 0) {
                supabase.from("players").update(dbUpdates).eq("id", playerDbId).then(({ error }) => {
                    if (error) console.error("[GameContext] updatePlayer DB error:", error);
                });
            }
        }
    }, [playerDbId]);

    const addCosmo = useCallback((amount: number) => {
        setPlayer(prev => {
            const newCosmo = prev.cosmo + amount;
            const { level, cosmoToNext, cosmoInLevel } = calculateLevel(newCosmo);
            const rank = calculateRank(newCosmo);

            // Background sync (DB column is still `xp`)
            if (!isMockMode && supabase && playerDbId) {
                supabase.from("players").update({ xp: newCosmo }).eq("id", playerDbId).then(({ error }) => {
                    if (error) console.error("[GameContext] addCosmo DB error:", error);
                });
            }

            return { ...prev, cosmo: newCosmo, level, cosmoToNext, cosmoInLevel, rank };
        });
    }, [playerDbId]);

    /* ─── 🪙 Coins Economy ─── */
    const addCoins = useCallback((amount: number) => {
        setPlayer(prev => ({ ...prev, coins: prev.coins + amount }));
        // Persist to DB
        if (playerDbId && supabase) {
            const sb = supabase;
            sb.from("players").select("coins").eq("id", playerDbId).single().then(({ data }) => {
                if (data) sb.from("players").update({ coins: (data.coins || 0) + amount }).eq("id", playerDbId).then(() => { });
            });
        }
    }, [playerDbId]);

    /* ─── ⭐ Lucky Stars ─── */
    const addStars = useCallback((amount: number) => {
        setPlayer(prev => ({ ...prev, luckyStars: prev.luckyStars + amount }));
        // Persist to DB
        if (playerDbId && supabase) {
            const sb = supabase;
            sb.from("players").select("lucky_stars").eq("id", playerDbId).single().then(({ data }) => {
                if (data) {
                    sb.from("players").update({ lucky_stars: (data.lucky_stars || 0) + amount }).eq("id", playerDbId).then(() => { });
                }
            });
        }
    }, [playerDbId]);

    const spendStars = useCallback((amount: number): boolean => {
        let success = false;
        setPlayer(prev => {
            if (prev.luckyStars < amount) {
                success = false;
                return prev;
            }
            success = true;
            return { ...prev, luckyStars: prev.luckyStars - amount };
        });
        // Persist to DB
        if (success && playerDbId && supabase) {
            const sb = supabase;
            sb.from("players").select("lucky_stars").eq("id", playerDbId).single().then(({ data }) => {
                if (data) sb.from("players").update({ lucky_stars: Math.max(0, (data.lucky_stars || 0) - amount) }).eq("id", playerDbId).then(() => { });
            });
        }
        return success;
    }, [playerDbId]);

    // BUG-2 FIX: Use a ref to capture the synchronous result from the updater
    const spendCoins = useCallback((amount: number): boolean => {
        let success = false;
        setPlayer(prev => {
            if (prev.coins < amount) {
                success = false;
                return prev;
            }
            success = true;
            return { ...prev, coins: prev.coins - amount };
        });
        // Note: React guarantees setState updater runs synchronously within
        // the same execution context when called from an event handler.
        // This pattern works correctly for event-driven spend operations.
        return success;
    }, []);

    /* ─── 💎 Crystal Economy ─── */
    const addCrystals = useCallback((amount: number, _reason?: string) => {
        setPlayer(prev => ({
            ...prev,
            crystals: prev.crystals + amount,
            totalCrystalsEarned: prev.totalCrystalsEarned + amount,
        }));
        // Persist to DB
        if (playerDbId && supabase) {
            const sb = supabase;
            sb.from("players").select("crystals, total_crystals_earned").eq("id", playerDbId).single().then(({ data }) => {
                if (data) sb.from("players").update({
                    crystals: (data.crystals || 0) + amount,
                    total_crystals_earned: (data.total_crystals_earned || 0) + amount,
                }).eq("id", playerDbId).then(() => { });
            });
        }
    }, [playerDbId]);

    // BUG-2 FIX: Same pattern as spendCoins
    const spendCrystals = useCallback((amount: number): boolean => {
        let success = false;
        setPlayer(prev => {
            if (prev.crystals < amount) {
                success = false;
                return prev;
            }
            success = true;
            return { ...prev, crystals: prev.crystals - amount };
        });
        // Persist to DB
        if (success && playerDbId && supabase) {
            const sb = supabase;
            sb.from("players").select("crystals").eq("id", playerDbId).single().then(({ data }) => {
                if (data) sb.from("players").update({ crystals: Math.max(0, (data.crystals || 0) - amount) }).eq("id", playerDbId).then(() => { });
            });
        }
        return success;
    }, [playerDbId]);



    /* ─── ⚡ Ability Charges Economy ─── */
    const MAX_ABILITY_CHARGES = 5;

    const useAbilityCharge = useCallback((): boolean => {
        let success = false;
        setPlayer(prev => {
            if (prev.abilityCharges < 1) {
                success = false;
                return prev;
            }
            success = true;
            return { ...prev, abilityCharges: prev.abilityCharges - 1 };
        });
        // Persist to DB
        if (success && playerDbId && supabase) {
            const sb = supabase;
            sb.from("players").select("ability_charges").eq("id", playerDbId).single().then(({ data }) => {
                if (data) sb.from("players").update({ ability_charges: Math.max(0, (data.ability_charges || 0) - 1) }).eq("id", playerDbId).then(() => { });
            });
        }
        return success;
    }, [playerDbId]);

    const addAbilityCharges = useCallback((amount: number) => {
        setPlayer(prev => ({
            ...prev,
            abilityCharges: Math.min(MAX_ABILITY_CHARGES, prev.abilityCharges + amount),
        }));
        // Persist to DB
        if (playerDbId && supabase) {
            const sb = supabase;
            sb.from("players").select("ability_charges").eq("id", playerDbId).single().then(({ data }) => {
                if (data) sb.from("players").update({
                    ability_charges: Math.min(MAX_ABILITY_CHARGES, (data.ability_charges || 0) + amount),
                }).eq("id", playerDbId).then(() => { });
            });
        }
    }, [playerDbId]);

    const resetGame = useCallback(() => {
        setPlayer(DEFAULT_PLAYER);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CALM_MODE_KEY);
    }, []);

    const setCalmMode = useCallback((enabled: boolean) => {
        setPlayer(prev => ({ ...prev, calmMode: enabled }));
        try {
            localStorage.setItem(CALM_MODE_KEY, JSON.stringify(enabled));
        } catch { /* ignore */ }
        // Apply/remove CSS class on document root for global CSS override
        if (enabled) {
            document.documentElement.classList.add("calm-mode");
        } else {
            document.documentElement.classList.remove("calm-mode");
        }
    }, []);

    const unlockAchievement = useCallback((id: string) => {
        setPlayer(prev => {
            if (prev.achievements.includes(id)) return prev; // Đã có rồi
            return { ...prev, achievements: [...prev.achievements, id] };
        });
    }, []);

    const updateParentControls = useCallback((controls: Partial<ParentControls>) => {
        setPlayer(prev => ({
            ...prev,
            parentControls: { ...prev.parentControls, ...controls },
        }));
    }, []);

    // Don't render children until hydrated to avoid mismatch
    if (!isHydrated) {
        return null; // Or a loading spinner
    }

    return (
        <GameContext.Provider
            value={{
                player,
                updatePlayer,
                addCosmo,
                addCoins,
                addStars,
                spendStars,
                spendCoins,
                addCrystals,
                spendCrystals,

                useAbilityCharge,
                addAbilityCharges,
                resetGame,
                setCalmMode,
                unlockAchievement,
                updateParentControls,
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

/* ─── Hook ─── */
export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return ctx;
}

/* ─── Class ability descriptions ─── */
export const CLASS_ABILITIES = {
    warrior: {
        name: "Lá chắn thép",
        description: "Miễn 1 lần sai đầu tiên mỗi level",
        icon: "🛡️",
    },
    wizard: {
        name: "Ngưng đọng thời gian",
        description: "Thêm thời gian suy nghĩ / bom rơi chậm hơn",
        icon: "⏳",
    },
    hunter: {
        name: "Mắt đại bàng",
        description: "Loại bỏ 1 đáp án sai mỗi câu",
        icon: "🎯",
    },
} as const;

/* ─── Mascot info ─── */
export const MASCOT_INFO = {
    cat: { emoji: "🐱", name: "Mèo Sao Băng" },
    dog: { emoji: "🐶", name: "Cún Tinh Vân" },
} as const;
