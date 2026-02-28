/**
 * db.ts – CosmoMosaic Data Access Layer
 *
 * All game data reads go through this file.
 * When NEXT_PUBLIC_SUPABASE_URL is set → reads from Supabase.
 * When not set (isMockMode) → falls back to mock-data.ts.
 *
 * This ensures the app always works, even without a DB connection.
 */

import { supabase, isMockMode, type DBLevel, type DBQuestion, type DBPlanet } from "./supabase";
import {
    mockPlanets,
    mockGameLevels,
    mockMathLevels,
    mockHaLongLevels,
    mockPhongNhaLevels,
    mockHoiAnLevels,
    mockSapaLevels,
    mockHanoiLevels,
    mockMekongLevels,
} from "./mock-data";

/* ─── Shared Types (used by game components) ─── */

export interface GameLevel {
    id?: string;
    level: number;
    planet: string;
    subject: string;
    title: string;
    speed: number;
    questions: WordQuestion[];
}

export interface WordQuestion {
    id?: string;
    question: string;
    correctWord: string;
    wrongWords: string[];
}

export interface MathLevel {
    id?: string;
    level: number;
    planet: string;
    subject: string;
    title: string;
    timePerQuestion: number;
    questions: MathQuestion[];
}

export interface MathQuestion {
    id?: string;
    equation: string;
    answer: number;
    options: number[];
}

export interface Planet {
    id: string;
    name: string;
    emoji: string;
    subjects: string[];
    gameType: "shooter" | "math" | "star-hunter";
    color1: string;
    color2: string;
    ringColor: string;
    description: string;
    totalLevels: number;
}

/* ─── Grade/Difficulty mapping ─── */

function difficultyForGrade(grade: number): ("easy" | "medium" | "hard")[] {
    if (grade <= 2) return ["easy", "medium"];
    if (grade <= 3) return ["easy", "medium"];
    if (grade <= 4) return ["medium", "hard"];
    return ["medium", "hard"];
}

/* ─── Planet list ──────────────────────────────────────── */

export async function getPlanetList(): Promise<Planet[]> {
    if (isMockMode || !supabase) {
        return mockPlanets.map((p) => ({
            id: p.id,
            name: p.name,
            emoji: p.emoji,
            subjects: p.subjects,
            gameType: (["giong", "sapa"].includes(p.id) ? "math" : ["hanoi", "mekong"].includes(p.id) ? "star-hunter" : "shooter") as "shooter" | "math" | "star-hunter",
            color1: p.color1,
            color2: p.color2,
            ringColor: p.ringColor,
            description: p.description,
            totalLevels: p.totalLevels,
        }));
    }

    const { data, error } = await supabase
        .from("planets")
        .select("*")
        .order("order_index");

    if (error || !data) {
        console.error("[db] getPlanetList error, falling back to mock:", error);
        return mockPlanets.map((p) => ({
            id: p.id,
            name: p.name,
            emoji: p.emoji,
            subjects: p.subjects,
            gameType: (["giong", "sapa"].includes(p.id) ? "math" : ["hanoi", "mekong"].includes(p.id) ? "star-hunter" : "shooter") as "shooter" | "math" | "star-hunter",
            color1: p.color1,
            color2: p.color2,
            ringColor: p.ringColor,
            description: p.description,
            totalLevels: p.totalLevels,
        }));
    }

    return (data as DBPlanet[]).map((p) => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        subjects: p.subjects,
        gameType: p.game_type,
        color1: p.color1,
        color2: p.color2,
        ringColor: p.ring_color,
        description: p.description,
        totalLevels: p.total_levels,
    }));
}

/* ─── SpaceShooter levels with grade filtering ─────────── */

export async function getShooterLevels(
    planetId: string,
    grade: number = 3
): Promise<GameLevel[]> {
    if (isMockMode || !supabase) {
        return getMockShooterLevels(planetId);
    }

    const allowedDifficulties = difficultyForGrade(grade);

    // Fetch levels for this planet that fit the grade range
    const { data: levelsData, error: levelsError } = await supabase
        .from("levels")
        .select("*")
        .eq("planet_id", planetId)
        .lte("grade_min", grade + 1)   // Slightly above grade is OK
        .gte("grade_max", grade - 1)   // Slightly below grade is OK
        .order("order_index");

    if (levelsError || !levelsData || levelsData.length === 0) {
        console.error("[db] getShooterLevels error:", levelsError);
        return getMockShooterLevels(planetId);
    }

    const levels: GameLevel[] = [];

    for (const level of levelsData as DBLevel[]) {
        const { data: questionsData, error: questionsError } = await supabase
            .from("questions")
            .select("*")
            .eq("level_id", level.id)
            .eq("type", "word")
            .in("difficulty", allowedDifficulties)
            .order("order_index");

        if (questionsError || !questionsData) continue;

        const questions: WordQuestion[] = (questionsData as DBQuestion[]).map((q) => ({
            id: q.id,
            question: q.question_text ?? "",
            correctWord: q.correct_word ?? "",
            wrongWords: q.wrong_words ?? [],
        }));

        if (questions.length === 0) continue;

        levels.push({
            id: level.id,
            level: level.level_number,
            planet: "", // will be filled by planet name lookup if needed
            subject: level.subject,
            title: level.title,
            speed: level.speed,
            questions,
        });
    }

    // Fallback to mock if DB returned empty
    if (levels.length === 0) return getMockShooterLevels(planetId);
    return levels;
}

