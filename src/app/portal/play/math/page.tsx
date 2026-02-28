"use client";

import { useRouter } from "next/navigation";
import StarField from "@/components/StarField";
import NeonButton from "@/components/NeonButton";
import MathForgeGame from "@/components/MathForgeGame";
import { mockMathLevels } from "@/lib/mock-data";

export default function MathPlayPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen relative flex flex-col">
            <StarField count={40} />

            {/* Top bar */}
            <div className="relative z-10 glass-card-strong" style={{ borderRadius: 0 }}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <NeonButton href="/portal" variant="cyan" size="sm">
                        ← Quay lại
                    </NeonButton>
                    <h1 className="text-sm sm:text-base font-bold text-white/80 font-[var(--font-heading)]">
                        ⚔️ Lò Rèn Vũ Trụ
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="glass-card !p-2 !px-4 !rounded-xl flex items-center gap-2">
                            <span className="text-neon-gold">⭐</span>
                            <span className="text-sm font-bold text-white">2,450 XP</span>
                        </div>
                        <div className="glass-card !p-2 !px-4 !rounded-xl flex items-center gap-2">
                            <span>🔥</span>
                            <span className="text-sm font-bold text-white">7 ngày</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game area */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
                <MathForgeGame
                    levels={mockMathLevels}
                    onExit={() => router.push("/portal")}
                />
            </div>
        </div>
    );
}
