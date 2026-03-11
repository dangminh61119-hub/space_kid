"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/services/auth-context";

/**
 * Hook to enforce authentication on any page.
 * Redirects unauthenticated users to /login.
 * Unlike useRequireRole, this allows ANY authenticated user regardless of role.
 *
 * @returns { loading, allowed, redirecting }
 */
export function useRequireAuth() {
    const router = useRouter();
    const { user, loading, needsRoleSelect } = useAuth();

    useEffect(() => {
        if (loading) return;

        // Not logged in → go to login
        if (!user) {
            router.replace("/login");
            return;
        }

        // OAuth user without role → choose role first
        if (needsRoleSelect) {
            router.replace("/role-select");
            return;
        }
    }, [user, loading, needsRoleSelect, router]);

    const allowed = !loading && !!user && !needsRoleSelect;
    const redirecting = !loading && !allowed;

    return { loading, allowed, redirecting };
}
