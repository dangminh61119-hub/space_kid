"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { supabase, isMockMode } from "./supabase";

/* ─── Types ─── */
export interface PlanetProgress {
    completedLevels: number;
    totalLevels: number;
    lastPlayedAt?: string;
}

export interface PlayerData {
    name: string;
    mascot: "cat" | "dog" | null;
    playerClass: "warrior" | "wizard" | "hunter" | null;
    grade: number;
    level: number;
    xp: number;
    xpToNext: number;
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
    planetsProgress: Record<string, PlanetProgress>;
}

interface GameContextType {
    player: PlayerData;
    updatePlayer: (updates: Partial<PlayerData>) => void;
    addXP: (amount: number) => void;
    updatePlanetProgress: (planetId: string, completedLevels: number, totalLevels: number) => void;
    useClassAbility: () => boolean;
    classAbilityAvailable: boolean;
    resetClassAbility: () => void;
    resetGame: () => void;
}

/* ─── Defaults ─── */
const DEFAULT_PLAYER: PlayerData = {
    name: "Tân Binh",
    mascot: null,
    playerClass: null,
    grade: 3,
    level: 1,
    xp: 0,
    xpToNext: 500,
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
    planetsProgress: {
        "ha-long": { completedLevels: 0, totalLevels: 20 },
        "hue": { completedLevels: 0, totalLevels: 25 },
        "giong": { completedLevels: 0, totalLevels: 20 },
        "phong-nha": { completedLevels: 0, totalLevels: 18 },
        "hoi-an": { completedLevels: 0, totalLevels: 15 },
        "sapa": { completedLevels: 0, totalLevels: 22 },
        "hanoi": { completedLevels: 0, totalLevels: 20 },
        "mekong": { completedLevels: 0, totalLevels: 18 },
    },
};

const STORAGE_KEY = "cosmomosaic_player";
const XP_PER_LEVEL = 500;

/* ─── Context ─── */
const GameContext = createContext<GameContextType | null>(null);

/* ─── Helper: Calculate level from XP ─── */
function calculateLevel(xp: number): { level: number; xpToNext: number } {
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const xpToNext = level * XP_PER_LEVEL;
    return { level, xpToNext };
}

