"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// In dev/mock mode, we don't require Supabase credentials
export const isMockMode = !supabaseUrl || !supabaseAnonKey;

export const supabase =
    supabaseUrl && supabaseAnonKey
        ? createClient(supabaseUrl, supabaseAnonKey)
        : null;

/* ─── Database Types ─── */

export interface DBPlanet {
    id: string;
    name: string;
    emoji: string;
    subjects: string[];
    game_type: "shooter" | "math";
    color1: string;
    color2: string;
    ring_color: string;
    description: string;
    total_levels: number;
    order_index: number;
}

export interface DBLevel {
    id: string;
    planet_id: string;
    level_number: number;
    title: string;
    subject: string;
    grade_min: number;
    grade_max: number;
    speed: number;
    time_per_q: number;
    order_index: number;
}

export interface DBQuestion {
    id: string;
    level_id: string;
    planet_id: string;
    subject: string;
    grade: number;
    difficulty: "easy" | "medium" | "hard";
    type: "word" | "math";
    // SpaceShooter
    question_text: string | null;
    correct_word: string | null;
    wrong_words: string[] | null;
    // MathForge
    equation: string | null;
    answer: number | null;
    options: number[] | null;
    // Analytics
    times_shown: number;
    times_wrong: number;
    order_index: number;
}

export interface DBPlayer {
    id: string;
    auth_id: string | null;
    name: string;
    mascot: "cat" | "dog" | null;
    player_class: "warrior" | "wizard" | "hunter" | null;
    grade: number;
    xp: number;
    streak: number;
    onboarding_complete: boolean;
    onboarding_quiz_score: number;
}

export interface DBPlanetProgress {
    id: string;
    player_id: string;
    planet_id: string;
    completed_levels: number;
    last_played_at: string | null;
}
