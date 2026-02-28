"use client";

import { GameProvider } from "@/lib/game-context";

export function Providers({ children }: { children: React.ReactNode }) {
    return <GameProvider>{children}</GameProvider>;
}