/* ─── MathForge levels with grade filtering ────────────── */

export async function getMathLevels(
    planetId: string,
    grade: number = 3
): Promise<MathLevel[]> {
    if (isMockMode || !supabase) {
        return getMockMathLevels(planetId);
    }

    const allowedDifficulties = difficultyForGrade(grade);

    const { data: levelsData, error: levelsError } = await supabase
        .from("levels")
        .select("*")
        .eq("planet_id", planetId)
        .lte("grade_min", grade + 1)
        .gte("grade_max", grade - 1)
        .order("order_index");

    if (levelsError || !levelsData || levelsData.length === 0) {
        console.error("[db] getMathLevels error:", levelsError);
        return getMockMathLevels(planetId);
    }

    const levels: MathLevel[] = [];

    for (const level of levelsData as DBLevel[]) {
        const { data: questionsData, error: questionsError } = await supabase
            .from("questions")
            .select("*")
            .eq("level_id", level.id)
            .eq("type", "math")
            .in("difficulty", allowedDifficulties)
            .order("order_index");

        if (questionsError || !questionsData) continue;

        const questions: MathQuestion[] = (questionsData as DBQuestion[]).map((q) => ({
            id: q.id,
            equation: q.equation ?? "",
            answer: q.answer ?? 0,
            options: q.options ?? [],
        }));

        if (questions.length === 0) continue;

        levels.push({
            id: level.id,
            level: level.level_number,
            planet: "",
            subject: level.subject,
            title: level.title,
            timePerQuestion: level.time_per_q,
            questions,
        });
    }

    if (levels.length === 0) return getMockMathLevels(planetId);
    return levels;
}

/* ─── Mock fallbacks ───────────────────────────────────── */

const MOCK_SHOOTER_MAP: Record<string, GameLevel[]> = {
    "hue": mockGameLevels.filter((l) => l.planet === "Cố đô Huế"),
    "ha-long": mockHaLongLevels,
    "phong-nha": mockPhongNhaLevels,
    "hoi-an": mockHoiAnLevels,
};

const MOCK_MATH_MAP: Record<string, MathLevel[]> = {
    "giong": mockMathLevels,
    "sapa": mockSapaLevels,
};

const MOCK_STAR_MAP: Record<string, GameLevel[]> = {
    "hanoi": mockHanoiLevels as GameLevel[],
    "mekong": mockMekongLevels as GameLevel[],
};

function getMockShooterLevels(planetId: string): GameLevel[] {
    const levels = MOCK_SHOOTER_MAP[planetId] ?? mockGameLevels;
    // Normalize to GameLevel shape
    return levels.map((l) => ({
        ...l,
        questions: l.questions.map((q) => ({
            question: q.question,
            correctWord: q.correctWord,
            wrongWords: q.wrongWords,
        })),
    }));
}

function getMockMathLevels(planetId: string): MathLevel[] {
    const levels = MOCK_MATH_MAP[planetId] ?? mockMathLevels;
    return levels.map((l) => ({
        ...l,
        questions: l.questions.map((q) => ({
            equation: q.equation,
            answer: q.answer,
            options: q.options,
        })),
    }));
}

/* ─── Star Hunter levels (same word query as shooter) ─── */

export async function getStarHunterLevels(
    planetId: string,
    grade: number = 3
): Promise<GameLevel[]> {
    if (isMockMode || !supabase) {
        return getMockStarLevels(planetId);
    }
    // Star Hunter uses the same 'word' question type as SpaceShooter
    const allowedDifficulties = difficultyForGrade(grade);
    const { data: levelsData, error: levelsError } = await supabase
        .from("levels")
        .select("*")
        .eq("planet_id", planetId)
        .lte("grade_min", grade + 1)
        .gte("grade_max", grade - 1)
        .order("order_index");

    if (levelsError || !levelsData || levelsData.length === 0) {
        console.error("[db] getStarHunterLevels error:", levelsError);
        return getMockStarLevels(planetId);
    }

    const levels: GameLevel[] = [];
    for (const level of levelsData as DBLevel[]) {
        const { data: questionsData, error: questionsError } = await supabase
            .from("questions")
            .select("*")
            .eq("level_id", level.id)
            .eq("type", "word")
            .in("difficulty", allowedDifficulties)
            .order("order_index");

        if (questionsError || !questionsData) continue;
        const questions: WordQuestion[] = (questionsData as DBQuestion[]).map((q) => ({
            id: q.id,
            question: q.question_text ?? "",
            correctWord: q.correct_word ?? "",
            wrongWords: q.wrong_words ?? [],
        }));
        if (questions.length === 0) continue;
        levels.push({ id: level.id, level: level.level_number, planet: "", subject: level.subject, title: level.title, speed: level.speed, questions });
    }
    if (levels.length === 0) return getMockStarLevels(planetId);
    return levels;
}

function getMockStarLevels(planetId: string): GameLevel[] {
    const levels = MOCK_STAR_MAP[planetId] ?? mockHanoiLevels;
    return levels.map((l) => ({
        ...l,
        questions: l.questions.map((q) => ({
            question: q.question,
            correctWord: q.correctWord,
            wrongWords: q.wrongWords,
        })),
    }));
}

/* ─── Analytics helpers (fire-and-forget) ─────────────── */

export async function recordWrongAnswer(questionId: string): Promise<void> {
    if (isMockMode || !supabase || !questionId) return;
    await supabase.rpc("record_wrong_answer", { q_id: questionId });
}
