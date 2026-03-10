"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase, isMockMode } from "./supabase";
import type { User, Session } from "@supabase/supabase-js";

/* ─── Types ─── */
export type UserRole = 'parent' | 'child' | 'admin' | null;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    role: UserRole;
    needsRoleSelect: boolean;        // True when OAuth user has no player record yet
    linkCode: string | null;         // Child's link code (6 chars)
    linkedChildren: string[];        // Parent's linked child IDs
    signUp: (email: string, password: string, name: string, grade: number, role?: 'parent' | 'child') => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signInWithGoogle: () => Promise<{ error: string | null }>;
    signInWithFacebook: () => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    linkChild: (code: string) => Promise<{ error: string | null; childName?: string }>;
    regenerateLinkCode: () => Promise<string | null>;
    createPlayerForOAuth: (playerRole: 'parent' | 'child') => Promise<string | null>;
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
    role: 'parent' | 'child';
    linkCode: string | null;
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
    const [role, setRole] = useState<UserRole>(null);
    const [linkCode, setLinkCode] = useState<string | null>(null);
    const [linkedChildren, setLinkedChildren] = useState<string[]>([]);
    const [needsRoleSelect, setNeedsRoleSelect] = useState(false);
    const [profileCompleted, setProfileCompleted] = useState(false);
    const [surveyCompleted, setSurveyCompleted] = useState(false);
    const [onboardingComplete, setOnboardingComplete] = useState(false);

    // Flag to prevent loadPlayerData from auto-creating during signUp
    const isSigningUp = useRef(false);

    // Load linked children for parent accounts
    const loadLinkedChildren = useCallback(async (parentPlayerId: string) => {
        if (!supabase) return;
        try {
            const { data } = await supabase
                .from("parent_child_link")
                .select("child_id")
                .eq("parent_id", parentPlayerId);
            if (data) {
                setLinkedChildren(data.map((d: { child_id: string }) => d.child_id));
            }
        } catch (err) {
            console.error("[auth] loadLinkedChildren error:", err);
        }
    }, []);

    // Load player data from DB — auto-creates record if missing
    const loadPlayerData = useCallback(async (authId: string, email: string) => {
        if (!supabase) return;
        try {
            // Try to find existing player
            const { data, error } = await supabase
                .from("players")
                .select("id, role, link_code, profile_completed, survey_completed, onboarding_complete")
                .eq("auth_id", authId)
                .single();

            if (!error && data) {
                console.log("[auth] loadPlayerData: found existing player", data.id, "role:", data.role);
                setPlayerDbId(data.id);
                setRole(data.role as UserRole);
                setLinkCode(data.link_code || null);
                setProfileCompleted(data.profile_completed);
                setSurveyCompleted(data.survey_completed);
                setOnboardingComplete(data.onboarding_complete);
                // Load linked children if parent
                if (data.role === 'parent') {
                    await loadLinkedChildren(data.id);
                }
            } else {
                // No player record found
                if (isSigningUp.current) {
                    // signUp is in progress — let signUp handle player creation
                    console.log("[auth] loadPlayerData: skipping auto-create (signUp in progress)");
                } else {
                    // OAuth or returning user with no player → mark for role selection
                    console.log("[auth] loadPlayerData: no player found, needs role selection");
                    setNeedsRoleSelect(true);
                }
            }
        } catch (err) {
            console.error("[auth] loadPlayerData exception:", err);
        }
        setLoading(false);
    }, [loadLinkedChildren]);

    // Initialize auth state
    useEffect(() => {
        if (isMockMode || !supabase) {
            // Mock mode: check localStorage
            try {
                const saved = localStorage.getItem(MOCK_AUTH_KEY);
                if (saved) {
                    const data = JSON.parse(saved) as MockAuthData;
                    // eslint-disable-next-line react-hooks/set-state-in-effect
                    setUser({ id: "mock-user-id", email: data.email } as User);
                    setRole(data.role || 'child');
                    setLinkCode(data.linkCode || null);
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
                loadPlayerData(s.user.id, s.user.email ?? "");
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            setUser(s?.user ?? null);
            if (s?.user) {
                loadPlayerData(s.user.id, s.user.email ?? "");
            } else {
                setPlayerDbId(null);
                setSurveyCompleted(false);
                setOnboardingComplete(false);
                setProfileCompleted(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [loadPlayerData]); // loadPlayerData is stable (useCallback with stable deps)

    // Create player record in DB
    const createPlayerRecord = useCallback(async (authId: string, name: string, grade: number, email: string, playerRole: 'parent' | 'child' = 'child') => {
        if (!supabase) {
            console.error("[auth] createPlayerRecord: supabase client is null");
            return null;
        }
        console.log("[auth] createPlayerRecord called:", { authId, name, grade, email, playerRole });
        const { data, error } = await supabase
            .from("players")
            .insert({ auth_id: authId, name, grade, email, role: playerRole })
            .select("id, link_code")
            .single();

        if (error) {
            console.error("[auth] createPlayerRecord error:", error);
            return null;
        }
        console.log("[auth] createPlayerRecord success:", data);
        if (data) {
            setRole(playerRole);
            setLinkCode(data.link_code || null);
        }
        return data?.id ?? null;
    }, []);

    /* ─── Auth methods ─── */

    const signUp = useCallback(async (email: string, password: string, name: string, grade: number, userRole: 'parent' | 'child' = 'child') => {
        if (isMockMode || !supabase) {
            // Mock mode
            const mockCode = userRole === 'child' ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;
            const mockData: MockAuthData = { email, name, grade, role: userRole, linkCode: mockCode, profileCompleted: false, surveyCompleted: false, onboardingComplete: false };
            localStorage.setItem(MOCK_AUTH_KEY, JSON.stringify(mockData));
            setUser({ id: "mock-user-id", email } as User);
            setPlayerDbId("mock-player-id");
            setRole(userRole);
            setLinkCode(mockCode);
            setProfileCompleted(false);
            setSurveyCompleted(false);
            setOnboardingComplete(false);
            return { error: null };
        }

        // Set flag BEFORE auth to prevent loadPlayerData from auto-creating
        isSigningUp.current = true;
        console.log("[auth] signUp called with email:", email, "role:", userRole);

        const { data, error } = await supabase.auth.signUp({ email, password });
        console.log("[auth] signUp result:", { user: data?.user?.id, session: !!data?.session, error });

        if (error) {
            isSigningUp.current = false;
            return { error: error.message };
        }

        if (data.user) {
            console.log("[auth] User created, creating player record...");
            const playerId = await createPlayerRecord(data.user.id, name, grade, email, userRole);
            console.log("[auth] Player record created with id:", playerId);
            setPlayerDbId(playerId);
            setNeedsRoleSelect(false);
            setProfileCompleted(userRole === 'parent'); // Parents skip profile
            setSurveyCompleted(userRole === 'parent');   // Parents skip survey
            setOnboardingComplete(userRole === 'parent'); // Parents skip onboarding
        } else {
            console.warn("[auth] signUp returned no user object");
        }

        isSigningUp.current = false;
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

    // Rate limit tracking for link attempts
    const linkAttempts = useRef<{ count: number; firstAttemptAt: number }>({ count: 0, firstAttemptAt: 0 });
    const MAX_LINK_ATTEMPTS = 5;
    const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

    // Link a child account to this parent using the child's link code
    // Security: one-time code + max 2 parents + rate limit
    const linkChild = useCallback(async (code: string): Promise<{ error: string | null; childName?: string }> => {
        if (isMockMode || !supabase) {
            const mockLinks = JSON.parse(localStorage.getItem('cosmomosaic_mock_links') || '[]');
            mockLinks.push({ code, childId: 'mock-child-' + code });
            localStorage.setItem('cosmomosaic_mock_links', JSON.stringify(mockLinks));
            setLinkedChildren(prev => [...prev, 'mock-child-' + code]);
            return { error: null, childName: 'Bé (mock)' };
        }

        if (!playerDbId) return { error: 'Chưa đăng nhập' };

        // ── Rate limit check ──
        const now = Date.now();
        if (now - linkAttempts.current.firstAttemptAt > RATE_LIMIT_WINDOW) {
            // Reset window
            linkAttempts.current = { count: 0, firstAttemptAt: now };
        }
        if (linkAttempts.current.count >= MAX_LINK_ATTEMPTS) {
            const minutesLeft = Math.ceil((RATE_LIMIT_WINDOW - (now - linkAttempts.current.firstAttemptAt)) / 60000);
            return { error: `Bạn đã nhập sai quá ${MAX_LINK_ATTEMPTS} lần. Vui lòng thử lại sau ${minutesLeft} phút.` };
        }

        // ── Find child by link_code ──
        const { data: child, error: findErr } = await supabase
            .from('players')
            .select('id, name')
            .eq('link_code', code.toUpperCase().trim())
            .eq('role', 'child')
            .single();

        if (findErr || !child) {
            linkAttempts.current.count += 1;
            const remaining = MAX_LINK_ATTEMPTS - linkAttempts.current.count;
            return {
                error: remaining > 0
                    ? `Không tìm thấy mã liên kết. Còn ${remaining} lần thử.`
                    : `Bạn đã nhập sai quá ${MAX_LINK_ATTEMPTS} lần. Vui lòng thử lại sau 1 giờ.`
            };
        }

        // ── Check max 2 parents per child ──
        const { data: existingLinks, error: countErr } = await supabase
            .from('parent_child_link')
            .select('id, parent_id')
            .eq('child_id', child.id);

        if (!countErr && existingLinks) {
            // Already linked to this parent?
            if (existingLinks.some((l: { parent_id: string }) => l.parent_id === playerDbId)) {
                return { error: `Bé ${child.name} đã được liên kết trước đó!` };
            }
            // Max 2 parents
            if (existingLinks.length >= 2) {
                return { error: `Bé ${child.name} đã có 2 phụ huynh liên kết. Không thể thêm nữa.` };
            }
        }

        // ── Create link ──
        const { error: linkErr } = await supabase
            .from('parent_child_link')
            .insert({ parent_id: playerDbId, child_id: child.id });

        if (linkErr) {
            console.error('[auth] linkChild error:', linkErr);
            return { error: 'Không thể liên kết. Vui lòng thử lại!' };
        }

        // ── Invalidate link code (one-time use) ──
        await supabase
            .from('players')
            .update({ link_code: null })
            .eq('id', child.id);

        setLinkedChildren(prev => [...prev, child.id]);
        // Reset rate limit on success
        linkAttempts.current = { count: 0, firstAttemptAt: 0 };
        return { error: null, childName: child.name };
    }, [playerDbId]);

    // Regenerate link code for child accounts (after it was invalidated)
    const regenerateLinkCode = useCallback(async (): Promise<string | null> => {
        if (isMockMode || !supabase || !playerDbId) return null;

        // Generate new 6-char code via SQL function
        const { data, error } = await supabase.rpc('regenerate_link_code', { player_id: playerDbId });
        if (error) {
            console.error('[auth] regenerateLinkCode error:', error);
            return null;
        }
        const newCode = data as string;
        setLinkCode(newCode);
        return newCode;
    }, [playerDbId]);

    const signOut = useCallback(async () => {
        if (isMockMode || !supabase) {
            localStorage.removeItem(MOCK_AUTH_KEY);
            setUser(null);
            setPlayerDbId(null);
            setRole(null);
            setLinkCode(null);
            setLinkedChildren([]);
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

    // Create player for OAuth users after they select a role
    const createPlayerForOAuth = useCallback(async (playerRole: 'parent' | 'child') => {
        if (!user || !supabase) return null;
        const playerId = await createPlayerRecord(user.id, user.email?.split('@')[0] || 'Tân Binh', 3, user.email || '', playerRole);
        if (playerId) {
            setPlayerDbId(playerId);
            setNeedsRoleSelect(false);
            setProfileCompleted(playerRole === 'parent');
            setSurveyCompleted(playerRole === 'parent');
            setOnboardingComplete(playerRole === 'parent');
        }
        return playerId;
    }, [user, createPlayerRecord]);

    return (
        <AuthContext.Provider value={{
            user, session, loading, role, needsRoleSelect, linkCode, linkedChildren,
            signUp, signIn, signInWithGoogle, signInWithFacebook, signOut, linkChild,
            regenerateLinkCode, createPlayerForOAuth,
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

    // Save ALL profile fields to the players table
    const { error } = await supabase
        .from("players")
        .update({
            name: data.childName,
            grade: data.grade,
            birthday: data.birthday || null,
            school: data.school || null,
            favorite_subjects: data.favoriteSubjects || null,
            parent_email: data.parentEmail,
            parent_name: data.parentName || null,
            parent_phone: data.parentPhone || null,
            profile_completed: true,
        })
        .eq("id", playerDbId);

    if (error) {
        console.error("[auth] saveProfileData error:", error);
    }
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
