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
    const { user, loading, role } = useAuth();

    useEffect(() => {
        if (loading) return;

        // Not logged in → go to login
        if (!user) {
            router.replace("/login");
            return;
        }

        // Wrong role → redirect to correct area
        if (role && role !== requiredRole) {
            if (role === "parent") {
                router.replace("/dashboard");
            } else {
                router.replace("/portal");
            }
        }
    }, [user, loading, role, requiredRole, router]);

    const allowed = !loading && !!user && role === requiredRole;

    return { loading: loading || (!allowed && !!user), allowed };
}
