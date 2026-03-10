"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StarField from "@/components/StarField";
import { useAuth } from "@/lib/services/auth-context";

/**
 * OAuth callback page – Supabase redirects here after Google/Facebook login.
 * Smart redirect: checks player record and routes accordingly.
 */
export default function AuthCallbackPage() {
    const router = useRouter();
    const { user, loading, role, needsRoleSelect, profileCompleted, onboardingComplete } = useAuth();
    const [waiting, setWaiting] = useState(true);

    useEffect(() => {
        if (loading) return;

        // Give auth state a moment to settle
        const timer = setTimeout(() => {
            setWaiting(false);

            if (!user) {
                // No user → something went wrong, go to login
                router.replace("/login");
                return;
            }

            if (needsRoleSelect || !role) {
                // New OAuth user, no player record → choose role
                router.replace("/role-select");
                return;
            }

            // Existing user → smart redirect based on role & status
            if (role === "parent") {
                router.replace("/dashboard");
            } else if (!profileCompleted) {
                router.replace("/profile");
            } else if (!onboardingComplete) {
                router.replace("/onboarding");
            } else {
                router.replace("/portal");
            }
        }, 1200);

        return () => clearTimeout(timer);
    }, [user, loading, role, needsRoleSelect, profileCompleted, onboardingComplete, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <StarField count={40} />
            <div className="relative z-10 text-center">
                <div className="text-5xl mb-4 animate-float">🚀</div>
                <p className="text-white text-lg font-semibold neon-text">
                    {waiting ? "Đang đăng nhập..." : "Đang chuyển hướng..."}
                </p>
                <p className="text-white/50 text-sm mt-2">Vui lòng chờ trong giây lát</p>
            </div>
        </div>
    );
}
