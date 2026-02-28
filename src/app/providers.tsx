"use client";

import { AuthProvider } from "@/lib/auth-context";
import { GameProvider } from "@/lib/game-context";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <GameProvider>{children}</GameProvider>
        </AuthProvider>
    );
}
