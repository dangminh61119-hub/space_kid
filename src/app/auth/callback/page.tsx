"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import StarField from "@/components/StarField";

/**
 * OAuth callback page – Supabase redirects here after Google/Facebook login.
 * The auth state change is handled by AuthProvider automatically.
 */
export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        // Supabase auth state change listener in AuthProvider will handle the session.
        // Just redirect after a brief delay for the session to establish.
        const timer = setTimeout(() => {
            router.push("/survey");
        }, 1500);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <StarField count={40} />
            <div className="relative z-10 text-center">
                <div className="text-5xl mb-4 animate-float">🚀</div>
                <p className="text-white text-lg font-semibold neon-text">Đang đăng nhập...</p>
                <p className="text-white/50 text-sm mt-2">Vui lòng chờ trong giây lát</p>
            </div>
        </div>
    );
}
