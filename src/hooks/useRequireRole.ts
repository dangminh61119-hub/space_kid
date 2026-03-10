"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/services/auth-context";

/**
 * Hook to enforce role-based access control.
 * Redirects users to the appropriate page if they don't have the required role.
 *
 * @param requiredRole - 'parent' or 'child'
 * @returns { loading, allowed } - loading state and whether access is allowed
 */
export function useRequireRole(requiredRole: "parent" | "child") {
    const router = useRouter();
    const { user, loading, role, needsRoleSelect } = useAuth();

    useEffect(() => {
        if (loading) return;

        // Not logged in → go to login
        if (!user) {
            router.replace("/login");
            return;
        }

        // No role yet (OAuth user) → choose role first
        if (needsRoleSelect || !role) {
            router.replace("/role-select");
            return;
        }

        // Wrong role → redirect to correct area
        if (role !== requiredRole) {
            if (role === "parent") {
                router.replace("/dashboard");
            } else {
                router.replace("/portal");
            }
        }
    }, [user, loading, role, needsRoleSelect, requiredRole, router]);

    const allowed = !loading && !!user && role === requiredRole;
    const redirecting = !loading && !allowed;

    return { loading, allowed, redirecting };
}
