"use client";

import { AuthProvider } from "@/lib/services/auth-context";
import { GameProvider } from "@/lib/game-context";
import { SoundProvider } from "@/lib/sound/SoundProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <GameProvider>
                <SoundProvider>{children}</SoundProvider>
            </GameProvider>
        </AuthProvider>
    );
}
