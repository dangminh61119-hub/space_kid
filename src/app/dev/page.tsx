"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { GameLevel } from "@/lib/services/db";

const GameModeController = dynamic(() => import("@/components/GameModeController"), { ssr: false });
const BossFightOverlay = dynamic(() => import("@/components/BossFightOverlay"), { ssr: false });

/* ═══════════════════════════════════════════════
 * Dev Test Page — Quick access to any game mode
 * URL: /dev
 * ═══════════════════════════════════════════════ */

const MOCK_QUESTIONS = [
    { question: "Con mèo", correctWord: "Cat", wrongWords: ["Dog", "Bird", "Fish"] },
    { question: "Quả táo", correctWord: "Apple", wrongWords: ["Banana", "Orange", "Grape"] },
    { question: "Ngôi nhà", correctWord: "House", wrongWords: ["Tree", "Car", "Book"] },
    { question: "Mặt trời", correctWord: "Sun", wrongWords: ["Moon", "Star", "Cloud"] },
    { question: "Con cá", correctWord: "Fish", wrongWords: ["Cat", "Dog", "Bird"] },
];

const GAME_MODES = [
    { id: "shooter",        label: "🚀 Bắn Súng (Shooter)",        color: "#FF6BFF" },
    { id: "timebomb",       label: "💣 Bom Hẹn Giờ (TimeBomb)",    color: "#FF4444" },
    { id: "meteor",         label: "☄️ Mưa Sao Băng (Meteor)",     color: "#00F5FF" },
    { id: "cosmo-bridge",   label: "🌉 Cầu Vũ Trụ (CosmoBridge)", color: "#4ADE80" },
    { id: "galaxy-sort",    label: "🌌 Sắp Xếp (GalaxySort)",     color: "#FFD700" },
    { id: "star-hunter",    label: "⭐ Săn Sao (StarHunter)",      color: "#E879F9" },
    { id: "nebula-flip",    label: "🃏 Lật Thẻ (NebulaFlip)",      color: "#9333EA" },
    { id: "gravity-well",   label: "🌀 Hố Hấp Dẫn (GravityWell)", color: "#0EA5E9" },
    { id: "constellation",  label: "✨ Chòm Sao (Constellation)",  color: "#F59E0B" },
    { id: "boss",           label: "🐙 Boss Fight (trực tiếp)",     color: "#DC2626" },
];

export default function DevTestPage() {
    const [activeMode, setActiveMode] = useState<string | null>(null);
    const [questionCount, setQuestionCount] = useState(3);

    const mockLevel: GameLevel = {
        id: "dev-test-level",
        level: 1,
        planet: "dev",
        subject: "English",
        title: "Dev Test Level",
        speed: 1,
        gameMode: activeMode || "shooter",
        questions: MOCK_QUESTIONS.slice(0, questionCount),
    };

    // Direct Boss Fight test
    if (activeMode === "boss") {
        return (
            <div className="min-h-screen bg-[#0a0020] flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-[900px] mb-4 flex items-center justify-between">
                    <button
                        onClick={() => setActiveMode(null)}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
                    >
                        ← Quay lại Dev Menu
                    </button>
                    <span className="text-white/50 text-sm">🐙 Boss Fight Test</span>
                </div>
                <div className="w-full max-w-[900px] aspect-video relative rounded-xl overflow-hidden border border-purple-500/30">
                    <BossFightOverlay
                        width={900}
                        height={500}
                        question={MOCK_QUESTIONS[0]}
                        initialShipX={450}
                        hp={3}
                        score={0}
                        onBossDefeated={(bonus) => {
                            alert(`🎉 Boss defeated! Bonus: ${bonus}`);
                            setActiveMode(null);
                        }}
                        onPlayerDied={() => {
                            alert("💀 You died!");
                            setActiveMode(null);
                        }}
                        onHpChange={() => { }}
                        onScoreChange={() => { }}
                    />
                </div>
                <p className="text-white/30 text-xs mt-3">Click & kéo chuột để di chuyển. Giữ chuột để bắn.</p>
            </div>
        );
    }

    // Game Mode test via GameModeController
    if (activeMode) {
        return (
            <div className="min-h-screen bg-[#0a0020] flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-5xl mb-4 flex items-center justify-between">
                    <button
                        onClick={() => setActiveMode(null)}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm"
                    >
                        ← Quay lại Dev Menu
                    </button>
                    <span className="text-white/50 text-sm">
                        Mode: {activeMode} · {questionCount} câu hỏi
                    </span>
                </div>
                <div className="w-full max-w-5xl mx-auto relative min-h-[500px] rounded-2xl overflow-hidden border border-white/10 bg-[#0a0020]">
                    <GameModeController
                        levels={[mockLevel]}
                        onExit={() => setActiveMode(null)}
                        playerClass="warrior"
                        onGameComplete={(score, level) => {
                            alert(`🎉 Game Complete! Score: ${score}, Level: ${level}`);
                            setActiveMode(null);
                        }}
                        onAnswered={() => { }}
                        planetId="dev-planet"
                        planetName="Dev Test"
                        planetEmoji="🛠️"
                    />
                </div>
            </div>
        );
    }

    // Menu chọn game mode
    return (
        <div className="min-h-screen bg-[#0a0020] flex items-center justify-center p-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="text-5xl mb-3">🛠️</div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dev Test Page</h1>
                    <p className="text-white/40 text-sm">Chọn game mode để test trực tiếp — không cần navigate qua portal</p>
                </div>

                {/* Settings */}
                <div className="mb-6 p-4 rounded-xl border border-white/10 bg-white/5">
                    <label className="text-white/60 text-sm block mb-2">Số câu hỏi:</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 5].map(n => (
                            <button
                                key={n}
                                onClick={() => setQuestionCount(n)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${questionCount === n
                                    ? "bg-purple-600 text-white scale-105"
                                    : "bg-white/10 text-white/60 hover:bg-white/20"
                                    }`}
                            >
                                {n} câu
                            </button>
                        ))}
                    </div>
                </div>

                {/* Game Mode buttons */}
                <div className="grid grid-cols-2 gap-3">
                    {GAME_MODES.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setActiveMode(mode.id)}
                            className="p-4 rounded-xl text-left transition-all hover:scale-[1.03] active:scale-95 border border-white/10 hover:border-white/30"
                            style={{
                                background: `linear-gradient(135deg, ${mode.color}20, ${mode.color}08)`,
                                borderColor: `${mode.color}30`,
                            }}
                        >
                            <span className="text-white font-bold text-sm">{mode.label}</span>
                        </button>
                    ))}
                </div>

                {/* Quick links */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-white/20 text-xs">Quick Links</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <a href="/portal" className="text-white/40 text-xs hover:text-white/70 transition-colors">Portal →</a>
                        <a href="/learn" className="text-white/40 text-xs hover:text-white/70 transition-colors">Learn Hub →</a>
                        <a href="/dashboard" className="text-white/40 text-xs hover:text-white/70 transition-colors">Dashboard →</a>
                        <a href="/admin" className="text-white/40 text-xs hover:text-white/70 transition-colors">Admin →</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
