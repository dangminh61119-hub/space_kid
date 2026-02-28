"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

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
    planetsProgress: {
        "ha-long": { completedLevels: 0, totalLevels: 20 },
        "hue": { completedLevels: 0, totalLevels: 25 },
        "giong": { completedLevels: 0, totalLevels: 20 },
        "phong-nha": { completedLevels: 0, totalLevels: 18 },
        "hoi-an": { completedLevels: 0, totalLevels: 15 },
        "sapa": { completedLevels: 0, totalLevels: 22 },
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

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as Partial<PlayerData>;
                setPlayer(prev => ({ ...prev, ...parsed }));
            }
        } catch {
            // ignore parse errors
        }
        setIsHydrated(true);
    }, []);

    // Save to localStorage on change (only after hydration)
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
    }, []);

    const addXP = useCallback((amount: number) => {
        setPlayer(prev => {
            const newXp = prev.xp + amount;
            const { level, xpToNext } = calculateLevel(newXp);
            return { ...prev, xp: newXp, level, xpToNext };
        });
    }, []);

    const updatePlanetProgress = useCallback((planetId: string, completedLevels: number, totalLevels: number) => {
        setPlayer(prev => ({
            ...prev,
            planetsProgress: {
                ...prev.planetsProgress,
                [planetId]: {
                    completedLevels,
                    totalLevels,
                    lastPlayedAt: new Date().toISOString(),
                },
            },
        }));
    }, []);

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
        return null;
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
