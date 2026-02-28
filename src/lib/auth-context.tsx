"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, isMockMode } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

/* ─── Types ─── */
interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, name: string, grade: number) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signInWithGoogle: () => Promise<{ error: string | null }>;
    signInWithFacebook: () => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    playerDbId: string | null; // UUID from players table
    surveyCompleted: boolean;
    onboardingComplete: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/* ─── Mock auth for dev without Supabase ─── */
const MOCK_AUTH_KEY = "cosmomosaic_mock_auth";

interface MockAuthData {
    email: string;
    name: string;
    grade: number;
    surveyCompleted: boolean;
    onboardingComplete: boolean;
}

/* ─── Provider ─── */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [playerDbId, setPlayerDbId] = useState<string | null>(null);
    const [surveyCompleted, setSurveyCompleted] = useState(false);
    const [onboardingComplete, setOnboardingComplete] = useState(false);

    // Initialize auth state
    useEffect(() => {
        if (isMockMode || !supabase) {
            // Mock mode: check localStorage
            try {
                const saved = localStorage.getItem(MOCK_AUTH_KEY);
                if (saved) {
                    const data = JSON.parse(saved) as MockAuthData;
                    setUser({ id: "mock-user-id", email: data.email } as User);
                    setSurveyCompleted(data.surveyCompleted);
                    setOnboardingComplete(data.onboardingComplete);
                    setPlayerDbId("mock-player-id");
                }
            } catch { /* ignore */ }
            setLoading(false);
            return;
        }

        // Real Supabase: get initial session
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                loadPlayerData(s.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                loadPlayerData(s.user.id);
            } else {
                setPlayerDbId(null);
                setSurveyCompleted(false);
                setOnboardingComplete(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load player data from DB
    const loadPlayerData = useCallback(async (authId: string) => {
        if (!supabase) return;
        try {
            const { data, error } = await supabase
                .from("players")
                .select("id, survey_completed, onboarding_complete")
                .eq("auth_id", authId)
                .single();

            if (!error && data) {
                setPlayerDbId(data.id);
                setSurveyCompleted(data.survey_completed);
                setOnboardingComplete(data.onboarding_complete);
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    // Create player record in DB
    const createPlayerRecord = useCallback(async (authId: string, name: string, grade: number, email: string) => {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from("players")
            .insert({ auth_id: authId, name, grade, email })
            .select("id")
            .single();

        if (error) {
            console.error("[auth] createPlayerRecord error:", error);
            return null;
        }
        return data?.id ?? null;
    }, []);

    /* ─── Auth methods ─── */

    const signUp = useCallback(async (email: string, password: string, name: string, grade: number) => {
        if (isMockMode || !supabase) {
            // Mock mode
            const mockData: MockAuthData = { email, name, grade, surveyCompleted: false, onboardingComplete: false };
            localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(mockData));
            setUser({ id: "mock-user-id", email } as User);
            setPlayerDbId("mock-player-id");
            setSurveyCompleted(false);
            setOnboardingComplete(false);
            return { error: null };
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: error.message };
        if (data.user) {
            const playerId = await createPlayerRecord(data.user.id, name, grade, email);
            setPlayerDbId(playerId);
            setSurveyCompleted(false);
            setOnboardingComplete(false);
        }
        return { error: null };
    }, [createPlayerRecord]);

    const signIn = useCallback(async (email: string, password: string) => {
        if (isMockMode || !supabase) {
            const saved = localStorage.getItem(MOCK_AUTH_KEY);
            if (saved) {
                const data = JSON.parse(saved) as MockAuthData;
                if (data.email === email) {
                    setUser({ id: "mock-user-id", email } as User);
                    setSurveyCompleted(data.surveyCompleted);
                    setOnboardingComplete(data.onboardingComplete);
                    setPlayerDbId("mock-player-id");
                    return { error: null };
                }
            }
            return { error: "Email hoặc mật khẩu không đúng" };
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };
        return { error: null };
    }, []);

    const signInWithGoogle = useCallback(async () => {
        if (isMockMode || !supabase) {
            return { error: "OAuth không khả dụng ở chế độ mock" };
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) return { error: error.message };
        return { error: null };
    }, []);

    const signInWithFacebook = useCallback(async () => {
        if (isMockMode || !supabase) {
            return { error: "OAuth không khả dụng ở chế độ mock" };
        }
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "facebook",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) return { error: error.message };
        return { error: null };
    }, []);

    const signOut = useCallback(async () => {
        if (isMockMode || !supabase) {
            localStorage.removeItem(MOCK_AUTH_KEY);
            setUser(null);
            setPlayerDbId(null);
            setSurveyCompleted(false);
            setOnboardingComplete(false);
            return;
        }
        await supabase.auth.signOut();
    }, []);

    return (
        <AuthContext.Provider value={{
            user, session, loading,
            signUp, signIn, signInWithGoogle, signInWithFacebook, signOut,
            playerDbId, surveyCompleted, onboardingComplete,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

/* ─── Hook ─── */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return ctx;
}

/* ─── Helper: Update survey/onboarding status ─── */
export async function markSurveyCompleted(playerDbId: string, estimatedGrade: number) {
    if (isMockMode || !supabase) {
        // Mock mode
        try {
            const saved = localStorage.getItem(MOCK_AUTH_KEY);
            if (saved) {
                const data = JSON.parse(saved) as MockAuthData;
                data.surveyCompleted = true;
                data.grade = estimatedGrade;
                localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(data));
            }
        } catch { /* ignore */ }
        return;
    }

    await supabase
        .from("players")
        .update({ survey_completed: true, estimated_grade: estimatedGrade })
        .eq("id", playerDbId);
}

export async function markOnboardingCompleted(playerDbId: string) {
    if (isMockMode || !supabase) {
        try {
            const saved = localStorage.getItem(MOCK_AUTH_KEY);
            if (saved) {
                const data = JSON.parse(saved) as MockAuthData;
                data.onboardingComplete = true;
                localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(data));
            }
        } catch { /* ignore */ }
        return;
    }

    await supabase
        .from("players")
        .update({ onboarding_complete: true })
        .eq("id", playerDbId);
}
