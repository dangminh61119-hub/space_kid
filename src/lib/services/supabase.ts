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
    grade_range?: number[];
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
    // Bloom Taxonomy (added in migration 006)
    bloom_level: number;            // 1–6 (Remember → Create)
    difficulty_score: number;       // 0.0–1.0 IRT score
    curriculum_ref: string;         // e.g. 'SGK-Toan-3'
    reviewed_by_teacher: boolean;   // Only show reviewed questions
}

export interface DBPlayer {
    id: string;
    auth_id: string | null;
    name: string;
    email: string | null;
    mascot: "cat" | "dog" | null;
    player_class: "warrior" | "wizard" | "hunter" | null;
    grade: number;
    xp: number;
    streak: number;
    onboarding_complete: boolean;
    onboarding_quiz_score: number;
    survey_completed: boolean;
    estimated_grade: number | null;
    // Profile questionnaire fields
    profile_completed: boolean;
    birthday: string | null;
    school: string | null;
    parent_email: string | null;
    parent_name: string | null;
    parent_phone: string | null;
    favorite_subjects: string[] | null;
}

export interface DBPlanetProgress {
    id: string;
    player_id: string;
    planet_id: string;
    completed_levels: number;
    last_played_at: string | null;
}

export interface DBSurveyQuestion {
    id: string;
    subject: string;
    grade: number;
    difficulty: "easy" | "medium" | "hard";
    question_text: string;
    options: string[];
    correct_answer: number;
}

export interface DBSurveyResponse {
    id: string;
    player_id: string;
    question_id: string;
    selected_answer: number;
    is_correct: boolean;
    answered_at: string;
}

export interface DBPlayerProficiency {
    id: string;
    player_id: string;
    subject: string;
    estimated_grade: number;
    mastery_score: number;
    total_correct: number;
    total_attempted: number;
    updated_at: string;
}

export interface DBAnswerHistory {
    id: string;
    player_id: string;
    question_id: string;
    is_correct: boolean;
    answered_at: string;
}

/* Mastery tracking (migration 006) */
export interface DBMastery {
    id: string;
    player_id: string;
    planet_id: string;
    subject: string;
    mastery_score: number;    // 0–100
    bloom_reached: number;    // 1–6
    correct_count: number;
    total_attempts: number;
    updated_at: string;
}