/* ─── Provider ─── */
export function GameProvider({ children }: { children: ReactNode }) {
    const [player, setPlayer] = useState<PlayerData>(DEFAULT_PLAYER);
    const [classAbilityAvailable, setClassAbilityAvailable] = useState(true);
    const [isHydrated, setIsHydrated] = useState(false);

    const { playerDbId } = useAuth(); // NEW: Get playerDbId from AuthContext

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
            } catch {
                // ignore parse errors
            }

            // Step 2: Fetch remote data if authenticated
            if (!isMockMode && supabase && playerDbId) {
                try {
                    // Fetch player details (level, xp, etc)
                    const { data: remotePlayer, error: pError } = await supabase
                        .from("players")
                        .select("xp, grade, name, mascot, player_class, streak, onboarding_complete, onboarding_quiz_score, survey_completed, estimated_grade, profile_completed")
                        .eq("id", playerDbId)
                        .single();

                    let remoteProgress: Record<string, PlanetProgress> | undefined = undefined;

                    // Fetch planet progress
                    const { data: progressData, error: progError } = await supabase
                        .from("planet_progress")
                        .select("planet_id, completed_levels, last_played_at")
                        .eq("player_id", playerDbId);

                    if (!progError && progressData && progressData.length > 0) {
                        remoteProgress = {};
                        progressData.forEach(p => {
                            remoteProgress![p.planet_id] = {
                                completedLevels: p.completed_levels,
                                // fallback totalLevels as the DB doesn't store this directly
                                totalLevels: localData.planetsProgress?.[p.planet_id]?.totalLevels || DEFAULT_PLAYER.planetsProgress[p.planet_id]?.totalLevels || 20,
                                lastPlayedAt: p.last_played_at
                            };
                        });
                    }

                    if (isMounted) {
                        setPlayer(prev => {
                            const updated = { ...prev };

                            // Merge player stats from DB 
                            if (!pError && remotePlayer) {
                                // Important: Also recalculate level based on valid remote XP
                                const actualXP = typeof remotePlayer.xp === 'number' ? remotePlayer.xp : prev.xp;
                                const { level, xpToNext } = calculateLevel(actualXP);

                                Object.assign(updated, {
                                    xp: actualXP,
                                    level,
                                    xpToNext,
                                    // only override if remote has data
                                    ...(remotePlayer.name ? { name: remotePlayer.name } : {}),
                                    ...(remotePlayer.grade ? { grade: remotePlayer.grade } : {}),
                                    ...(remotePlayer.mascot ? { mascot: remotePlayer.mascot } : {}),
                                    ...(remotePlayer.player_class ? { playerClass: remotePlayer.player_class } : {}),
                                    ...(remotePlayer.streak !== undefined ? { streak: remotePlayer.streak } : {}),
                                });
                            }

                            // Merge planet progress from DB (overwriting local progress per planet if remote exists)
                            if (remoteProgress) {
                                updated.planetsProgress = { ...updated.planetsProgress };
                                for (const planetId in remoteProgress) {
                                    const remoteLevel = remoteProgress[planetId].completedLevels;
                                    const localLevel = updated.planetsProgress[planetId]?.completedLevels || 0;

                                    // Normally we take remote, but for safety in edge cases, take max.
                                    if (remoteLevel >= localLevel) {
                                        updated.planetsProgress[planetId] = {
                                            ...updated.planetsProgress[planetId],
                                            ...remoteProgress[planetId]
                                        };
                                    }
                                }
                            }

                            return updated;
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
            if ('xp' in updates) dbUpdates.xp = updates.xp;
            if ('streak' in updates) dbUpdates.streak = updates.streak;
            if ('mascot' in updates) dbUpdates.mascot = updates.mascot;
            if ('playerClass' in updates) dbUpdates.player_class = updates.playerClass;

            if (Object.keys(dbUpdates).length > 0) {
                supabase.from("players").update(dbUpdates).eq("id", playerDbId).then(({ error }) => {
                    if (error) console.error("[GameContext] updatePlayer DB error:", error);
                });
            }
        }
    }, [playerDbId]);

    const addXP = useCallback((amount: number) => {
        setPlayer(prev => {
            const newXp = prev.xp + amount;
            const { level, xpToNext } = calculateLevel(newXp);

            // Background sync
            if (!isMockMode && supabase && playerDbId) {
                supabase.from("players").update({ xp: newXp }).eq("id", playerDbId).then(({ error }) => {
                    if (error) console.error("[GameContext] addXP DB error:", error);
                });
            }

            return { ...prev, xp: newXp, level, xpToNext };
        });
    }, [playerDbId]);

    const updatePlanetProgress = useCallback((planetId: string, completedLevels: number, totalLevels: number) => {
        setPlayer(prev => {
            const now = new Date().toISOString();

            // Background sync
            if (!isMockMode && supabase && playerDbId) {
                supabase.from("planet_progress").upsert({
                    player_id: playerDbId,
                    planet_id: planetId,
                    completed_levels: completedLevels,
                    last_played_at: now
                }, { onConflict: 'player_id,planet_id' }).then(({ error }) => {
                    if (error) console.error("[GameContext] updatePlanetProgress DB error:", error);
                });
            }

            return {
                ...prev,
                planetsProgress: {
                    ...prev.planetsProgress,
                    [planetId]: {
                        completedLevels,
                        totalLevels,
                        lastPlayedAt: now,
                    },
                },
            };
        });
    }, [playerDbId]);

    const useClassAbility = useCallback(() => {
        if (!classAbilityAvailable) return false;
        setClassAbilityAvailable(false);
        return true;
    }, [classAbilityAvailable]);

    const resetClassAbility = useCallback(() => {
        setClassAbilityAvailable(true);
    }, []);

    const resetGame = useCallback(() => {
        setPlayer(DEFAULT_PLAYER);
        setClassAbilityAvailable(true);
        localStorage.removeItem(STORAGE_KEY);
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
                addXP,
                updatePlanetProgress,
                useClassAbility,
                classAbilityAvailable,
                resetClassAbility,
                resetGame,
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
