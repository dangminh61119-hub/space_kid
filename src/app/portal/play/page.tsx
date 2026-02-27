"use client";

import { motion } from "framer-motion";
import StarField from "@/components/StarField";
import NeonButton from "@/components/NeonButton";
import GlassCard from "@/components/GlassCard";

export default function PlayPage() {
    return (
        <div className="min-h-screen relative flex flex-col">
            <StarField count={40} />

            {/* Top bar */}
            <div className="relative z-10 glass-card-strong" style={{ borderRadius: 0 }}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <NeonButton href="/portal" variant="cyan" size="sm">
                        ← Quay lại
                    </NeonButton>
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

            {/* Game iframe area */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-5xl aspect-video"
                >
                    <GlassCard glow="cyan" hover={false} className="h-full flex flex-col items-center justify-center">
                        {/* Placeholder for GDevelop game iframe */}
                        <div className="text-6xl mb-4 animate-float">🎮</div>
                        <h2 className="text-xl sm:text-2xl font-bold font-[var(--font-heading)] neon-text mb-3">
                            Hành tinh Vịnh Hạ Long
                        </h2>
                        <p className="text-white/50 text-sm mb-6 text-center max-w-md">
                            Khu vực game GDevelop sẽ được nhúng tại đây qua iframe.
                            <br />
                            Bé sẽ chơi trực tiếp trên trang này!
                        </p>
                        <div className="flex flex-col items-center gap-3">
                            <div className="glass-card !p-4 !rounded-xl text-center">
                                <code className="text-xs text-neon-cyan break-all">
                                    {`<iframe src="your-gdevelop-game.html" />`}
                                </code>
                            </div>
                            <NeonButton variant="gold" size="sm" onClick={() => alert("Game GDevelop sẽ được tích hợp tại đây!")}>
                                Bắt đầu chơi thử 🎯
                            </NeonButton>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
