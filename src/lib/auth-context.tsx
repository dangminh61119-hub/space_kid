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
    profileCompleted: boolean;
    surveyCompleted: boolean;
    onboardingComplete: boolean;
    setSurveyDone: () => void;
    setOnboardingDone: () => void;
    setProfileDone: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/* ─── Mock auth for dev without Supabase ─── */
const MOCK_AUTH_KEY = "cosmomosaic_mock_auth";

interface MockAuthData {
    email: string;
    name: string;
    grade: number;
    profileCompleted: boolean;
    surveyCompleted: boolean;
    onboardingComplete: boolean;
}

/* ─── Provider ─── */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [playerDbId, setPlayerDbId] = useState<string | null>(null);
    const [profileCompleted, setProfileCompleted] = useState(false);
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
                    setProfileCompleted(data.profileCompleted);
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
                setProfileCompleted(s.user.user_metadata?.profile_completed ?? false);
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
                setProfileCompleted(s.user.user_metadata?.profile_completed ?? false);
                loadPlayerData(s.user.id);
            } else {
                setPlayerDbId(null);
                setSurveyCompleted(false);
                setOnboardingComplete(false);
                setProfileCompleted(false);
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
            const mockData: MockAuthData = { email, name, grade, profileCompleted: false, surveyCompleted: false, onboardingComplete: false };
            localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(mockData));
            setUser({ id: "mock-user-id", email } as User);
            setPlayerDbId("mock-player-id");
            setProfileCompleted(false);
            setSurveyCompleted(false);
            setOnboardingComplete(false);
            return { error: null };
        }

        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) return { error: error.message };
        if (data.user) {
            const playerId = await createPlayerRecord(data.user.id, name, grade, email);
            setPlayerDbId(playerId);
            setProfileCompleted(false);
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
                    setProfileCompleted(data.profileCompleted);
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
            setProfileCompleted(false);
            setSurveyCompleted(false);
            setOnboardingComplete(false);
            return;
        }
        await supabase.auth.signOut();
    }, []);

    const setSurveyDone = useCallback(() => setSurveyCompleted(true), []);
    const setOnboardingDone = useCallback(() => setOnboardingComplete(true), []);
    const setProfileDone = useCallback(() => setProfileCompleted(true), []);

    return (
        <AuthContext.Provider value={{
            user, session, loading,
            signUp, signIn, signInWithGoogle, signInWithFacebook, signOut,
            playerDbId, profileCompleted, surveyCompleted, onboardingComplete,
            setSurveyDone, setOnboardingDone, setProfileDone,
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

/* ─── Helper: Profile data types ─── */
export interface ProfileFormData {
    childName: string;
    grade: number;
    birthday?: string;
    school?: string;
    favoriteSubjects?: string[];
    parentEmail: string;
    parentName?: string;
    parentPhone?: string;
}

/* ─── Helper: Save profile data & mark completed ─── */
export async function saveProfileData(playerDbId: string, data: ProfileFormData) {
    if (isMockMode || !supabase) {
        try {
            const saved = localStorage.getItem(MOCK_AUTH_KEY);
            if (saved) {
                const mock = JSON.parse(saved) as MockAuthData;
                mock.name = data.childName;
                mock.grade = data.grade;
                mock.profileCompleted = true;
                localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(mock));
            }
            // Also store profile details separately
            localStorage.setItem("cosmomosaic_profile", JSON.stringify(data));
        } catch { /* ignore */ }
        return;
    }

    // Update name and grade in players table
    await supabase
        .from("players")
        .update({
            name: data.childName,
            grade: data.grade,
        })
        .eq("id", playerDbId);

    // Update the rest in Auth user metadata
    await supabase.auth.updateUser({
        data: {
            birthday: data.birthday || null,
            school: data.school || null,
            favorite_subjects: data.favoriteSubjects || [],
            parent_email: data.parentEmail,
            parent_name: data.parentName || null,
            parent_phone: data.parentPhone || null,
            profile_completed: true,
        }
    });
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
